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
import { VISIBLE_RESOURCES_COUNT } from '../constants.js';
/** Friendly label for a resource (title preferred, then name), only when it
 * adds information beyond the URI that is already shown. */
const getResourceLabel = (resource) => {
    const label = resource.title || resource.name;
    if (!label || label === resource.uri)
        return undefined;
    return label;
};
export const ResourceListStep = ({ resources, onSelect, onBack, isActive = true, }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    // 动态计算 URI 列的最大宽度（基于实际内容）。URI 是用户实际要输入的内容，
    // 因此给它更宽的列（最小 30，最大 60）。
    const uriWidth = useMemo(() => {
        if (resources.length === 0)
            return 30;
        const maxLength = Math.max(...resources.map((r) => r.uri.length));
        return Math.min(Math.max(maxLength + 2, 30), 60);
    }, [resources]);
    // 计算可视区域的起始索引（滚动窗口）
    const scrollOffset = useMemo(() => {
        if (resources.length <= VISIBLE_RESOURCES_COUNT) {
            return 0;
        }
        // 确保选中项在可视区域内
        if (selectedIndex < VISIBLE_RESOURCES_COUNT - 1) {
            return 0;
        }
        return Math.min(selectedIndex - VISIBLE_RESOURCES_COUNT + 1, resources.length - VISIBLE_RESOURCES_COUNT);
    }, [selectedIndex, resources.length]);
    // 当前可视的资源列表
    const displayResources = useMemo(() => resources.slice(scrollOffset, scrollOffset + VISIBLE_RESOURCES_COUNT), [resources, scrollOffset]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
        }
        else if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => Math.min(resources.length - 1, prev + 1));
        }
        else if (key.name === 'return') {
            if (resources[selectedIndex]) {
                onSelect(resources[selectedIndex]);
            }
        }
    }, { isActive });
    if (resources.length === 0) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(Text, { color: theme.text.secondary, children: t('No resources available for this server.') }) }));
    }
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { flexDirection: "column", children: displayResources.map((resource, index) => {
                    const actualIndex = scrollOffset + index;
                    const isSelected = actualIndex === selectedIndex;
                    const label = getResourceLabel(resource);
                    return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Box, { width: uriWidth, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, wrap: "truncate", children: resource.uri }) }), label && (_jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: label }))] }, resource.uri));
                }) }), resources.length > VISIBLE_RESOURCES_COUNT && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.secondary, children: [scrollOffset > 0 ? '↑ ' : '  ', t('{{current}}/{{total}}', {
                            current: (selectedIndex + 1).toString(),
                            total: resources.length.toString(),
                        }), scrollOffset + VISIBLE_RESOURCES_COUNT < resources.length
                            ? ' ↓'
                            : ''] }) }))] }));
};
//# sourceMappingURL=ResourceListStep.js.map