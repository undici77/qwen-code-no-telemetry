import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { t } from '../../../../i18n/index.js';
import { getStatusColor, getStatusIcon, formatServerCommand, } from '../utils.js';
// 标签列宽度
const LABEL_WIDTH = 15;
export const ServerDetailStep = ({ server, onViewTools, onReconnect, onDisable, onAuthenticate, onClearAuth, onBack, }) => {
    const statusColor = server
        ? server.isDisabled
            ? 'yellow'
            : getStatusColor(server.status)
        : 'gray';
    // 根据服务器状态动态生成可用操作
    const actions = useMemo(() => {
        const result = [];
        if (!server) {
            return result;
        }
        // 只在服务器未禁用且有工具时显示"查看工具"选项
        if (!server.isDisabled && (server.toolCount ?? 0) > 0) {
            result.push({
                key: 'view-tools',
                label: t('View tools'),
                value: 'view-tools',
            });
        }
        // 只在服务器未禁用且已断开连接时显示"重新连接"选项
        if (!server.isDisabled && server.status === 'disconnected') {
            result.push({
                key: 'reconnect',
                label: t('Reconnect'),
                value: 'reconnect',
            });
        }
        // 始终显示启用/禁用选项
        result.push({
            key: 'toggle-disable',
            label: server?.isDisabled ? t('Enable') : t('Disable'),
            value: 'toggle-disable',
        });
        // 已认证的服务器显示"重新认证"，未认证的显示"认证"
        if (!server.isDisabled) {
            result.push({
                key: 'authenticate',
                label: server.hasOAuthTokens ? t('Re-authenticate') : t('Authenticate'),
                value: 'authenticate',
            });
        }
        // 只在存储有 OAuth 认证信息时显示“清空认证”选项
        if (!server.isDisabled && server.hasOAuthTokens) {
            result.push({
                key: 'clear-auth',
                label: t('Clear Authentication'),
                value: 'clear-auth',
            });
        }
        return result;
    }, [server]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
        }
    }, { isActive: true });
    if (!server) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No server selected') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Status:') }) }), _jsx(Box, { children: _jsxs(Text, { color: statusColor === 'green'
                                        ? theme.status.success
                                        : statusColor === 'yellow'
                                            ? theme.status.warning
                                            : theme.status.error, children: [getStatusIcon(server.status), ' ', server.isDisabled ? t('disabled') : t(server.status)] }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Source:') }) }), _jsx(Box, { children: _jsx(Text, { color: theme.text.primary, children: server.source === 'user'
                                        ? t('User Settings')
                                        : server.source === 'project'
                                            ? t('Workspace Settings')
                                            : t('Extension') }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Command:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "truncate", children: formatServerCommand(server) }) })] }), server.config.cwd && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Working Directory:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "truncate", children: server.config.cwd }) })] })), !server.isDisabled && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Tools:') }) }), _jsx(Box, { children: _jsxs(Text, { children: [server.toolCount, ' ', server.toolCount === 1 ? t('tool') : t('tools'), !!server.invalidToolCount && server.invalidToolCount > 0 && (_jsxs(Text, { color: theme.status.warning, children: [' ', "(", server.invalidToolCount, ' ', server.invalidToolCount === 1
                                                    ? t('invalid')
                                                    : t('invalid'), ")"] }))] }) })] })), server.errorMessage && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.status.error, children: t('Error:') }) }), _jsx(Box, { children: _jsx(Text, { color: theme.status.error, wrap: "wrap", children: server.errorMessage }) })] }))] }), _jsx(Box, { children: _jsx(RadioButtonSelect, { items: actions, showNumbers: false, onSelect: (value) => {
                        switch (value) {
                            case 'view-tools':
                                onViewTools();
                                break;
                            case 'reconnect':
                                onReconnect?.();
                                break;
                            case 'toggle-disable':
                                onDisable?.();
                                break;
                            case 'authenticate':
                                onAuthenticate?.();
                                break;
                            case 'clear-auth':
                                onClearAuth?.();
                                break;
                            default:
                                break;
                        }
                    } }) })] }));
};
//# sourceMappingURL=ServerDetailStep.js.map