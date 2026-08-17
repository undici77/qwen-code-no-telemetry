/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Declarative-agent frontmatter schema constants and parsers.
 *
 * Mirrors Claude Code 2.1.168's `.claude/agents/<name>.md` schema verbatim so
 * a user can drop a Claude Code agent file into `.qwen/agents/` and have it
 * parse identically. The internal verification source (DL7 / Ig5 / GN / kc /
 * P37 / _Y) is documented in `docs/design/declarative-agents-port.md`.
 *
 * Parsing follows DL7's "lenient" posture: invalid optional fields are dropped
 * to undefined rather than thrown — the caller layer is responsible for
 * deciding whether a dropped field surfaces a warning. This intentionally
 * differs from the strict throw-on-invalid posture used for `approvalMode`
 * elsewhere in the loader, because that field predates this port and changing
 * its semantics would break existing `.qwen/agents/*.md` files.
 */
/** Permission mode enum (DL7 `$E` / `kc` constant). */
export declare const PERMISSION_MODE_VALUES: readonly [
  'acceptEdits',
  'auto',
  'bypassPermissions',
  'default',
  'dontAsk',
  'plan',
];
export type PermissionModeValue = (typeof PERMISSION_MODE_VALUES)[number];
/** Color allowlist (DL7 `_Y` constant). Values outside this list are silently dropped. */
export declare const COLOR_VALUES: readonly [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan',
];
export type ColorValue = (typeof COLOR_VALUES)[number];
/**
 * Map a Claude Code `permissionMode` frontmatter value to a qwen-code
 * `approvalMode` value. Returns `undefined` for unknown / falsy input.
 *
 * Disambiguated from `packages/core/src/tools/agent/agent.ts`'s internal
 * `permissionModeToApprovalMode`, which maps the qwen `PermissionMode` enum
 * to the qwen `ApprovalMode` enum (different domain entirely). Importing the
 * wrong symbol via IDE auto-complete would silently return `undefined` for
 * every qwen enum value, hence the longer name.
 */
export declare function claudePermissionModeToApprovalMode(
  permissionMode: string | undefined,
): string | undefined;
/**
 * Parse a maxTurns value. Accepts a positive integer number or numeric string.
 * Returns `undefined` for anything else (matches DL7 `W46`).
 */
export declare function parseMaxTurns(value: unknown): number | undefined;
/** Type guard: value is a valid PERMISSION_MODE_VALUES literal. */
export declare function isPermissionMode(
  value: unknown,
): value is PermissionModeValue;
/** Type guard: value is a valid COLOR_VALUES literal. */
export declare function isColor(value: unknown): value is ColorValue;
/**
 * Parse a frontmatter `mcpServers` value into the record-of-specs shape
 * qwen-code's MCP layer expects. Matches CC `gS8`'s shallow validation:
 *
 *   - non-object / array / null → undefined (whole field dropped)
 *   - string (CC's server-name reference form) → undefined; qwen-code does
 *     not support the reference form yet, so it is rejected at this layer
 *     rather than silently passed through and later confusing the MCP loader
 *   - record-of-records → keep entries whose value is a plain object,
 *     drop entries whose value is a scalar / array / null
 *
 * The deep `{ type, command, args, ... }` validation per spec is intentionally
 * deferred to the runtime MCP loader (which already owns the union for
 * stdio/sse/http/etc.). This mirrors CC, where Ig5 keeps mcpServers as
 * `z.unknown()` at parse time and gS8 / DL7 run per-item `safeParse` at
 * registration time. Drop-the-whole-field is preferred over throw so a
 * malformed mcpServers block doesn't kill the entire agent.
 */
export declare function parseAgentMcpServers(
  value: unknown,
): Record<string, unknown> | undefined;
/**
 * Parse a frontmatter `hooks` value into the record-of-event-matchers shape
 * qwen-code's hook layer expects. Matches CC `TKO` / `_u`'s shallow
 * validation:
 *
 *   - non-object / array / null → undefined (whole field dropped)
 *   - record → keep entries whose value is an array, drop entries whose
 *     value is a non-array (a scalar / object / null is never a valid
 *     HookMatcher list)
 *
 * Per-matcher / per-hook `{ type, command, ... }` validation is deferred to
 * the runtime hook subsystem (`SessionHooksManager` already owns the discriminated
 * union for command/http/function/prompt). Drop-the-whole-field is preferred
 * over throw, matching the rest of the DL7 lenient posture.
 */
export declare function parseAgentHooks(
  value: unknown,
): Record<string, unknown> | undefined;
