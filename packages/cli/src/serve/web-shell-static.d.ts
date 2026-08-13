/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application, Request } from 'express';
export { resolveWebShellDir } from './web-shell-resolver.js';
/**
 * Build the Web Shell CSP. `frame-ancestors` defaults to `'none'` (the caller
 * also sets `X-Frame-Options: DENY`) to block clickjacking. When the daemon is
 * started with `--allow-origin chrome-extension://<id>`, those extension
 * origins are allowed to frame the shell so the extension can host the UI in a
 * Chrome side panel (issue #5626); X-Frame-Options is dropped in that case
 * since it can't express an allowlist.
 */
export declare function buildWebShellCsp(frameAncestors?: readonly string[]): string;
/** Default (no-framing) Web Shell CSP. */
export declare const WEB_SHELL_CSP: string;
/**
 * True when the request is a top-level document navigation (address-bar
 * load, link click, or refresh) rather than a programmatic fetch/XHR.
 *
 * Mirrors the `bypass` discriminator in `packages/web-shell/vite.config.ts`
 * so the daemon's SPA fallback claims exactly the requests the dev proxy
 * would have served `index.html` for — and leaves API fetches (which carry
 * `Accept: application/json`) to fall through to the JSON routes / 404.
 */
export declare function isDocumentNavigation(req: Request): boolean;
/**
 * True when the request matches a route `mountWebShellAssets` registers
 * BEFORE `bearerAuth`. The deferred-runtime gate in `createDelegatingServeApp`
 * exempts exactly these so a cold daemon answers the shell's entry points the
 * same way the warm runtime app does, instead of 401ing browser navigations
 * that cannot attach the bearer header. Percent-encoded single-segment deep
 * links (e.g. `/session/<id>%2fstatus`) also match — Express does not decode
 * `%2F` during route matching — but they cannot reach an API route or session
 * data: pre-auth answers serve only the public shell HTML, identical to
 * `GET /` (or the startup-failure envelope). Keep in sync with the routes
 * registered in `mountWebShellAssets`.
 */
export declare function isPreAuthWebShellRequest(req: Request): boolean;
/**
 * Mount the Web Shell static assets BEFORE `bearerAuth`. The shell carries no
 * secrets and a browser cannot attach an `Authorization` header to a
 * `<script src>` subresource or an address-bar navigation, so gating these
 * would just break the UI. The front-end's own API calls still carry the
 * bearer via `getDaemonAuthHeaders()`.
 *
 *  - `GET /assets/*` — hashed, immutable build chunks (long-cache).
 *  - `GET /` — the HTML shell, always (so `curl /` shows the UI too).
 *  - `GET /session/:id` document navigations — the HTML shell, so a browser
 *    refresh can load before the front-end adds its bearer header.
 *
 * `isPreAuthWebShellRequest` encodes this same surface for the
 * deferred-runtime gate; keep the two in sync.
 *
 * Caller must have already verified `webShellDir` exists.
 */
export declare function mountWebShellAssets(app: Application, webShellDir: string, frameAncestors?: readonly string[]): void;
/**
 * Mount the SPA deep-link fallback for routes not explicitly mounted above.
 * Registered AFTER all API routes — just before the error handler — so real
 * routes, INCLUDING their `bearerAuth` 401s, always win and only genuine 404
 * misses fall through to the shell.
 *
 * This is what keeps a token-gated daemon honest: a navigation with an
 * attacker-controlled `Accept: text/html` to an authed route (e.g.
 * `/capabilities`, `/health` on a non-loopback bind) hits that route's real
 * response / 401, not this shell. Because real routes run first, no per-path
 * denylist is needed. The one exception is exact `/session/:id` document
 * navigations, which `mountWebShellAssets` claims BEFORE auth so a browser
 * refresh can load the shell. That stays safe because the route matches a
 * single path segment only, serves only document navigations, and there is no
 * `GET /session/:id` API route for it to shadow — API subpaths like
 * `/session/:id/status` still hit `bearerAuth`.
 *
 * Only GET/HEAD document navigations are claimed; API fetches send
 * `Accept: application/json`, fail `isDocumentNavigation`, and fall through to
 * the standard JSON 404.
 */
export declare function mountWebShellSpaFallback(app: Application, webShellDir: string, frameAncestors?: readonly string[]): void;
