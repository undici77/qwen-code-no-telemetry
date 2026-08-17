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
import type { PermissionDeniedReason } from '../hooks/types.js';
export type { PermissionDeniedReason } from '../hooks/types.js';
import type { ToolCallConfirmationDetails } from '../tools/tools.js';
import {
  type AutoModeDenialState,
  type DenialFallbackReason,
} from './denialTracking.js';
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
export declare function shouldRunAutoModeForCall(
  approvalMode: ApprovalMode,
  toolName: string,
): boolean;
export declare function isAutoModeProtectedWritePath(filePath: string): boolean;
/**
 * Returns true when `classifyAllShell` is enabled and the tool is a
 * shell-like tool (Bash/Monitor). Used to force all shell commands
 * through the classifier even when their default permission is 'allow'.
 */
export declare function shouldClassifyAllShellForAutoMode(
  toolName: string,
  config: Config,
): boolean;
/**
 * Returns true when an L4 `allow` verdict must still pass through the AUTO
 * classifier because it writes protected configuration or instruction paths.
 */
export declare function shouldForceAutoModeReviewForAllow(
  ctx: PermissionCheckContext,
  cwdFallback?: string,
): boolean;
/**
 * Returns true when the pending action is a file edit / write targeting a
 * path that lies within the current workspace (cwd + additional directories)
 * AND is not rejected by {@link isAutoModeProtectedWritePath} (covers
 * persistence paths and Qwen self-modification surfaces, including symlinks
 * whose realpath resolves to a protected target).
 *
 * Symlinks ARE resolved via `WorkspaceContext.isPathWithinWorkspace`, which
 * internally calls `fs.realpathSync`. A symlink whose target is outside the
 * workspace correctly fails this check and falls through to the classifier
 * — fail-safe by implementation.
 *
 * Caller should only consult this when L4 evaluation returned `'default'`.
 */
export declare function passesAcceptEditsFastPath(
  ctx: PermissionCheckContext,
  config: Config,
): boolean;
/**
 * Unified decision returned by {@link evaluateAutoMode}.
 *
 * `via` records which layer produced the verdict; for `'classifier'` calls
 * the additional `shouldBlock`, `reason`, and `unavailable` fields surface
 * the classifier's verdict to the scheduler / UI / denialTracking.
 */
export type AutoModeDecision =
  | {
      via: 'fast-path:accept-edits';
    }
  | {
      via: 'fast-path:allowlist';
    }
  | {
      via: 'blocked:destructive-command';
      reason: string;
    }
  | {
      via: 'classifier';
      shouldBlock: boolean;
      reason: string;
      unavailable: boolean;
      stage: 'fast' | 'thinking';
      durationMs: number;
    }
  | {
      via: 'fallback';
      reason: FallbackToAskReason;
    };
/**
 * Reasons AUTO mode itself is unavailable before a per-call decision can run.
 * Kept distinct from per-call fallback and classifier-denial reasons.
 */
export type AutoModeUnavailableReason =
  | 'circuit-breaker'
  | 'disabled'
  | 'policy';
/**
 * Reasons a call falls through to manual approval even though AUTO mode is on.
 * This is not a denial: the user may still approve the pending request.
 */
export type FallbackToAskReason =
  | 'safety_check'
  | 'ask_rule'
  | 'plan_mode_floor'
  | 'org_ask_ceiling'
  | 'classifier_unavailable'
  | DenialFallbackReason;
/** Outcome of {@link applyAutoModeDecision}. */
export type AutoModeOutcome =
  | {
      kind: 'approved';
    }
  | {
      kind: 'blocked';
      errorMessage: string;
      reason: PermissionDeniedReason;
    }
  | {
      kind: 'fallback';
      reason: FallbackToAskReason;
      message?: string;
    };
/**
 * Apply an AUTO decision and denial-tracking update. Shared by the scheduler
 * and ACP paths; callers still handle their integration-specific responses.
 */
export declare function applyAutoModeDecision(
  decision: AutoModeDecision,
  config: Config,
  denialState: AutoModeDenialState,
): AutoModeOutcome;
export declare function shouldFirePermissionDeniedForAutoMode(
  decision: AutoModeDecision,
  outcome: AutoModeOutcome,
): decision is Extract<
  AutoModeDecision,
  {
    via: 'classifier';
  }
>;
export declare function getAutoModePermissionDeniedReason(
  decision: Extract<
    AutoModeDecision,
    {
      via: 'classifier';
    }
  >,
): PermissionDeniedReason;
/**
 * Trailing guidance appended to classifier policy-denial tool results.
 * Centralised so the policy boundary (no silent retries, no equivalent-path
 * workarounds, stop and ask the user) stays in sync with the main system
 * prompt's Denied Tool Calls rule.
 */
export declare const AUTO_MODE_DENIAL_GUIDANCE =
  'Do not try to complete the denied action through another tool, shell indirection, generated script, alias, symlink, config change, hook, command file, MCP configuration, encoded payload, or equivalent path. If that action is required, stop and ask the user for explicit approval. You may continue with unrelated safe work or a genuinely safer alternative that does not accomplish the denied action.';
export declare function formatClassifierUnavailableFallbackMessage(
  decision: Extract<
    AutoModeDecision,
    {
      via: 'classifier';
    }
  >,
): string;
export declare function decorateClassifierUnavailableConfirmation(
  confirmation: ToolCallConfirmationDetails,
  message: string,
): ToolCallConfirmationDetails;
/**
 * Build the tool-error message the scheduler / ACP session returns when the
 * classifier supplies a policy block. Keeping it here gives both paths the
 * same denial guidance.
 *
 * Callers are responsible for only invoking this on classifier verdicts —
 * `decision.via === 'classifier'` with `decision.shouldBlock === true`.
 */
export declare function formatClassifierBlockMessage(
  decision: Extract<
    AutoModeDecision,
    {
      via: 'classifier';
    }
  >,
): string;
export interface EvaluateAutoModeInput {
  ctx: PermissionCheckContext;
  /** True when a user-provided `permissions.ask` rule matched this call. */
  pmForcedAsk: boolean;
  /** Raw tool params (forwarded to the classifier). */
  toolParams: Record<string, unknown>;
  /** Main session message history. */
  messages: readonly Content[];
  config: Config;
  signal: AbortSignal;
  /**
   * When present, the L5.3 classifier is skipped and an unmatched call
   * resolves to `{ via: 'fallback', reason: skipClassifierReason }`.
   * Used by the scheduler to short-circuit classifier dispatch when
   * denialTracking has already armed a fallback to manual approval —
   * while still letting safe tools take the L5.1 / L5.2 fast-paths.
   */
  skipClassifierReason?: DenialFallbackReason;
}
/**
 * Resolve a pending tool call under AUTO mode by walking the three-layer
 * filter in order. Caller must have already determined that L4 did not
 * resolve the call to `allow` or `deny` — `evaluateAutoMode` only runs
 * when L4 produced `'ask'` (tool's intrinsic default OR user-forced) or
 * `'default'`.
 */
export declare function evaluateAutoMode(
  input: EvaluateAutoModeInput,
): Promise<AutoModeDecision>;
