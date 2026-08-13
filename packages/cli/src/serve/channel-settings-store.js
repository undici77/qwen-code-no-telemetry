/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { getPlugin, UNSAFE_OBJECT_KEYS, } from '../commands/channel/channel-registry.js';
import { loadSettings, saveSettings } from '../config/settings.js';
export class ChannelSettingsError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'ChannelSettingsError';
    }
}
function revisionOf(channels, startupNames) {
    return createHash('sha256')
        .update(JSON.stringify({ channels, startupNames }))
        .digest('hex');
}
function applySecretUpdate(current, update) {
    validateSecretUpdate(update);
    if (update.operation === 'preserve')
        return current;
    if (update.operation === 'clear')
        return undefined;
    if (typeof update.value !== 'string' || update.value.length === 0) {
        throw invalidSecret('Secret replacements must be non-empty strings.');
    }
    return update.value;
}
function invalidSecret(message) {
    return new ChannelSettingsError('channel_settings_invalid_secret', message);
}
function invalidConfig(message) {
    return new ChannelSettingsError('channel_settings_invalid_config', message);
}
function assertSafeChannelName(name) {
    if (UNSAFE_OBJECT_KEYS.has(name)) {
        throw new ChannelSettingsError('channel_settings_invalid_name', `Channel name ${JSON.stringify(name)} is not allowed.`);
    }
}
function assertUpsertChannelName(name) {
    assertSafeChannelName(name);
    if (isAllStartupName(name)) {
        throw new ChannelSettingsError('channel_settings_invalid_name', `Channel name ${JSON.stringify(name)} is reserved for startup selection.`);
    }
}
function isAllStartupName(name) {
    return name.trim() === 'all';
}
function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isEnvironmentReference(value) {
    return /^\$[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}
function assertStringRecord(key, value, allowedKeys) {
    if (!isRecord(value)) {
        throw invalidConfig(`Channel field "${key}" must be an object.`);
    }
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (!allowedKeys.has(nestedKey) || typeof nestedValue !== 'string') {
            throw invalidConfig(`Channel field "${key}.${nestedKey}" is invalid.`);
        }
    }
}
function assertNumberRecord(key, value, allowedKeys) {
    if (!isRecord(value)) {
        throw invalidConfig(`Channel field "${key}" must be an object.`);
    }
    for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (!allowedKeys.has(nestedKey) ||
            typeof nestedValue !== 'number' ||
            !Number.isFinite(nestedValue)) {
            throw invalidConfig(`Channel field "${key}.${nestedKey}" is invalid.`);
        }
    }
}
function assertSharedField(key, value) {
    const enumValues = {
        senderPolicy: new Set(['allowlist', 'pairing', 'open']),
        dmPolicy: new Set(['open', 'disabled']),
        groupPolicy: new Set(['disabled', 'allowlist', 'pairing', 'open']),
        sessionScope: new Set(['user', 'thread', 'chat_thread', 'single']),
        dispatchMode: new Set(['steer', 'followup', 'collect']),
        blockStreaming: new Set(['on', 'off']),
    };
    if (Object.hasOwn(enumValues, key)) {
        if (typeof value !== 'string' || !enumValues[key].has(value)) {
            throw invalidConfig(`Channel field "${key}" has an invalid value.`);
        }
        return true;
    }
    if (['model', 'cwd', 'approvalMode', 'instructions'].includes(key)) {
        if (typeof value !== 'string') {
            throw invalidConfig(`Channel field "${key}" must be a string.`);
        }
        return true;
    }
    if (key === 'allowedUsers') {
        if (!Array.isArray(value) ||
            value.some((item) => typeof item !== 'string')) {
            throw invalidConfig(`Channel field "${key}" must be a string array.`);
        }
        return true;
    }
    if (key === 'groupHistoryLimit') {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            throw invalidConfig(`Channel field "${key}" must be a number.`);
        }
        return true;
    }
    if (key === 'identity') {
        assertStringRecord(key, value, new Set(['id', 'displayName', 'description']));
        return true;
    }
    if (key === 'blockStreamingChunk') {
        assertNumberRecord(key, value, new Set(['minChars', 'maxChars']));
        return true;
    }
    if (key === 'blockStreamingCoalesce') {
        assertNumberRecord(key, value, new Set(['idleMs']));
        return true;
    }
    if (key === 'memoryScope') {
        if (!isRecord(value)) {
            throw invalidConfig(`Channel field "${key}" must be an object.`);
        }
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
            const valid = (nestedKey === 'namespace' && typeof nestedValue === 'string') ||
                (nestedKey === 'mode' && nestedValue === 'metadata-only');
            if (!valid) {
                throw invalidConfig(`Channel field "${key}.${nestedKey}" is invalid.`);
            }
        }
        return true;
    }
    return false;
}
function containsUnsafeObjectKey(value) {
    if (Array.isArray(value)) {
        return value.some((item) => containsUnsafeObjectKey(item));
    }
    if (!isRecord(value))
        return false;
    return Object.entries(value).some(([key, nested]) => UNSAFE_OBJECT_KEYS.has(key) || containsUnsafeObjectKey(nested));
}
function assertDescriptorValue(field, value, path = field.key, previous) {
    if (field.kind === 'object') {
        // The web editor cannot edit object fields and re-sends the stored value
        // verbatim on every save; an unchanged stored object keeps its values even
        // if a newer rule would reject them. Reserved keys stay rejected.
        if (isDeepStrictEqual(previous, value) && !containsUnsafeObjectKey(value)) {
            return;
        }
        if (!isRecord(value)) {
            throw invalidConfig(`Channel field "${path}" has an invalid value.`);
        }
        const previousRecord = isRecord(previous) ? previous : {};
        const properties = new Map(field.properties.map((property) => [property.key, property]));
        for (const [key, nestedValue] of Object.entries(value)) {
            const property = properties.get(key);
            if (!property) {
                assertPreservedUnknownField(path, key, nestedValue, previousRecord);
                continue;
            }
            assertDescriptorValue(property, nestedValue, `${path}.${key}`, Object.hasOwn(previousRecord, key) ? previousRecord[key] : undefined);
        }
        assertRequiredFields(field.properties, value, path);
        return;
    }
    const invalidEnvironment = typeof value === 'string' &&
        isEnvironmentReference(value) &&
        !field.envResolvable;
    if (invalidEnvironment) {
        throw invalidConfig(`Channel field "${path}" does not support environment references.`);
    }
    const valid = ((field.kind === 'string' || field.kind === 'secret') &&
        typeof value === 'string' &&
        value.length > 0) ||
        (field.kind === 'boolean' && typeof value === 'boolean') ||
        (field.kind === 'number' &&
            typeof value === 'number' &&
            Number.isFinite(value) &&
            (field.exclusiveMinimum === undefined ||
                value > field.exclusiveMinimum)) ||
        (field.kind === 'enum' &&
            typeof value === 'string' &&
            field.options?.some((option) => option.value === value) === true) ||
        (field.kind === 'string-list' &&
            Array.isArray(value) &&
            value.every((item) => typeof item === 'string')) ||
        (field.kind === 'record' &&
            isRecord(value) &&
            Object.values(value).every((v) => typeof v === 'string') &&
            !containsUnsafeObjectKey(value));
    if (!valid) {
        throw invalidConfig(`Channel field "${path}" has an invalid value.`);
    }
}
function assertRequiredFields(fields, values, path) {
    for (const field of fields) {
        if (!field.required)
            continue;
        const value = Object.hasOwn(values, field.key)
            ? values[field.key]
            : undefined;
        if (value === undefined || value === null || value === '') {
            const fieldPath = path ? `${path}.${field.key}` : field.key;
            throw invalidConfig(`Channel field "${fieldPath}" is required.`);
        }
    }
}
function assertPreservedUnknownField(path, key, value, previous) {
    const fieldPath = path ? `${path}.${key}` : key;
    if (UNSAFE_OBJECT_KEYS.has(key)) {
        throw invalidConfig(`Channel field "${fieldPath}" is not manageable.`);
    }
    if (containsUnsafeObjectKey(value)) {
        throw invalidConfig(`Channel field "${fieldPath}" cannot use a reserved key.`);
    }
    if (Object.hasOwn(previous, key) && isDeepStrictEqual(previous[key], value)) {
        return;
    }
    throw invalidConfig(`Channel field "${fieldPath}" is not manageable.`);
}
function assertManagedConfig(config, previous, fields) {
    const descriptorFields = new Map(fields.map((field) => [field.key, field]));
    for (const [key, value] of Object.entries(config)) {
        if (key === 'type')
            continue;
        const field = descriptorFields.get(key);
        if (field) {
            assertDescriptorValue(field, value, field.key, Object.hasOwn(previous, key) ? previous[key] : undefined);
            continue;
        }
        if (assertSharedField(key, value))
            continue;
        assertPreservedUnknownField(undefined, key, value, previous);
    }
    assertRequiredFields(fields, config);
}
function validateSecretUpdate(update) {
    if (!isRecord(update)) {
        throw invalidSecret('Secret updates must be objects.');
    }
    const operation = update['operation'];
    const keys = Object.keys(update).sort();
    const valid = ((operation === 'preserve' || operation === 'clear') &&
        keys.length === 1 &&
        keys[0] === 'operation') ||
        (operation === 'replace' &&
            keys.length === 2 &&
            keys[0] === 'operation' &&
            keys[1] === 'value' &&
            typeof update['value'] === 'string' &&
            update['value'].length > 0);
    if (!valid) {
        throw invalidSecret('Secret updates contain an invalid operation.');
    }
}
export function assertValidChannelSecretUpdates(updates) {
    if (!isRecord(updates)) {
        throw invalidSecret('Secret updates must be objects.');
    }
    for (const [key, update] of Object.entries(updates)) {
        if (UNSAFE_OBJECT_KEYS.has(key)) {
            throw invalidSecret(`Secret update ${JSON.stringify(key)} is invalid.`);
        }
        validateSecretUpdate(update);
    }
}
function workspaceValues(workspaceCwd) {
    const settings = loadSettings(workspaceCwd, { skipLoadEnvironment: true })
        .workspace.settings;
    const rawChannels = isRecord(settings.channels) ? settings.channels : {};
    const channels = {};
    for (const [name, config] of Object.entries(rawChannels)) {
        if (isRecord(config))
            channels[name] = config;
    }
    const startupNames = Array.isArray(settings.serve?.channels)
        ? settings.serve.channels.filter((name) => typeof name === 'string')
        : [];
    return { channels, startupNames };
}
export class WorkspaceChannelSettingsStore {
    workspaceCwd;
    constructor(workspaceCwd) {
        this.workspaceCwd = workspaceCwd;
    }
    snapshot() {
        const { channels, startupNames } = workspaceValues(this.workspaceCwd);
        return {
            revision: revisionOf(channels, startupNames),
            channels: { ...channels },
            startupNames: [...startupNames],
        };
    }
    async upsert(name, options) {
        assertUpsertChannelName(name);
        const secretUpdates = options.secrets === undefined ? {} : options.secrets;
        assertValidChannelSecretUpdates(secretUpdates);
        const plugin = await getPlugin(options.config.type);
        if (!plugin?.management) {
            throw new ChannelSettingsError('channel_settings_unmanageable', `Channel type "${options.config.type}" does not provide safe management metadata.`);
        }
        const secretKeys = new Set(plugin.management.fields
            .filter((field) => field.kind === 'secret')
            .map((field) => field.key));
        for (const key of Object.keys(secretUpdates)) {
            if (!secretKeys.has(key)) {
                throw invalidSecret(`Channel type "${options.config.type}" does not declare "${key}" as a secret.`);
            }
        }
        for (const key of secretKeys) {
            if (Object.hasOwn(options.config, key)) {
                throw invalidSecret(`Secret "${key}" must use an explicit preserve, replace, or clear operation.`);
            }
        }
        const current = this.assertRevision(options.expectedRevision);
        const storedPrevious = current.channels[name] ?? {};
        const previous = storedPrevious['type'] === options.config.type ? storedPrevious : {};
        const nextConfig = { ...options.config };
        for (const key of secretKeys) {
            const update = secretUpdates[key] ?? { operation: 'preserve' };
            const value = applySecretUpdate(previous[key], update);
            if (value !== undefined)
                nextConfig[key] = value;
        }
        assertManagedConfig(nextConfig, previous, plugin.management.fields);
        let crossFieldError;
        try {
            crossFieldError = plugin.management.validateConfig?.(nextConfig);
            if (crossFieldError instanceof Promise) {
                // A non-async validateConfig can still return a rejected Promise; the
                // backstop below throws without awaiting it, so attach a handler to
                // keep the rejection from terminating the daemon.
                void crossFieldError.catch(() => { });
            }
        }
        catch (error) {
            throw invalidConfig(`Channel validateConfig failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (crossFieldError !== undefined) {
            throw invalidConfig(typeof crossFieldError === 'string'
                ? crossFieldError
                : 'Channel validateConfig must return a string error message.');
        }
        const channels = { ...current.channels, [name]: nextConfig };
        const workspaceFile = loadSettings(this.workspaceCwd, {
            skipLoadEnvironment: true,
        }).workspace;
        saveSettings(workspaceFile, { channels }, ['channels'], {
            throwOnWriteFailure: true,
        });
        return this.snapshot();
    }
    async remove(name, options) {
        assertSafeChannelName(name);
        const current = this.assertRevision(options.expectedRevision);
        const channels = { ...current.channels };
        delete channels[name];
        const hasAllSentinel = current.startupNames.some(isAllStartupName);
        const startupNames = hasAllSentinel
            ? Object.keys(channels).some((channelName) => !isAllStartupName(channelName))
                ? ['all']
                : []
            : current.startupNames.filter((startupName) => startupName !== name);
        const workspaceFile = loadSettings(this.workspaceCwd, {
            skipLoadEnvironment: true,
        }).workspace;
        saveSettings(workspaceFile, { channels, serve: { channels: startupNames } }, ['channels'], { throwOnWriteFailure: true });
        return this.snapshot();
    }
    async setStartupNames(names, options) {
        for (const name of names) {
            assertSafeChannelName(name);
        }
        this.assertRevision(options.expectedRevision);
        const workspaceFile = loadSettings(this.workspaceCwd, {
            skipLoadEnvironment: true,
        }).workspace;
        saveSettings(workspaceFile, { serve: { channels: [...names] } }, ['serve', 'channels'], { throwOnWriteFailure: true });
        return this.snapshot();
    }
    assertRevision(expectedRevision) {
        const current = this.snapshot();
        if (current.revision !== expectedRevision) {
            throw new ChannelSettingsError('channel_settings_conflict', 'Channel settings changed; reload before trying again.');
        }
        return current;
    }
}
//# sourceMappingURL=channel-settings-store.js.map