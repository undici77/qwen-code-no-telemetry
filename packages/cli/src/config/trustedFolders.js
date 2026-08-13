/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import lockfile from 'proper-lockfile';
import { atomicWriteFileSync, createDebugLogger, FatalConfigError, getErrorMessage, ideContextStore, Storage, } from '@qwen-code/qwen-code-core';
import stripJsonComments from 'strip-json-comments';
import { parseJsoncObject, updateJsoncContent } from '../utils/jsonc-editor.js';
import { arePathsEquivalent, getPathComparisonVariants, } from './path-comparison.js';
import { buildTrustPrecedenceRules, resolveTrustDecision, resolveTrustRule, } from './trust-precedence.js';
const debugLogger = createDebugLogger('TRUSTED_FOLDERS');
export const TRUSTED_FOLDERS_FILENAME = 'trustedFolders.json';
export function getTrustedFoldersPath() {
    if (process.env['QWEN_CODE_TRUSTED_FOLDERS_PATH']) {
        return process.env['QWEN_CODE_TRUSTED_FOLDERS_PATH'];
    }
    // Resolve lazily on every call: see settings.ts:getUserSettingsPath for why
    // a top-level const would be stale after `preResolveHomeEnvOverrides()`.
    return path.join(Storage.getGlobalQwenDir(), TRUSTED_FOLDERS_FILENAME);
}
export var TrustLevel;
(function (TrustLevel) {
    TrustLevel["TRUST_FOLDER"] = "TRUST_FOLDER";
    TrustLevel["TRUST_PARENT"] = "TRUST_PARENT";
    TrustLevel["DO_NOT_TRUST"] = "DO_NOT_TRUST";
})(TrustLevel || (TrustLevel = {}));
const trustedFoldersChangeListeners = new Set();
export function onTrustedFoldersChanged(listener) {
    trustedFoldersChangeListeners.add(listener);
    return () => trustedFoldersChangeListeners.delete(listener);
}
function notifyTrustedFoldersChanged() {
    for (const listener of trustedFoldersChangeListeners)
        listener();
}
export class LoadedTrustedFolders {
    user;
    errors;
    constructor(user, errors) {
        this.user = user;
        this.errors = errors;
    }
    get rules() {
        return Object.entries(this.user.config).map(([path, trustLevel]) => ({
            path,
            trustLevel,
        }));
    }
    /**
     * Returns true or false if the path should be "trusted". This function
     * should only be invoked when the folder trust setting is active.
     *
     * @param location path
     * @returns
     */
    isPathTrusted(location) {
        return resolveTrustDecision(buildTrustPrecedenceRules(this.rules), getPathComparisonVariants(location));
    }
    setValue(path, trustLevel) {
        const committedConfig = writeTrustedFolders(this.user.path, (diskConfig) => ({ ...diskConfig, [path]: trustLevel }));
        this.user.config = committedConfig;
        notifyTrustedFoldersChanged();
    }
}
let loadedTrustedFolders;
/**
 * FOR TESTING PURPOSES ONLY.
 * Resets the in-memory cache of the trusted folders configuration.
 */
export function resetTrustedFoldersForTesting() {
    loadedTrustedFolders = undefined;
}
export function loadTrustedFolders() {
    if (loadedTrustedFolders) {
        return loadedTrustedFolders;
    }
    const errors = [];
    let userConfig = {};
    const userPath = getTrustedFoldersPath();
    // Load user trusted folders
    try {
        if (fs.existsSync(userPath)) {
            const content = fs.readFileSync(userPath, 'utf-8');
            const parsed = JSON.parse(stripJsonComments(content));
            if (typeof parsed !== 'object' ||
                parsed === null ||
                Array.isArray(parsed)) {
                errors.push({
                    message: 'Trusted folders file is not a valid JSON object.',
                    path: userPath,
                });
            }
            else {
                userConfig = parsed;
            }
        }
    }
    catch (error) {
        errors.push({
            message: getErrorMessage(error),
            path: userPath,
        });
    }
    loadedTrustedFolders = new LoadedTrustedFolders({ path: userPath, config: userConfig }, errors);
    return loadedTrustedFolders;
}
export function saveTrustedFolders(trustedFoldersFile) {
    writeTrustedFolders(trustedFoldersFile.path, () => ({
        ...trustedFoldersFile.config,
    }));
}
function assertTrustedFoldersConfig(config) {
    for (const [rulePath, trustLevel] of Object.entries(config)) {
        if (!Object.values(TrustLevel).includes(trustLevel)) {
            throw new FatalConfigError(`Invalid trusted folder rule for ${JSON.stringify(rulePath)}.`);
        }
    }
}
function writeTrustedFolders(filePath, update) {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    const release = lockfile.lockSync(filePath, {
        realpath: false,
        stale: 10_000,
        onCompromised: (err) => {
            debugLogger.warn('trusted folders lock compromised:', err);
        },
    });
    try {
        let originalContent = '{}';
        if (fs.existsSync(filePath)) {
            const stat = fs.lstatSync(filePath);
            if (stat.isSymbolicLink() || !stat.isFile()) {
                throw new FatalConfigError('Trusted folders path must be a regular file.');
            }
            originalContent = fs.readFileSync(filePath, 'utf-8');
        }
        let parsed;
        try {
            parsed = parseJsoncObject(originalContent);
        }
        catch (error) {
            if (error instanceof Error &&
                error.message === 'JSONC document root is not a JSON object.') {
                throw new FatalConfigError('Trusted folders file is not a valid JSON object.');
            }
            throw error;
        }
        const diskConfig = Object.fromEntries(Object.entries(parsed));
        assertTrustedFoldersConfig(diskConfig);
        const nextConfig = update({ ...diskConfig });
        assertTrustedFoldersConfig(nextConfig);
        const content = updateJsoncContent(originalContent, nextConfig, true);
        atomicWriteFileSync(filePath, content, 
        // noFollow: refuse to follow any pre-placed symlink at the
        // config path — a redirected write could either leak the
        // trusted-folder list to an attacker target or leave the user's
        // real config silently stale. Matches the credential write
        // sites' security posture (sharedTokenManager, oauth-token-storage,
        // file-token-storage all use noFollow:true).
        { encoding: 'utf-8', mode: 0o600, forceMode: true, noFollow: true });
        return nextConfig;
    }
    finally {
        try {
            release();
        }
        catch {
            // The atomic write is authoritative; stale-lock cleanup is retryable.
        }
    }
}
/** Is folder trust feature enabled per the current applied settings */
export function isFolderTrustEnabled(settings) {
    const folderTrustSetting = settings.security?.folderTrust?.enabled ?? false;
    return folderTrustSetting;
}
export function getExplicitTrustLevel(trustConfig, workspaceCwd) {
    const winner = resolveTrustRule(buildTrustPrecedenceRules(Object.entries(trustConfig).map(([rulePath, trustLevel]) => ({
        path: rulePath,
        trustLevel,
    }))), getPathComparisonVariants(workspaceCwd));
    return winner?.payload ?? null;
}
function loadTrustedFoldersWithOverrides(trustConfig) {
    const folders = loadTrustedFolders();
    if (folders.errors.length > 0) {
        const errorMessages = folders.errors.map((error) => `Error in ${error.path}: ${error.message}`);
        throw new FatalConfigError(`${errorMessages.join('\n')}\nPlease fix the configuration file and try again.`);
    }
    if (trustConfig) {
        // Return a fresh instance instead of mutating the cached singleton. Callers
        // pass an override to *preview* trust status for a tentative config (e.g.
        // useTrustModify's updateTrustLevel, which builds the config "to check the
        // new trust status without writing"). Mutating the cached singleton here
        // would leak that unconfirmed config into every later loadTrustedFolders()
        // read and persist it on the next setValue().
        return new LoadedTrustedFolders({ ...folders.user, config: trustConfig }, folders.errors);
    }
    return folders;
}
function trustStatusToResult(status) {
    if (status.effective.source === 'disabled') {
        return { isTrusted: true, source: undefined };
    }
    return {
        isTrusted: status.effective.state === 'trusted'
            ? true
            : status.effective.state === 'untrusted'
                ? false
                : undefined,
        source: status.effective.source === 'file' || status.effective.source === 'ide'
            ? status.effective.source
            : undefined,
    };
}
export function getWorkspaceTrustStatus(settings, workspaceCwd, trustConfig) {
    if (!isFolderTrustEnabled(settings)) {
        return {
            v: 1,
            workspaceCwd,
            folderTrustEnabled: false,
            effective: { state: 'trusted', source: 'disabled' },
            explicitTrustLevel: null,
            requiresDaemonRestartForChanges: true,
        };
    }
    const ideTrust = ideContextStore.get()?.workspaceState?.isTrusted;
    if (ideTrust !== undefined &&
        arePathsEquivalent(workspaceCwd, process.cwd())) {
        return {
            v: 1,
            workspaceCwd,
            folderTrustEnabled: true,
            effective: {
                state: ideTrust ? 'trusted' : 'untrusted',
                source: 'ide',
            },
            explicitTrustLevel: null,
            requiresDaemonRestartForChanges: true,
        };
    }
    const folders = loadTrustedFoldersWithOverrides(trustConfig);
    const isTrusted = folders.isPathTrusted(workspaceCwd);
    const state = isTrusted === true
        ? 'trusted'
        : isTrusted === false
            ? 'untrusted'
            : 'unknown';
    return {
        v: 1,
        workspaceCwd,
        folderTrustEnabled: true,
        effective: {
            state,
            source: isTrusted === undefined ? 'none' : 'file',
        },
        explicitTrustLevel: getExplicitTrustLevel(folders.user.config, workspaceCwd),
        requiresDaemonRestartForChanges: true,
    };
}
export function isWorkspaceTrusted(settings, trustConfig, workspacePath) {
    if (!isFolderTrustEnabled(settings)) {
        return { isTrusted: true, source: undefined };
    }
    const ideTrust = ideContextStore.get()?.workspaceState?.isTrusted;
    if (ideTrust !== undefined &&
        (workspacePath === undefined ||
            arePathsEquivalent(workspacePath, process.cwd()))) {
        return { isTrusted: ideTrust, source: 'ide' };
    }
    return trustStatusToResult(getWorkspaceTrustStatus(settings, workspacePath ?? process.cwd(), trustConfig));
}
//# sourceMappingURL=trustedFolders.js.map