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
import { MCPServerStatus } from '@qwen-code/qwen-code-core';
import { getStatusColor, getStatusIcon, formatServerCommand, } from '../utils.js';
// 标签列宽度
const LABEL_WIDTH = 15;
export const ServerDetailStep = ({ server, onViewTools, onViewResources, onApprove, onReconnect, onDisable, onAuthenticate, onClearAuth, onBack, isActive = true, }) => {
    // 受门控（#4615）但未审批的 server 被 discovery 跳过，不会进入连接/认证流程，
    // 审批原因优先展示。
    const awaitingApproval = !!server && !server.isDisabled && !!server.approvalState;
    // 未连接且需要认证时，状态以"需要认证"展示，避免误导用户去排查连接问题。
    // requiresAuth 是加载时的快照，状态被实时推到 connected 后不再适用。
    const needsAuth = !!server &&
        !server.isDisabled &&
        !awaitingApproval &&
        !!server.requiresAuth &&
        server.status !== MCPServerStatus.CONNECTED;
    const statusColor = server
        ? server.isDisabled || awaitingApproval || needsAuth
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
        // 只在调用方接入了 onViewResources 回调、且服务器未禁用并有资源时显示
        // "查看资源"。onViewResources 是可选 prop：像扩展管理器（McpServerActionsView）
        // 这类同样复用 ServerDetailStep 的调用方，若未接入资源子视图就不应出现一个
        // 点了没反应的死操作。
        if (onViewResources &&
            !server.isDisabled &&
            (server.resourceCount ?? 0) > 0) {
            result.push({
                key: 'view-resources',
                label: t('View resources'),
                value: 'view-resources',
            });
        }
        // 只在服务器未禁用且已断开连接时显示"重新连接"选项。受门控但未审批的 server
        // 被 discovery 跳过，重连无法推进（仍是 pending/rejected），故隐藏以与状态文案一致。
        if (!server.isDisabled &&
            !awaitingApproval &&
            server.status === 'disconnected') {
            result.push({
                key: 'reconnect',
                label: t('Reconnect'),
                value: 'reconnect',
            });
        }
        // 受门控但未审批的 server 显示"审批"按钮，让用户可以在 /mcp 中直接审批
        // 而不必等待启动时的弹窗。
        if (awaitingApproval && onApprove) {
            result.push({
                key: 'approve',
                label: t('Approve'),
                value: 'approve',
            });
        }
        // 始终显示启用/禁用选项（扩展提供的服务器走扩展级禁用记录）
        result.push({
            key: 'toggle-disable',
            label: server.isDisabled ? t('Enable') : t('Disable'),
            value: 'toggle-disable',
        });
        // 已认证的服务器显示"重新认证"，未认证的显示"认证"。审批未通过时认证同样无法推进，隐藏。
        if (!server.isDisabled && !awaitingApproval) {
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
    }, [server, onViewResources, onApprove, awaitingApproval]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
        }
    }, { isActive });
    if (!server) {
        return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('No server selected') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Status:') }) }), _jsx(Box, { children: _jsxs(Text, { color: statusColor === 'green'
                                        ? theme.status.success
                                        : statusColor === 'yellow'
                                            ? theme.status.warning
                                            : theme.status.error, children: [getStatusIcon(server.status), ' ', server.isDisabled
                                            ? t('disabled')
                                            : awaitingApproval
                                                ? server.approvalState === 'rejected'
                                                    ? t('rejected — edit config to re-approve')
                                                    : t('needs approval')
                                                : needsAuth
                                                    ? t('needs authentication')
                                                    : t(server.status)] }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Source:') }) }), _jsx(Box, { children: _jsx(Text, { color: theme.text.primary, children: server.source === 'user'
                                        ? t('User Settings')
                                        : server.source === 'project'
                                            ? '.mcp.json'
                                            : server.source === 'workspace'
                                                ? t('Workspace Settings')
                                                : server.source === 'system'
                                                    ? t('System Settings')
                                                    : t('Extension') }) })] }), _jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Command:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "truncate", children: formatServerCommand(server) }) })] }), server.config.cwd && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Working Directory:') }) }), _jsx(Box, { children: _jsx(Text, { wrap: "truncate", children: server.config.cwd }) })] })), !server.isDisabled && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Tools:') }) }), _jsx(Box, { children: _jsxs(Text, { children: [server.toolCount, ' ', server.toolCount === 1 ? t('tool') : t('tools'), !!server.invalidToolCount && server.invalidToolCount > 0 && (_jsxs(Text, { color: theme.status.warning, children: [' ', "(", server.invalidToolCount, ' ', server.invalidToolCount === 1
                                                    ? t('invalid')
                                                    : t('invalid'), ")"] }))] }) })] })), !server.isDisabled && server.promptCount > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Prompts:') }) }), _jsx(Box, { children: _jsx(Text, { children: server.promptCount }) })] })), !server.isDisabled && server.resourceCount > 0 && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.text.primary, children: t('Resources:') }) }), _jsx(Box, { children: _jsx(Text, { children: server.resourceCount }) })] })), server.errorMessage && (_jsxs(Box, { children: [_jsx(Box, { width: LABEL_WIDTH, children: _jsx(Text, { color: theme.status.error, children: t('Error:') }) }), _jsx(Box, { children: _jsx(Text, { color: theme.status.error, wrap: "wrap", children: server.errorMessage }) })] }))] }), _jsx(Box, { children: _jsx(RadioButtonSelect, { items: actions, isFocused: isActive, showNumbers: false, onSelect: (value) => {
                        switch (value) {
                            case 'view-tools':
                                onViewTools();
                                break;
                            case 'view-resources':
                                onViewResources?.();
                                break;
                            case 'approve':
                                onApprove?.();
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