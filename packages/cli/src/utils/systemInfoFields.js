/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { t } from '../i18n/index.js';
import { findProviderByCredentials, resolveMetadataKey, } from '@qwen-code/qwen-code-core';
export function getSystemInfoFields(info) {
    const fields = [];
    addField(fields, t('Qwen Code'), formatCliVersion(info));
    addField(fields, t('Runtime'), formatRuntime(info));
    addField(fields, t('IDE Client'), info.ideClient);
    addField(fields, 'LSP', info.lspStatus ?? '');
    addField(fields, t('OS'), formatOs(info));
    addField(fields, t('Auth'), formatAuth(info));
    addField(fields, t('Base URL'), formatBaseUrl(info));
    addField(fields, t('Model'), info.modelVersion);
    addField(fields, t('Fast Model'), info.fastModel || info.modelVersion);
    addField(fields, t('Session ID'), info.sessionId);
    addField(fields, t('Sandbox'), info.sandboxEnv);
    addField(fields, t('Proxy'), formatProxy(info.proxy));
    addField(fields, t('Memory Usage'), info.memoryUsage);
    return fields;
}
function addField(fields, label, value) {
    if (value) {
        fields.push({ label, value });
    }
}
function formatCliVersion(info) {
    if (!info.cliVersion) {
        return '';
    }
    if (!info.gitCommit) {
        return info.cliVersion;
    }
    return `${info.cliVersion} (${info.gitCommit})`;
}
function formatRuntime(info) {
    if (!info.nodeVersion && !info.npmVersion) {
        return '';
    }
    const node = info.nodeVersion ? `Node.js ${info.nodeVersion}` : '';
    const npm = info.npmVersion ? `npm ${info.npmVersion}` : '';
    return joinParts([node, npm], ' / ');
}
function formatOs(info) {
    return joinParts([info.osPlatform, info.osArch, formatOsRelease(info.osRelease)], ' ').trim();
}
function formatOsRelease(release) {
    if (!release) {
        return '';
    }
    return `(${release})`;
}
function formatAuth(info) {
    if (!info.selectedAuthType) {
        return '';
    }
    const managedProvider = findProviderByCredentials(info.baseUrl, info.apiKeyEnvKey);
    if (managedProvider && resolveMetadataKey(managedProvider)) {
        return t(managedProvider.label);
    }
    if (info.selectedAuthType.startsWith('oauth') ||
        info.selectedAuthType === 'qwen-oauth') {
        return 'Qwen OAuth';
    }
    return `API Key - ${info.selectedAuthType}`;
}
function formatBaseUrl(info) {
    if (!info.selectedAuthType || !info.baseUrl) {
        return '';
    }
    if (info.selectedAuthType.startsWith('oauth') ||
        info.selectedAuthType === 'qwen-oauth') {
        return '';
    }
    return info.baseUrl;
}
function formatProxy(proxy) {
    if (!proxy) {
        return 'no proxy';
    }
    return redactProxy(proxy);
}
function redactProxy(proxy) {
    try {
        const url = new URL(proxy);
        if (url.username || url.password) {
            url.username = url.username ? '***' : '';
            url.password = url.password ? '***' : '';
        }
        return url.toString();
    }
    catch {
        return proxy.replace(/\/\/[^/]*@/, '//***@');
    }
}
function joinParts(parts, separator) {
    return parts.filter((part) => part).join(separator);
}
//# sourceMappingURL=systemInfoFields.js.map