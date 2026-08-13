/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonPendingPromptAddedEvent, DaemonPendingPromptStartedEvent, DaemonPendingPromptCompletedEvent, DaemonTurnCompleteEvent, DaemonTurnErrorEvent } from '@qwen-code/sdk/daemon';
export type PendingPromptSidechannelEvent = DaemonPendingPromptAddedEvent | DaemonPendingPromptStartedEvent | DaemonPendingPromptCompletedEvent | DaemonTurnCompleteEvent | DaemonTurnErrorEvent;
export declare function getPendingPromptVersion(): number;
export declare function getPendingPromptEvents(): readonly PendingPromptSidechannelEvent[];
export declare function subscribePendingPromptVersion(listener: () => void): () => void;
export declare function subscribePendingPromptEvents(listener: () => void): () => void;
export declare function bumpPendingPromptVersion(): void;
export declare function consumePendingPromptEvents(handled: readonly PendingPromptSidechannelEvent[]): void;
export declare function publishPendingPromptEvent(event: unknown): boolean;
/**
 * Parse a raw daemon SSE frame and return true if it's a pending-prompt
 * event that should bump the version counter.
 */
export declare function isPendingPromptEvent(event: unknown): boolean;
