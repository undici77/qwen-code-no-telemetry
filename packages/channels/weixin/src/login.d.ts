/**
 * QR code login flow for WeChat iLink Bot.
 */
export interface LoginResult {
    connected: boolean;
    token?: string;
    baseUrl?: string;
    userId?: string;
    message: string;
}
/** Step 1: Get QR code from server and display in terminal */
export declare function startLogin(apiBaseUrl: string): Promise<string>;
/** Step 2: Poll for scan result */
export declare function waitForLogin(params: {
    qrcodeId: string;
    apiBaseUrl: string;
    timeoutMs?: number;
}): Promise<LoginResult>;
