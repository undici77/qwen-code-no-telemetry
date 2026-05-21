/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Execute API preconnect
 * Use HEAD request to establish TCP+TLS connection without sending actual request body.
 * Uses the shared undici dispatcher to ensure connection pool is shared with SDK clients.
 *
 * @param authType - Authentication type (openai, qwen-oauth, anthropic, etc.)
 * @param options - Configuration options
 */
export declare function preconnectApi(authType: string | undefined, options?: {
    resolvedBaseUrl?: string;
    proxy?: string;
}): void;
/**
 * Reset preconnect state (for testing only)
 * @internal
 */
export declare function resetPreconnectState(): void;
