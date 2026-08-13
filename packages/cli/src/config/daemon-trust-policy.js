/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createHash } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { ideContextStore } from '@qwen-code/qwen-code-core';
import stripJsonComments from 'strip-json-comments';
import { getSystemDefaultsPath, getSystemSettingsPath, getUserSettingsPath, } from './settings.js';
import { getExplicitTrustLevel, getTrustedFoldersPath, LoadedTrustedFolders, TrustLevel, } from './trustedFolders.js';
import { arePathsEquivalent } from './path-comparison.js';
import { v1ToV2Migration } from './migration/versions/v1-to-v2.js';
const MAX_TRUSTED_FOLDERS_BYTES = 1024 * 1024;
const MAX_SETTINGS_BYTES = 4 * 1024 * 1024;
function policyError(code, filePath, error) {
    return {
        code,
        path: filePath,
        message: error instanceof Error ? error.message : String(error),
    };
}
async function readJsonObject(filePath, maxBytes, requireRegularFile, retryMissing = false) {
    const delays = [0, 50, 200];
    let result = {};
    for (const delay of delays) {
        if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        result = await readJsonObjectOnce(filePath, maxBytes, requireRegularFile);
        if (!result.error && (!result.missing || !retryMissing))
            return result;
    }
    return result;
}
async function readJsonObjectOnce(filePath, maxBytes, requireRegularFile) {
    let stat;
    try {
        stat = await fs.lstat(filePath);
    }
    catch (error) {
        if (error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT') {
            return { value: {}, missing: true };
        }
        return {
            error: policyError('trust_policy_unreadable', filePath, error),
        };
    }
    if (!requireRegularFile && stat.isSymbolicLink()) {
        try {
            stat = (await fs.stat(filePath));
        }
        catch (error) {
            return {
                error: policyError('trust_policy_unreadable', filePath, error),
            };
        }
    }
    if ((requireRegularFile && stat.isSymbolicLink()) || !stat.isFile()) {
        return {
            error: policyError('trust_policy_invalid', filePath, new Error('Trust policy input must be a regular file.')),
        };
    }
    if (stat.size > maxBytes) {
        return {
            error: policyError('trust_policy_invalid', filePath, new Error(`Trust policy input exceeds ${maxBytes} bytes.`)),
        };
    }
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(stripJsonComments(raw));
        if (typeof parsed !== 'object' ||
            parsed === null ||
            Array.isArray(parsed)) {
            throw new Error('Trust policy input must contain a JSON object.');
        }
        return { value: parsed };
    }
    catch (error) {
        if (error instanceof Error &&
            'code' in error &&
            error.code === 'ENOENT') {
            return { value: {}, missing: true };
        }
        return { error: policyError('trust_policy_invalid', filePath, error) };
    }
}
function migrateFolderTrustSettings(value, scope) {
    if (!value || !v1ToV2Migration.shouldMigrate(value))
        return value;
    return v1ToV2Migration.migrate(value, scope).settings;
}
function folderTrustSetting(value, filePath) {
    if (!value || !('security' in value))
        return {};
    const security = value?.['security'];
    if (typeof security !== 'object' ||
        security === null ||
        Array.isArray(security)) {
        return {
            error: policyError('trust_policy_invalid', filePath, new Error('`security` must be an object.')),
        };
    }
    if (!('folderTrust' in security))
        return {};
    const folderTrust = security['folderTrust'];
    if (typeof folderTrust !== 'object' ||
        folderTrust === null ||
        Array.isArray(folderTrust)) {
        return {
            error: policyError('trust_policy_invalid', filePath, new Error('`security.folderTrust` must be an object.')),
        };
    }
    if (!('enabled' in folderTrust))
        return {};
    const enabled = folderTrust['enabled'];
    if (typeof enabled === 'boolean')
        return { value: enabled };
    return {
        error: policyError('trust_policy_invalid', filePath, new Error('`security.folderTrust.enabled` must be a boolean.')),
    };
}
function parseTrustedFolders(value, filePath) {
    const config = {};
    for (const [rulePath, rawLevel] of Object.entries(value ?? {})) {
        if (!Object.values(TrustLevel).includes(rawLevel)) {
            return {
                config: {},
                error: policyError('trust_policy_invalid', filePath, new Error(`Invalid trust level for ${JSON.stringify(rulePath)}.`)),
            };
        }
        config[rulePath] = rawLevel;
    }
    return { config };
}
function semanticRevision(input) {
    const sortedRules = Object.entries(input.trustedFolders).sort(([a], [b]) => a.localeCompare(b));
    return createHash('sha256')
        .update(JSON.stringify({
        folderTrustEnabled: input.folderTrustEnabled,
        ideTrust: input.ideTrust ?? null,
        trustedFolders: sortedRules,
        settingsError: input.settingsError?.code ?? null,
        trustedFoldersError: input.trustedFoldersError?.code ?? null,
    }))
        .digest('hex');
}
export async function readDaemonTrustPolicySnapshot() {
    const [user, system, systemDefaults] = await Promise.all([
        readJsonObject(getUserSettingsPath(), MAX_SETTINGS_BYTES, false),
        readJsonObject(getSystemSettingsPath(), MAX_SETTINGS_BYTES, false),
        readJsonObject(getSystemDefaultsPath(), MAX_SETTINGS_BYTES, false),
    ]);
    const systemFolderTrust = folderTrustSetting(migrateFolderTrustSettings(system.value, 'System'), getSystemSettingsPath());
    const userFolderTrust = folderTrustSetting(migrateFolderTrustSettings(user.value, 'User'), getUserSettingsPath());
    const defaultsFolderTrust = folderTrustSetting(migrateFolderTrustSettings(systemDefaults.value, 'SystemDefaults'), getSystemDefaultsPath());
    const settingsError = system.error ??
        systemFolderTrust.error ??
        user.error ??
        userFolderTrust.error ??
        systemDefaults.error ??
        defaultsFolderTrust.error;
    const folderTrustEnabled = systemFolderTrust.value ??
        userFolderTrust.value ??
        defaultsFolderTrust.value ??
        false;
    const trustedFoldersFile = await readJsonObject(getTrustedFoldersPath(), MAX_TRUSTED_FOLDERS_BYTES, true, folderTrustEnabled);
    const parsedTrustedFolders = parseTrustedFolders(trustedFoldersFile.value, getTrustedFoldersPath());
    const trustedFoldersError = trustedFoldersFile.error ?? parsedTrustedFolders.error;
    const ideTrust = ideContextStore.get()?.workspaceState?.isTrusted;
    const revision = semanticRevision({
        folderTrustEnabled,
        ideTrust,
        trustedFolders: parsedTrustedFolders.config,
        ...(settingsError ? { settingsError } : {}),
        ...(trustedFoldersError ? { trustedFoldersError } : {}),
    });
    return {
        revision,
        folderTrustEnabled,
        ideTrust,
        trustedFolders: Object.freeze({ ...parsedTrustedFolders.config }),
        ...(settingsError ? { settingsError } : {}),
        ...(trustedFoldersError ? { trustedFoldersError } : {}),
    };
}
function explicitTrustLevel(snapshot, workspaceCwd) {
    return getExplicitTrustLevel(snapshot.trustedFolders, workspaceCwd);
}
export function evaluateDaemonWorkspaceTrust(snapshot, workspaceCwd, processCwd = process.cwd()) {
    if (snapshot.settingsError) {
        return {
            state: 'error',
            targetTrusted: false,
            source: 'none',
            explicitTrustLevel: null,
            error: snapshot.settingsError,
        };
    }
    if (!snapshot.folderTrustEnabled) {
        return {
            state: 'trusted',
            targetTrusted: true,
            source: 'disabled',
            explicitTrustLevel: null,
        };
    }
    if (snapshot.ideTrust !== undefined &&
        arePathsEquivalent(workspaceCwd, processCwd)) {
        return {
            state: snapshot.ideTrust ? 'trusted' : 'untrusted',
            targetTrusted: snapshot.ideTrust,
            source: 'ide',
            explicitTrustLevel: null,
        };
    }
    if (snapshot.trustedFoldersError) {
        return {
            state: 'error',
            targetTrusted: false,
            source: 'none',
            explicitTrustLevel: null,
            error: snapshot.trustedFoldersError,
        };
    }
    const folders = new LoadedTrustedFolders({
        path: getTrustedFoldersPath(),
        config: { ...snapshot.trustedFolders },
    }, []);
    const trusted = folders.isPathTrusted(workspaceCwd);
    return {
        state: trusted === true
            ? 'trusted'
            : trusted === false
                ? 'untrusted'
                : 'unknown',
        targetTrusted: trusted === true,
        source: trusted === undefined ? 'none' : 'file',
        explicitTrustLevel: explicitTrustLevel(snapshot, workspaceCwd),
    };
}
//# sourceMappingURL=daemon-trust-policy.js.map