import type { ChannelOutputSegmentContext, ChannelOutputSegmentEndReason, ChannelUserInputRequestContext, UserInputPresentationResult } from '@qwen-code/channel-base';
import type { QuestionCardController } from './question-card-controller.js';
import { type StatusCardController } from './status-card-controller.js';
export interface DingtalkInteractionPresenterOptions {
    statusCards?: StatusCardController;
    questionCards?: QuestionCardController;
    sendFallback?(chatId: string, text: string, sessionId: string): Promise<void>;
}
export interface DingtalkCardSender {
    senderName: string;
}
export declare class DingtalkInteractionPresenter {
    private readonly options;
    private readonly runs;
    private readonly segments;
    private readonly terminalSegmentIds;
    constructor(options: DingtalkInteractionPresenterOptions);
    registerRun(runId: string, ownerId: string, target: {
        chatId: string;
        isGroup: boolean;
    }, sessionId?: string, sender?: DingtalkCardSender): void;
    startStatusCard(runId: string): void;
    appendOutput(segment: ChannelOutputSegmentContext, chunk: string): void;
    closeOutput(segmentId: string, text: string, reason: ChannelOutputSegmentEndReason, segment?: ChannelOutputSegmentContext): Promise<boolean>;
    presentInput(context: ChannelUserInputRequestContext): Promise<UserInputPresentationResult>;
    terminalizeRun(runId: string, terminal: 'completed' | 'failed' | 'cancelled', detail?: string): void;
    reserveProjection(runId: string): ((operation: () => Promise<void>) => Promise<void>) | undefined;
    /**
     * A failed or cancelled terminal overwrites the single continuity card,
     * erasing content a boundary already declared delivered there. Send it as
     * a text message so it survives the overwrite.
     */
    private redeliverCardDeliveredContent;
    private enqueue;
    private boundContent;
    private withSenderPrefix;
    private withoutExistingSenderPrefix;
    private ensureStatusContext;
    private cardTarget;
    private addTerminalSegment;
}
