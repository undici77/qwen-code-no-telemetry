/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ToolErrorType } from './tool-error.js';
import { SchemaValidator } from '../utils/schemaValidator.js';
import {} from '../agents/runtime/agent-statistics.js';
/**
 * A convenience base class for ToolInvocation.
 */
export class BaseToolInvocation {
    params;
    constructor(params) {
        this.params = params;
    }
    toolLocations() {
        return [];
    }
    /**
     * Default: read-only tools return 'allow'. Override in subclasses for
     * tools with side effects.
     */
    getDefaultPermission() {
        return Promise.resolve('allow');
    }
    /**
     * Default fallback: returns a generic 'info' confirmation dialog using the
     * tool's getDescription(). This ensures that even tools whose
     * getDefaultPermission() returns 'allow' can still be prompted when PM
     * rules override the decision to 'ask' at L4.
     *
     * Tools with richer confirmation UIs (Shell, Edit, MCP, etc.) override this.
     */
    getConfirmationDetails(_abortSignal) {
        const details = {
            type: 'info',
            title: `Confirm ${this.constructor.name.replace(/Invocation$/, '')}`,
            prompt: this.getDescription(),
            onConfirm: async (_outcome, _payload) => {
                // No-op: persistence is handled by coreToolScheduler via PM rules
            },
        };
        return Promise.resolve(details);
    }
}
/**
 * New base class for tools that separates validation from execution.
 * New tools should extend this class.
 */
export class DeclarativeTool {
    name;
    displayName;
    description;
    kind;
    parameterSchema;
    isOutputMarkdown;
    canUpdateOutput;
    shouldDefer;
    alwaysLoad;
    searchHint;
    constructor(name, displayName, description, kind, parameterSchema, isOutputMarkdown = true, canUpdateOutput = false, 
    /**
     * When true, this tool is hidden from the initial function-declaration list
     * sent to the model to save tokens. The model discovers it on-demand via the
     * {@link ToolNames.TOOL_SEARCH} tool, which injects the full schema into
     * subsequent API requests. Mirrors the `shouldDefer` field described in
     * Claude Code's tool framework.
     */
    shouldDefer = false, 
    /**
     * When true, this tool is always included in the function-declaration list
     * even in contexts where deferral is the default. Used for meta tools like
     * ToolSearch itself.
     */
    alwaysLoad = false, 
    /**
     * Optional space-separated keywords used by ToolSearch's keyword-match
     * scoring. Complements the tool's name and description.
     */
    searchHint) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.kind = kind;
        this.parameterSchema = parameterSchema;
        this.isOutputMarkdown = isOutputMarkdown;
        this.canUpdateOutput = canUpdateOutput;
        this.shouldDefer = shouldDefer;
        this.alwaysLoad = alwaysLoad;
        this.searchHint = searchHint;
    }
    get schema() {
        return {
            name: this.name,
            description: this.description,
            parametersJsonSchema: this.parameterSchema,
        };
    }
    /**
     * Projects tool params for the AUTO approval mode classifier.
     *
     * Tools with security-relevant parameters (file paths, shell commands,
     * URLs) should override this to redact voluminous or sensitive fields
     * (full content, secrets) while exposing enough for the classifier to
     * judge safety.
     *
     * Returns:
     *   - object: projected params to send to the classifier
     *   - empty string: signals "no security relevance" — the classifier
     *     transcript will record only the tool name
     *   - undefined: fall back to raw params (only safe when the tool is
     *     known to have no sensitive params)
     *
     * Default is the empty-string sentinel — fail-closed: a third-party
     * MCP tool (or any tool that has not opted in) does not leak its raw
     * parameters (potentially containing API keys, tokens, file contents)
     * into the classifier LLM prompt. Tools that want their args inspected
     * by the classifier for safety judgement should override this and
     * return an object with only the security-relevant fields.
     */
    toAutoClassifierInput(_params) {
        return '';
    }
    /**
     * Validates the raw tool parameters.
     * Subclasses should override this to add custom validation logic
     * beyond the JSON schema check.
     * @param params The raw parameters from the model.
     * @returns An error message string if invalid, null otherwise.
     */
    validateToolParams(_params) {
        // Base implementation can be extended by subclasses.
        return null;
    }
    /**
     * A convenience method that builds and executes the tool in one step.
     * Throws an error if validation fails.
     * @param params The raw, untrusted parameters from the model.
     * @param signal AbortSignal for tool cancellation.
     * @param updateOutput Optional callback to stream output.
     * @returns The result of the tool execution.
     */
    async buildAndExecute(params, signal, updateOutput, shellExecutionConfig) {
        const invocation = this.build(params);
        return invocation.execute(signal, updateOutput, shellExecutionConfig);
    }
    /**
     * Similar to `build` but never throws.
     * @param params The raw, untrusted parameters from the model.
     * @returns A `ToolInvocation` instance.
     */
    silentBuild(params) {
        try {
            return this.build(params);
        }
        catch (e) {
            if (e instanceof Error) {
                return e;
            }
            return new Error(String(e));
        }
    }
    /**
     * A convenience method that builds and executes the tool in one step.
     * Never throws.
     * @param params The raw, untrusted parameters from the model.
     * @params abortSignal a signal to abort.
     * @returns The result of the tool execution.
     */
    async validateBuildAndExecute(params, abortSignal) {
        const invocationOrError = this.silentBuild(params);
        if (invocationOrError instanceof Error) {
            const errorMessage = invocationOrError.message;
            return {
                llmContent: `Error: Invalid parameters provided. Reason: ${errorMessage}`,
                returnDisplay: errorMessage,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.INVALID_TOOL_PARAMS,
                },
            };
        }
        try {
            return await invocationOrError.execute(abortSignal);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                llmContent: `Error: Tool call execution failed. Reason: ${errorMessage}`,
                returnDisplay: errorMessage,
                error: {
                    message: errorMessage,
                    type: ToolErrorType.EXECUTION_FAILED,
                },
            };
        }
    }
}
/**
 * New base class for declarative tools that separates validation from execution.
 * New tools should extend this class, which provides a `build` method that
 * validates parameters before deferring to a `createInvocation` method for
 * the final `ToolInvocation` object instantiation.
 */
export class BaseDeclarativeTool extends DeclarativeTool {
    build(params) {
        const validationError = this.validateToolParams(params);
        if (validationError) {
            throw new Error(validationError);
        }
        return this.createInvocation(params);
    }
    validateToolParams(params) {
        const errors = SchemaValidator.validate(this.schema.parametersJsonSchema, params);
        if (errors) {
            return errors;
        }
        return this.validateToolParamValues(params);
    }
    validateToolParamValues(_params) {
        // Base implementation can be extended by subclasses.
        return null;
    }
}
/**
 * Type guard to check if an object is a Tool.
 * @param obj The object to check.
 * @returns True if the object is a Tool, false otherwise.
 */
export function isTool(obj) {
    return (typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        'build' in obj &&
        typeof obj.build === 'function');
}
/**
 * Detects cycles in a JSON schemas due to `$ref`s.
 * @param schema The root of the JSON schema.
 * @returns `true` if a cycle is detected, `false` otherwise.
 */
export function hasCycleInSchema(schema) {
    function resolveRef(ref) {
        if (!ref.startsWith('#/')) {
            return null;
        }
        const path = ref.substring(2).split('/');
        let current = schema;
        for (const segment of path) {
            if (typeof current !== 'object' ||
                current === null ||
                !Object.prototype.hasOwnProperty.call(current, segment)) {
                return null;
            }
            current = current[segment];
        }
        return current;
    }
    function traverse(node, visitedRefs, pathRefs) {
        if (typeof node !== 'object' || node === null) {
            return false;
        }
        if (Array.isArray(node)) {
            for (const item of node) {
                if (traverse(item, visitedRefs, pathRefs)) {
                    return true;
                }
            }
            return false;
        }
        if ('$ref' in node && typeof node.$ref === 'string') {
            const ref = node.$ref;
            if (ref === '#/' || pathRefs.has(ref)) {
                // A ref to just '#/' is always a cycle.
                return true; // Cycle detected!
            }
            if (visitedRefs.has(ref)) {
                return false; // Bail early, we have checked this ref before.
            }
            const resolvedNode = resolveRef(ref);
            if (resolvedNode) {
                // Add it to both visited and the current path
                visitedRefs.add(ref);
                pathRefs.add(ref);
                const hasCycle = traverse(resolvedNode, visitedRefs, pathRefs);
                pathRefs.delete(ref); // Backtrack, leaving it in visited
                return hasCycle;
            }
        }
        // Crawl all the properties of node
        for (const key in node) {
            if (Object.prototype.hasOwnProperty.call(node, key)) {
                if (traverse(node[key], visitedRefs, pathRefs)) {
                    return true;
                }
            }
        }
        return false;
    }
    return traverse(schema, new Set(), new Set());
}
/**
 * TODO:
 * 1. support explicit denied outcome
 * 2. support proceed with modified input
 */
export var ToolConfirmationOutcome;
(function (ToolConfirmationOutcome) {
    ToolConfirmationOutcome["ProceedOnce"] = "proceed_once";
    ToolConfirmationOutcome["ProceedAlways"] = "proceed_always";
    /** @deprecated Use ProceedAlwaysProject or ProceedAlwaysUser instead. */
    ToolConfirmationOutcome["ProceedAlwaysServer"] = "proceed_always_server";
    /** @deprecated Use ProceedAlwaysProject or ProceedAlwaysUser instead. */
    ToolConfirmationOutcome["ProceedAlwaysTool"] = "proceed_always_tool";
    /** Persist the permission rule to the project settings (workspace scope). */
    ToolConfirmationOutcome["ProceedAlwaysProject"] = "proceed_always_project";
    /** Persist the permission rule to the user settings (user scope). */
    ToolConfirmationOutcome["ProceedAlwaysUser"] = "proceed_always_user";
    ToolConfirmationOutcome["ModifyWithEditor"] = "modify_with_editor";
    /** Restore the approval mode that was active before entering plan mode. */
    ToolConfirmationOutcome["RestorePrevious"] = "restore_previous";
    ToolConfirmationOutcome["Cancel"] = "cancel";
})(ToolConfirmationOutcome || (ToolConfirmationOutcome = {}));
export var Kind;
(function (Kind) {
    Kind["Read"] = "read";
    Kind["Edit"] = "edit";
    Kind["Delete"] = "delete";
    Kind["Move"] = "move";
    Kind["Search"] = "search";
    Kind["Execute"] = "execute";
    Kind["Think"] = "think";
    Kind["Fetch"] = "fetch";
    Kind["Other"] = "other";
})(Kind || (Kind = {}));
// Function kinds that have side effects
export const MUTATOR_KINDS = [
    Kind.Edit,
    Kind.Delete,
    Kind.Move,
    Kind.Execute,
];
/**
 * Tool kinds that are safe to execute concurrently (pure reads, no writes).
 * Kind.Think is excluded because some Think tools write to disk
 * (e.g., save_memory, todo_write).
 */
export const CONCURRENCY_SAFE_KINDS = new Set([
    Kind.Read,
    Kind.Search,
    Kind.Fetch,
]);
//# sourceMappingURL=tools.js.map