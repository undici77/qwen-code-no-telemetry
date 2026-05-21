/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
const VerboseModeContext = createContext({
    verboseMode: true,
    frozenSnapshot: null,
});
export const useVerboseMode = () => useContext(VerboseModeContext);
export const VerboseModeProvider = VerboseModeContext.Provider;
//# sourceMappingURL=VerboseModeContext.js.map