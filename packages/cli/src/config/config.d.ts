/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config, FileDiscoveryService, type LoadServerHierarchicalMemoryOptions, type LoadServerHierarchicalMemoryResponse, type ToolInvocationGuard, type MCPServerConfig } from '@qwen-code/qwen-code-core';
import type { LoadedSettings, Settings } from './settings.js';
export { isValidSessionId } from './session-id.js';
export interface CliArgs {
    query: string | undefined;
    model: string | undefined;
    fallbackModel: string[] | undefined;
    sandbox: boolean | string | undefined;
    sandboxImage: string | undefined;
    debug: boolean | undefined;
    prompt: string | undefined;
    promptInteractive: string | undefined;
    systemPrompt: string | undefined;
    appendSystemPrompt: string | undefined;
    yolo: boolean | undefined;
    bare: boolean | undefined;
    safeMode?: boolean | undefined;
    approvalMode: string | undefined;
    telemetry: boolean | undefined;
    telemetryTarget: string | undefined;
    telemetryOtlpEndpoint: string | undefined;
    telemetryOtlpProtocol: string | undefined;
    telemetryLogPrompts: boolean | undefined;
    telemetryOutfile: string | undefined;
    allowedMcpServerNames: string[] | undefined;
    mcpConfig: string | undefined;
    allowedTools: string[] | undefined;
    acp: boolean | undefined;
    experimentalAcp: boolean | undefined;
    experimentalLsp: boolean | undefined;
    extensions: string[] | undefined;
    listExtensions: boolean | undefined;
    openaiLogging: boolean | undefined;
    openaiApiKey: string | undefined;
    openaiBaseUrl: string | undefined;
    openaiLoggingDir: string | undefined;
    proxy: string | undefined;
    insecure?: boolean | undefined;
    includeDirectories: string[] | undefined;
    screenReader: boolean | undefined;
    inputFormat?: string | undefined;
    outputFormat: string | undefined;
    includePartialMessages?: boolean;
    /**
     * If chat recording is disabled, the chat history would not be recorded,
     * so --continue and --resume would not take effect.
     */
    chatRecording: boolean | undefined;
    /** Resume the most recent session for the current project */
    continue: boolean | undefined;
    /** Resume a specific session by its ID */
    resume: string | undefined;
    /** Specify a session ID without session resumption */
    sessionId: string | undefined;
    /**
     * Create a new forked session from the resumed session. Must be used with
     * --resume or --continue.
     */
    forkSession?: boolean | undefined;
    /** Internal: preserve the outer session ID when relaunching in a sandbox */
    sandboxSessionId?: string | undefined;
    /**
     * Start the session inside a git worktree. Accepted forms:
     * - bare `--worktree` (empty string from yargs) → auto-generated slug
     * - `--worktree foo` / `--worktree=foo` → explicit slug
     * - `--worktree=#123` / `--worktree https://github.com/o/r/pull/123` → PR ref
     *
     * Consumed by `setupStartupWorktree()` before `loadCliConfig()`. When set,
     * the CLI chdirs into `<repoRoot>/.qwen/worktrees/<slug>/` and the entire
     * session runs inside that worktree.
     */
    worktree?: string | undefined;
    maxSessionTurns: number | undefined;
    maxWallTime: string | undefined;
    maxToolCalls: number | undefined;
    maxSubagentDepth: number | undefined;
    coreTools: string[] | undefined;
    excludeTools: string[] | undefined;
    disabledSlashCommands: string[] | undefined;
    authType: string | undefined;
    channel: string | undefined;
    jsonFd?: number | undefined;
    jsonFile?: string | undefined;
    jsonSchema?: string | undefined;
    inputFile?: string | undefined;
}
/**
 * Resolves the `--json-schema` argument into a parsed JSON Schema object.
 *
 * Accepts either a JSON literal or `@path/to/schema.json`. Fails fast with a
 * FatalConfigError if the input can't be read/parsed/compiled — invalid
 * schemas should not silently skip validation at runtime.
 */
export declare function resolveJsonSchemaArg(raw: string | undefined): Record<string, unknown> | undefined;
export declare function parseArguments(): Promise<CliArgs>;
export declare function loadHierarchicalGeminiMemory(currentWorkingDirectory: string, includeDirectoriesToReadGemini: readonly string[] | undefined, fileService: FileDiscoveryService, extensionContextFilePaths: string[] | undefined, folderTrust: boolean, memoryImportFormat?: 'flat' | 'tree', contextRuleExcludes?: string[], options?: LoadServerHierarchicalMemoryOptions): Promise<LoadServerHierarchicalMemoryResponse>;
export declare function isDebugMode(argv: CliArgs): boolean;
/**
 * Builds the live-read closure for `Config.getDisabledSkillNames()`.
 *
 * The returned function reads through `loadedSettings.merged` on every
 * call, so `LoadedSettings` skill-setting mutations
 * are reflected without rebuilding `Config`. The closure is over the
 * `LoadedSettings` instance, NOT over its `.merged` snapshot — that
 * distinction matters because `LoadedSettings.setValue` replaces the
 * internal `_merged` object on every call. A closure over `.merged` would
 * stay frozen at construction time.
 *
 * Use this from every `loadCliConfig` call site (interactive entry, ACP
 * session start, etc.) so all surfaces — `<available_skills>` in the
 * model description, `/skill-name` slash commands, `/skills` listing and
 * completion — agree on which skills are currently disabled.
 */
export declare function buildDisabledSkillNamesProvider(loadedSettings: LoadedSettings): () => ReadonlySet<string>;
/**
 * Thrown (instead of `process.exit(1)`) when a caller-supplied session id
 * already exists and `throwOnSessionIdConflict` is set. The interactive CLI
 * exits the process on a duplicate id, but that would kill a shared ACP child
 * and every session on its channel — embedded callers catch this and fail the
 * single request instead.
 */
export declare class SessionIdConflictError extends Error {
    readonly sessionId: string;
    constructor(sessionId: string, message: string);
}
export declare function loadCliConfig(settings: Settings, argv: CliArgs, cwd?: string, overrideExtensions?: string[], 
/**
 * Optional separated hooks for proper source attribution.
 * If provided, these override settings.hooks for hook loading.
 */
hooksConfig?: {
    userHooks?: Record<string, unknown>;
    projectHooks?: Record<string, unknown>;
}, 
/**
 * Live-read provider for the set of disabled skill names. Forwarded to
 * `ConfigParameters` so that `Config.getDisabledSkillNames()` reflects
 * effective skill availability even after `setValue` mutations within the
 * same process.
 *
 * Callers MUST close over the live `LoadedSettings` instance, NOT over
 * the `settings: Settings` snapshot passed as the first argument here —
 * `LoadedSettings.setValue` replaces `_merged`, so any closure over a
 * snapshot would only see cold data and the dialog/subcommand toggles
 * would not take effect on the model side. Use
 * `buildDisabledSkillNamesProvider(loadedSettings)` to construct it
 * correctly.
 */
disabledSkillNamesProvider?: () => ReadonlySet<string>, 
/**
 * MCP servers injected by the embedding session (e.g. ACP / IDE clients).
 * Treated as a session-level source at the TOP of the precedence stack — above
 * settings and `.mcp.json`, below `--mcp-config` — and never approval-gated:
 * they are explicit, per-session, and not checked into the repo. Routing them
 * here (rather than merging into `settings.mcpServers`) keeps them from being
 * demoted below a project `.mcp.json` by `assembleMcpServers`. See issue #4615.
 */
sessionMcpServers?: Record<string, MCPServerConfig>, 
/**
 * Lifecycle handle for the settings file watcher started in `gemini.tsx`
 * before `Config.initialize()`. Passed through to `Config` so it can be
 * stopped during shutdown — only `stopWatching()` is exposed here to keep
 * core decoupled from the CLI-owned `SettingsWatcher` implementation.
 */
settingsWatcher?: {
    stopWatching(): void;
}, 
/**
 * When true, a duplicate caller-supplied session id throws
 * `SessionIdConflictError` instead of calling `process.exit(1)`. Embedded
 * callers (ACP/daemon) set this so one conflicting `newSession` degrades a
 * single request rather than terminating the shared child process.
 */
throwOnSessionIdConflict?: boolean, 
/**
 * Runtime-only host policy. This is deliberately not sourced from argv,
 * settings, or the environment: only an embedding host that owns the Config
 * construction may install the executor-boundary callback.
 */
hostPolicy?: {
    toolInvocationGuard?: ToolInvocationGuard;
}): Promise<Config>;
