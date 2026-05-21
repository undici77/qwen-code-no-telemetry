import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useMemo, useEffect } from 'react';
import { Box, Text } from 'ink';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import { Kind } from '@qwen-code/qwen-code-core';
import { theme } from '../../../semantic-colors.js';
import { t } from '../../../../i18n/index.js';
/**
 * Tool selection with categories.
 */
export function ToolSelector({ tools = [], onSelect, config, }) {
    // Generate tool categories from actual tool registry
    const { toolCategories, readTools, editTools, executeTools, initialCategory, } = useMemo(() => {
        if (!config) {
            // Fallback categories if config not available
            return {
                toolCategories: [
                    {
                        id: 'all',
                        name: t('All Tools (Default)'),
                        tools: [],
                    },
                ],
                readTools: [],
                editTools: [],
                executeTools: [],
                initialCategory: 'all',
            };
        }
        const toolRegistry = config.getToolRegistry();
        const allTools = toolRegistry.getAllTools();
        // Categorize tools by Kind
        const readTools = allTools
            .filter((tool) => tool.kind === Kind.Read ||
            tool.kind === Kind.Search ||
            tool.kind === Kind.Fetch ||
            tool.kind === Kind.Think)
            .map((tool) => tool.displayName)
            .sort();
        const editTools = allTools
            .filter((tool) => tool.kind === Kind.Edit ||
            tool.kind === Kind.Delete ||
            tool.kind === Kind.Move)
            .map((tool) => tool.displayName)
            .sort();
        const executeTools = allTools
            .filter((tool) => tool.kind === Kind.Execute)
            .map((tool) => tool.displayName)
            .sort();
        const toolCategories = [
            {
                id: 'all',
                name: t('All Tools'),
                tools: [],
            },
            {
                id: 'read',
                name: t('Read-only Tools'),
                tools: readTools,
            },
            {
                id: 'edit',
                name: t('Read & Edit Tools'),
                tools: [...readTools, ...editTools],
            },
            {
                id: 'execute',
                name: t('Read & Edit & Execution Tools'),
                tools: [...readTools, ...editTools, ...executeTools],
            },
        ].filter((category) => category.id === 'all' || category.tools.length > 0);
        // Determine initial category based on tools prop
        let initialCategory = 'all'; // default to first option
        if (tools.length === 0) {
            // Empty array represents all tools
            initialCategory = 'all';
        }
        else {
            // Try to match tools array to a category
            const matchingCategory = toolCategories.find((category) => {
                if (category.id === 'all')
                    return false;
                // Check if the tools array exactly matches this category's tools
                const categoryToolsSet = new Set(category.tools);
                const inputToolsSet = new Set(tools);
                return (categoryToolsSet.size === inputToolsSet.size &&
                    [...categoryToolsSet].every((tool) => inputToolsSet.has(tool)));
            });
            if (matchingCategory) {
                initialCategory = matchingCategory.id;
            }
            // If no exact match found, keep default 'all'
        }
        return {
            toolCategories,
            readTools,
            editTools,
            executeTools,
            initialCategory,
        };
    }, [config, tools]);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    // Update selected category when initialCategory changes (when tools prop changes)
    useEffect(() => {
        setSelectedCategory(initialCategory);
    }, [initialCategory]);
    const toolOptions = toolCategories.map((category) => ({
        label: category.name,
        value: category.id,
        category,
    }));
    const handleHighlight = (selectedValue) => {
        setSelectedCategory(selectedValue);
    };
    const handleSelect = (selectedValue) => {
        const category = toolCategories.find((cat) => cat.id === selectedValue);
        if (category) {
            if (category.id === 'all') {
                onSelect([]); // Empty array for 'all'
            }
            else {
                onSelect(category.tools);
            }
        }
    };
    // Get the currently selected category for displaying tools
    const currentCategory = toolCategories.find((cat) => cat.id === selectedCategory);
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Box, { flexDirection: "column", children: _jsx(RadioButtonSelect, { items: toolOptions.map((option) => ({
                        key: option.value,
                        label: option.label,
                        value: option.value,
                    })), initialIndex: toolOptions.findIndex((opt) => opt.value === selectedCategory), onSelect: handleSelect, onHighlight: handleHighlight, isFocused: true }) }), currentCategory && (_jsx(Box, { flexDirection: "column", children: currentCategory.id === 'all' ? (_jsx(Text, { color: theme.text.secondary, children: t('All tools selected, including MCP tools') })) : currentCategory.tools.length > 0 ? (_jsxs(_Fragment, { children: [_jsx(Text, { color: theme.text.secondary, children: t('Selected tools:') }), _jsx(Box, { flexDirection: "column", marginLeft: 2, children: (() => {
                                // Filter the already categorized tools to show only those in current category
                                const categoryReadTools = currentCategory.tools.filter((tool) => readTools.includes(tool));
                                const categoryEditTools = currentCategory.tools.filter((tool) => editTools.includes(tool));
                                const categoryExecuteTools = currentCategory.tools.filter((tool) => executeTools.includes(tool));
                                return (_jsxs(_Fragment, { children: [categoryReadTools.length > 0 && (_jsxs(Text, { color: theme.text.secondary, children: ["\u2022 ", t('Read-only tools:'), ' ', categoryReadTools.join(', ')] })), categoryEditTools.length > 0 && (_jsxs(Text, { color: theme.text.secondary, children: ["\u2022 ", t('Edit tools:'), " ", categoryEditTools.join(', ')] })), categoryExecuteTools.length > 0 && (_jsxs(Text, { color: theme.text.secondary, children: ["\u2022 ", t('Execution tools:'), ' ', categoryExecuteTools.join(', ')] }))] }));
                            })() })] })) : null }))] }));
}
//# sourceMappingURL=ToolSelector.js.map