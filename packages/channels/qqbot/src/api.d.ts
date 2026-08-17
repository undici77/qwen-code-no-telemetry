/**
 * QQ Bot HTTP API client.
 *
 * Encapsulates all REST calls to the QQ Bot API:
 *  - Access token issuance
 *  - WebSocket Gateway URL resolution
 *  - Message sending (text / markdown)
 */
export interface TokenResponse {
  accessToken: string;
  expiresIn: number;
}
/**
 * Obtain an access token via appId + clientSecret.
 * Throws on HTTP errors or missing token in the response.
 */
export declare function fetchAccessToken(
  appId: string,
  appSecret: string,
): Promise<TokenResponse>;
/**
 * Validate the WebSocket Gateway URL to enforce TLS and known hostname.
 * - Enforces wss:// protocol (hard boundary — throws on non-wss).
 * - Rejects hostnames outside `*.qq.com` (hard boundary).
 *
 * The QQ Bot Open Platform documents all endpoints under qq.com domains
 * (api.sgroup.qq.com, sandbox.api.sgroup.qq.com, bots.qq.com). Broader
 * suffixes like *.tencentcs.com would accept attacker-controlled Tencent
 * Cloud API Gateway default domains, creating a token-exfiltration vector
 * if /gateway is tampered with or misdirected.
 */
export declare function validateGatewayUrl(url: string): string;
/**
 * Resolve the WebSocket Gateway URL.
 * Throws on HTTP errors or missing URL in the response.
 */
export declare function fetchGatewayUrl(
  accessToken: string,
  sandbox: boolean,
): Promise<string>;
/** Determine the API base URL from the sandbox flag. */
export declare function getApiBase(sandbox: boolean): string;
/**
 * Send a message chunk to a QQ chat.
 * Resolves on success; caller should handle errors and msg_seq tracking.
 */
export declare function sendQQMessage(
  base: string,
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<Response>;
