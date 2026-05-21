import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
/**
 * Default noop implementation for platforms without message support
 */
const defaultContext = {
    platform: 'web',
    postMessage: () => { },
    onMessage: () => () => { },
};
/**
 * Platform context for accessing platform-specific capabilities
 */
export const PlatformContext = createContext(defaultContext);
/**
 * Hook to access platform context
 */
export function usePlatform() {
    return useContext(PlatformContext);
}
/**
 * Platform context provider component
 */
export function PlatformProvider({ children, value }) {
    return (_jsx(PlatformContext.Provider, { value: value, children: children }));
}
//# sourceMappingURL=PlatformContext.js.map