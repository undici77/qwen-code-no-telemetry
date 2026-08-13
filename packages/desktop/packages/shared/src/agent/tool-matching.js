/**
 * Stateless tool matching for SDK message → AgentEvent conversion.
 *
 * This module extracts tool_start and tool_result events from SDK message
 * content blocks using DIRECT ID matching instead of FIFO queues.
 *
 * Key principle: Every output is derived from the current message + an
 * append-only tool index. No mutable queues, stacks, or order-dependent state.
 *
 * The SDK provides:
 * - `parent_tool_use_id` on every message — identifies the subagent context (Task ID or null)
 * - `tool_use_id` on each tool_result content block — directly identifies which tool the result is for
 *
 * Together these eliminate the need for FIFO matching, parent stacks, and orphan recovery.
 */
import { toolMetadataStore } from '../interceptor-common.ts';
import { createLogger } from '../utils/debug.ts';
import { isParentTaskTool } from '../utils/toolNames.ts';
const log = createLogger('tool-matching');
// Re-export from browser-safe module (no Node deps) for backward compatibility
export { PARENT_TASK_TOOLS, isParentTaskTool } from '../utils/toolNames.ts';
/**
 * Append-only index of tool metadata, built from tool_start events.
 * Order-independent: inserting A then B = inserting B then A.
 * Used to look up tool name/input when processing tool_result blocks
 * (which carry tool_use_id but not tool_name).
 */
export class ToolIndex {
    entries = new Map();
    /** Register a tool (idempotent — same ID always maps to same entry) */
    register(toolUseId, name, input) {
        // Update input if we now have more complete data (stream events start with empty input)
        const existing = this.entries.get(toolUseId);
        if (existing && Object.keys(existing.input).length === 0 && Object.keys(input).length > 0) {
            this.entries.set(toolUseId, { name, input });
        }
        else if (!existing) {
            this.entries.set(toolUseId, { name, input });
        }
    }
    getName(toolUseId) {
        return this.entries.get(toolUseId)?.name;
    }
    getInput(toolUseId) {
        return this.entries.get(toolUseId)?.input;
    }
    getEntry(toolUseId) {
        return this.entries.get(toolUseId);
    }
    has(toolUseId) {
        return this.entries.has(toolUseId);
    }
    get size() {
        return this.entries.size;
    }
}
// ============================================================================
// Pure extraction functions
// ============================================================================
/** Strip internal metadata fields (_displayName, _intent) from tool input */
function stripInternalFields(input) {
    const { _displayName, _intent, ...clean } = input;
    return clean;
}
/**
 * Extract tool_start events from assistant message content blocks.
 *
 * Each tool_use block in the content becomes a tool_start event.
 * Parent assignment comes directly from the SDK's parent_tool_use_id field
 * on the message — no stacks or FIFO needed.
 *
 * Fallback: When SDK's parent_tool_use_id is null AND exactly one Task is active,
 * we assign that Task as the parent. This handles cases where the SDK doesn't
 * provide parent info for subagent child tools.
 *
 * @param contentBlocks - Content blocks from SDKAssistantMessage.message.content
 * @param sdkParentToolUseId - parent_tool_use_id from the SDK message (null = top-level)
 * @param toolIndex - Append-only index to register new tools in
 * @param emittedToolStartIds - Set of tool IDs already emitted (for stream/assistant dedup)
 * @param turnId - Current turn correlation ID
 * @param activeParentTools - Set of currently active Task tool IDs (for fallback parent assignment)
 * @param sessionDir - Session directory for reading tool metadata (prevents race when concurrent sessions clobber singleton)
 * @returns Array of tool_start AgentEvents
 */
export function extractToolStarts(contentBlocks, sdkParentToolUseId, toolIndex, emittedToolStartIds, turnId, activeParentTools, sessionDir) {
    const events = [];
    for (const block of contentBlocks) {
        if (block.type !== 'tool_use')
            continue;
        const toolBlock = block;
        // Register in index (idempotent — handles both stream and assistant events)
        toolIndex.register(toolBlock.id, toolBlock.name, toolBlock.input);
        // Determine parent: SDK's parent_tool_use_id is authoritative when present.
        // Fallback: if SDK provides null AND exactly one Task is active, use that Task.
        // This handles subagent child tools when SDK doesn't provide parent info.
        let parentToolUseId;
        if (sdkParentToolUseId) {
            // SDK provided explicit parent — use it
            parentToolUseId = sdkParentToolUseId;
        }
        else if (activeParentTools && activeParentTools.size === 1) {
            // Fallback: exactly one active Task, assign it as parent for child tools.
            // We can't safely assign when multiple Tasks are active (ambiguous).
            // Don't assign if this tool IS the Task (would create self-reference).
            const [singleActiveParent] = activeParentTools;
            if (toolBlock.id !== singleActiveParent) {
                parentToolUseId = singleActiveParent;
            }
        }
        // Dedup: stream_event arrives before assistant message, both have the same tool_use block.
        // The Set is append-only and order-independent (same ID always deduplicates the same way).
        if (emittedToolStartIds.has(toolBlock.id)) {
            // Already emitted via stream — re-emit only when we have newly useful data.
            // 1) Complete input arrived on assistant message (stream starts with {})
            // 2) Metadata became available later in toolMetadataStore (race-safe)
            const hasNewInput = Object.keys(toolBlock.input).length > 0;
            const { intent, displayName } = extractToolMetadata(toolBlock, sessionDir);
            const hasMetadataUpdate = !!intent || !!displayName;
            if (hasNewInput || hasMetadataUpdate) {
                events.push({
                    type: 'tool_start',
                    toolName: toolBlock.name,
                    toolUseId: toolBlock.id,
                    input: stripInternalFields(toolBlock.input),
                    intent,
                    displayName,
                    turnId,
                    parentToolUseId,
                });
            }
            continue;
        }
        emittedToolStartIds.add(toolBlock.id);
        const { intent, displayName } = extractToolMetadata(toolBlock, sessionDir);
        events.push({
            type: 'tool_start',
            toolName: toolBlock.name,
            toolUseId: toolBlock.id,
            input: stripInternalFields(toolBlock.input),
            intent,
            displayName,
            turnId,
            parentToolUseId,
        });
    }
    return events;
}
/**
 * Extract tool_result events from user message content blocks.
 *
 * Each tool_result content block carries an explicit `tool_use_id` that
 * directly identifies which tool the result belongs to. No FIFO matching needed.
 *
 * Falls back to the convenience field `tool_use_result` + `parent_tool_use_id`
 * when content blocks don't contain tool_result entries (e.g., some MCP tools).
 *
 * @param contentBlocks - Content blocks from SDKUserMessage.message.content (may be empty)
 * @param sdkParentToolUseId - parent_tool_use_id from the SDK message
 * @param toolUseResultValue - Convenience field tool_use_result from SDK message
 * @param toolIndex - Read-only lookup for tool name/input
 * @param turnId - Current turn correlation ID
 * @returns Array of tool_result AgentEvents (and background task events)
 */
export function extractToolResults(contentBlocks, sdkParentToolUseId, toolUseResultValue, toolIndex, turnId) {
    const events = [];
    // Primary path: extract tool_use_id directly from content blocks
    const toolResultBlocks = contentBlocks.filter((b) => b.type === 'tool_result');
    if (toolResultBlocks.length > 0) {
        // Direct ID matching — each block explicitly identifies its tool
        for (const block of toolResultBlocks) {
            const toolUseId = block.tool_use_id;
            const entry = toolIndex.getEntry(toolUseId);
            const resultStr = serializeResult(block.content);
            const isError = block.is_error ?? isToolResultError(block.content);
            events.push({
                type: 'tool_result',
                toolUseId,
                toolName: entry?.name,
                result: resultStr,
                isError,
                input: entry?.input,
                turnId,
                parentToolUseId: sdkParentToolUseId ?? undefined,
            });
            // Detect background tasks/shells from results
            if (entry) {
                const bgEvents = detectBackgroundEvents(toolUseId, entry, resultStr, isError, turnId, sdkParentToolUseId ?? undefined);
                events.push(...bgEvents);
            }
        }
    }
    else if (toolUseResultValue !== undefined) {
        // Fallback: use convenience fields when content blocks are unavailable.
        // This handles edge cases like in-process MCP tools that don't provide
        // tool_result content blocks.
        //
        // When sdkParentToolUseId is set, it points to the tool's own ID (for
        // regular tools using the convenience API) — so we use it as toolUseId.
        // When null (top-level tools without content blocks), we generate a
        // synthetic ID so the result isn't silently dropped.
        //
        // parentToolUseId is intentionally set to undefined here because in the
        // fallback path we only have one ID — using it as BOTH toolUseId and
        // parentToolUseId would create a self-referencing loop. The safe default
        // is to treat the tool as top-level when parent is ambiguous.
        const toolUseId = sdkParentToolUseId ?? `fallback-${turnId ?? 'unknown'}`;
        const entry = toolIndex.getEntry(toolUseId);
        const resultStr = serializeResult(toolUseResultValue);
        const isError = isToolResultError(toolUseResultValue);
        events.push({
            type: 'tool_result',
            toolUseId,
            toolName: entry?.name,
            result: resultStr,
            isError,
            input: entry?.input,
            turnId,
            parentToolUseId: undefined,
        });
        if (entry) {
            const bgEvents = detectBackgroundEvents(toolUseId, entry, resultStr, isError, turnId);
            events.push(...bgEvents);
        }
    }
    return events;
}
// ============================================================================
// Helpers (pure)
// ============================================================================
/**
 * Extract intent and displayName metadata for a tool call.
 *
 * Sources (checked in priority order):
 * 1. toolMetadataStore — populated by backend-specific metadata capture
 * 2. toolBlock.input._intent / _displayName — fallback for Codex backend or if SSE interception didn't run
 * 3. Bash description field — fallback for intent on Bash tools
 */
function extractToolMetadata(toolBlock, sessionDir) {
    // 1. Check the metadata store first (populated by SSE interceptor)
    // Pass sessionDir to ensure we read from the correct session's file even when
    // the singleton _sessionDir has been clobbered by a concurrent session.
    const idCandidates = new Set([toolBlock.id]);
    if (toolBlock.id.includes('|')) {
        const [base] = toolBlock.id.split('|');
        if (base)
            idCandidates.add(base);
    }
    for (const candidate of idCandidates) {
        const stored = toolMetadataStore.get(candidate, sessionDir);
        if (!stored)
            continue;
        let intent = stored.intent;
        const displayName = stored.displayName;
        // Bash description fallback for intent
        if (!intent && toolBlock.name === 'Bash') {
            intent = toolBlock.input.description;
        }
        return { intent, displayName };
    }
    // Log when metadata store misses — helps diagnose cross-process sync issues
    const argsHasIntent = typeof toolBlock.input._intent === 'string';
    const argsHasDisplayName = typeof toolBlock.input._displayName === 'string';
    log.debug(`extractToolMetadata: store miss for ${toolBlock.name} (${toolBlock.id}); candidates=${Array.from(idCandidates).join(' -> ')}; argsIntent=${argsHasIntent}; argsDisplayName=${argsHasDisplayName}`);
    // 2. Fallback: read directly from tool input (Codex backend, non-streaming, etc.)
    let intent = toolBlock.input._intent;
    const displayName = toolBlock.input._displayName;
    // 3. Bash description fallback for intent
    if (!intent && toolBlock.name === 'Bash') {
        intent = toolBlock.input.description;
    }
    return { intent, displayName };
}
/** Serialize a tool result value to string, handling circular references */
export function serializeResult(value) {
    if (typeof value === 'string')
        return value;
    if (value === undefined || value === null)
        return '';
    try {
        return JSON.stringify(value, null, 2);
    }
    catch {
        return '[Result contains non-serializable data]';
    }
}
/** Check if a tool result indicates an error */
export function isToolResultError(result) {
    if (typeof result === 'string') {
        // Check for common error patterns
        return /^\s*(\[ERROR\]|Error:|error:)/.test(result);
    }
    if (result && typeof result === 'object') {
        // Check for error flag in result object
        if ('is_error' in result && result.is_error)
            return true;
        if ('error' in result)
            return true;
    }
    return false;
}
/** Detect background task/shell events from tool results */
function detectBackgroundEvents(toolUseId, entry, resultStr, isError, turnId, parentToolUseId) {
    const events = [];
    // Background Task detection — Task/Agent tool with agentId in result.
    // Qwen Agent calls default to background unless they explicitly opt out or
    // use a launch shape that stays foreground. Task keeps its provider-specific
    // explicit opt-in behavior.
    //
    // NOTE: This heuristic (top-level `agent` call, no explicit
    // `run_in_background`, no `working_dir`, no named teammate) mirrors two other
    // implementations that must stay in sync:
    //   - core dispatch (source of truth): packages/core/src/tools/agent/agent.ts
    //     (`backgroundRequested`/`shouldRunInBackground` in AgentTool.execute)
    //   - web-shell UI: packages/web-shell/client/adapters/toolClassification.ts
    //     (`isBackgroundSubAgentToolCall`)
    // If the routing rule changes in core, update all three. The web shell reads
    // `rawOutput.status`; this adapter reads the serialized runtime result.
    const normalizedToolName = entry.name.toLowerCase();
    const isTopLevelQwenAgent = normalizedToolName === 'agent' && parentToolUseId === undefined;
    const isForkAgent = typeof entry.input.subagent_type === 'string' &&
        entry.input.subagent_type.toLowerCase() === 'fork';
    const defaultsToBackground = isTopLevelQwenAgent &&
        entry.input.run_in_background === undefined &&
        entry.input.working_dir === undefined &&
        entry.input.name === undefined &&
        // Args alone cannot distinguish an interactive detached fork from a
        // headless registry-backed fork. The runtime result check below handles
        // the latter.
        !isForkAgent;
    const runtimeReportedBackground = isTopLevelQwenAgent &&
        isForkAgent &&
        resultStr.startsWith('Background agent launched successfully.');
    const wasRunInBackground = runtimeReportedBackground ||
        (entry.input.run_in_background === true &&
            (normalizedToolName !== 'agent' || isTopLevelQwenAgent)) ||
        defaultsToBackground;
    if (isParentTaskTool(entry.name) && wasRunInBackground && !isError && resultStr) {
        const agentIdMatch = resultStr.match(/agentId:\s*([a-zA-Z0-9_-]+)/);
        if (agentIdMatch?.[1]) {
            const intentValue = entry.input._intent;
            events.push({
                type: 'task_backgrounded',
                toolUseId,
                taskId: agentIdMatch[1],
                turnId,
                ...(typeof intentValue === 'string' && { intent: intentValue }),
            });
        }
    }
    // Background Shell detection — Bash tool with shell_id or backgroundTaskId
    if (entry.name === 'Bash' && !isError && resultStr) {
        const shellIdMatch = resultStr.match(/shell_id:\s*([a-zA-Z0-9_-]+)/)
            || resultStr.match(/"backgroundTaskId":\s*"([a-zA-Z0-9_-]+)"/);
        if (shellIdMatch?.[1]) {
            const intentValue = (typeof entry.input._intent === 'string' && entry.input._intent)
                || (typeof entry.input.description === 'string' && entry.input.description)
                || undefined;
            const commandValue = typeof entry.input.command === 'string' ? entry.input.command : undefined;
            events.push({
                type: 'shell_backgrounded',
                toolUseId,
                shellId: shellIdMatch[1],
                turnId,
                ...(intentValue && { intent: intentValue }),
                ...(commandValue && { command: commandValue }),
            });
        }
    }
    // Shell killed detection — KillShell tool
    if (entry.name === 'KillShell') {
        const shellId = entry.input.shell_id;
        if (shellId) {
            events.push({
                type: 'shell_killed',
                shellId,
                turnId,
            });
        }
    }
    return events;
}
//# sourceMappingURL=tool-matching.js.map