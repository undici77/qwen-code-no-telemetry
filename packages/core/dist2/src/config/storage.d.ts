/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export { QWEN_DIR } from '../utils/paths.js';
export declare const GOOGLE_ACCOUNTS_FILENAME = "google_accounts.json";
export declare const OAUTH_FILE = "oauth_creds.json";
export declare const SKILL_PROVIDER_CONFIG_DIRS: string[];
export declare class Storage {
    private readonly targetDir;
    /**
     * Custom runtime output base directory set via settings.
     * When null, falls back to getGlobalQwenDir().
     */
    private static runtimeBaseDir;
    private static readonly runtimeBaseDirContext;
    constructor(targetDir: string);
    /**
     * Expands tilde and resolves relative paths to absolute.
     */
    private static resolvePath;
    /**
     * Sanitizes a session id for use as a plan filename.
     *
     * Plan files are keyed by session id, but the raw id is public SDK input.
     * Strip directory separators and Windows-invalid filename characters so a
     * hostile value cannot escape the plans directory.
     */
    static sanitizePlanSessionId(sessionId: string): string;
    private static resolveRuntimeBaseDir;
    /**
     * Sets the custom runtime output base directory.
     * Handles tilde (~) expansion and resolves relative paths to absolute.
     * Pass null/undefined/empty string to reset to default (getGlobalQwenDir()).
     * @param dir - The directory path, or null/undefined to reset
     * @param cwd - Base directory for resolving relative paths (defaults to process.cwd()).
     *              Pass the project root so that relative values like ".qwen" resolve
     *              per-project, enabling a single global config to work across all projects.
     */
    static setRuntimeBaseDir(dir: string | null | undefined, cwd?: string): void;
    /**
     * Runs function execution in an async context with a specific runtime output dir.
     * This is used to isolate runtime output paths between concurrent sessions.
     */
    static runWithRuntimeBaseDir<T>(dir: string | null | undefined, cwd: string | undefined, fn: () => T): T;
    /**
     * Returns the base directory for all runtime output (temp files, debug logs,
     * session data, todos, insights, etc.).
     *
     * Priority: QWEN_RUNTIME_DIR env var > setRuntimeBaseDir() value > getGlobalQwenDir()
     * @returns Absolute path to the runtime output base directory
     */
    static getRuntimeBaseDir(): string;
    static getGlobalQwenDir(): string;
    static getMcpOAuthTokensPath(): string;
    static getGlobalSettingsPath(): string;
    static getInstallationIdPath(): string;
    static getGoogleAccountsPath(): string;
    static getUserCommandsDir(): string;
    static getGlobalMemoryFilePath(): string;
    static getGlobalTempDir(): string;
    static getGlobalDebugDir(): string;
    static getDebugLogPath(sessionId: string): string;
    static getGlobalIdeDir(): string;
    /**
     * Resolves pathToResolve by realpathing its deepest existing ancestor and
     * appending the not-yet-created remainder.
     */
    private static resolvePathThroughExistingAncestor;
    /**
     * Checks whether {@link childPath} resides within {@link parentPath},
     * resolving symbolic links to prevent traversal bypass attacks.
     */
    private static isPathWithinDirectory;
    static assertPathWithinDirectory(childPath: string, parentPath: string, errorMessage: string): void;
    static getPlansDir(projectRoot?: string | null, plansDirectory?: string | null): string;
    static getPlanFilePath(sessionId: string, projectRoot?: string | null, plansDirectory?: string | null): string;
    static getGlobalBinDir(): string;
    static getGlobalArenaDir(): string;
    getQwenDir(): string;
    getProjectDir(): string;
    getProjectTempDir(): string;
    ensureProjectTempDirExists(): void;
    static getOAuthCredsPath(): string;
    getProjectRoot(): string;
    getHistoryDir(): string;
    getWorkspaceSettingsPath(): string;
    getProjectCommandsDir(): string;
    /**
     * Path to the runtime-status sidecar JSON for this session.
     *
     * Co-located with the per-session chat log under
     * `<projectDir>/chats/<sessionId>.runtime.json` so external observers
     * (terminal multiplexers, IDE integrations, status daemons) can scan
     * the same directory used for chat history to find live sessions.
     */
    getRuntimeStatusPath(sessionId: string): string;
    getProjectTempCheckpointsDir(): string;
    getExtensionsDir(): string;
    getExtensionsConfigPath(): string;
    getUserSkillsDirs(): string[];
    /**
     * Returns the user-level extensions directory (~/.qwen/extensions/).
     * Extensions installed at user scope are stored here, as opposed to
     * project-level extensions which live in <project>/.qwen/extensions/.
     */
    static getUserExtensionsDir(): string;
    getHistoryFilePath(): string;
}
