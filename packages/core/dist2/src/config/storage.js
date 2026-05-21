/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { getProjectHash, QWEN_DIR, sanitizeCwd } from '../utils/paths.js';
import { FatalConfigError } from '../utils/errors.js';
export { QWEN_DIR } from '../utils/paths.js';
export const GOOGLE_ACCOUNTS_FILENAME = 'google_accounts.json';
export const OAUTH_FILE = 'oauth_creds.json';
export const SKILL_PROVIDER_CONFIG_DIRS = ['.qwen', '.agents'];
const TMP_DIR_NAME = 'tmp';
const BIN_DIR_NAME = 'bin';
const PROJECT_DIR_NAME = 'projects';
const IDE_DIR_NAME = 'ide';
const PLANS_DIR_NAME = 'plans';
const DEBUG_DIR_NAME = 'debug';
const ARENA_DIR_NAME = 'arena';
export class Storage {
    targetDir;
    /**
     * Custom runtime output base directory set via settings.
     * When null, falls back to getGlobalQwenDir().
     */
    static runtimeBaseDir = null;
    static runtimeBaseDirContext = new AsyncLocalStorage();
    constructor(targetDir) {
        this.targetDir = targetDir;
    }
    /**
     * Expands tilde and resolves relative paths to absolute.
     */
    static resolvePath(dir, cwd) {
        let resolved = dir;
        if (resolved === '~' ||
            resolved.startsWith('~/') ||
            resolved.startsWith('~\\')) {
            const relativeSegments = resolved === '~'
                ? []
                : resolved
                    .slice(2)
                    .split(/[/\\]+/)
                    .filter(Boolean);
            resolved = path.join(os.homedir(), ...relativeSegments);
        }
        if (!path.isAbsolute(resolved)) {
            resolved = cwd ? path.resolve(cwd, resolved) : path.resolve(resolved);
        }
        return resolved;
    }
    /**
     * Sanitizes a session id for use as a plan filename.
     *
     * Plan files are keyed by session id, but the raw id is public SDK input.
     * Strip directory separators and Windows-invalid filename characters so a
     * hostile value cannot escape the plans directory.
     */
    static sanitizePlanSessionId(sessionId) {
        const safeName = path
            .basename(sessionId.replace(/\\/g, '/'))
            .replace(/^\.+/g, '_')
            // eslint-disable-next-line no-control-regex
            .replace(/[<>:"|?*\x00-\x1F]/g, '_');
        return safeName || '_';
    }
    static resolveRuntimeBaseDir(dir, cwd) {
        if (!dir) {
            return null;
        }
        return Storage.resolvePath(dir, cwd);
    }
    /**
     * Sets the custom runtime output base directory.
     * Handles tilde (~) expansion and resolves relative paths to absolute.
     * Pass null/undefined/empty string to reset to default (getGlobalQwenDir()).
     * @param dir - The directory path, or null/undefined to reset
     * @param cwd - Base directory for resolving relative paths (defaults to process.cwd()).
     *              Pass the project root so that relative values like ".qwen" resolve
     *              per-project, enabling a single global config to work across all projects.
     */
    static setRuntimeBaseDir(dir, cwd) {
        Storage.runtimeBaseDir = Storage.resolveRuntimeBaseDir(dir, cwd);
    }
    /**
     * Runs function execution in an async context with a specific runtime output dir.
     * This is used to isolate runtime output paths between concurrent sessions.
     */
    static runWithRuntimeBaseDir(dir, cwd, fn) {
        const resolved = Storage.resolveRuntimeBaseDir(dir, cwd);
        return Storage.runtimeBaseDirContext.run(resolved, fn);
    }
    /**
     * Returns the base directory for all runtime output (temp files, debug logs,
     * session data, todos, insights, etc.).
     *
     * Priority: QWEN_RUNTIME_DIR env var > setRuntimeBaseDir() value > getGlobalQwenDir()
     * @returns Absolute path to the runtime output base directory
     */
    static getRuntimeBaseDir() {
        const envDir = process.env['QWEN_RUNTIME_DIR'];
        if (envDir) {
            return (Storage.resolveRuntimeBaseDir(envDir) ?? Storage.getGlobalQwenDir());
        }
        const contextualDir = Storage.runtimeBaseDirContext.getStore();
        if (contextualDir !== undefined) {
            return contextualDir ?? Storage.getGlobalQwenDir();
        }
        if (Storage.runtimeBaseDir) {
            return Storage.runtimeBaseDir;
        }
        return Storage.getGlobalQwenDir();
    }
    static getGlobalQwenDir() {
        const envDir = process.env['QWEN_HOME'];
        if (envDir) {
            return Storage.resolvePath(envDir);
        }
        const homeDir = os.homedir();
        if (!homeDir) {
            return path.join(os.tmpdir(), '.qwen');
        }
        return path.join(homeDir, QWEN_DIR);
    }
    static getMcpOAuthTokensPath() {
        return path.join(Storage.getGlobalQwenDir(), 'mcp-oauth-tokens.json');
    }
    static getGlobalSettingsPath() {
        return path.join(Storage.getGlobalQwenDir(), 'settings.json');
    }
    static getInstallationIdPath() {
        return path.join(Storage.getGlobalQwenDir(), 'installation_id');
    }
    static getGoogleAccountsPath() {
        return path.join(Storage.getGlobalQwenDir(), GOOGLE_ACCOUNTS_FILENAME);
    }
    static getUserCommandsDir() {
        return path.join(Storage.getGlobalQwenDir(), 'commands');
    }
    static getGlobalMemoryFilePath() {
        return path.join(Storage.getGlobalQwenDir(), 'memory.md');
    }
    static getGlobalTempDir() {
        return path.join(Storage.getRuntimeBaseDir(), TMP_DIR_NAME);
    }
    static getGlobalDebugDir() {
        return path.join(Storage.getRuntimeBaseDir(), DEBUG_DIR_NAME);
    }
    static getDebugLogPath(sessionId) {
        return path.join(Storage.getGlobalDebugDir(), `${sessionId}.txt`);
    }
    static getGlobalIdeDir() {
        // Pinned to the global Qwen dir so the VS Code companion (which only
        // sees env vars, not settings-based runtimeOutputDir) finds the same
        // lock-file location as the CLI.
        return path.join(Storage.getGlobalQwenDir(), IDE_DIR_NAME);
    }
    /**
     * Resolves pathToResolve by realpathing its deepest existing ancestor and
     * appending the not-yet-created remainder.
     */
    static resolvePathThroughExistingAncestor(pathToResolve) {
        let candidate = pathToResolve;
        while (true) {
            try {
                const realCandidate = fs.realpathSync(candidate);
                const remainder = path.relative(candidate, pathToResolve);
                return path.join(realCandidate, remainder);
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
                const parent = path.dirname(candidate);
                if (parent === candidate) {
                    return pathToResolve;
                }
                candidate = parent;
            }
        }
    }
    /**
     * Checks whether {@link childPath} resides within {@link parentPath},
     * resolving symbolic links to prevent traversal bypass attacks.
     */
    static isPathWithinDirectory(childPath, parentPath) {
        const realParent = Storage.resolvePathThroughExistingAncestor(parentPath);
        const realChild = Storage.resolvePathThroughExistingAncestor(childPath);
        const relativePath = path.relative(realParent, realChild);
        return (relativePath === '' ||
            (!relativePath.startsWith('..') && !path.isAbsolute(relativePath)));
    }
    static assertPathWithinDirectory(childPath, parentPath, errorMessage) {
        if (!Storage.isPathWithinDirectory(childPath, parentPath)) {
            throw new FatalConfigError(errorMessage);
        }
    }
    static getPlansDir(projectRoot, plansDirectory) {
        const configuredPlansDirectory = plansDirectory?.trim();
        if (configuredPlansDirectory) {
            if (!projectRoot) {
                throw new FatalConfigError('projectRoot is required when plansDirectory is configured.');
            }
            const resolvedProjectRoot = path.resolve(projectRoot);
            const resolvedPlansDirectory = Storage.resolvePath(configuredPlansDirectory, resolvedProjectRoot);
            Storage.assertPathWithinDirectory(resolvedPlansDirectory, resolvedProjectRoot, `plansDirectory must resolve within the project root.`);
            return resolvedPlansDirectory;
        }
        return path.join(Storage.getGlobalQwenDir(), PLANS_DIR_NAME);
    }
    static getPlanFilePath(sessionId, projectRoot, plansDirectory) {
        // Kept for tests and SDK callers that still use Storage helpers directly.
        return path.join(Storage.getPlansDir(projectRoot, plansDirectory), `${Storage.sanitizePlanSessionId(sessionId)}.md`);
    }
    static getGlobalBinDir() {
        return path.join(Storage.getGlobalQwenDir(), BIN_DIR_NAME);
    }
    static getGlobalArenaDir() {
        return path.join(Storage.getGlobalQwenDir(), ARENA_DIR_NAME);
    }
    getQwenDir() {
        return path.join(this.targetDir, QWEN_DIR);
    }
    getProjectDir() {
        const projectId = sanitizeCwd(this.getProjectRoot());
        const projectsDir = path.join(Storage.getRuntimeBaseDir(), PROJECT_DIR_NAME);
        return path.join(projectsDir, projectId);
    }
    getProjectTempDir() {
        const hash = getProjectHash(this.getProjectRoot());
        const tempDir = Storage.getGlobalTempDir();
        const targetDir = path.join(tempDir, hash);
        return targetDir;
    }
    ensureProjectTempDirExists() {
        fs.mkdirSync(this.getProjectTempDir(), { recursive: true });
    }
    static getOAuthCredsPath() {
        return path.join(Storage.getGlobalQwenDir(), OAUTH_FILE);
    }
    getProjectRoot() {
        return this.targetDir;
    }
    getHistoryDir() {
        const hash = getProjectHash(this.getProjectRoot());
        const historyDir = path.join(Storage.getRuntimeBaseDir(), 'history');
        const targetDir = path.join(historyDir, hash);
        return targetDir;
    }
    getWorkspaceSettingsPath() {
        return path.join(this.getQwenDir(), 'settings.json');
    }
    getProjectCommandsDir() {
        return path.join(this.getQwenDir(), 'commands');
    }
    /**
     * Path to the runtime-status sidecar JSON for this session.
     *
     * Co-located with the per-session chat log under
     * `<projectDir>/chats/<sessionId>.runtime.json` so external observers
     * (terminal multiplexers, IDE integrations, status daemons) can scan
     * the same directory used for chat history to find live sessions.
     */
    getRuntimeStatusPath(sessionId) {
        return path.join(this.getProjectDir(), 'chats', `${sessionId}.runtime.json`);
    }
    getProjectTempCheckpointsDir() {
        return path.join(this.getProjectTempDir(), 'checkpoints');
    }
    getExtensionsDir() {
        return path.join(this.getQwenDir(), 'extensions');
    }
    getExtensionsConfigPath() {
        return path.join(this.getExtensionsDir(), 'qwen-extension.json');
    }
    getUserSkillsDirs() {
        const homeDir = os.homedir() || os.tmpdir();
        return SKILL_PROVIDER_CONFIG_DIRS.map((dir) => dir === QWEN_DIR
            ? path.join(Storage.getGlobalQwenDir(), 'skills')
            : path.join(homeDir, dir, 'skills'));
    }
    /**
     * Returns the user-level extensions directory (~/.qwen/extensions/).
     * Extensions installed at user scope are stored here, as opposed to
     * project-level extensions which live in <project>/.qwen/extensions/.
     */
    static getUserExtensionsDir() {
        return path.join(Storage.getGlobalQwenDir(), 'extensions');
    }
    getHistoryFilePath() {
        return path.join(this.getProjectTempDir(), 'shell_history');
    }
}
//# sourceMappingURL=storage.js.map