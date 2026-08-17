import type {
  ChannelUserInputRequestContext,
  UserInputPresentationResult,
} from '@qwen-code/channel-base';
export type FeishuQuestionCallbackResult =
  | {
      kind: 'unhandled';
    }
  | {
      kind: 'handled';
      response: Record<string, unknown>;
      execute?: () => Promise<void>;
    };
export interface FeishuQuestionCardControllerOptions {
  timeoutMs: number;
  sendCard(chatId: string, card: Record<string, unknown>): Promise<string>;
  patchCard(messageId: string, card: Record<string, unknown>): Promise<boolean>;
  sendFallback(chatId: string, text: string): Promise<void>;
  onError?(operation: string, error: unknown): void;
}
export declare class FeishuQuestionCardController {
  private readonly options;
  private readonly byRequest;
  private readonly activeByScope;
  private disposed;
  constructor(options: FeishuQuestionCardControllerOptions);
  present(
    context: ChannelUserInputRequestContext,
  ): Promise<UserInputPresentationResult>;
  claim(data: unknown): FeishuQuestionCallbackResult;
  cancelRun(runId: string, terminalState?: 'cancelled' | 'expired'): void;
  dispose(): void;
  private expire;
  private respond;
  private isTerminated;
  private finalize;
  private completeResponse;
  private projectTerminal;
  private expiredResponse;
  private markClaimed;
  private scopeKey;
  private fallbackText;
}
