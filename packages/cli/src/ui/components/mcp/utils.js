/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { t } from '../../../i18n/index.js';
import { SOURCE_ORDER } from './constants.js';
function getSourceDisplayName(source) {
    switch (source) {
        case 'user':
            return t('User MCPs');
        case 'project':
            return t('Project MCPs');
        case 'workspace':
            return t('Workspace Settings');
        case 'system':
            return t('System Settings');
        case 'extension':
            return t('Extension MCPs');
        default:
            return source;
    }
}
/**
 * 按来源分组服务器
 */
export function groupServersBySource(servers) {
    const groups = new Map();
    for (const server of servers) {
        const existing = groups.get(server.source);
        if (existing) {
            existing.push(server);
        }
        else {
            groups.set(server.source, [server]);
        }
    }
    // 按优先级排序: user > project > extension
    const result = [];
    for (const source of SOURCE_ORDER) {
        const servers = groups.get(source);
        if (servers && servers.length > 0) {
            result.push({
                source,
                displayName: getSourceDisplayName(source),
                servers,
            });
        }
    }
    return result;
}
/**
 * 获取状态颜色
 */
export function getStatusColor(status) {
    switch (status) {
        case 'connected':
            return 'green';
        case 'connecting':
            return 'yellow';
        case 'disconnected':
            return 'red';
        default:
            return 'gray';
    }
}
/**
 * 获取状态图标
 */
export function getStatusIcon(status) {
    switch (status) {
        case 'connected':
            return '✓';
        case 'connecting':
            return '…';
        case 'disconnected':
            return '✗';
        default:
            return '?';
    }
}
/**
 * 截断文本
 */
export function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}
/**
 * 格式化服务器命令显示
 */
export function formatServerCommand(server) {
    const config = server.config;
    if (config.httpUrl) {
        return `${config.httpUrl} (http)`;
    }
    if (config.url) {
        return `${config.url} (sse)`;
    }
    if (config.command) {
        const args = config.args?.join(' ') || '';
        return `${config.command} ${args} (stdio)`.trim();
    }
    return t('Unknown');
}
/**
 * Check if a tool is valid (has both name and description required by LLM)
 * @param name - Tool name
 * @param description - Tool description
 * @returns boolean indicating if the tool is valid
 */
export function isToolValid(name, description) {
    return !!name && !!description;
}
/**
 * Get the reason why a tool is invalid
 * @param name - Tool name
 * @param description - Tool description
 * @returns Array of missing fields
 */
export function getToolInvalidReasons(name, description) {
    const reasons = [];
    if (!name)
        reasons.push(t('missing name'));
    if (!description)
        reasons.push(t('missing description'));
    return reasons;
}
//# sourceMappingURL=utils.js.map