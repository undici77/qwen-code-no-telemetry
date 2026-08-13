/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
const RenderModeContext = React.createContext({
    renderMode: 'render',
    setRenderMode: () => undefined,
});
export const RenderModeProvider = RenderModeContext.Provider;
export function useRenderMode() {
    return React.useContext(RenderModeContext);
}
//# sourceMappingURL=RenderModeContext.js.map