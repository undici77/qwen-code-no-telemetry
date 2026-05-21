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
import { VISIBLE_TOOLS_COUNT } from '../constants.js';
export const ToolListStep = ({ tools, onSelect, onBack, }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    // 动态计算工具名称列的最大宽度（基于实际内容）
    const toolNameWidth = useMemo(() => {
        if (tools.length === 0)
            return 30;
        const maxLength = Math.max(...tools.map((t) => t.name.length));
        // 最小 30，最大 50，留一些余量
        return Math.min(Math.max(maxLength + 2, 30), 50);
    }, [tools]);
    // 计算可视区域的起始索引（滚动窗口）
    const scrollOffset = useMemo(() => {
        if (tools.length <= VISIBLE_TOOLS_COUNT) {
            return 0;
        }
        // 确保选中项在可视区域内
        if (selectedIndex < VISIBLE_TOOLS_COUNT - 1) {
            return 0;
        }
        return Math.min(selectedIndex - VISIBLE_TOOLS_COUNT + 1, tools.length - VISIBLE_TOOLS_COUNT);
    }, [selectedIndex, tools.length]);
    // 当前可视的工具列表
    const displayTools = useMemo(() => tools.slice(scrollOffset, scrollOffset + VISIBLE_TOOLS_COUNT), [tools, scrollOffset]);
    useKeypress((key) => {
        if (key.name === 'escape') {
            onBack();
        }
        else if (keyMatchers[Command.SELECTION_UP](key)) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
        else if (keyMatchers[Command.SELECTION_DOWN](key)) {
            setSelectedIndex((prev) => Math.min(tools.length - 1, prev + 1));
        }
        else if (key.name === 'return') {
            if (tools[selectedIndex]) {
                onSelect(tools[selectedIndex]);
            }
        }
    }, { isActive: true });
    if (tools.length === 0) {
        return (_jsx(Box, { flexDirection: "column", children: _jsx(Text, { color: theme.text.secondary, children: t('No tools available for this server.') }) }));
    }
    const getToolAnnotations = (tool) => {
        const hints = [];
        if (tool.annotations?.destructiveHint)
            hints.push(t('destructive'));
        if (tool.annotations?.readOnlyHint)
            hints.push(t('read-only'));
        if (tool.annotations?.openWorldHint)
            hints.push(t('open-world'));
        if (tool.annotations?.idempotentHint)
            hints.push(t('idempotent'));
        return hints.join(', ');
    };
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { flexDirection: "column", children: displayTools.map((tool, index) => {
                    const actualIndex = scrollOffset + index;
                    const isSelected = actualIndex === selectedIndex;
                    const annotations = getToolAnnotations(tool);
                    return (_jsxs(Box, { children: [_jsx(Box, { minWidth: 2, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, children: isSelected ? '❯' : ' ' }) }), _jsx(Box, { width: toolNameWidth, children: _jsx(Text, { color: isSelected ? theme.text.accent : theme.text.primary, wrap: "truncate", children: tool.name }) }), !tool.isValid && (_jsx(Text, { color: theme.status.warning, children: t('invalid: {{reason}}', {
                                    reason: tool.invalidReason || t('unknown'),
                                }) })), annotations && tool.isValid && (_jsx(Text, { color: theme.text.secondary, children: annotations }))] }, tool.name));
                }) }), tools.length > VISIBLE_TOOLS_COUNT && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.secondary, children: [scrollOffset > 0 ? '↑ ' : '  ', t('{{current}}/{{total}}', {
                            current: (selectedIndex + 1).toString(),
                            total: tools.length.toString(),
                        }), scrollOffset + VISIBLE_TOOLS_COUNT < tools.length ? ' ↓' : ''] }) }))] }));
};
//# sourceMappingURL=ToolListStep.js.map