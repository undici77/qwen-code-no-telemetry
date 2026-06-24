/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonToolTranscriptBlock, DaemonTranscriptBlock, DaemonTranscriptReducerOptions, DaemonTranscriptState, DaemonUiEvent } from './types.js';
type TimestampFormatOptions = {
    locale?: string;
    timeZone?: string;
    timeStyle?: 'short' | 'medium' | 'long' | 'full';
    dateStyle?: 'short' | 'medium' | 'long' | 'full';
};
export declare function createDaemonTranscriptState(opts?: DaemonTranscriptReducerOptions): DaemonTranscriptState;
export declare function appendLocalUserTranscriptMessage(state: DaemonTranscriptState, text: string, opts?: DaemonTranscriptReducerOptions & {
    images?: Array<{
        data: string;
        mimeType: string;
    }>;
}): DaemonTranscriptState;
export declare function reduceDaemonTranscriptEvents(state: DaemonTranscriptState, events: readonly DaemonUiEvent[], opts?: DaemonTranscriptReducerOptions): DaemonTranscriptState;
export declare function rebuildDaemonTranscriptBlockIndex(blocks: readonly DaemonTranscriptBlock[]): Record<string, number>;
/**
 * Format `missed daemon events X-Y` defensively. The naive formula
 * `lastDeliveredId+1 .. earliestAvailableId-1` produces inverted output
 * for `gap == 0` (next-id-is-next, no actual gap) and confusing
 * single-event range for `gap == 1`. Round all edge cases to natural
 * phrasing so the diagnostic stays readable.
 */
export declare function formatMissedRange(lastDeliveredId: number, earliestAvailableId: number): string;
export declare function selectTranscriptBlocks(state: DaemonTranscriptState): readonly DaemonTranscriptBlock[];
export declare function selectPendingPermissionBlocks(state: DaemonTranscriptState): ReadonlyArray<Extract<DaemonTranscriptBlock, {
    kind: 'permission';
}>>;
export declare function selectTranscriptBlocksOrderedByEventId(state: DaemonTranscriptState): readonly DaemonTranscriptBlock[];
/**
 * Return the currently-running tool block, or `undefined` when no tool is
 * in flight. Used by UI to render a "正在运行 X" header without scanning
 * `blocks[]`.
 */
export declare function selectCurrentTool(state: DaemonTranscriptState): Extract<DaemonTranscriptBlock, {
    kind: 'tool';
}> | undefined;
/**
 * Approval mode currently active for the session, mirrored from
 * `session.approval_mode.changed` events. `undefined` until the daemon
 * emits at least one change event.
 */
export declare function selectApprovalMode(state: DaemonTranscriptState): string | undefined;
/**
 * Most recent follow-up suggestion observed for the session, mirrored
 * from `followup.suggestion` events. Adapters render the `suggestion`
 * as ghost-text in their input placeholder. Returns `undefined` until
 * the daemon emits at least one suggestion, or after the consumer
 * clears it via `clearFollowupSuggestion` (typically on sendPrompt).
 */
export declare function selectLastFollowupSuggestion(state: DaemonTranscriptState): {
    suggestion: string;
    promptId: string;
} | undefined;
/**
 * Per-tool progress query. Returns `undefined` if no progress has been
 * recorded for the given toolCallId. The shape `{ ratio?, step? }` matches
 * the eventual `tool.progress` event payload (daemon-side emission
 * pending — SDK is ready to consume).
 *
 * @alpha The daemon does not emit `tool.progress` yet, so this selector is
 * provisional until that event lands.
 */
export declare function selectToolProgress(state: DaemonTranscriptState, toolCallId: string): {
    ratio?: number;
    step?: string;
} | undefined;
export declare function selectSubagentChildBlocks(state: DaemonTranscriptState, parentToolCallId: string): readonly DaemonToolTranscriptBlock[];
/**
 * Return whether a given tool block was invoked inside a sub-agent
 * delegation (has `parentToolCallId` set). Convenience for renderers
 * dispatching on flat-vs-nested rendering.
 */
export declare function isSubagentChildBlock(block: DaemonTranscriptBlock): block is DaemonToolTranscriptBlock;
/**
 * Format the most authoritative timestamp on a block as a localized
 * string. Prefers `serverTimestamp` (cross-client consistent), falls back
 * to `clientReceivedAt` (always set, but client-clock).
 *
 * Returns `''` if the block has neither — defensive against future block
 * types that may not carry timestamps.
 *
 * @example
 *   formatBlockTimestamp(block) // "2026-05-20 14:32:18"
 *   formatBlockTimestamp(block, { locale: 'zh-CN', timeStyle: 'short' })
 */
export declare function formatBlockTimestamp(block: DaemonTranscriptBlock, opts?: TimestampFormatOptions): string;
export {};
