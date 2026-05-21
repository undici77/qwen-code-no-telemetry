/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { createContext, useContext } from 'react';
import {} from '../hooks/useKeypress.js';
import {} from '../IdeIntegrationNudge.js';
import {} from '../CommandFormatMigrationNudge.js';
import {} from '../components/FolderTrustDialog.js';
import {} from '@qwen-code/qwen-code-core';
import {} from '../../config/settings.js';
import {} from '../hooks/useArenaCommand.js';
export const UIActionsContext = createContext(null);
export const useUIActions = () => {
    const context = useContext(UIActionsContext);
    if (!context) {
        throw new Error('useUIActions must be used within a UIActionsProvider');
    }
    return context;
};
//# sourceMappingURL=UIActionsContext.js.map