/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Dispatcher } from 'undici';
type UndiciModule = typeof import('undici');
/**
 * Load undici behind a dynamic import so it stays out of the eager startup
 * closure (issue #7264). esbuild compiles the CJS undici package into a
 * default-only dynamic chunk (no named exports), while Node and vitest
 * expose named exports directly — unwrap only the default-only shape.
 */
export declare function loadUndici(): Promise<UndiciModule>;
/**
 * Async entry points that lead to the synchronous dispatcher builders below
 * (content generator creation, preconnect) must await this before calling
 * them.
 */
export declare function preloadRuntimeFetchModule(): Promise<void>;
/**
 * JavaScript runtime type
 */
export type Runtime = 'node' | 'bun' | 'unknown';
/**
 * Determine whether TLS certificate verification should be disabled for
 * outbound API connections.
 *
 * This is an opt-in escape hatch for self-hosted / lab environments that use
 * self-signed certificates. Because Qwen Code installs its own undici
 * dispatcher (to control timeouts), Node's global `NODE_TLS_REJECT_UNAUTHORIZED`
 * is not automatically honored by that dispatcher — this helper feeds the
 * setting back into the dispatcher's TLS connect options.
 *
 * Sources (any one enables it):
 * - `QWEN_TLS_INSECURE` env var (`1`/`true`/`yes`/`on`, case-insensitive).
 *   The `--insecure` CLI flag sets this.
 * - `NODE_TLS_REJECT_UNAUTHORIZED=0` (Node convention, for parity)
 *
 * WARNING: disabling verification removes protection against
 * man-in-the-middle attacks. Only use it for trusted, private endpoints.
 *
 * @returns true when certificate verification should be skipped
 */
export declare function isTlsVerificationDisabled(): boolean;
/**
 * Detect the current JavaScript runtime
 */
export declare function detectRuntime(): Runtime;
/**
 * Runtime fetch options for OpenAI SDK
 */
export type OpenAIRuntimeFetchOptions =
  | {
      fetchOptions?: {
        dispatcher?: Dispatcher;
        timeout?: false;
      };
      fetch?: any;
    }
  | undefined;
/**
 * Runtime fetch options for Anthropic SDK
 */
export type AnthropicRuntimeFetchOptions = {
  fetchOptions?: {
    dispatcher?: Dispatcher;
  };
  fetch?: any;
};
/**
 * SDK type identifier
 */
export type SDKType = 'openai' | 'anthropic';
/**
 * Build runtime-specific fetch options for OpenAI SDK
 */
export declare function buildRuntimeFetchOptions(
  sdkType: 'openai',
  proxyUrl?: string,
): OpenAIRuntimeFetchOptions;
/**
 * Build runtime-specific fetch options for Anthropic SDK
 */
export declare function buildRuntimeFetchOptions(
  sdkType: 'anthropic',
  proxyUrl?: string,
): AnthropicRuntimeFetchOptions;
/**
 * Get or create a shared undici dispatcher for the given proxy configuration.
 * The dispatcher is cached so that preconnect and subsequent SDK requests
 * share the same connection pool, enabling TCP+TLS connection reuse.
 *
 * @param proxyUrl - Proxy URL used to create a cached proxy dispatcher
 * @returns A cached undici dispatcher that honors NO_PROXY
 */
export declare function getOrCreateSharedDispatcher(
  proxyUrl: string,
  insecure?: boolean,
): Dispatcher;
/**
 * Records the explicit proxy URL (`--proxy` / `settings.proxy`, resolved by
 * `Config.getProxy()`) at the moment the config installs the process-wide
 * proxy dispatcher. Paths without a Config reference — the MCP transport
 * fetch below — read it back so an explicitly configured proxy is honored
 * even off the global dispatcher.
 */
export declare function setResolvedProxyUrlForRuntimeFetch(
  proxyUrl: string | undefined,
): void;
/**
 * Cached dispatcher for the MCP streamable HTTP fetch (#7147/#7195): the MCP
 * transport pins undici's own fetch with a dedicated dispatcher (Node's
 * bundled fetch stalls same-origin POSTs behind the transport's standalone
 * SSE stream), and that dispatcher must still honor proxies:
 *
 * - With an explicit `--proxy`/settings proxy (recorded via
 *   {@link setResolvedProxyUrlForRuntimeFetch}) it reuses the same cached
 *   proxy-aware dispatcher as the LLM path (`getOrCreateSharedDispatcher`),
 *   so MCP and LLM traffic share one pool and one timeout policy.
 * - Otherwise it uses a cached `EnvHttpProxyAgent` with no explicit URL,
 *   which honors `HTTP(S)_PROXY`/`NO_PROXY` from the environment and
 *   dispatches directly when none are set — with the same disabled
 *   header/body timeouts (a standalone SSE stream legitimately idles past
 *   undici's 300s defaults).
 */
export declare function getOrCreateMcpDispatcher(
  insecure?: boolean,
): Dispatcher;
/**
 * Reset the dispatcher cache (for testing only)
 * @internal
 */
export declare function resetDispatcherCache(): void;
/**
 * Extract hostname (with port) from a proxy URL for deduplication.
 *
 * This function extracts just the host part from a proxy URL, removing any
 * credentials. This allows different credentials for the same host to be
 * logged separately when dispatcher creation fails, enabling administrators
 * to diagnose credential issues.
 *
 * Examples:
 * - `http://user:pass@proxy.example.com:8080` → `proxy.example.com:8080`
 * - `https://proxy.example.com:8080` → `proxy.example.com:8080`
 *
 * @param proxyUrl - Proxy URL that may contain credentials
 * @returns Hostname with port (credentials removed)
 */
export declare function extractHostnameFromProxyUrl(proxyUrl: string): string;
/**
 * Redact proxy credentials from error messages to prevent credential leakage.
 *
 * Per RFC 3986, userinfo cannot contain unencoded '@', so `[^/\s]*` correctly
 * matches only the userinfo portion without over-consuming hostname or unrelated '@'.
 * The /g flag ensures all credential occurrences in multi-line error chains are redacted.
 *
 * Two patterns are supported:
 * - With scheme: `http://user:pass@proxy.local` → `http://<redacted>@proxy.local`
 * - Without scheme (Node.js native errors): `token@proxy.local:8080` → `<redacted>@proxy.local:8080`
 *
 * Scheme-less token-only credentials are only redacted when the host has a
 * plausible proxy port and either local/proxy-like host structure or nearby
 * network-error context. This avoids mangling email or SSH-like strings such
 * as `git@github.com:22` and `user@example.com:123`.
 *
 * @param message - Error message that may contain proxy URLs with credentials
 * @returns Message with all proxy credentials replaced by '<redacted>'
 */
export declare function redactProxyCredentials(message: string): string;
/**
 * Redact proxy credentials from thrown SDK errors in-place where possible.
 *
 * Preserving or cloning from the original error object keeps SDK-specific
 * fields such as status, code, and retry metadata intact while preventing
 * proxy credentials from leaking through message, stack, logs, or upstream
 * crash reports.
 *
 * @param error - Error-like value that may contain proxy credentials
 * @returns A redacted error value, reusing the original object when writable
 */
export declare function redactProxyError(error: unknown): unknown;
export {};
