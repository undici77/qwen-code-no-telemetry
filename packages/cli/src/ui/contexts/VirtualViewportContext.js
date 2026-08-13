/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
export const VirtualViewportContext = createContext(undefined);
export function useVirtualViewport(fallback) {
    return useContext(VirtualViewportContext) ?? fallback ?? false;
}
//# sourceMappingURL=VirtualViewportContext.js.map