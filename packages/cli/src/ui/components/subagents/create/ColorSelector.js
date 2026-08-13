import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import {} from '../types.js';
import { theme } from '../../../semantic-colors.js';
import { COLOR_OPTIONS } from '../constants.js';
const colorOptions = COLOR_OPTIONS;
/**
 * Color selection with preview.
 */
export function ColorSelector({ color = 'auto', agentName = 'Agent', onSelect, }) {
    const [selectedColor, setSelectedColor] = useState(color);
    // Update selected color when color prop changes
    useEffect(() => {
        setSelectedColor(color);
    }, [color]);
    const handleSelect = (selectedValue) => {
        const colorOption = colorOptions.find((option) => option.id === selectedValue);
        if (colorOption) {
            onSelect(colorOption.name);
        }
    };
    const handleHighlight = (selectedValue) => {
        const colorOption = colorOptions.find((option) => option.id === selectedValue);
        if (colorOption) {
            setSelectedColor(colorOption.name);
        }
    };
    const currentColor = colorOptions.find((option) => option.name === selectedColor) ||
        colorOptions[0];
    return (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsx(Box, { flexDirection: "column", children: _jsx(RadioButtonSelect, { items: colorOptions.map((option) => ({
                        key: option.id,
                        label: option.name,
                        value: option.id,
                    })), initialIndex: colorOptions.findIndex((opt) => opt.id === currentColor.id), onSelect: handleSelect, onHighlight: handleHighlight, isFocused: true }) }), _jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: theme.text.secondary, children: "Preview:" }), _jsx(Box, { marginLeft: 2, children: _jsx(Text, { color: currentColor.value, children: ` ${agentName} ` }) })] })] }));
}
//# sourceMappingURL=ColorSelector.js.map