import type {
  ChannelUserInputRequestContext,
  UserInputPresentationResult,
} from '@qwen-code/channel-base';
import { type DingtalkInteractiveCardClient } from './interactive-card-client.js';
import type {
  DingtalkCardCallback,
  DingtalkCardCallbackResult,
} from './interactive-card-types.js';
export interface QuestionCardControllerOptions {
  client: DingtalkInteractiveCardClient;
  timeoutMs: number;
  sendFallback(chatId: string, text: string): Promise<void>;
  reserveRunProjection?(
    runId: string,
  ): ((operation: () => Promise<void>) => Promise<void>) | undefined;
  onError?(operation: string, error: unknown): void;
}
export declare class QuestionCardController {
  private readonly options;
  private readonly byRequest;
  private readonly byOutTrack;
  private readonly activeByScope;
  private readonly pendingByRun;
  private nextSequence;
  constructor(options: QuestionCardControllerOptions);
  present(
    context: ChannelUserInputRequestContext,
    target: {
      chatId: string;
      isGroup: boolean;
    },
  ): Promise<UserInputPresentationResult>;
  claim(callback: DingtalkCardCallback): DingtalkCardCallbackResult;
  cancelRun(runId: string, terminalState?: 'cancelled' | 'expired'): void;
  private respond;
  private expire;
  private finalize;
  private reserveTerminalProjection;
  private projectTerminal;
  private parseAnswers;
  private readAnswerValues;
  private otherAnswerKey;
  private scopeKey;
  private cardData;
  private fallbackText;
}
