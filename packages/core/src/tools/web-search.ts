/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// No-telemetry fork patch — see NO_TELEMETRY_GUIDELINES.md §1.5.
//
// Upstream's `web-search.ts` implements the search tool against the DashScope
// Responses API, which routes queries through external servers and violates the
// no-telemetry policy. The fork's SerpApi backend lives in
// `./serpapi-web-search.js`, a fork-owned file upstream never creates and
// therefore never conflicts with. This module is the seam: it re-exports that
// backend under the exact names upstream's consumers already import
// (`evaluateWebSearchGate`, `WebSearchTool`, `WebSearchSettings`), so the
// registry block in `config/config.ts` and the re-export in `index.ts` stay
// byte-identical to upstream.
//
// This file is declared `merge=ours` in .gitattributes: upstream rewrites of
// it are discarded automatically. Nothing upstream puts here can reach the
// network — every request is built inside the SerpApi module.

export * from './serpapi-web-search.js';
