import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../../keyMatchers.js';
import { t } from '../../../../i18n/index.js';
import { groupServersBySource, getStatusIcon, getStatusColor, } from '../utils.js';
export const ServerListStep = ({ servers, onSelect, }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const groupedServers = useMemo(() => groupServersBySource(servers), [servers]);
    const serverNameWidth = useMemo(() => {
        if (servers.length === 0)
            return 20;
        const maxLength = Math.max(...servers.map((s) => s.name.length));
        // 最小 20，最大 35，留一些余量
        return Math.min(Math.max(maxLength + 2, 20), 35);
    }, [servers]);
    const flatServers = useMemo(() => {
        const result = [];
        for (const group of groupedServers) {
            result.push(...group.servers);
        }
        return result;
    }, [groupedServers]);
    useKeypress((key) => {
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => Math.min(flatServers.length - 1, prev + 1));
        }
        else if (key.name === 'return') {
            onSelect(selectedIndex);
        }
    }, { isActive: true });
    if (servers.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('No MCP servers configured.') }), _jsx(Text, { color: theme.text.secondary, children: t('Add MCP servers to your settings to get started.') })] }));
    }
    const getSelectionPosition = (globalIndex) => {
        let currentIndex = 0;
        for (const group of groupedServers) {
            if (globalIndex < currentIndex + group.servers.length) {
                return {
                    groupIndex: groupedServers.indexOf(group),
                    itemIndex: globalIndex - currentIndex,
                };
            }
            currentIndex += group.servers.length;
        }
        return { groupIndex: 0, itemIndex: 0 };
    };
    const currentPosition = getSelectionPosition(selectedIndex);
    return (_jsxs(Box, { flexDirection: "column", children: [groupedServers.map((group, groupIndex) => (_jsxs(Box, { flexDirection: "column", marginBottom: groupIndex === groupedServers.length - 1 ? 0 : 1, children: [_jsxs(Text, { bold: true, color: theme.text.primary, children: [`  ${group.displayName}`, group.servers[0]?.configPath && (_jsxs(Text, { color: theme.text.secondary, children: [' ', "(", group.servers[0].configPath, ")"] }))] }), _jsx(Box, { flexDirection: "column", children: group.servers.map((server, itemIndex) => {
                            const isSelected = groupIndex === currentPosition.groupIndex &&
                                itemIndex === currentPosition.itemIndex;
                            const statusColor = server.isDisabled
                                ? 'yellow'
                                : getStatusColor(server.status);
                            return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Box, { width: serverNameWidth, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, wrap: "truncate", children: server.name }) }), _jsx(Text, { color: theme.text.secondary, children: " \u00B7 " }), _jsxs(Text, { color: statusColor === 'green'
                                            ? theme.status.success
                                            : statusColor === 'yellow'
                                                ? theme.status.warning
                                                : theme.status.error, children: [getStatusIcon(server.status), ' ', server.isDisabled ? t('disabled') : t(server.status)] }), !!server.invalidToolCount && server.invalidToolCount > 0 && (_jsxs(Text, { color: theme.status.warning, children: [' ', t('{{count}} invalid tools', {
                                                count: String(server.invalidToolCount),
                                            })] }))] }, server.name));
                        }) })] }, group.source))), servers.some((s) => s.status === 'disconnected' && !s.isDisabled) && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.status.warning, children: ["\u203B ", t('Run qwen --debug to see error logs')] }) }))] }));
};
//# sourceMappingURL=ServerListStep.js.map