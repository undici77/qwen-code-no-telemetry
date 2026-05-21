/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
import {} from '../hooks/useHistoryManager.js';
import {} from './UIActionsContext.js';
import {} from '../hooks/useIdeTrustListener.js';
import {} from '../hooks/useProviderUpdates.js';
import {} from '../hooks/useArenaCommand.js';
export const UIStateContext = createContext(null);
export const useUIState = () => {
    const context = useContext(UIStateContext);
    if (!context) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};
//# sourceMappingURL=UIStateContext.js.map