/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  handleUncaughtException,
  isExpectedPtyRaceError,
} from './utils/uncaught-exception-handler.js';
type BootstrapRoute = 'serve' | 'mcp' | 'help' | 'version' | 'default';
export declare const TOP_LEVEL_COMMANDS: readonly [
  readonly ['auth', 'Configure authentication (removed)'],
  readonly [
    'channel <command>',
    'Manage messaging channels (Telegram, Discord, etc.)',
  ],
  readonly ['extensions <command>', 'Manage Qwen Code extensions.'],
  readonly [
    'hooks',
    'Manage Qwen Code hooks (use /hooks in interactive mode).',
  ],
  readonly ['mcp', 'Manage MCP servers'],
  readonly [
    'review <command>',
    'Run a review non-interactively (`run`), plus the internal helpers used by the /review skill (PR worktree setup, context fetch, rules loading, presubmit checks, cleanup)',
  ],
  readonly [
    'serve',
    'Run Qwen Code as a local HTTP daemon (Stage 1 experimental: --http-bridge)',
  ],
  readonly ['sessions <command>', 'Manage Qwen Code sessions'],
  readonly ['update', 'Check for Qwen Code updates and install if available'],
];
export declare const MCP_COMMANDS: readonly [
  readonly ['add <name> <commandOrUrl> [args...]', 'Add a server'],
  readonly ['remove <name>', 'Remove a server'],
  readonly ['list', 'List all configured MCP servers'],
  readonly ['reconnect [server-name]', 'Reconnect to MCP servers'],
  readonly ['approve [name]', 'Approve a pending MCP server'],
  readonly ['reject [name]', 'Reject a pending MCP server'],
];
export declare function resolveBootstrapRoute(
  rawArgv: readonly string[],
): BootstrapRoute;
export declare function runCliEntry(rawArgv?: readonly string[]): Promise<void>;
export declare function handleCriticalError(error: unknown): Promise<void>;
/**
 * The entry a subprocess should call to reach THIS build, consumed by shell
 * children as `"${QWEN_CODE_CLI:-qwen}"` (see getShellContextEnvVars in core).
 * The npm bin wrapper (scripts/cli-entry.js) stamps installed launches, but a
 * workspace launch — a direct `node dist/index.js` — never passes through
 * it (the npm `start` and `dev` scripts stamp QWEN_CODE_CLI in their own
 * launchers), so every skill shell-out resolved `qwen` off PATH: a different
 * install, silently.
 *
 * Stamps the bin entry (dist/index.js), not this module: cli.ts compiles to
 * dist/src/cli.js, which carries no shebang, and the spawn-time filter blanks
 * an entry a shell cannot exec. Skipped when the derived path does not exist
 * (dev runs execute .ts sources with no built entry; the bare-`qwen` fallback
 * is the pre-existing behavior there) and when the module was not loaded from
 * the filesystem at all — under test runners, Vite statically rewrites the
 * new URL(…, import.meta.url) expression to a non-file URL, and the stamp
 * must never take the CLI down.
 *
 * The execute bit is granted here when missing, best-effort: the stamped file
 * must be shell-execable, but tsc emits dist/index.js as 0644 and only npm's
 * bin-link ever chmods it — on a plain `npm run build` checkout the spawn
 * filter would blank the stamp and the version skew this exists to fix would
 * survive. A failed chmod keeps the old fallback: the filter writes '' and
 * subprocesses run `qwen`.
 *
 * First writer wins, unlike the wrapper's unconditional assignment: an
 * already-set value may come from an outer launcher in THIS process —
 * cli-entry.js selecting a standalone shim, or the desktop app's vendored
 * bundle — which knows launch details this module cannot see and must not be
 * overwritten. The cost is that a value inherited from a PARENT qwen session
 * also survives, since the two cases are indistinguishable here; the primary
 * skew scenario — a workspace launch from a plain terminal — has the slot
 * unset either way. Empty counts as unset: a parent session's spawn filter
 * writes '' for an entry its shell could not exec, and that verdict is about
 * the parent's entry, not this build's.
 *
 * scripts/dev.js and scripts/start.js assign QWEN_CODE_CLI unconditionally —
 * the opposite policy on purpose, not an oversight: those files ARE the outer
 * launcher (they spawn the CLI as a child and must re-point an inherited value
 * at this build), whereas this module runs in-process AFTER an outer launcher
 * may already have stamped, so it yields. The bundled `node dist/cli.js` launch
 * (the desktop error message's instruction) is not stamped either — cli.js sits
 * at the package root, so the derived ../index.js does not exist and the
 * existence check skips it, consistent with this PR's workspace-entry scope.
 */
export declare function stampCliEntryEnv(entryPath?: string): void;
export { handleUncaughtException, isExpectedPtyRaceError };
export declare function runCliEntryPoint(
  run?: () => Promise<void>,
  handleError?: (error: unknown) => Promise<void>,
): Promise<void>;
