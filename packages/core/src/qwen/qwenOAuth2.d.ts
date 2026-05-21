/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'events';
import type { Config } from '../config/config.js';
/**
 * PKCE (Proof Key for Code Exchange) utilities
 * Implements RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients
 */
/**
 * Generate a random code verifier for PKCE
 * @returns A random string of 43-128 characters
 */
export declare function generateCodeVerifier(): string;
/**
 * Generate a code challenge from a code verifier using SHA-256
 * @param codeVerifier The code verifier string
 * @returns The code challenge string
 */
export declare function generateCodeChallenge(codeVerifier: string): string;
/**
 * Generate PKCE code verifier and challenge pair
 * @returns Object containing code_verifier and code_challenge
 */
export declare function generatePKCEPair(): {
    code_verifier: string;
    code_challenge: string;
};
/**
 * Standard error response data
 */
export interface ErrorData {
    error: string;
    error_description: string;
}
/**
 * Custom error class to indicate that credentials should be cleared
 * This is thrown when a 400 error occurs during token refresh, indicating
 * that the refresh token is expired or invalid
 */
export declare class CredentialsClearRequiredError extends Error {
    originalError?: unknown | undefined;
    constructor(message: string, originalError?: unknown | undefined);
}
/**
 * Typed error thrown by `QwenOAuth2Client.pollDeviceToken` for upstream
 * RFC 8628 errors that aren't `authorization_pending` / `slow_down`.
 *
 * Earlier the class threw a plain `Error` with the OAuth code embedded
 * in the message text; downstream callers (notably PR #4255's
 * device-flow registry provider) had to substring-match the message
 * to extract the error code, an implicit cross-file contract that
 * silently degrades to `upstream_error` if the message format ever
 * changes. The structured `oauthError` / `description` / `status`
 * fields make the contract explicit + type-checked.
 *
 * The thrown `message` keeps the same `"Device token poll failed:
 * ${error} - ${description}"` shape so existing log-parsing /
 * substring-matching code continues to work; new code should branch
 * on `instanceof QwenOAuthPollError` + read fields directly.
 */
export declare class QwenOAuthPollError extends Error {
    readonly status?: number;
    readonly oauthError?: string;
    readonly description?: string;
    constructor(opts: {
        oauthError?: string;
        description?: string;
        status?: number;
    });
}
/**
 * Qwen OAuth2 credentials interface
 */
export interface QwenCredentials {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    expiry_date?: number;
    token_type?: string;
    resource_url?: string;
}
/**
 * Device authorization success data
 */
export interface DeviceAuthorizationData {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete: string;
    expires_in: number;
}
/**
 * Device authorization response interface
 */
export type DeviceAuthorizationResponse = DeviceAuthorizationData | ErrorData;
/**
 * Type guard to check if device authorization was successful
 */
export declare function isDeviceAuthorizationSuccess(response: DeviceAuthorizationResponse): response is DeviceAuthorizationData;
/**
 * Device token success data
 */
export interface DeviceTokenData {
    access_token: string | null;
    refresh_token?: string | null;
    token_type: string;
    expires_in: number | null;
    scope?: string | null;
    endpoint?: string;
    resource_url?: string;
}
/**
 * Device token pending response
 */
export interface DeviceTokenPendingData {
    status: 'pending';
    slowDown?: boolean;
}
/**
 * Device token response interface
 */
export type DeviceTokenResponse = DeviceTokenData | DeviceTokenPendingData | ErrorData;
/**
 * Type guard to check if device token response was successful
 */
export declare function isDeviceTokenSuccess(response: DeviceTokenResponse): response is DeviceTokenData;
/**
 * Type guard to check if device token response is pending
 */
export declare function isDeviceTokenPending(response: DeviceTokenResponse): response is DeviceTokenPendingData;
/**
 * Type guard to check if response is an error
 */
export declare function isErrorResponse(response: DeviceAuthorizationResponse | DeviceTokenResponse | TokenRefreshResponse): response is ErrorData;
/**
 * Token refresh success data
 */
export interface TokenRefreshData {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    resource_url?: string;
}
/**
 * Token refresh response interface
 */
export type TokenRefreshResponse = TokenRefreshData | ErrorData;
/**
 * Qwen OAuth2 client interface
 */
export interface IQwenOAuth2Client {
    setCredentials(credentials: QwenCredentials): void;
    getCredentials(): QwenCredentials;
    getAccessToken(): Promise<{
        token?: string;
    }>;
    requestDeviceAuthorization(options: {
        scope: string;
        code_challenge: string;
        code_challenge_method: string;
    }, fetchOpts?: {
        signal?: AbortSignal;
    }): Promise<DeviceAuthorizationResponse>;
    pollDeviceToken(options: {
        device_code: string;
        code_verifier: string;
    }, fetchOpts?: {
        signal?: AbortSignal;
    }): Promise<DeviceTokenResponse>;
    refreshAccessToken(): Promise<TokenRefreshResponse>;
}
/**
 * Qwen OAuth2 client implementation
 */
export declare class QwenOAuth2Client implements IQwenOAuth2Client {
    private credentials;
    private sharedManager;
    constructor();
    setCredentials(credentials: QwenCredentials): void;
    getCredentials(): QwenCredentials;
    getAccessToken(): Promise<{
        token?: string;
    }>;
    requestDeviceAuthorization(options: {
        scope: string;
        code_challenge: string;
        code_challenge_method: string;
    }, fetchOpts?: {
        signal?: AbortSignal;
    }): Promise<DeviceAuthorizationResponse>;
    pollDeviceToken(options: {
        device_code: string;
        code_verifier: string;
    }, fetchOpts?: {
        signal?: AbortSignal;
    }): Promise<DeviceTokenResponse>;
    refreshAccessToken(): Promise<TokenRefreshResponse>;
}
export declare enum QwenOAuth2Event {
    AuthUri = "auth-uri",
    AuthProgress = "auth-progress",
    AuthCancel = "auth-cancel"
}
/**
 * Authentication result types to distinguish different failure reasons
 */
export type AuthResult = {
    success: true;
} | {
    success: false;
    reason: 'timeout' | 'cancelled' | 'error' | 'rate_limit';
    message?: string;
};
/**
 * Global event emitter instance for QwenOAuth2 authentication events
 */
export declare const qwenOAuth2Events: EventEmitter<[never]>;
export declare function getQwenOAuthClient(config: Config, options?: {
    requireCachedCredentials?: boolean;
}): Promise<QwenOAuth2Client>;
export declare const QWEN_CREDENTIAL_FILE_MODE = 384;
export declare function cacheQwenCredentials(credentials: QwenCredentials, opts?: {
    signal?: AbortSignal;
}): Promise<void>;
/**
 * Clear cached Qwen credentials from disk
 * This is useful when credentials have expired or need to be reset
 */
export declare function clearQwenCredentials(): Promise<void>;
export declare const clearCachedCredentialFile: typeof clearQwenCredentials;
