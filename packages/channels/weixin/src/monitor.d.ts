/**
 * Long-polling loop: getUpdates -> callback.
 * Platform-agnostic: the onMessage callback handles delivery.
 */
export declare function getContextToken(userId: string): string | undefined;
export interface CdnRef {
    encryptQueryParam: string;
    aesKey: string;
}
export interface FileCdnRef extends CdnRef {
    fileName: string;
}
export interface ParsedMessage {
    fromUserId: string;
    messageId: string;
    text: string;
    /** CDN reference for deferred image download. */
    image?: CdnRef;
    /** CDN reference for deferred file download. */
    file?: FileCdnRef;
    /** Text of the referenced (replied-to) message. */
    refText?: string;
}
export type OnMessageCallback = (msg: ParsedMessage) => Promise<void>;
export declare function startPollLoop(params: {
    baseUrl: string;
    token: string;
    onMessage: OnMessageCallback;
    abortSignal: AbortSignal;
}): Promise<void>;
