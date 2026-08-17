import type { Message, SystemMessage } from '../adapters/types';
export declare function parseModelSwitchStatusModel(
  content: string,
): string | null;
export declare function isModelSwitchSummaryMessage(
  message: Message,
): message is SystemMessage;
export declare function filterModelSwitchMessages(
  messages: readonly Message[],
): Message[];
