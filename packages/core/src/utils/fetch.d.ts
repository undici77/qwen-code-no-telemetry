/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare class FetchError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
export declare function isConnectionLevelError(error: unknown): boolean;
export declare function isPrivateIp(url: string): boolean;
/** Generalizes isPrivateIp to hostnames that are never publicly routable. */
export declare function isPrivateHost(url: string): boolean;
/**
 * A redirect is followed silently only when it stays on the same host
 * (allowing a leading "www." to be added or removed), same protocol and
 * port, and carries no credentials. Anything else is surfaced to the
 * caller: WebFetch permission rules are domain-scoped, so silently
 * following a cross-host redirect would fetch from a domain the user
 * never approved.
 */
export declare function isPermittedRedirect(originalUrl: string, redirectUrl: string): boolean;
export interface FetchPolicyOptions {
    /** Budget for the entire transfer — headers AND body. */
    timeoutMs: number;
    /** Reject responses larger than this, before or during body read. */
    maxBytes: number;
    /** Same-host redirect hops to follow before erroring. */
    maxRedirects: number;
    headers?: Record<string, string>;
    /** Caller cancellation (e.g. the tool's abort signal). */
    signal?: AbortSignal;
}
export interface FetchPolicyResponse {
    kind: 'response';
    status: number;
    statusText: string;
    contentType: string;
    /** Content-Disposition header, if any — carries the server's filename. */
    contentDisposition: string;
    body: Buffer;
    /** URL after any followed same-host redirects. */
    finalUrl: string;
}
export interface FetchPolicyRedirect {
    kind: 'cross-host-redirect';
    originalUrl: string;
    redirectUrl: string;
    status: number;
}
export type FetchPolicyResult = FetchPolicyResponse | FetchPolicyRedirect;
/**
 * Fetch with manual redirect handling, a full-transfer timeout, a byte cap
 * enforced while streaming, caller-abort wiring, and a single retry on
 * transient failures (403/429 statuses, connection resets). Uses the global
 * fetch so the process-wide proxy dispatcher (setGlobalDispatcher) applies.
 * The timeout budget spans both attempts.
 */
export declare function fetchWithPolicy(url: string, options: FetchPolicyOptions): Promise<FetchPolicyResult>;
export declare function formatFetchErrorForUser(error: unknown, options?: {
    url?: string;
}): string;
