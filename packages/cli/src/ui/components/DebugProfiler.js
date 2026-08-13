import { jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Text } from 'ink';
import { useEffect, useRef, useState } from 'react';
import { theme } from '../semantic-colors.js';
import { useKeypress } from '../hooks/useKeypress.js';
export const DebugProfiler = () => {
    const numRenders = useRef(0);
    const [showNumRenders, setShowNumRenders] = useState(false);
    useEffect(() => {
        numRenders.current++;
    });
    useKeypress((key) => {
        if (key.ctrl && key.name === 'b') {
            setShowNumRenders((prev) => !prev);
        }
    }, { isActive: true });
    if (!showNumRenders) {
        return null;
    }
    return (_jsxs(Text, { color: theme.status.warning, children: ["Renders: ", numRenders.current, " "] }));
};
//# sourceMappingURL=DebugProfiler.js.map