/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
const EMPTY_IDS = new Set();
const ThoughtExpandedContext = createContext({
    allExpanded: false,
    expandedHeadIds: EMPTY_IDS,
    toggle: () => { },
});
export const useThoughtExpanded = () => useContext(ThoughtExpandedContext);
export const ThoughtExpandedProvider = ThoughtExpandedContext.Provider;
//# sourceMappingURL=ThoughtExpandedContext.js.map