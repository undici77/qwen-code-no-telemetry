/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AgentEventEmitter } from './runtime/agent-events.js';
import type { SandboxConfig } from '../config/config.js';
import type { Content } from '@google/genai';
export declare function sanitizeFilenameComponent(value: string): string;
/** Root dir holding every session's subagent transcripts: `<projectDir>/subagents/`. */
export declare function getSubagentsRootDir(projectDir: string): string;
/**
 * Returns the directory holding all subagent transcripts for a given session.
 * Layout: `<projectDir>/subagents/<sessionId>/`.
 *
 * TODO: this path is part of the model-facing contract via `<output-file>` in
 * the task-notification XML. When a second background task kind lands (e.g. a
 * shell pool), migrate to `<projectDir>/tasks/<sessionId>/<kind>-<id>.jsonl`
 * so the namespace generalizes. Update `read-file.ts` auto-allow accordingly.
 */
export declare function getSubagentSessionDir(
  projectDir: string,
  sessionId: string,
): string;
/** Returns the canonical JSONL transcript path. */
export declare function getAgentJsonlPath(
  projectDir: string,
  sessionId: string,
  agentId: string,
): string;
/** Returns the sidecar metadata file path. */
export declare function getAgentMetaPath(
  projectDir: string,
  sessionId: string,
  agentId: string,
): string;
export interface AgentMeta {
  agentId: string;
  agentType: string;
  description: string;
  /** SessionId of the user session that launched this agent. */
  parentSessionId: string;
  /** Tool call in the parent session that launched this agent. */
  toolUseId?: string;
  /** AgentId of the launching subagent for nested forks; null for top-level. */
  parentAgentId: string | null;
  /** ISO 8601 creation time. */
  createdAt: string;
  /**
   * Persisted lifecycle status. Background-resume discovery treats
   * `running` as resumable work that was interrupted by process exit.
   */
  status?: 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  /**
   * Whether the original launch ran asynchronously. Completed entries are
   * restored only when this is explicitly true so legacy foreground sidecars
   * are never exposed as reusable background agents.
   */
  isBackgrounded?: boolean;
  /** Whether the original launch used temporary worktree isolation. */
  isolation?: 'worktree';
  /** ISO 8601 timestamp of the latest lifecycle transition. */
  lastUpdatedAt?: string;
  /** Resolved approval mode used when the agent was launched. */
  resolvedApprovalMode?: string;
  /**
   * Immutable launch-time execution policy for a restricted fork.
   * Legacy absence allows every tool except the mandatory interaction-tool
   * exclusion; an empty list means deny-all.
   */
  executionAllowedTools?: string[];
  /** Launch-time CLI/runtime flags that should survive process restart. */
  persistedCliFlags?: AgentPersistedCliFlags;
  /** Canonical subagent config name used to recreate this agent. */
  subagentName?: string;
  /** UI hint preserved for resumed task rows. */
  agentColor?: string;
  /** Number of explicit resume attempts performed so far. */
  resumeCount?: number;
  /**
   * Nesting depth at launch time; restored on background/foreground resume
   * via {@link normalizeResumedAgentDepth} — never trust the raw value.
   */
  depth?: number;
  /**
   * Concrete model ID this agent runs with. Persisted so a process-restart
   * recovery can enforce per-model concurrency caps on the revive path.
   */
  model?: string;
  /** Last terminal error, if any. */
  lastError?: string;
}
export interface AgentPersistedCliFlags {
  /** Mirrors resolvedApprovalMode; kept here so the restored flag set is explicit. */
  approvalMode?: string;
  bare?: boolean;
  safeMode?: boolean;
  sandbox?: SandboxConfig | null;
  screenReader?: boolean;
  model?: string;
  authType?: string;
  baseUrl?: string;
  maxSessionTurns?: number;
  maxToolCalls?: number;
  /**
   * Launch-time nesting cap. Interprets the persisted `depth` — without it a
   * nested agent launched under a lower cap would resume after restart under
   * the new session's (or default) cap and regain spawn capacity.
   *
   * Always a normalized 1–100 integer when written by this codebase; the
   * resume path still re-normalizes because the sidecar is a plain JSON
   * file a malformed or hand-edited copy of which can carry anything.
   */
  maxSubagentDepth?: number;
}
/**
 * Normalizes a persisted launch depth read from an agent sidecar before it
 * is pinned via the `runWithAgentContext` depthOverride. The sidecar is a
 * plain JSON file, so a malformed or hand-edited value must not mint spawn
 * capacity: a negative depth (or `-1e309`, which parses to -Infinity) would
 * make `canSpawnNestedAgent()` pass for every cap.
 *
 * Absent values return undefined (the resume frame derives its depth as a
 * fresh launch). Anything but an integer within 0–{@link
 * MAX_SUBAGENT_DEPTH_LIMIT} fails CLOSED to the limit: the resumed agent
 * keeps running but cannot spawn — clamping a corrupt value down to 0 would
 * fail open by granting full spawn capacity.
 */
export declare function normalizeResumedAgentDepth(
  value: number | undefined,
): number | undefined;
/**
 * Best-effort — a failed sidecar write must not break the agent launch path.
 */
export declare function writeAgentMeta(metaPath: string, meta: AgentMeta): void;
export declare function readAgentMeta(metaPath: string): AgentMeta | undefined;
export declare function patchAgentMeta(
  metaPath: string,
  updates: Partial<AgentMeta>,
): AgentMeta | undefined;
export declare function readLastTranscriptRecordUuidSync(
  jsonlPath: string,
): string | null;
export interface AttachJsonlOptions {
  /** Subagent identifier — populated on every record. */
  agentId: string;
  /** Display name (subagent type), e.g. "explore". */
  agentName?: string;
  /** UI hint. */
  agentColor?: string;
  /** Parent user-session UUID — recorded as `sessionId` on every record. */
  sessionId: string;
  /** cwd at launch time, for resume context. */
  cwd: string;
  /** CLI version for compatibility tracking. */
  version: string;
  /** Optional git branch at launch time. */
  gitBranch?: string;
  /**
   * Launching prompt — recorded as the first `user`-role record so the
   * transcript is self-describing. Empty/omitted seeds nothing.
   */
  initialUserPrompt?: string;
  /**
   * Exact bootstrap history that seeded the agent before its first runtime
   * turn. Used by transcript-first resume to reconstruct fork context.
   */
  bootstrapHistory?: Content[];
  /**
   * Launching prompt that should be treated as the first model-facing task
   * prompt during transcript-based resume. For forks this may differ from the
   * bootstrap's visible user directive (e.g. `Begin.` vs full boilerplate).
   */
  launchTaskPrompt?: string;
  /**
   * When true, continue appending onto an existing transcript rather than
   * starting a fresh UUID chain.
   */
  appendToExisting?: boolean;
  /**
   * Optional explicit parent UUID to use for the first appended record.
   * Resume flows pass the last stable transcript UUID here so new records
   * branch away from any dangling tail produced by an interrupted turn.
   */
  initialParentUuid?: string | null;
}
export interface AttachJsonlTranscriptResult {
  /** Removes the event listeners and closes the file handle. Idempotent. */
  cleanup: () => void;
}
/**
 * Subscribes to an AgentEventEmitter and appends ChatRecord-shaped JSONL
 * lines to `jsonlPath`. Maintains a parentUuid chain so consumers can walk
 * the transcript tree the same way they walk the main session log.
 *
 * Holds a single append-mode fd for the lifetime of the writer so streaming
 * tools (which can fire many TOOL_CALL events per round) avoid
 * an open+write+close syscall storm. The fd is opened lazily on the first
 * write so callers that attach but never produce a record don't materialize
 * an empty file.
 */
export declare function attachJsonlTranscriptWriter(
  emitter: AgentEventEmitter,
  jsonlPath: string,
  options: AttachJsonlOptions,
): AttachJsonlTranscriptResult;
