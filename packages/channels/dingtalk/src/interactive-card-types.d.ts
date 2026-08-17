export interface DingtalkInteractiveCardConfig {
  enabled: boolean;
  statusCard: {
    enabled: boolean;
  };
  questionCard: {
    enabled: boolean;
    timeoutMs: number;
  };
}
export interface DingtalkCardCallback {
  outTrackId: string;
  actionId: string;
  actorId: string;
  formData: Record<string, unknown>;
  hasBusinessPayload?: boolean;
  isCancel?: boolean;
}
export type DingtalkCardCallbackResult =
  | {
      kind: 'accepted';
      execute: () => Promise<void>;
    }
  | {
      kind: 'forbidden';
      actorId: string;
      target: {
        chatId: string;
        isGroup: boolean;
      };
    }
  | {
      kind: 'ignored';
      actorId?: string;
    };
export declare const DINGTALK_INTERACTIVE_CARD_TIMEOUT_EXCLUSIVE_MINIMUM = 0;
export declare const DINGTALK_INTERACTIVE_CARD_TIMEOUT_MAXIMUM_MS = 2147483647;
export declare function parseDingtalkInteractiveCardConfig(
  value: unknown,
): DingtalkInteractiveCardConfig;
export declare function parseDingtalkCardCallback(
  value: unknown,
): DingtalkCardCallback | undefined;
export declare function parseDingtalkCardActorId(
  value: unknown,
): string | undefined;
