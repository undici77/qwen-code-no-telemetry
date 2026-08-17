/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '../config/config.js';
import type {
  PartListUnion,
  Content,
  FunctionDeclaration,
  GenerateContentResponseUsageMetadata,
} from '@google/genai';
import type { AttributionSnapshot } from './commitAttribution.js';
import type {
  ChatCompressionInfo,
  ToolCallResponseInfo,
} from '../core/turn.js';
import type { Status } from '../core/coreToolScheduler.js';
import type { UiEvent } from '../telemetry/uiTelemetry.js';
import type {
  FileHistorySnapshot,
  SerializedFileHistorySnapshot,
} from './fileHistoryService.js';
import type {
  SessionArtifactEventRecordPayload,
  SessionArtifactSnapshotRecordPayload,
} from './session-artifact-persistence.js';
import { type SessionWriterLease } from './session-writer-lease.js';
import type {
  GoalStateRecordPayloadV2,
  GoalTurnPermit,
  TranscriptCursor,
} from '../goals/goal-protocol.js';
export declare function sanitizeToolCallResultForRecording<
  T extends Partial<ToolCallResponseInfo>,
>(toolCallResult: T): T;
/**
 * A single record stored in the JSONL file.
 * Forms a tree structure via uuid/parentUuid for future conversation branching support.
 *
 * Each record is self-contained with full metadata, enabling:
 * - Append-only writes (crash-safe)
 * - Tree reconstruction by following parentUuid chain
 * - Future conversation branching by forking from any historical record
 */
export type ChatRecordProvenance =
  | 'real_user'
  | 'assistant_output'
  | 'tool_result'
  | 'goal_control'
  | 'goal_runtime'
  | 'system';
export type RecordToolResultOptions =
  | {
      goalContext?: GoalTurnPermit;
      provenance?: 'tool_result';
    }
  | {
      goalContext: GoalTurnPermit;
      provenance: 'goal_runtime';
    };
export interface ChatRecord {
  /** Unique identifier for this logical message */
  uuid: string;
  /** UUID of the parent message; null for root (first message in session) */
  parentUuid: string | null;
  /** Session identifier - groups records into a logical conversation */
  sessionId: string;
  /** ISO 8601 timestamp of when the record was created */
  timestamp: string;
  /**
   * Message type: user input, assistant response, tool result, or system event.
   * System records are append-only events that can alter how history is reconstructed
   * (e.g., chat compression checkpoints) while keeping the original UI history intact.
   */
  type: 'user' | 'assistant' | 'tool_result' | 'system';
  /** Optional subtype for distinguishing non-standard records */
  subtype?:
    | 'chat_compression'
    | 'slash_command'
    | 'ui_telemetry'
    | 'at_command'
    | 'attribution_snapshot'
    | 'notification'
    | 'cron'
    | 'mid_turn_user_message'
    | 'custom_title'
    | 'parent_session'
    | 'session_source'
    | 'rewind'
    | 'agent_bootstrap'
    | 'agent_launch_prompt'
    | 'file_history_snapshot'
    | 'user_text_elements'
    | 'session_artifact_event'
    | 'session_artifact_snapshot'
    | 'goal_state'
    | 'goal_runtime'
    | 'realtime_message';
  /** Explicit source classification used by Goal evidence validation. */
  provenance?: ChatRecordProvenance;
  /** Goal identity and logical turn that owned this model-facing record. */
  goalContext?: GoalTurnPermit;
  /** Working directory at time of message */
  cwd: string;
  /** CLI version for compatibility tracking */
  version: string;
  /** Current git branch, if available */
  gitBranch?: string;
  /**
   * The actual Content object (role + parts) sent to/from LLM.
   * This is stored in the exact format needed for API calls, enabling
   * direct aggregation into Content[] for session resumption.
   * Contains: text, functionCall, functionResponse, thought parts, etc.
   */
  message?: Content;
  /** Token usage statistics */
  usageMetadata?: GenerateContentResponseUsageMetadata;
  /** Model used for this response */
  model?: string;
  /** Context window size of the model used for this response */
  contextWindowSize?: number;
  /**
   * Tool call metadata for UI recovery.
   * Contains enriched info (displayName, status, result, etc.) not in API format.
   */
  toolCallResult?: Partial<ToolCallResponseInfo> & {
    status?: Status;
  };
  /**
   * Payload for records that need non-API metadata. For chat compression, this
   * stores all data needed to reconstruct the compressed history without
   * mutating the original UI list.
   */
  systemPayload?:
    | ChatCompressionRecordPayload
    | SlashCommandRecordPayload
    | UiTelemetryRecordPayload
    | AtCommandRecordPayload
    | AttributionSnapshotPayload
    | CustomTitleRecordPayload
    | ParentSessionRecordPayload
    | SessionSourceRecordPayload
    | NotificationRecordPayload
    | UserPromptRecordPayload
    | RewindRecordPayload
    | AgentBootstrapRecordPayload
    | FileHistorySnapshotRecordPayload
    | UserTextElementsRecordPayload
    | SessionArtifactEventRecordPayload
    | SessionArtifactSnapshotRecordPayload
    | GoalStateRecordPayloadV2;
  /** Background subagent that produced this record (e.g. "explore-7f3c"). */
  agentId?: string;
  /** Display name for the subagent (e.g. "Explore"). */
  agentName?: string;
  /** UI hint for tools rendering subagent transcripts. */
  agentColor?: string;
  /** True for records produced by a subagent (a sidechain off the parent session). */
  isSidechain?: boolean;
  /** Writer execution that produced this subagent round. */
  agentRunId?: string;
  /** Round number within agentRunId. */
  agentRound?: number;
  /** Source kind for injected external input records. */
  externalInputKind?: 'message' | 'notification';
  /**
   * Set on every record of a forked session to record its lineage.
   * `sessionId` is the parent (source) session id; `messageUuid` is the
   * uuid of the equivalent message in the parent — the same value as
   * this record's `uuid`, since /branch copies each message verbatim
   * except for rewriting `sessionId` and rebuilding `parentUuid` by
   * write order.
   *
   * Written by /branch on every copied record; never consumed by any
   * feature at read time — it exists purely as per-message audit trail
   * so that when a record is inspected in isolation its origin is
   * self-contained (mirrors Claude Code's /branch behavior).
   */
  forkedFrom?: {
    sessionId: string;
    messageUuid: string;
  };
}
export interface NotificationRecordPayload {
  displayText: string;
  backgroundTask?: {
    taskId: string;
    status: string;
    kind: 'agent' | 'monitor' | 'shell';
    toolUseId?: string;
    /** Structured fields for i18n rendering (persisted for page refresh). */
    description?: string;
    commandLabel?: string;
    eventCount?: number;
    droppedLines?: number;
  };
}
export interface UserPromptRecordPayload {
  /**
   * TUI submittedPrompt projection when available; otherwise the expanded
   * pre-hook prompt.
   */
  displayText: string;
  /** Sanitized hook context duplicated from the tagged model-bound part. */
  hookContext: string;
}
export interface AgentBootstrapRecordPayload {
  /** Bootstrap kind for future-proof decoding. */
  kind: 'fork';
  /**
   * Exact model-facing history prefix seeded before the agent emitted any
   * runtime events. For forks, this includes the inherited parent context and
   * the original first task prompt/user turn.
   */
  history: Content[];
  /**
   * Legacy launch-time system instruction. Current writers omit this field and
   * resume reconstructs the instruction from the current parent runtime.
   */
  systemInstruction?: string | Content;
  /**
   * Legacy launch-time tool declarations / allowlist. Current writers omit
   * this field and resume resolves tool names through the current registry.
   */
  tools?: Array<string | FunctionDeclaration>;
}
/**
 * Stored payload for chat compression checkpoints. This allows us to rebuild the
 * effective chat history on resume while keeping the original UI-visible history.
 */
export interface ChatCompressionRecordPayload {
  /** Compression metrics/status returned by the compression service */
  info: ChatCompressionInfo;
  /**
   * Snapshot of the new history contents that the model should see after
   * compression (summary turns + retained tail). Stored as Content[] for
   * resume reconstruction.
   */
  compressedHistory: Content[];
}
export interface SlashCommandRecordPayload {
  /** Whether this record represents the invocation or the resulting output. */
  phase: 'invocation' | 'result';
  /** Raw user-entered slash command (e.g., "/about"). */
  rawCommand: string;
  /** Whether the visible slash-command invocation reached model history. */
  sentToModel?: boolean;
  /**
   * Whether the UI intentionally hid this invocation from visible history,
   * so resume/preview reconstruction skips the user row as well.
   */
  hiddenInvocation?: boolean;
  /**
   * History items the UI displayed for this command, in the same shape used by
   * the CLI (without IDs). Stored as plain objects for replay on resume.
   */
  outputHistoryItems?: Array<Record<string, unknown>>;
}
/**
 * Stored payload for @-command replay.
 */
export interface AtCommandRecordPayload {
  /** Files that were read for this @-command. */
  filesRead: string[];
  /** Status for UI reconstruction. */
  status: 'success' | 'error';
  /** Optional result message for UI reconstruction. */
  message?: string;
  /** Raw user-entered @-command query (optional for legacy records). */
  userText?: string;
}
/**
 * Source of a custom session title.
 * - `manual`: set by the user via `/rename` (or pre-2026 records without
 *   a source field — treated as manual for safety so auto can't overwrite
 *   a title a user deliberately chose).
 * - `auto`: generated by the session-title service from conversation text;
 *   safe to re-generate or be replaced by a manual rename.
 */
export type TitleSource = 'manual' | 'auto';
/**
 * Stored payload for custom title set via /rename or auto-generation.
 */
export interface CustomTitleRecordPayload {
  /** The custom title for the session */
  customTitle: string;
  /**
   * How this title was produced. Absent on legacy records — readers should
   * treat `undefined` as `'manual'` so existing user-set titles are never
   * replaced by auto-generation after an upgrade.
   */
  titleSource?: TitleSource;
}
/**
 * Stored payload recording the session that spawned this one (a
 * `create_sub_session` caller). Immutable — written once, near the start of the
 * transcript. Lets a management UI link a sub-session back to its parent, and
 * survives a daemon restart via the session-list transcript scan.
 */
export interface ParentSessionRecordPayload {
  /** Id of the session that spawned this one. */
  parentSessionId: string;
}
/** Immutable attribution describing which integration created the session. */
export interface SessionSourceRecordPayload {
  sourceType: string;
  sourceId?: string;
}
/**
 * Stored payload for UI telemetry replay.
 */
export interface UiTelemetryRecordPayload {
  uiEvent: UiEvent;
}
/**
 * Stored payload for attribution state snapshots.
 * Enables session persistence of AI contribution tracking.
 */
export interface AttributionSnapshotPayload {
  snapshot: AttributionSnapshot;
}
/**
 * Stored payload for conversation rewind events.
 */
export interface RewindRecordPayload {
  /** Number of UI history items truncated. */
  truncatedCount: number;
}
/**
 * Stored payload for file history snapshot persistence.
 * Each entry records one or more snapshots for session resume.
 */
export interface FileHistorySnapshotRecordPayload {
  snapshots: SerializedFileHistorySnapshot[];
}
export interface UserTextElementsRecordPayload {
  content: string;
  textElements: unknown[];
}
export interface ChatRecordingFailureEvent {
  sessionId: string;
  error: Error;
}
export type ChatRecordingFailureListener = (
  event: ChatRecordingFailureEvent,
) => void | Promise<void>;
/**
 * Service for recording the current chat session to disk.
 *
 * This service provides comprehensive conversation recording that captures:
 * - All user and assistant messages
 * - Tool calls and their execution results
 * - Token usage statistics
 * - Assistant thoughts and reasoning
 *
 * **API Design:**
 * - `recordUserMessage()` - Queues a user message for recording
 * - `recordAssistantTurn()` - Queues an assistant turn with all data
 * - `recordToolResult()` - Queues tool results for recording
 *
 * **Storage Format:** JSONL files with tree-structured records.
 * Each record has uuid/parentUuid fields enabling:
 * - Append-only writes (never rewrite the file)
 * - Linear history reconstruction
 * - Future conversation branching (fork from any historical point)
 *
 * File location: ~/.qwen/tmp/<project_id>/chats/
 *
 * For session management (list, load, remove), use SessionService.
 */
export declare class ChatRecordingService {
  private readonly onWriteFailure?;
  /** UUID of the active logical tail, including records queued for writing. */
  private lastRecordUuid;
  /** UUID of the last active-tail record confirmed written to disk. */
  private lastPersistedRecordUuid;
  private readonly config;
  /**
   * Tracks the `lastRecordUuid` value just before each user turn was recorded.
   * Used by {@link rewindRecording} to re-root the parentUuid chain so that
   * rewound messages end up on a dead branch in the tree, making
   * `reconstructHistory()` skip them automatically on resume.
   *
   * Index `i` holds the active tail UUID observed before the (i+1)th user
   * message was queued. For example, `turnParentUuids[0]` is the UUID right
   * before the very first user message (often `null` or the startup context
   * record).
   */
  private turnParentUuids;
  private chatsDirEnsured;
  private cachedConversationFile;
  private state;
  private binding;
  /** Serializes appends and authoritative read barriers. Always settles. */
  private operationTail;
  private acceptingWrites;
  private closePromise;
  private handoffRequested;
  /** First async JSONL write failure; permanently degrades this recorder. */
  private writeFailure;
  private integrityFailure;
  private readonly writerLeaseRequired;
  /** In-memory cache of the current session's custom title (for re-append on exit) */
  private currentCustomTitle;
  /**
   * Source of {@link currentCustomTitle}. `undefined` on legacy records that
   * pre-date the `titleSource` field — that's treated as manual everywhere
   * (safe default) without rewriting the persisted record.
   */
  private currentTitleSource;
  /** Parent session id once recorded, so {@link recordParentSession} is
   * idempotent — a bridge retry (after a failed response) must not append a
   * second `parent_session` record for the same immutable lineage. */
  private currentParentSessionId;
  /** Immutable creator attribution once recorded. */
  private currentSourceType;
  private currentSourceId;
  private readonly userDisplayTextsForTitle;
  /**
   * How many auto-title attempts have been made this process.
   *
   * We don't commit to "one attempt per session" because the first assistant
   * turn may be a pure tool-call with no user-visible text (e.g., the model
   * opens with a search) — the title service returns null, and we'd waste
   * the whole session's chance on a turn that never had a shot. Instead we
   * retry for a handful of turns until either the title lands or we hit the
   * cap, which protects against a persistently failing fast-model looping
   * on every turn. {@link AUTO_TITLE_ATTEMPT_CAP} sets the ceiling.
   */
  private autoTitleAttempts;
  /**
   * AbortController for the in-flight auto-title LLM call, or `undefined`
   * when no generation is pending. Doubles as the in-flight guard — a
   * defined controller means "one is running; don't launch another".
   * Stored on the instance so {@link finalize} (called on session switch
   * and shutdown) can cancel a pending call cleanly rather than letting
   * it burn tokens after the session has already moved on.
   */
  private autoTitleController;
  /** Explicit title writes waiting to settle; background auto-title defers. */
  private pendingExplicitTitleWrites;
  /** Title writes whose durable result and final cached value are unresolved. */
  private pendingTitleWrites;
  /**
   * JSON-serialized form of the most recent attribution snapshot accepted for
   * recording, used to deduplicate identical writes on every non-retry
   * turn. Without this, sessions that touch many files would write a
   * full duplicate of the entire snapshot to the JSONL on every turn,
   * inflating the on-disk session and making `/resume` slower to
   * hydrate.
   */
  private lastAttributionSnapshotJson;
  private cachedGitBranch;
  /**
   * Approximate bytes of JSONL content accepted after the last
   * `custom_title` record in the ordered writer queue. Used by the title
   * re-anchor invariant: once enough non-title content accumulates
   * past the last anchor, {@link appendRecord} re-appends a fresh
   * `custom_title` to EOF so the picker's tail-window scan
   * ({@link readSessionTitleFromFile}) keeps finding it.
   *
   * Without this, a long agentic turn that streams >64KB of tool
   * output could push the only `custom_title` record past the 64KB
   * tail window, forcing the picker into a head-window fallback (or
   * returning undefined if the title is beyond both windows).
   */
  private bytesSinceTitleAnchor;
  private hasNonTitleContentSinceTitleAnchor;
  constructor(
    config: Config,
    onWriteFailure?: ChatRecordingFailureListener | undefined,
    writerLeaseRequired?: boolean,
  );
  private readPersistedTitleInfo;
  /**
   * Returns the current custom title, if any. Read-only accessor for
   * callers (e.g. auto-title trigger) that need to know whether a title is
   * already set before attempting generation.
   */
  getCurrentCustomTitle(): string | undefined;
  /**
   * Returns the source of the current custom title, or `undefined` when no
   * title is set.
   */
  getCurrentTitleSource(): TitleSource | undefined;
  /**
   * Returns the session ID.
   * @returns The session ID.
   */
  private getSessionId;
  private ensureChatsDir;
  private ensureConversationFile;
  private restoreSessionState;
  private trackUserDisplayTextForTitle;
  activate(
    lease: SessionWriterLease,
    sessionData?: {
      conversation: {
        messages: ChatRecord[];
      };
      lastCompletedUuid: string | null;
    },
    persistedTitleInfo?: {
      title?: string;
      source?: TitleSource;
    },
  ): void;
  /**
   * Creates base fields for a ChatRecord.
   */
  private createBaseRecord;
  private getCachedGitBranch;
  private enterWriteFailure;
  private enqueueRecordWrite;
  /**
   * Fire-and-forget: queues a JSONL write on the internal operation tail.
   * A failed write permanently degrades this recorder; already-queued
   * descendants are skipped and later fire-and-forget calls become no-ops.
   */
  private appendRecord;
  private appendRecordStrict;
  /**
   * Maintain the "title is always in the tail window" invariant by
   * counting bytes accepted since the last `custom_title` record and
   * re-anchoring once enough non-title content has been written.
   *
   * - A `custom_title` record IS the new anchor — reset the counter.
   * - Without a current or pending title, the counter is irrelevant.
   * - Otherwise accumulate this record's serialized size; if the
   *   running total breaches the threshold, re-append a fresh
   *   `custom_title` to EOF. The recursive `appendRecord` call will
   *   land this branch's first arm (subtype === 'custom_title') and
   *   reset the counter to 0.
   *
   * Size estimate uses `JSON.stringify` for parity with the actual
   * write path (`jsonl.writeLine` serializes the same way). It's an
   * extra serialize per record, but appendRecord is already gated by
   * an async I/O write whose cost dominates by orders of magnitude.
   *
   * Byte count uses `Buffer.byteLength(..., 'utf8')`, not `String.length`:
   * `String.length` counts UTF-16 code units, but `jsonl.writeLine`
   * emits UTF-8 — multi-byte characters (CJK, emoji) are 2–3× larger
   * on disk than `.length` reports, and undercounting would let the
   * actual on-disk distance from the last anchor blow past the 64KB
   * tail window before the threshold fires.
   */
  private updateTitleAnchorTracking;
  /**
   * Append a fresh `custom_title` record to EOF using the in-memory
   * cached title. Mirrors {@link finalize}'s record shape — invoked
   * mid-session (every 32KB of other writes) so the picker's
   * tail-window scan never has to fall back to
   * scanning the middle of the file.
   */
  private reanchorTitle;
  /**
   * Awaits all queued async writes. Call before process exit / session
   * teardown to ensure no records are dropped.
   */
  flush(): Promise<void>;
  runWithWriteBarrier<T>(operation: () => Promise<T>): Promise<T>;
  assertCanStartTurn(): Promise<void>;
  close(options?: { handoff?: boolean }): Promise<void>;
  beginClose(options?: { handoff?: boolean }): void;
  private closeOnce;
  hasWriteOwnership(): boolean;
  readActiveTranscriptChain(): Promise<readonly ChatRecord[]>;
  getTranscriptCursor(): TranscriptCursor;
  recordGoalState(
    recordUuid: string,
    payload: GoalStateRecordPayloadV2,
  ): Promise<ChatRecord>;
  /**
   * Clears cached filesystem paths after Config swaps to a new working
   * directory. The recorder keeps session state, but future appends must
   * resolve the JSONL path through the updated Config.storage.
   */
  resetStoragePaths(): void;
  /**
   * Records a user message.
   * Queues the write immediately on the serialized async writer.
   *
   * @param message The raw PartListUnion object as used with the API
   * @param goalContext Goal identity and turn that own this message
   * @param promptPayload User-authored display text and hook-context provenance
   */
  recordUserMessage(
    message: PartListUnion,
    goalContext?: GoalTurnPermit,
    promptPayload?: UserPromptRecordPayload,
  ): void;
  getUserDisplayTextsForTitle(): ReadonlyArray<string | undefined>;
  recordGoalRuntimeMessage(
    message: PartListUnion,
    goalContext: GoalTurnPermit,
  ): void;
  /**
   * Records a user message drained while tool results are being submitted.
   *
   * The model sees these as extra user-role parts in the same API Content as
   * tool results. Keeping a distinct subtype lets resume reconstruct that shape
   * instead of replaying consecutive user-role entries.
   */
  recordMidTurnUserMessage(
    message: PartListUnion,
    displayText?: string,
    goalContext?: GoalTurnPermit,
  ): void;
  /**
   * Records a cron-fired prompt.
   * Stored as a user-role message with subtype 'cron' so the UI
   * restores it as a notification item instead of a user turn.
   */
  recordCronPrompt(
    message: PartListUnion,
    displayText?: string,
    goalContext?: GoalTurnPermit,
  ): void;
  /**
   * Records a background agent notification.
   * Stored as a user-role message with subtype 'notification' so the
   * UI restores it as an info item, not a user turn.
   */
  recordNotification(
    message: PartListUnion,
    displayText?: string,
    backgroundTask?: NotificationRecordPayload['backgroundTask'],
    goalContext?: GoalTurnPermit,
  ): void;
  /**
   * Durably records a daemon-delivered notification before its sender is
   * acknowledged. Unlike the ordinary in-process notification path, this
   * rejects when the writer is unavailable or the append fails.
   */
  recordNotificationStrict(
    message: PartListUnion,
    displayText?: string,
    backgroundTask?: NotificationRecordPayload['backgroundTask'],
  ): Promise<void>;
  private recordNotificationLike;
  private createNotificationRecord;
  /**
   * Records an assistant turn with all available data.
   * Queues the write immediately on the serialized async writer.
   *
   * @param data.message The raw PartListUnion object from the model response
   * @param data.model The model name
   * @param data.tokens Token usage statistics
   * @param data.contextWindowSize Context window size of the model
   * @param data.toolCallsMetadata Enriched tool call info for UI recovery
   */
  recordAssistantTurn(data: {
    model: string;
    message?: PartListUnion;
    tokens?: GenerateContentResponseUsageMetadata;
    contextWindowSize?: number;
    goalContext?: GoalTurnPermit;
  }): void;
  recordRealtimeConversation(
    entries: ReadonlyArray<{
      role: 'user' | 'assistant';
      text: string;
    }>,
    model: string,
  ): Promise<void>;
  /**
   * Fire-and-forget: after an assistant turn is recorded, attempt to generate
   * a short session title from the conversation so far. Runs at most once per
   * process lifetime per session and only when:
   *
   * - No title is already set (auto must never overwrite a manual rename,
   *   and we don't need to regenerate an existing auto title mid-session).
   * - A fast model is configured — the service itself also guards this,
   *   but checking here avoids paying for the import/history load when
   *   there's no point.
   *
   * Errors are swallowed. The title is best-effort and must never surface
   * as a user-visible error or interrupt recording.
   */
  private maybeTriggerAutoTitle;
  /**
   * Records tool results (function responses) sent back to the model.
   * Queues the write immediately on the serialized async writer.
   *
   * @param message The raw PartListUnion object with functionResponse parts
   * @param toolCallResult Optional tool call result info for UI recovery
   */
  recordToolResult(
    message: PartListUnion,
    toolCallResult?: Partial<ToolCallResponseInfo> & {
      status: Status;
    },
    options?: RecordToolResultOptions,
  ): void;
  /**
   * Records a slash command invocation as a system record. This keeps the model
   * history clean while allowing resume to replay UI output for commands like
   * /about.
   */
  recordSlashCommand(payload: SlashCommandRecordPayload): void;
  /**
   * Records a chat compression checkpoint as a system record. This keeps the UI
   * history immutable while allowing resume/continue flows to reconstruct the
   * compressed model-facing history from the stored snapshot.
   */
  recordChatCompression(payload: ChatCompressionRecordPayload): void;
  /**
   * Records a UI telemetry event for replaying metrics on resume.
   */
  recordUiTelemetryEvent(uiEvent: UiEvent): void;
  /**
   * Records a conversation rewind and re-roots the parentUuid chain.
   *
   * Sets `lastRecordUuid` back to the UUID that was current just before the
   * target user turn was recorded, then appends a rewind system record.
   * This makes all messages after that point sit on a dead branch in the
   * UUID tree, so `reconstructHistory()` will skip them on resume.
   *
   * @param targetTurnIndex 0-based index of the user turn to rewind to.
   *   For example, 0 means rewind to the very first user message (keeping
   *   nothing before it), 1 means keep the first user turn, etc.
   * @param payload Additional metadata to persist with the rewind record.
   */
  rewindRecording(
    targetTurnIndex: number,
    payload: RewindRecordPayload,
    survivingFileHistorySnapshots?: FileHistorySnapshot[],
  ): void;
  /**
   * Rebuilds `turnParentUuids` from a reconstructed message list.
   *
   * Call this after resuming a session so that subsequent rewinds within
   * the resumed session have correct boundary data. Also updates
   * `lastRecordUuid` to the last record in the chain.
   */
  rebuildTurnBoundaries(messages: ChatRecord[]): void;
  /**
   * Observer invoked after a custom title record lands (manual or auto).
   * The ACP session layer registers here to push a live title notification
   * to connected daemon clients — without it, auto-generated titles are
   * only discoverable via the next session-list poll (generation runs in
   * this child process; the daemon bridge never sees it happen).
   */
  private titleRecordedCallback?;
  setTitleRecordedCallback(
    callback:
      | ((
          customTitle: string,
          titleSource: TitleSource,
          sessionId: string,
        ) => void)
      | undefined,
  ): void;
  /**
   * Returns the currently registered title-recorded callback.
   * Used to chain callbacks (e.g., when a UI component needs to observe
   * title changes without replacing an existing ACP notification callback).
   */
  getTitleRecordedCallback():
    | ((
        customTitle: string,
        titleSource: TitleSource,
        sessionId: string,
      ) => void)
    | undefined;
  /**
   * Durably records an explicit custom title for the session. Explicit title
   * requests take priority over the best-effort background auto-title task.
   *
   * @param customTitle The title text.
   * @param titleSource Where the title came from — defaults to `'manual'`
   *   so existing `/rename` call sites keep their behavior unchanged.
   * @returns true once the record is written, false on any I/O failure.
   */
  recordCustomTitle(
    customTitle: string,
    titleSource?: TitleSource,
  ): Promise<boolean>;
  private persistCustomTitle;
  /**
   * Records the session that spawned this one (a `create_sub_session` caller).
   * Appended as a system record near the start of the transcript so the parent
   * lineage persists with the session and survives a daemon restart (the
   * session list rehydrates it by scanning the transcript). Immutable — written
   * once when the sub-session is created.
   *
   * @param parentSessionId Id of the spawning session.
   * @returns true once the record is durably written, false on I/O error.
   *   AWAITS the write (via the strict append path) rather than the
   *   fire-and-forget `appendRecord`, whose failure is only observable through
   *   a later `flush()` and cannot determine this call's return value.
   */
  recordParentSession(parentSessionId: string): Promise<boolean>;
  /** Persist immutable creator attribution near the start of the transcript. */
  recordSessionSource(sourceType: string, sourceId?: string): Promise<boolean>;
  /**
   * Finalizes the current session by re-appending cached metadata to EOF, but
   * only after this recorder has appended non-title content since the last
   * title anchor. Pure load/resume must remain read-only so session lists do
   * not treat restored sessions as newly active.
   *
   * Best-effort: errors are logged but never thrown.
   */
  finalize(): void;
  /**
   * Records @-command metadata as a system record for UI reconstruction.
   */
  recordAtCommand(payload: AtCommandRecordPayload): void;
  /**
   * Records an attribution state snapshot for session persistence.
   * Called at the start of every non-retry turn so that a resumed session
   * sees the most recent state including edits made during the prior turn.
   *
   * Deduplicates identical successive writes: if the snapshot's JSON
   * form is byte-identical to the last one we wrote, skip the append.
   * Without this, sessions that touch many files would write a full
   * duplicate of the entire snapshot to the JSONL on every turn, even
   * when nothing changed — inflating session size and slowing /resume.
   *
   * Set the dedup key optimistically so synchronous identical calls (common
   * during a tool-driven turn) dedup correctly. A synchronous setup failure
   * rolls the key back; an async write failure permanently degrades this
   * recorder, so the current instance never retries it.
   */
  recordAttributionSnapshot(snapshot: AttributionSnapshot): void;
  recordFileHistorySnapshot(snapshot: FileHistorySnapshot): void;
  recordFileHistorySnapshotBatch(snapshots: FileHistorySnapshot[]): void;
  recordUserTextElements(payload: UserTextElementsRecordPayload): Promise<void>;
  private appendSerializedFileHistorySnapshotBatch;
  recordSessionArtifactEvent(
    payload: SessionArtifactEventRecordPayload,
  ): Promise<void>;
  recordSessionArtifactSnapshot(
    payload: SessionArtifactSnapshotRecordPayload,
  ): Promise<void>;
}
