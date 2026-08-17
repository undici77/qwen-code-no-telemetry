import type {
  ChannelUserInputRequestContext,
  ChannelUserQuestion,
} from '@qwen-code/channel-base';
export type FeishuQuestionTerminalState =
  | 'processing'
  | 'submitted'
  | 'cancelled'
  | 'expired';
export type FeishuQuestionAction =
  | {
      kind: 'submit';
      requestId: string;
      operatorId?: string;
      chatId?: string;
      messageId?: string;
      formValue?: Record<string, unknown>;
    }
  | {
      kind: 'cancel';
      requestId: string;
      operatorId?: string;
      chatId?: string;
      messageId?: string;
    }
  | {
      kind: 'unhandled';
    };
export declare const terminalLabels: Record<
  FeishuQuestionTerminalState,
  string
>;
export declare function buildQuestionCard(
  context: Pick<ChannelUserInputRequestContext, 'requestId' | 'questions'>,
): Record<string, unknown>;
export declare function buildQuestionTerminalCard(
  questions: ChannelUserQuestion[],
  state: FeishuQuestionTerminalState,
  answers?: Record<string, string>,
): Record<string, unknown>;
export declare function parseQuestionAction(
  data: unknown,
): FeishuQuestionAction;
export declare function parseQuestionAnswers(
  questions: ChannelUserQuestion[],
  formValue: Record<string, unknown> | undefined,
): Record<string, string> | undefined;
