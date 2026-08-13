import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../../keyMatchers.js';
import { getExtensionDisplayName, getExtensionDescription, } from '@qwen-code/qwen-code-core';
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
import { t, getCurrentLanguage } from '../../../../i18n/index.js';
import { ExtensionUpdateState } from '../../../state/extensions.js';
export const ExtensionListStep = ({ extensions, extensionsUpdateState, onExtensionSelect, }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { columns: termWidth } = useTerminalSize();
    // Calculate max widths for each column for alignment
    const { maxNameWidth, maxStatusWidth } = useMemo(() => {
        let maxName = 0;
        let maxStatus = 0;
        for (const ext of extensions) {
            maxName = Math.max(maxName, getExtensionDisplayName(ext, getCurrentLanguage()).length);
            const statusLength = ext.isActive
                ? t('active').length
                : t('disabled').length;
            maxStatus = Math.max(maxStatus, statusLength);
        }
        return {
            maxNameWidth: maxName,
            maxStatusWidth: maxStatus,
        };
    }, [extensions]);
    // Reset selection when extensions change
    useEffect(() => {
        if (extensions.length > 0 && selectedIndex >= extensions.length) {
            setSelectedIndex(0);
        }
    }, [extensions, selectedIndex]);
    // Keyboard navigation
    useKeypress((key) => {
        if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => prev > 0 ? prev - 1 : extensions.length - 1);
        }
        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => prev < extensions.length - 1 ? prev + 1 : 0);
        }
        else if (key.name === 'return' || key.name === 'space') {
            if (extensions.length > 0) {
                onExtensionSelect(selectedIndex);
            }
        }
    }, { isActive: true });
    if (extensions.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: t('No extensions installed.') }), _jsx(Text, { color: theme.text.secondary, children: t("Use '/extensions install' to install your first extension.") })] }));
    }
    const getUpdateStateColor = (state) => {
        if (!state)
            return theme.text.secondary;
        switch (state) {
            case ExtensionUpdateState.CHECKING_FOR_UPDATES:
            case ExtensionUpdateState.UPDATING:
                return theme.text.secondary;
            case ExtensionUpdateState.UPDATE_AVAILABLE:
            case ExtensionUpdateState.UPDATED_NEEDS_RESTART:
            case ExtensionUpdateState.UPDATED_WITH_WARNINGS:
                return theme.status.warning;
            case ExtensionUpdateState.ERROR:
                return theme.status.error;
            case ExtensionUpdateState.UP_TO_DATE:
            case ExtensionUpdateState.NOT_UPDATABLE:
            case ExtensionUpdateState.UPDATED:
                return theme.status.success;
            default:
                return theme.text.secondary;
        }
    };
    const getLocalizedUpdateState = (state) => {
        if (!state)
            return '';
        // Map internal state values to translation keys
        const stateMap = {
            'up to date': t('up to date'),
            'update available': t('update available'),
            'checking...': t('checking...'),
            'not updatable': t('not updatable'),
            error: t('error'),
        };
        return stateMap[state] || state;
    };
    const truncateDescription = (text, maxWidth, maxLines) => {
        if (maxWidth <= 0)
            return [];
        const lines = [];
        let remaining = text;
        for (let i = 0; i < maxLines; i++) {
            if (!remaining)
                break;
            if (remaining.length <= maxWidth || i === maxLines - 1) {
                lines.push(remaining.length > maxWidth
                    ? remaining.slice(0, maxWidth - 1) + '…'
                    : remaining);
                break;
            }
            lines.push(remaining.slice(0, maxWidth));
            remaining = remaining.slice(maxWidth);
        }
        return lines;
    };
    const renderExtensionItem = (extension, index, isSelected) => {
        const locale = getCurrentLanguage();
        const isActive = extension.isActive;
        const activeColor = isActive ? theme.status.success : theme.text.secondary;
        const activeString = isActive ? t('active') : t('disabled');
        const updateState = extensionsUpdateState.get(extension.name);
        const stateColor = getUpdateStateColor(updateState);
        const stateText = getLocalizedUpdateState(updateState);
        const description = getExtensionDescription(extension, locale);
        // selector(2) + name + gap(2) + status + gap(2) + update state
        const fixedWidth = 2 + maxNameWidth + 2 + maxStatusWidth + 4 + 15;
        const descWidth = Math.max(0, termWidth - fixedWidth);
        const descLines = description
            ? truncateDescription(description, descWidth, 2)
            : [];
        return (_jsxs(Box, { flexDirection: "column", marginBottom: descLines.length > 0 ? 1 : 0, children: [_jsxs(Box, { alignItems: "center", children: [_jsx(Box, { minWidth: 2, flexShrink: 0, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '●' : ' ' }) }), _jsx(Box, { width: maxNameWidth, flexShrink: 0, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, wrap: "truncate", children: getExtensionDisplayName(extension, locale) }) }), _jsx(Box, { marginLeft: 2, width: maxStatusWidth + 2, flexShrink: 0, children: _jsxs(Text, { color: activeColor, children: ["(", activeString, ")"] }) }), stateText && _jsxs(Text, { color: stateColor, children: ["[", stateText, "]"] })] }), descLines.length > 0 && (_jsx(Box, { paddingLeft: 2, flexDirection: "column", children: descLines.map((line, i) => (_jsx(Text, { color: theme.text.secondary, children: line }, i))) }))] }, extension.name));
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.secondary, children: t('{{count}} extensions installed', {
                        count: extensions.length.toString(),
                    }) }) }), _jsx(Box, { flexDirection: "column", children: extensions.map((extension, index) => renderExtensionItem(extension, index, index === selectedIndex)) })] }));
};
//# sourceMappingURL=ExtensionListStep.js.map