/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
export const ShellFocusContext = createContext(true);
export const useShellFocusState = () => useContext(ShellFocusContext);
//# sourceMappingURL=ShellFocusContext.js.map