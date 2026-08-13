/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { useDaemonWorkspaceEventSignals } from '../../session/DaemonSessionProvider.js';
import { useDaemonWorkspaceActions } from '../DaemonWorkspaceProvider.js';
import { useDaemonResource } from './useDaemonResource.js';
import { useWorkspaceEventReload } from './useWorkspaceEventReload.js';
export function useDaemonSettings(options = {}) {
    const workspaceActions = useDaemonWorkspaceActions();
    const load = useCallback(() => workspaceActions.loadSettingsStatus(), [workspaceActions]);
    const result = useDaemonResource(load, options);
    const signals = useDaemonWorkspaceEventSignals();
    useWorkspaceEventReload(signals?.settingsVersion, result.reload, options.autoLoad === true || result.data !== undefined);
    return {
        ...result,
        status: result.data,
        settings: result.data?.settings ?? [],
        setValue: workspaceActions.setWorkspaceSetting,
    };
}
//# sourceMappingURL=useDaemonSettings.js.map