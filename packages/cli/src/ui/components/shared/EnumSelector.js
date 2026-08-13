import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Colors } from '../../colors.js';
/**
 * A left-right scrolling selector for enum values
 */
export function EnumSelector({ options, currentValue, isActive, onValueChange: _onValueChange, }) {
    const [currentIndex, setCurrentIndex] = useState(() => {
        // Guard against empty options array
        if (!options || options.length === 0) {
            return 0;
        }
        const index = options.findIndex((option) => option.value === currentValue);
        return index >= 0 ? index : 0;
    });
    // Update index when currentValue changes externally
    useEffect(() => {
        // Guard against empty options array
        if (!options || options.length === 0) {
            return;
        }
        const index = options.findIndex((option) => option.value === currentValue);
        // Always update index, defaulting to 0 if value not found
        setCurrentIndex(index >= 0 ? index : 0);
    }, [currentValue, options]);
    // Guard against empty options array
    if (!options || options.length === 0) {
        return _jsx(Box, {});
    }
    // Left/right navigation is handled by parent component
    // This component is purely for display
    // onValueChange is kept for interface compatibility but not used internally
    const currentOption = options[currentIndex] || options[0];
    const canScrollLeft = options.length > 1;
    const canScrollRight = options.length > 1;
    return (_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: isActive && canScrollLeft ? Colors.AccentGreen : Colors.Gray, children: canScrollLeft ? '←' : ' ' }), _jsx(Text, { children: " " }), _jsx(Text, { color: isActive ? Colors.AccentGreen : Colors.Foreground, bold: isActive, children: currentOption.label }), _jsx(Text, { children: " " }), _jsx(Text, { color: isActive && canScrollRight ? Colors.AccentGreen : Colors.Gray, children: canScrollRight ? '→' : ' ' })] }));
}
//# sourceMappingURL=EnumSelector.js.map