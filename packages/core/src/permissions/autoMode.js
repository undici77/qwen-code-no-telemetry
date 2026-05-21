/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * AUTO approval mode three-layer filter.
 *
 * Layer 1 (L5.1): acceptEdits fast-path — Edit/Write targeting a path inside
 *   the workspace are auto-allowed without invoking the classifier.
 * Layer 2 (L5.2): safe-tool allowlist — built-in read-only / metadata tools
 *   are auto-allowed without invoking the classifier.
 * Layer 3 (L5.3): LLM classifier — see `classifier.ts` (wired in by the
 *   top-level `evaluateAutoMode` orchestrator).
 *
 * All three layers only fire when L4 PermissionManager returned `'default'`
 * (no rule matched). When L4 returns `'ask'` (user wrote an explicit ask
 * rule) the fast-paths are skipped — user intent takes precedence.
 */
import { ApprovalMode } from '../config/config.js';
import { ToolNames } from '../tools/tool-names.js';
import { createDebugLogger } from '../utils/debugLogger.js';
import { classifyAction } from './classifier.js';
import { recordAllow, recordBlock, recordUnavailable, } from './denialTracking.js';
const autoModeDebugLogger = createDebugLogger('AUTO_MODE');
/**
 * Built-in tools whose any-parameter behavior is safe under the AUTO mode
 * classifier's threat model — they never write files, never perform network
 * calls, and never execute arbitrary code.
 *
 * MCP tools are intentionally excluded (third-party code, cannot be statically
 * trusted regardless of name).
 */
export const SAFE_TOOL_ALLOWLIST = new Set([
    // Read-only file / search
    ToolNames.READ_FILE,
    ToolNames.GREP,
    ToolNames.GLOB,
    ToolNames.LS,
    ToolNames.LSP,
    // Tool introspection
    ToolNames.TOOL_SEARCH,
    // Output / session metadata
    ToolNames.TODO_WRITE,
    ToolNames.STRUCTURED_OUTPUT,
    // Inverse tools — hand control back to the user
    ToolNames.ASK_USER_QUESTION,
    ToolNames.EXIT_PLAN_MODE,
    // Background task coordination (peers' permission checks still apply)
    ToolNames.CRON_LIST,
    ToolNames.TASK_STOP,
    // `send_message` is intentionally NOT in the allowlist: it injects
    // arbitrary text into another running agent as a new instruction. The
    // classifier MUST see the destination + message content so it can
    // judge whether the inter-agent message is steering a peer toward
    // destructive or exfiltrating actions.
]);
/**
 * Returns true when `toolName` is a built-in tool whose every legal parameter
 * combination is safe enough to skip the classifier. Caller should only
 * consult this when L4 evaluation returned `'default'` — explicit user rules
 * still take precedence.
 */
export function isInSafeToolAllowlist(toolName) {
    return SAFE_TOOL_ALLOWLIST.has(toolName);
}
/** Edit / Write tool names eligible for the acceptEdits fast-path. */
const EDIT_TOOL_NAMES = new Set([
    ToolNames.EDIT,
    ToolNames.WRITE_FILE,
]);
/**
 * Predicate for whether the AUTO mode L5 branch should run for a given call.
 * Centralizes the rule "only when the session is in AUTO and the tool isn't
 * one that always needs direct user attention". Used by both the CLI
 * scheduler and the ACP Session path so they stay in sync.
 */
export function shouldRunAutoModeForCall(approvalMode, toolName) {
    if (approvalMode !== ApprovalMode.AUTO)
        return false;
    if (toolName === ToolNames.ASK_USER_QUESTION)
        return false;
    if (toolName === ToolNames.EXIT_PLAN_MODE)
        return false;
    return true;
}
/**
 * Paths inside the workspace that nevertheless execute code on subsequent
 * tooling operations (git commit, npm install, CI runs, …) and must NOT
 * take the acceptEdits fast-path. Without this list, a hostile AGENTS.md
 * could instruct the agent to write `.git/hooks/pre-commit` → fast-path
 * approves (it's in workspace) → next `git commit` runs arbitrary code
 * without classifier review.
 *
 * Edits to these paths still pass through the AUTO classifier; users
 * who want to allow specific hook/script edits can add an explicit
 * `permissions.allow` rule.
 */
const PERSISTENCE_PATH_PATTERNS = Object.freeze([
    /(^|\/)\.git\//, // git config, hooks, alias — covers .git/hooks/* and .git/config
    /(^|\/)\.husky\//, // git hooks via husky
    /(^|\/)package\.json$/, // npm scripts (root + nested workspaces)
    /(^|\/)\.npmrc$/, // registry override → malicious package fetch on next install
    /(^|\/)(Makefile|makefile|GNUmakefile)$/, // make targets
    /(^|\/)\.?[Jj]ustfile$/, // just task runner
    /(^|\/)Taskfile\.ya?ml$/, // go-task
    /(^|\/)\.github\/workflows\//, // CI workflow definitions
]);
/**
 * Returns true when the pending action is a file edit / write targeting a
 * path that lies within the current workspace (cwd + additional directories)
 * AND is NOT in {@link PERSISTENCE_PATH_PATTERNS}.
 *
 * Symlinks ARE resolved via `WorkspaceContext.isPathWithinWorkspace`, which
 * internally calls `fs.realpathSync`. A symlink whose target is outside the
 * workspace correctly fails this check and falls through to the classifier
 * — fail-safe by implementation.
 *
 * Caller should only consult this when L4 evaluation returned `'default'`.
 */
export function passesAcceptEditsFastPath(ctx, config) {
    if (!EDIT_TOOL_NAMES.has(ctx.toolName))
        return false;
    if (!ctx.filePath)
        return false;
    // Persistence paths (hooks, package.json scripts, CI definitions) must
    // never auto-approve via fast-path — they execute code on subsequent
    // tooling operations.
    if (PERSISTENCE_PATH_PATTERNS.some((p) => p.test(ctx.filePath))) {
        return false;
    }
    return config.getWorkspaceContext().isPathWithinWorkspace(ctx.filePath);
}
/**
 * Apply an {@link AutoModeDecision} to denial-tracking state and return
 * an outcome the caller can act on. Shared between
 * `coreToolScheduler.ts` and `acp-integration/session/Session.ts` — the
 * switch on `decision.via`, the `recordAllow / recordBlock /
 * recordUnavailable` updates, and the formatted block message used to
 * all be duplicated line-for-line across the two files. Drift between
 * those copies was a recurring class of bug across PR #4151 review
 * rounds; this helper makes the two paths share one source of truth.
 *
 * Callers retain responsibility for the surrounding integration
 * (marking the tool call scheduled vs writing an error response,
 * logging the fallback reason with denial-state context, etc.) — those
 * pieces differ between scheduler and Session.
 */
export function applyAutoModeDecision(decision, config, denialState) {
    switch (decision.via) {
        case 'fast-path:accept-edits':
        case 'fast-path:allowlist':
            config.setAutoModeDenialState(recordAllow(denialState));
            return { kind: 'approved' };
        case 'classifier':
            if (decision.shouldBlock) {
                config.setAutoModeDenialState(decision.unavailable
                    ? recordUnavailable(denialState)
                    : recordBlock(denialState));
                return {
                    kind: 'blocked',
                    errorMessage: formatClassifierBlockMessage(decision),
                };
            }
            config.setAutoModeDenialState(recordAllow(denialState));
            return { kind: 'approved' };
        case 'fallback':
            return { kind: 'fallback' };
        default: {
            const _exhaustive = decision;
            // Surface drift at runtime — TS exhaustiveness can be bypassed
            // via `as` cast / JS interop / partial build. Without this log
            // every tool call would silently degrade to manual approval with
            // zero operator-visible signal.
            autoModeDebugLogger.error(`Auto mode: unrecognised decision.via "${decision.via}" — falling through to manual approval`);
            void _exhaustive;
            return { kind: 'fallback' };
        }
    }
}
/**
 * Build the tool-error message the scheduler / ACP session returns when
 * the classifier blocks or is unavailable. Shared between
 * `coreToolScheduler.ts` and `acp-integration/session/Session.ts` so the
 * CLI and ACP paths surface identical diagnostic signal to operators
 * (context overflow vs API timeout vs construction failure).
 *
 * Callers are responsible for only invoking this on classifier verdicts —
 * `decision.via === 'classifier'` with `decision.shouldBlock === true`.
 */
export function formatClassifierBlockMessage(decision) {
    if (decision.unavailable) {
        return decision.reason
            ? `Auto mode classifier unavailable (${decision.reason}); action blocked for safety`
            : `Auto mode classifier unavailable; action blocked for safety`;
    }
    return `Blocked by auto mode policy: ${decision.reason}`;
}
/**
 * Resolve a pending tool call under AUTO mode by walking the three-layer
 * filter in order. Caller must have already determined that L4 did not
 * resolve the call to `allow` or `deny` — `evaluateAutoMode` only runs
 * when L4 produced `'ask'` (tool's intrinsic default OR user-forced) or
 * `'default'`.
 */
export async function evaluateAutoMode(input) {
    // L5.1: edits within the workspace skip the classifier. We only short-
    // circuit when the user has NOT explicitly forced an ask rule; an
    // intrinsic L3 'ask' (e.g. EditTool's default) does not block the
    // fast-path, otherwise the fast-path would be dead code for the very
    // tools it's designed to cover.
    if (!input.pmForcedAsk &&
        passesAcceptEditsFastPath(input.ctx, input.config)) {
        return { via: 'fast-path:accept-edits' };
    }
    // L5.2: hardcoded safe-tool allowlist. Same gate as L5.1.
    if (!input.pmForcedAsk && isInSafeToolAllowlist(input.ctx.toolName)) {
        return { via: 'fast-path:allowlist' };
    }
    // User wrote an explicit `permissions.ask` rule matching this call —
    // honor that intent and route to manual confirmation instead of letting
    // the classifier auto-approve. The fast-paths above already opt out for
    // the same reason; the classifier path was the missing leg.
    // (auto-mode.md documents this as "ask rules force manual confirmation".)
    if (input.pmForcedAsk) {
        return { via: 'fallback' };
    }
    // Caller (scheduler) has detected an armed fallback state; surface that
    // so the call drops to manual approval instead of burning a classifier
    // request that would deepen the denial streak.
    if (input.skipClassifier) {
        return { via: 'fallback' };
    }
    // L5.3: two-stage LLM classifier.
    // Forward the messages array by reference — buildClassifierContents only
    // reads it. The previous spread `[...input.messages]` was a redundant
    // allocation on every classifier call.
    const result = await classifyAction({
        toolName: input.ctx.toolName,
        toolParams: input.toolParams,
        messages: input.messages,
        config: input.config,
        signal: input.signal,
    });
    return {
        via: 'classifier',
        shouldBlock: result.shouldBlock,
        reason: result.reason,
        unavailable: result.unavailable === true,
        stage: result.stage,
        durationMs: result.durationMs,
    };
}
//# sourceMappingURL=autoMode.js.map