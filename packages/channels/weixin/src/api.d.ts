/**
 * HTTP API wrapper for WeChat iLink Bot API.
 */
import type { GetUpdatesResp, SendMessageReq, GetConfigResp, SendTypingReq, SendTypingResp } from './types.js';
/** Structured error from WeChat iLink Bot API. */
export declare class WeixinApiError extends Error {
    /** HTTP status code (0 if network/timeout error). */
    status: number;
    /** API-level return code (ret field in response body). */
    ret?: number;
    /** API-level error code (errcode field in response body). */
    errcode?: number;
    constructor(message: string, status: number, ret?: number, errcode?: number);
}
export declare function buildHeaders(token?: string): Record<string, string>;
export declare function getUpdates(baseUrl: string, token: string, getUpdatesBuf: string, timeoutMs?: number, signal?: AbortSignal): Promise<GetUpdatesResp>;
export declare function sendMessage(baseUrl: string, token: string, msg: SendMessageReq['msg']): Promise<void>;
export declare function getConfig(baseUrl: string, token: string, userId: string, contextToken?: string): Promise<GetConfigResp>;
export declare function sendTyping(baseUrl: string, token: string, req: Omit<SendTypingReq, 'base_info'>): Promise<SendTypingResp>;
/**
 * Request an upload URL and CDN credentials for media.
 * @param aeskeyHex 16-byte AES key as 32-char hex string (e.g. "00112233445566778899aabbccddeeff")
 * @returns Either the full CDN upload URL or the upload_param string
 */
export declare function getUploadUrl(baseUrl: string, token: string, toUserId: string, filekey: string, rawsize: number, rawfilemd5: string, encryptedSize: number, aeskeyHex: string): Promise<string>;
/** Upload encrypted media to CDN.
 *  If urlOrParam is a full URL, use it directly (host must match).
 *  If it's just a param, construct the URL. */
export declare function uploadToCdn(urlOrParam: string, filekey: string, encryptedData: Buffer): Promise<string>;
