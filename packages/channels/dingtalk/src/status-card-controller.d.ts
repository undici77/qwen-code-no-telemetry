import type { ChannelOutputSegmentContext, ChannelTaskCancellationReason } from '@qwen-code/channel-base';
import { type DingtalkInteractiveCardClient } from './interactive-card-client.js';
import type { DingtalkCardCallbackResult } from './interactive-card-types.js';
export declare const CONTENT_LIMIT = 20000;
export declare const TRUNCATION_MARKER = "[Earlier output truncated]\n";
export interface StatusCardControllerOptions {
    client: DingtalkInteractiveCardClient;
    cancelRun(sessionId: string, runId: string): Promise<boolean>;
    model?: string;
    onError?(operation: string, error: unknown): void;
}
export declare class StatusCardController {
    private readonly options;
    private readonly recordsBySegment;
    private readonly recordsByOutTrack;
    private readonly segmentIdsByRun;
    private readonly terminalSegmentIds;
    constructor(options: StatusCardControllerOptions);
    ensure(segment: ChannelOutputSegmentContext, target: {
        chatId: string;
        isGroup: boolean;
    }): void;
    replace(segment: ChannelOutputSegmentContext, target: {
        chatId: string;
        isGroup: boolean;
    }, content: string): void;
    /**
     * Whether a created, still-running status card is displaying content for
     * this segment. Awaits the in-flight creation so a boundary decision made
     * while creation is pending does not race it. A latched stream failure
     * means the card can never show further content, so it is not live.
     */
    isCardLive(segmentId: string): Promise<boolean>;
    /**
     * Drain any pending snapshot so callers can treat the card's current
     * content as delivered. Returns false when there is no live record, the
     * card never became ready, or the stream failed during the drain, so the
     * caller can fall back instead of claiming delivery.
     */
    flushPending(segmentId: string): Promise<boolean>;
    private createRecord;
    complete(segmentId: string, text: string, retainedContent?: (content: string) => string): Promise<boolean>;
    fail(segmentId: string, error: string): void;
    cancelRun(runId: string, reason: ChannelTaskCancellationReason): void;
    claimStop(outTrackId: string, actorId: string): DingtalkCardCallbackResult;
    private create;
    private scheduleFlush;
    private flush;
    private finalize;
    private statusLine;
    private updateRunningStatus;
    private scheduleStatusRefresh;
}
