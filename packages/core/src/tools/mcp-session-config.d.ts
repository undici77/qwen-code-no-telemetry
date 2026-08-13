/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MCPServerConfig } from '../config/config.js';
export declare function normalizeMcpIncludeEntry(entry: string): string;
/**
 * Filter lists arrive straight from settings files without schema
 * coercion, so shapes like `excludeTools: "x"` or `includeTools: [123]`
 * are possible. Coerce to the nearest valid form so the metadata key and
 * the runtime filter stay total and agree with each other instead of
 * throwing.
 */
export declare function coerceMcpFilterEntries(entries: unknown): string[];
/**
 * Stable identity for MCP settings projected into one session rather than
 * used to create the transport. Semantically equivalent filters share a key:
 * order, duplicates, and include-list argument suffixes do not cause
 * registration churn. An absent include list remains distinct from an empty
 * one because they mean "allow all" and "allow none", respectively.
 */
export declare function mcpSessionMetadataKey(config: MCPServerConfig): string;
