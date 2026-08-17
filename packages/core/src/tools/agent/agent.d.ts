/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, BaseToolInvocation } from '../tools.js';
import type { ToolResult, ToolResultDisplay } from '../tools.js';
import type { PermissionDecision } from '../../permissions/types.js';
import type { SubagentManager } from '../../subagents/subagent-manager.js';
import { type ForkTurns } from './fork-subagent.js';
import { type ForkProfile } from './fork-profile.js';
import { AgentEventEmitter } from '../../agents/runtime/agent-events.js';
import { PermissionMode } from '../../hooks/types.js';
import { ApprovalMode, Config } from '../../config/config.js';
import { type AgentPersistedCliFlags } from '../../agents/agent-transcript.js';
export interface AgentParams {
  description: string;
  prompt: string;
  /** Todo ID this top-level execution implements, when a visible plan exists. */
  todo_id?: string;
  subagent_type?: string;
  /** User-defined model grade for this subagent invocation. */
  model?: string;
  /**
   * Parent conversation turns inherited by a fork. Omitted or `all` inherits
   * everything; a positive integer string inherits that many recent user turns.
   */
  fork_turns?: ForkTurns;
  /**
   * Tool names a fork may execute. The fork's current model-visible
   * declarations remain unchanged so the prompt-cache prefix is preserved.
   */
  fork_tools?: string[];
  /** Project-level named execution profile for a fork. */
  fork_profile?: string;
  run_in_background?: boolean;
  /** When set, spawn as a named teammate via TeamManager instead of a one-shot subagent. */
  name?: string;
  /** Start a named teammate in plan mode and require leader approval. */
  plan_mode_required?: boolean;
  /** Restrict a named teammate to read-only inspection and coordination tools. */
  read_only?: boolean;
  /**
   * When set to `'worktree'`, spins up a temporary git worktree under
   * `<projectRoot>/.qwen/worktrees/agent-<7hex>` and instructs the agent to
   * confine all file operations to that path. After the agent completes:
   * - if no changes were made, the worktree is auto-removed;
   * - if changes were made, the worktree is preserved and its path/branch
   *   are returned in the agent's result.
   */
  isolation?: 'worktree';
  /**
   * Pins the sub-agent's working directory to an EXISTING, caller-owned
   * git worktree of the current repo (absolute, or relative to the
   * parent's cwd). Unlike `isolation:'worktree'`, the harness does NOT
   * create or clean up the directory — the caller owns its lifecycle
   * (e.g. `/review`'s `fetch-pr` provisions the PR worktree and `cleanup`
   * removes it). Every "where am I?" surface on the sub-agent's Config is
   * rebound to this path so its cwd-relative file/shell operations and its
   * search tools resolve inside the worktree rather than the parent tree.
   * (This is a cwd pin, not a filesystem sandbox — absolute paths can still
   * reach outside, same as `isolation:'worktree'`.) Must resolve to a
   * worktree registered against this repository. Pinning rebinds the child's
   * workspace boundary. If `isolation` is also
   * provided, it is ignored and the caller-owned worktree is reused.
   */
  working_dir?: string;
}
/**
 * Resolves the effective permission mode for a sub-agent.
 *
 * Rules (matching claw-code):
 * - Permissive parent modes (yolo, auto-edit) always win
 * - Otherwise, the agent definition's mode applies if set
 * - Default fallback is auto-edit (sub-agents need autonomy)
 */
export declare function resolveSubagentApprovalMode(
  parentApprovalMode: ApprovalMode,
  agentApprovalMode?: string,
  isTrustedFolder?: boolean,
): PermissionMode;
/**
 * Marker that signals "this Config wrapper has rebuilt its own tool
 * registry so bound EditTool / WriteFileTool / ReadFileTool resolve to
 * the wrapper instead of the parent". Stored as a Symbol-keyed property
 * so that JavaScript's normal property lookup (which walks the
 * prototype chain) lets a downstream wrapper detect a rebuild that
 * happened on any ancestor without manually walking the chain.
 *
 * `Symbol.for` is used so the marker survives bundle-deduping; two
 * independent imports of this module observe the same Symbol identity.
 */
export declare const TOOL_REGISTRY_REBUILT: unique symbol;
/**
 * `true` if any Config in this wrapper's prototype chain has already
 * rebuilt its tool registry via {@link rebuildToolRegistryOnOverride}.
 *
 * Used by spawn sites that may be called with a wrapper-on-wrapper
 * argument (e.g. `subagent-manager.ts:buildSubagentContextOverride`
 * receiving `bgConfig = Object.create(agentConfig)` from the
 * background-agent path) to skip a redundant rebuild.
 */
export declare function hasRebuiltToolRegistry(config: Config): boolean;
/**
 * Rebuilds the tool registry on `override` so core tools resolve
 * `this.config` to `override` instead of `base`. Used by both
 * {@link createApprovalModeOverride} and
 * `subagent-manager.ts:buildSubagentContextOverride` to avoid
 * duplicated rebuild logic.
 *
 * - `override.createToolRegistry(...)` runs on the override (so the
 *   lazy factories close over `this = override`).
 * - Discovered tools (MCP / command-discovered) are copied from `base`
 *   rather than re-discovered, since discovery is expensive.
 * - The {@link TOOL_REGISTRY_REBUILT} marker is set so wrapper-of-wrapper
 *   layers downstream skip the rebuild via {@link hasRebuiltToolRegistry}.
 */
export declare function rebuildToolRegistryOnOverride(
  override: Config,
  base: Config,
): Promise<void>;
/**
 * Handle returned by {@link createApprovalModeOverride}.
 *
 * The `cleanup` callback MUST be invoked in a `finally` block after the
 * sub-agent lifecycle ends. It restores the parent PermissionManager's
 * dangerous allow rules if and only if this override was responsible
 * for stripping them — see {@link createApprovalModeOverride} below
 * for the cases.
 */
export interface ApprovalModeOverrideHandle {
  config: Config;
  cleanup: () => void;
}
export interface ApprovalModeOverrideOptions {
  persistedCliFlags?: AgentPersistedCliFlags;
}
/**
 * Creates a Config override with a different approval mode.
 *
 * Uses prototype delegation (Object.create) to avoid mutating the parent
 * config, then delegates to {@link rebuildToolRegistryOnOverride} so the
 * override's tool registry has core tools bound to the override rather
 * than to the parent. Without that rebuild, the parent's cached tool
 * instances continue to resolve `this.config` to the parent, defeating
 * per-Config isolation of FileReadCache / approval mode for any code
 * path that goes through the bound tool.
 *
 * Returns `{ config, cleanup }`. Callers MUST invoke `cleanup` in a
 * `finally` block after the override is no longer in use, otherwise
 * the parent's PermissionManager may leak a strip across the sub-agent
 * boundary (see strip lifecycle below).
 *
 * Strip lifecycle for AUTO overrides:
 *   - parent not in AUTO, override starts in AUTO: this function strips
 *     the PARENT's PM (shared via prototype chain — the override cannot
 *     have its own PM without a much bigger refactor).
 *   - parent already in AUTO, override starts in AUTO: parent's
 *     `setApprovalMode` already stripped on its own entry, so this
 *     function does not strip again.
 *   - override enters/leaves AUTO later: `setApprovalMode` reuses Config's
 *     normal state transition, but suppresses AUTO strip/restore while the
 *     parent is already in AUTO because the parent owns that strip lifecycle.
 *     `cleanup` only restores if the child finishes still in AUTO while the
 *     parent is not in AUTO.
 */
export declare function createApprovalModeOverride(
  base: Config,
  mode: ApprovalMode,
  options?: ApprovalModeOverrideOptions,
): Promise<ApprovalModeOverrideHandle>;
/**
 * Agent tool that enables primary agents to delegate tasks to specialized agents.
 * The tool dynamically loads available agents and includes them in its description
 * for the model to choose from.
 */
export declare class AgentTool extends BaseDeclarativeTool<
  AgentParams,
  ToolResult
> {
  private readonly config;
  static readonly Name: string;
  get maxOutputChars(): number;
  get truncateKeep(): 'tail';
  private subagentManager;
  private availableSubagents;
  private readonly removeChangeListener;
  constructor(config: Config);
  dispose(): void;
  /**
   * Asynchronously initializes the tool by loading available subagents
   * and updating the description and schema.
   */
  refreshSubagents(): Promise<void>;
  /**
   * Updates the tool's description and schema based on available subagents.
   */
  private updateDescriptionAndSchema;
  validateToolParams(params: AgentParams): string | null;
  protected createInvocation(params: AgentParams): AgentToolInvocation;
  toAutoClassifierInput(params: AgentParams): Record<string, unknown>;
  getAvailableSubagentNames(): string[];
}
declare class AgentToolInvocation extends BaseToolInvocation<
  AgentParams,
  ToolResult
> {
  private readonly config;
  private readonly subagentManager;
  private readonly forkProfile?;
  readonly eventEmitter: AgentEventEmitter;
  private currentDisplay;
  private currentToolCalls;
  private callId?;
  constructor(
    config: Config,
    subagentManager: SubagentManager,
    params: AgentParams,
    forkProfile?: ForkProfile | undefined,
  );
  setCallId(callId: string): void;
  /**
   * Updates the current display state and calls updateOutput if provided
   */
  private updateDisplay;
  private registerOwnedMonitorNotifications;
  /**
   * Sets up event listeners for real-time subagent progress updates
   */
  private setupEventListeners;
  getDescription(): string;
  /**
   * Launching a sub-agent hands off control to a new instance with its
   * own tool access. In AUTO mode the classifier needs to inspect the
   * prompt before the spawn happens — but the scheduler short-circuits
   * at L4 when `finalPermission === 'allow'`, so the L3 default must be
   * `'ask'` or the classifier projection added in this PR would never
   * be reached.
   */
  getDefaultPermission(): Promise<PermissionDecision>;
  /**
   * Creates a fork subagent that inherits the parent's conversation context
   * and cache-safe generation params.
   */
  private createForkSubagent;
  private runSubagentStopHookLoop;
  /**
   * Wrap a subagent body in `qwen-code.subagent` span lifecycle.
   *
   * Single entry point for the 3 invocation paths (foreground named, fork,
   * background). Captures the invoker span context (for fork/background's
   * `Link`), reads parent agent id + depth from the AgentContext ALS, opens
   * the span with appropriate parent strategy, runs `body` inside
   * `runInSubagentSpanContext` so child LLM/tool/hook spans correctly
   * inherit the subagent's traceId, then closes the span with the right
   * status taxonomy.
   *
   * The span's lifecycle is **decoupled from this method's return** — for
   * fire-and-forget paths (fork, background), the caller `void`s the
   * returned promise; the span only closes when the body actually finishes
   * (or the 4h TTL safety net fires). See `telemetry-subagent-spans-design.md`.
   *
   * **Rejection-handling contract for void'd callers:** the body is expected
   * to never reject — both `runSubagentWithHooks` and `bgBody` have their
   * own try/catch and publish outcomes via `recordOutcome`. This wrapper's
   * own `catch` is a defensive fallback for synchronous setup throws.
   * Callers using `void` must NOT remove the body's try/catch under the
   * assumption that this wrapper covers it: a rejection escaping the
   * `void` boundary becomes an unhandled-promise event (terminates the
   * process on Node ≥ 15 in default mode). If a new void'd call site is
   * added, wrap it in `.catch(...)` defensively. wenshao @ #4410.
   *
   * #3731 Phase 3.
   */
  private runWithSubagentSpan;
  /**
   * Build the spec object passed to `runWithSubagentSpan`. The 3 call
   * sites differ only in `invocationKind`; this helper de-duplicates the
   * other fields so renaming `subagentName` (or adding a new spec field)
   * is a one-place change. wenshao @ #4410.
   */
  private buildSubagentSpanSpec;
  /**
   * Runs a subagent with start/stop hook lifecycle, updating the display
   * as execution progresses.
   */
  private runSubagentWithHooks;
  /**
   * Failure ToolResult for a spawn blocked by an execute()-entry guard
   * (nesting depth limit, fork containment). Keeps the two guards' result
   * shape in lockstep.
   */
  private buildSpawnBlockedResult;
  execute(
    signal?: AbortSignal,
    updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult>;
  /**
   * Spawn a named teammate via TeamManager.
   * Returns immediately — the teammate runs concurrently.
   * Messages from the teammate are delivered to the leader
   * via TeamManager's inbox polling mechanism.
   *
   * `signal` aborts the spawn itself if the leader cancels
   * before the teammate is registered. `updateOutput` lets the
   * UI render a brief "spawning…" / "spawned" status while the
   * teammate's runtime config is loaded.
   */
  private executeTeammate;
}
export {};
