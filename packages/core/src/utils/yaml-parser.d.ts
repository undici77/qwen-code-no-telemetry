/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Parses a YAML string with full spec support (block scalars, nested
 * structures, etc.), falling back to the simple parser on failure so
 * that slightly malformed frontmatter still loads where possible.
 *
 * @param yamlString - YAML string to parse
 * @returns Parsed object
 */
export declare function parse(yamlString: string): Record<string, unknown>;
/**
 * Serializes a record back to YAML using the full eemeli/yaml stringifier so
 * arbitrarily nested values (e.g. CC-style `mcpServers` / `hooks`) round-trip
 * cleanly. The previous hand-rolled formatter only walked one level of
 * nesting and emitted `[object Object]` for anything deeper, corrupting the
 * file on save — see `docs/design/yaml-parser-replacement.md` for the audit.
 *
 * `lineWidth: 0` disables automatic line wrapping so multi-line strings are
 * preserved as-is, matching the stable-output posture the test suite assumes.
 */
export declare function stringify(obj: Record<string, unknown>, options?: {
    lineWidth?: number;
    minContentWidth?: number;
}): string;
