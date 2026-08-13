/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Max sessions shown side by side in the split view. Each pane is a full
 * session (its own SSE + transcript), so this bounds live connections and keeps
 * panes readable. Shared so the overview caps a selection to the same limit
 * before it ever builds a `?split=` URL or opens the in-window split.
 */
export declare const MAX_SPLIT_PANES = 6;
/**
 * Build an absolute URL that opens the app straight into the split view for the
 * given sessions. Derived from the current location so it inherits the origin
 * and any `?daemon=`/`?token=` query a dev deployment relies on; the trailing
 * `/session/<id>` deep-link is stripped while preserving any deployment base
 * path, so no single session competes with the split.
 */
export declare function buildSplitUrl(sessionIds: string[], currentHref: string, token?: string): string;
/** Read the session ids from a `?split=a,b,c` query string (empty when absent). */
export declare function parseSplitSessionIds(search: string): string[];
/**
 * Persist the in-window split's session set so a refresh restores it. Uses
 * `sessionStorage` (not `localStorage`) on purpose: it is scoped per browser
 * tab, so a split opened in its own tab (via {@link buildSplitUrl}) and the
 * in-window split never clobber each other, and a fresh unrelated tab restores
 * nothing. It still survives a refresh of the same tab — the case this fixes.
 */
export declare function saveSplitSessions(sessions: readonly string[]): void;
/** The persisted split session set, or `[]` when absent/unavailable/malformed. */
export declare function loadSplitSessions(): string[];
/** Forget the persisted split (e.g. when the user leaves the split view). */
export declare function clearSplitSessions(): void;
