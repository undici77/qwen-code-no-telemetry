/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface RouteMapping {
  method: string;
  /**
   * Extract JSON-RPC params from URL path segments, request body, and — for the
   * REST-style query-backed helpers (`/file?path=…&maxBytes=…`, `/stat`,
   * `/list`, `/glob`, `context-usage?detail=…`) — the URL query string. The
   * daemon's ACP handlers are strictly typed (e.g. `maxBytes` must be a
   * `number`, `detail` must be the boolean `true`), so query values — which
   * arrive as strings — are coerced to the expected type here via
   * `strParam`/`numParam`/`boolParam`.
   */
  extractParams: (
    segments: string[],
    body: unknown,
    httpMethod: string,
    query?: URLSearchParams,
  ) => Record<string, unknown>;
  /**
   * True for notifications (no response expected). The transport will
   * NOT wait for a JSON-RPC response from the server.
   */
  notification?: boolean;
}
export interface RouteEntry {
  httpMethod: string;
  pattern: RegExp;
  mapping: RouteMapping;
}
/**
 * Map of `METHOD PATH_PATTERN` to JSON-RPC method + params extractor.
 * Path segments are split by `/` after stripping the base URL prefix.
 *
 * Pattern conventions:
 *   - `:param` = named path param (consumed positionally)
 *   - `*`      = rest wildcard
 */
export declare const ROUTE_TABLE: readonly RouteEntry[];
