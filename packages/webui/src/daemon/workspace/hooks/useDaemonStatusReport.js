/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { useDaemonWorkspaceActions } from '../DaemonWorkspaceProvider.js';
import { useDaemonResource } from './useDaemonResource.js';
export function useDaemonStatusReport(options = {}) {
    const { detail = 'summary', ...resourceOptions } = options;
    const workspaceActions = useDaemonWorkspaceActions();
    const load = useCallback(() => workspaceActions.loadDaemonStatus(detail), [workspaceActions, detail]);
    const result = useDaemonResource(load, resourceOptions);
    return {
        ...result,
        report: result.data,
    };
}
//# sourceMappingURL=useDaemonStatusReport.js.map