export declare const STATUS_CARD_TEMPLATE_ID =
  '675cde2f-f526-40cb-b828-f5b2b57b8b77.schema';
export declare const QUESTION_CARD_TEMPLATE_ID =
  'c2a6355b-9724-4f7e-9653-d33fcb3311bb.schema';
type CardParamMap = Record<string, unknown>;
export interface CreateCardInput {
  templateId: string;
  outTrackId: string;
  target: {
    chatId: string;
    isGroup: boolean;
  };
  cardParamMap: CardParamMap;
}
export interface StreamCardInput {
  outTrackId: string;
  key: string;
  content: string;
  finalize: boolean;
  isError?: boolean;
}
export interface UpdateCardInput {
  outTrackId: string;
  cardParamMap: CardParamMap;
}
export interface DingtalkInteractiveCardClientOptions {
  robotCode: string;
  getAccessToken(): Promise<string>;
  fetch?: typeof fetch;
}
export declare class DingtalkInteractiveCardClient {
  private readonly options;
  private readonly fetch;
  constructor(options: DingtalkInteractiveCardClientOptions);
  createAndDeliver(input: CreateCardInput): Promise<void>;
  openOrUpdateStream(input: StreamCardInput): Promise<void>;
  updateInstance(input: UpdateCardInput): Promise<void>;
  private request;
}
export {};
