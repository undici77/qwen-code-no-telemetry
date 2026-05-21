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
import type { Content } from '@google/genai';
import { ApprovalMode, type Config } from '../config/config.js';
import { type AutoModeDenialState } from './denialTracking.js';
import type { PermissionCheckContext } from './types.js';
/**
 * Built-in tools whose any-parameter behavior is safe under the AUTO mode
 * classifier's threat model — they never write files, never perform network
 * calls, and never execute arbitrary code.
 *
 * MCP tools are intentionally excluded (third-party code, cannot be statically
 * trusted regardless of name).
 */
export declare const SAFE_TOOL_ALLOWLIST: ReadonlySet<string>;
/**
 * Returns true when `toolName` is a built-in tool whose every legal parameter
 * combination is safe enough to skip the classifier. Caller should only
 * consult this when L4 evaluation returned `'default'` — explicit user rules
 * still take precedence.
 */
export declare function isInSafeToolAllowlist(toolName: string): boolean;
/**
 * Predicate for whether the AUTO mode L5 branch should run for a given call.
 * Centralizes the rule "only when the session is in AUTO and the tool isn't
 * one that always needs direct user attention". Used by both the CLI
 * scheduler and the ACP Session path so they stay in sync.
 */
export declare function shouldRunAutoModeForCall(approvalMode: ApprovalMode, toolName: string): boolean;
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
export declare function passesAcceptEditsFastPath(ctx: PermissionCheckContext, config: Config): boolean;
/**
 * Unified decision returned by {@link evaluateAutoMode}.
 *
 * `via` records which layer produced the verdict; for `'classifier'` calls
 * the additional `shouldBlock`, `reason`, and `unavailable` fields surface
 * the classifier's verdict to the scheduler / UI / denialTracking.
 */
export type AutoModeDecision = {
    via: 'fast-path:accept-edits';
} | {
    via: 'fast-path:allowlist';
} | {
    via: 'classifier';
    shouldBlock: boolean;
    reason: string;
    unavailable: boolean;
    stage: 'fast' | 'thinking';
    durationMs: number;
} | {
    via: 'fallback';
};
/**
 * Outcome of {@link applyAutoModeDecision}. Boils the union of
 * `AutoModeDecision` plus denial-tracking state updates down to a
 * three-way "what should the caller do" instruction so the scheduler /
 * ACP paths share one decision handler instead of duplicating the
 * switch + state-update boilerplate.
 */
export type AutoModeOutcome = {
    kind: 'approved';
} | {
    kind: 'blocked';
    errorMessage: string;
} | {
    kind: 'fallback';
};
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
export declare function applyAutoModeDecision(decision: AutoModeDecision, config: Config, denialState: AutoModeDenialState): AutoModeOutcome;
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
export declare function formatClassifierBlockMessage(decision: Extract<AutoModeDecision, {
    via: 'classifier';
}>): string;
export interface EvaluateAutoModeInput {
    ctx: PermissionCheckContext;
    /**
     * True when L4 PermissionManager forced `'ask'` because the user wrote
     * an explicit ask rule that matched this call. When `true`, fast-paths
     * must be skipped so the user's explicit intent is honored.
     *
     * Comes from `PermissionFlowResult.pmForcedAsk` (set by L4 in
     * `evaluatePermissionRules` when a user-provided ask rule matched).
     *
     * False here covers both "no user rule matched at all" (L4 returned
     * `'default'`) AND "tool's intrinsic L3 default was `'ask'` and the
     * user has no rule" — both cases should still hit the fast-paths
     * because the user hasn't expressed a contrary intent.
     */
    pmForcedAsk: boolean;
    /** Raw tool params (forwarded to the classifier). */
    toolParams: Record<string, unknown>;
    /** Main session message history. */
    messages: readonly Content[];
    config: Config;
    signal: AbortSignal;
    /**
     * When true, the L5.3 classifier is skipped and an unmatched call
     * resolves to `{ via: 'fallback' }`. Used by the scheduler to short-
     * circuit classifier dispatch when denialTracking has already armed a
     * fallback to manual approval — while still letting safe tools take
     * the L5.1 / L5.2 fast-paths.
     */
    skipClassifier?: boolean;
}
/**
 * Resolve a pending tool call under AUTO mode by walking the three-layer
 * filter in order. Caller must have already determined that L4 did not
 * resolve the call to `allow` or `deny` — `evaluateAutoMode` only runs
 * when L4 produced `'ask'` (tool's intrinsic default OR user-forced) or
 * `'default'`.
 */
export declare function evaluateAutoMode(input: EvaluateAutoModeInput): Promise<AutoModeDecision>;
