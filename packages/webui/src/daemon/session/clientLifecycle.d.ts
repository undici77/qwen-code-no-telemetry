/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function getStableClientId(clientId: string | undefined, sessionId?: string): string;
/**
 * Read the client id persisted for `sessionId` without generating one. Returns
 * `undefined` when nothing is stored (SSR, private-mode quota failure, or a
 * session this client never attached). Callers use this to act on behalf of a
 * NON-current session, where `getStableClientId`'s generate-on-miss would mint
 * an unrelated id that is not attached to the target session.
 */
export declare function getPersistedClientId(sessionId: string): string | undefined;
export declare function persistStableClientId(clientId: string | undefined, sessionId?: string): void;
export declare function detachDaemonClient(opts: {
    baseUrl: string;
    token?: string;
    sessionId: string;
    clientId?: string;
}): Promise<void>;
