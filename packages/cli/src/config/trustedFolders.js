/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { FatalConfigError, getErrorMessage, isWithinRoot, ideContextStore, Storage, } from '@qwen-code/qwen-code-core';
import stripJsonComments from 'strip-json-comments';
import { writeStderrLine } from '../utils/stdioHelpers.js';
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
        const trustedPaths = [];
        const untrustedPaths = [];
        for (const rule of this.rules) {
            switch (rule.trustLevel) {
                case TrustLevel.TRUST_FOLDER:
                    trustedPaths.push(rule.path);
                    break;
                case TrustLevel.TRUST_PARENT:
                    trustedPaths.push(path.dirname(rule.path));
                    break;
                case TrustLevel.DO_NOT_TRUST:
                    untrustedPaths.push(rule.path);
                    break;
                default:
                    // Do nothing for unknown trust levels.
                    break;
            }
        }
        for (const trustedPath of trustedPaths) {
            if (isWithinRoot(location, trustedPath)) {
                return true;
            }
        }
        for (const untrustedPath of untrustedPaths) {
            if (path.normalize(location) === path.normalize(untrustedPath)) {
                return false;
            }
        }
        return undefined;
    }
    setValue(path, trustLevel) {
        this.user.config[path] = trustLevel;
        saveTrustedFolders(this.user);
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
    try {
        // Ensure the directory exists
        const dirPath = path.dirname(trustedFoldersFile.path);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(trustedFoldersFile.path, JSON.stringify(trustedFoldersFile.config, null, 2), { encoding: 'utf-8', mode: 0o600 });
    }
    catch (error) {
        writeStderrLine('Error saving trusted folders file.');
        writeStderrLine(error instanceof Error ? error.message : String(error));
    }
}
/** Is folder trust feature enabled per the current applied settings */
export function isFolderTrustEnabled(settings) {
    const folderTrustSetting = settings.security?.folderTrust?.enabled ?? false;
    return folderTrustSetting;
}
function getWorkspaceTrustFromLocalConfig(trustConfig) {
    const folders = loadTrustedFolders();
    if (trustConfig) {
        folders.user.config = trustConfig;
    }
    if (folders.errors.length > 0) {
        const errorMessages = folders.errors.map((error) => `Error in ${error.path}: ${error.message}`);
        throw new FatalConfigError(`${errorMessages.join('\n')}\nPlease fix the configuration file and try again.`);
    }
    const isTrusted = folders.isPathTrusted(process.cwd());
    return {
        isTrusted,
        source: isTrusted !== undefined ? 'file' : undefined,
    };
}
export function isWorkspaceTrusted(settings, trustConfig) {
    if (!isFolderTrustEnabled(settings)) {
        return { isTrusted: true, source: undefined };
    }
    const ideTrust = ideContextStore.get()?.workspaceState?.isTrusted;
    if (ideTrust !== undefined) {
        return { isTrusted: ideTrust, source: 'ide' };
    }
    // Fall back to the local user configuration
    return getWorkspaceTrustFromLocalConfig(trustConfig);
}
//# sourceMappingURL=trustedFolders.js.map