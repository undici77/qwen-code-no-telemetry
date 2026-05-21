import { resolvePath } from '@qwen-code/channel-base';
import * as path from 'node:path';
import { getPlugin, supportedTypes } from './channel-registry.js';
export function resolveEnvVars(value) {
    if (value.startsWith('$')) {
        const envName = value.substring(1);
        const envValue = process.env[envName];
        if (!envValue) {
            throw new Error(`Environment variable ${envName} is not set (referenced as ${value})`);
        }
        return envValue;
    }
    return value;
}
export function findCliEntryPath() {
    const mainModule = process.argv[1];
    if (mainModule) {
        return path.resolve(mainModule);
    }
    throw new Error('Cannot determine CLI entry path');
}
export async function parseChannelConfig(name, rawConfig) {
    if (!rawConfig['type']) {
        throw new Error(`Channel "${name}" is missing required field "type".`);
    }
    const channelType = rawConfig['type'];
    const plugin = await getPlugin(channelType);
    if (!plugin) {
        const types = await supportedTypes();
        throw new Error(`Channel type "${channelType}" is not supported. Available: ${types.join(', ')}`);
    }
    // Validate plugin-required fields
    for (const field of plugin.requiredConfigFields ?? []) {
        if (!rawConfig[field]) {
            throw new Error(`Channel "${name}" (${channelType}) requires "${field}".`);
        }
    }
    // Resolve env vars for known credential fields
    const token = rawConfig['token']
        ? resolveEnvVars(rawConfig['token'])
        : '';
    const clientId = rawConfig['clientId']
        ? resolveEnvVars(rawConfig['clientId'])
        : undefined;
    const clientSecret = rawConfig['clientSecret']
        ? resolveEnvVars(rawConfig['clientSecret'])
        : undefined;
    return {
        ...rawConfig,
        type: channelType,
        token,
        clientId,
        clientSecret,
        senderPolicy: rawConfig['senderPolicy'] ||
            'allowlist',
        allowedUsers: rawConfig['allowedUsers'] || [],
        sessionScope: rawConfig['sessionScope'] || 'user',
        cwd: resolvePath(rawConfig['cwd'] || process.cwd()),
        approvalMode: rawConfig['approvalMode'],
        instructions: rawConfig['instructions'],
        model: rawConfig['model'],
        groupPolicy: rawConfig['groupPolicy'] || 'disabled',
        groups: rawConfig['groups'] || {},
    };
}
//# sourceMappingURL=config-utils.js.map