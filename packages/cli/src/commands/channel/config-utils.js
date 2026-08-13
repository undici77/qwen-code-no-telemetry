import { resolveChannelCwd } from './channel-cwd.js';
import { getPlugin, supportedTypes } from './channel-registry.js';
const ENV_VAR_NAME_PATTERN = /^[A-Z_][A-Z0-9_]*$/;
const CHANNEL_APPROVAL_MODES = new Set([
    'plan',
    'default',
    'auto-edit',
    'auto',
    'yolo',
]);
export { findCliEntryPath } from './cli-entry-path.js';
export function resolveEnvVars(value, env = process.env) {
    if (value.startsWith('$$')) {
        return value.substring(1);
    }
    if (value.startsWith('$')) {
        const envName = value.substring(1);
        const envValue = env[envName];
        if (envValue === undefined) {
            throw new Error(`Environment variable ${envName} is not set (referenced as ${value})`);
        }
        if (envValue === '') {
            throw new Error(`Environment variable ${envName} is empty (referenced as ${value})`);
        }
        return envValue;
    }
    return value;
}
function resolveOptionalStringField(channelName, rawConfig, field, envResolution) {
    const value = rawConfig[field];
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    if (typeof value !== 'string') {
        throw new Error(`Channel "${channelName}" field "${field}" must be a string.`);
    }
    return resolveConfigEnvVar(value, envResolution);
}
const KNOWN_CREDENTIAL_FIELDS = new Set(['token', 'clientId', 'clientSecret']);
function resolveConfigEnvVar(value, mode) {
    if (mode === false)
        return value;
    if (value.startsWith('$$'))
        return value.substring(1);
    if (mode === 'available' && value.startsWith('$')) {
        const envName = value.substring(1);
        const envValue = process.env[envName];
        if (envValue === undefined) {
            throw new Error(`Environment variable ${envName} is not set (referenced as ${value}). ` +
                'Set the variable or remove the $ prefix to use a literal value.');
        }
        if (envValue === '') {
            throw new Error(`Environment variable ${envName} is empty (referenced as ${value})`);
        }
        return envValue;
    }
    return resolveEnvVars(value);
}
/**
 * Validate identity/memoryScope shape at parse time. settings.json is
 * hand-edited; a malformed value would otherwise surface as an opaque
 * TypeError on the first prompt of every session instead of at startup.
 */
function parseObjectStringFields(channelName, rawConfig, key, fields) {
    const value = rawConfig[key];
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Channel "${channelName}" field "${key}" must be an object.`);
    }
    const record = value;
    const result = {};
    for (const field of fields) {
        const fieldValue = record[field];
        if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            continue;
        }
        if (typeof fieldValue !== 'string') {
            throw new Error(`Channel "${channelName}" field "${key}.${field}" must be a string.`);
        }
        result[field] = fieldValue;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}
function parseMemoryScopeConfig(channelName, rawConfig) {
    const parsed = parseObjectStringFields(channelName, rawConfig, 'memoryScope', ['namespace', 'mode']);
    if (parsed?.['mode'] !== undefined && parsed['mode'] !== 'metadata-only') {
        throw new Error(`Channel "${channelName}" field "memoryScope.mode" must be "metadata-only".`);
    }
    return parsed;
}
function requireStringField(channelName, path, value) {
    if (typeof value !== 'string' || value === '') {
        throw new Error(`Channel "${channelName}" field "${path}" must be a string.`);
    }
    return value;
}
function optionalBooleanField(channelName, path, value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'boolean') {
        throw new Error(`Channel "${channelName}" field "${path}" must be a boolean.`);
    }
    return value;
}
function requireObjectField(channelName, path, value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`Channel "${channelName}" field "${path}" must be an object.`);
    }
    return value;
}
function parseWebhookTarget(channelName, path, raw) {
    const record = requireObjectField(channelName, path, raw);
    const target = {
        chatId: requireStringField(channelName, `${path}.chatId`, record['chatId']),
        senderId: requireStringField(channelName, `${path}.senderId`, record['senderId']),
    };
    if (record['threadId'] !== undefined) {
        target.threadId = requireStringField(channelName, `${path}.threadId`, record['threadId']);
    }
    const isGroup = optionalBooleanField(channelName, `${path}.isGroup`, record['isGroup']);
    if (isGroup !== undefined) {
        target.isGroup = isGroup;
    }
    return target;
}
function parseWebhookSource(channelName, path, raw, env) {
    const record = requireObjectField(channelName, path, raw);
    const rawTargets = requireObjectField(channelName, `${path}.targets`, record['targets']);
    const targets = {};
    for (const [targetRef, targetConfig] of Object.entries(rawTargets)) {
        targets[targetRef] = parseWebhookTarget(channelName, `${path}.targets.${targetRef}`, targetConfig);
    }
    const hasSecret = record['secret'] !== undefined && record['secret'] !== null;
    const hasSecretEnv = record['secretEnv'] !== undefined && record['secretEnv'] !== null;
    if (hasSecret === hasSecretEnv) {
        throw new Error(`Channel "${channelName}" field "${path}" must define exactly one of "secret" or "secretEnv".`);
    }
    const secret = hasSecret
        ? resolveEnvVars(requireStringField(channelName, `${path}.secret`, record['secret']), env)
        : resolveWebhookSecretEnv(channelName, path, requireStringField(channelName, `${path}.secretEnv`, record['secretEnv']), env);
    if (secret.length === 0) {
        throw new Error(`Channel "${channelName}" field "${path}" webhook secret must be non-empty.`);
    }
    return { secret, targets };
}
function resolveWebhookSecretEnv(channelName, path, secretEnv, env) {
    const envName = secretEnv.startsWith('$')
        ? secretEnv.substring(1)
        : secretEnv;
    if (!ENV_VAR_NAME_PATTERN.test(envName)) {
        throw new Error(`Channel "${channelName}" field "${path}.secretEnv" must be an environment variable name or $-prefixed reference.`);
    }
    const envValue = env[envName];
    if (envValue === undefined) {
        throw new Error(`Channel "${channelName}" field "${path}.secretEnv" references an unset environment variable.`);
    }
    if (envValue === '') {
        throw new Error(`Channel "${channelName}" field "${path}.secretEnv" references an empty environment variable.`);
    }
    return envValue;
}
function parseWebhookConfig(channelName, rawConfig, env = process.env) {
    const raw = rawConfig['webhooks'];
    if (raw === undefined || raw === null) {
        return undefined;
    }
    const record = requireObjectField(channelName, 'webhooks', raw);
    const rawSources = requireObjectField(channelName, 'webhooks.sources', record['sources']);
    const sources = {};
    for (const [source, sourceConfig] of Object.entries(rawSources)) {
        sources[source] = parseWebhookSource(channelName, `webhooks.sources.${source}`, sourceConfig, env);
    }
    return { sources };
}
function parseApprovalModeConfig(channelName, rawConfig) {
    const approvalMode = rawConfig['approvalMode'];
    if (approvalMode === undefined || approvalMode === null) {
        return undefined;
    }
    if (typeof approvalMode !== 'string' ||
        !CHANNEL_APPROVAL_MODES.has(approvalMode)) {
        throw new Error(`Channel "${channelName}" field "approvalMode" must be one of: ${[
            ...CHANNEL_APPROVAL_MODES,
        ].join(', ')}.`);
    }
    return approvalMode;
}
export function parseChannelWebhookConfig(channelName, rawConfig, env = process.env) {
    return parseWebhookConfig(channelName, rawConfig, env);
}
export function parseChannelWebhookConfigLenient(channelName, rawConfig, onSourceError, env = process.env) {
    const raw = rawConfig['webhooks'];
    if (raw === undefined || raw === null) {
        return undefined;
    }
    const record = requireObjectField(channelName, 'webhooks', raw);
    const rawSources = requireObjectField(channelName, 'webhooks.sources', record['sources']);
    const sources = {};
    for (const [source, sourceConfig] of Object.entries(rawSources)) {
        try {
            sources[source] = parseWebhookSource(channelName, `webhooks.sources.${source}`, sourceConfig, env);
        }
        catch (error) {
            onSourceError?.(source, error);
        }
    }
    return { sources };
}
export async function parseChannelConfig(name, rawConfig, defaultCwd = process.cwd(), options = {}) {
    if (!rawConfig['type']) {
        throw new Error(`Channel "${name}" is missing required field "type".`);
    }
    const channelType = rawConfig['type'];
    const plugin = await getPlugin(channelType);
    if (!plugin) {
        const types = await supportedTypes();
        throw new Error(`Channel type "${channelType}" is not supported. Available: ${types.join(', ')}`);
    }
    const resolvedRawConfig = { ...rawConfig };
    const envResolution = options.resolveEnvVars ?? true;
    const resolvedPluginFields = new Set();
    // Validate plugin-required fields
    for (const field of plugin.requiredConfigFields ?? []) {
        const value = rawConfig[field];
        if (value === undefined || value === null || value === '') {
            throw new Error(`Channel "${name}" (${channelType}) requires "${field}".`);
        }
        if (typeof value === 'string' && !KNOWN_CREDENTIAL_FIELDS.has(field)) {
            resolvedRawConfig[field] = resolveConfigEnvVar(value, envResolution);
            resolvedPluginFields.add(field);
        }
    }
    for (const field of plugin.envResolvableConfigFields ?? []) {
        if (resolvedPluginFields.has(field))
            continue;
        const value = rawConfig[field];
        if (typeof value === 'string' && value !== '') {
            resolvedRawConfig[field] = resolveConfigEnvVar(value, envResolution);
        }
    }
    // Resolve env vars for known credential fields
    const token = resolveOptionalStringField(name, rawConfig, 'token', envResolution) ?? '';
    const clientId = resolveOptionalStringField(name, rawConfig, 'clientId', envResolution);
    const clientSecret = resolveOptionalStringField(name, rawConfig, 'clientSecret', envResolution);
    return {
        ...resolvedRawConfig,
        type: channelType,
        token,
        clientId,
        clientSecret,
        senderPolicy: rawConfig['senderPolicy'] ||
            'allowlist',
        allowedUsers: rawConfig['allowedUsers'] || [],
        sessionScope: rawConfig['sessionScope'] ||
            plugin?.defaultSessionScope ||
            'user',
        cwd: resolveChannelCwd(rawConfig['cwd'], defaultCwd),
        approvalMode: parseApprovalModeConfig(name, rawConfig),
        instructions: rawConfig['instructions'],
        identity: parseObjectStringFields(name, rawConfig, 'identity', [
            'id',
            'displayName',
            'description',
        ]),
        memoryScope: parseMemoryScopeConfig(name, rawConfig),
        model: rawConfig['model'],
        groupPolicy: rawConfig['groupPolicy'] || 'disabled',
        dmPolicy: rawConfig['dmPolicy'] || 'open',
        groups: rawConfig['groups'] || {},
        webhooks: parseWebhookConfig(name, rawConfig),
    };
}
//# sourceMappingURL=config-utils.js.map