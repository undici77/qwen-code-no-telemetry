/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback } from 'react';
import { useDaemonWorkspaceActions } from '../DaemonWorkspaceProvider.js';
import { useDaemonResource } from './useDaemonResource.js';
export function useDaemonSkills(options = {}) {
    const workspaceActions = useDaemonWorkspaceActions();
    const load = useCallback(() => workspaceActions.loadSkillsStatus(), [workspaceActions]);
    const result = useDaemonResource(load, options);
    return {
        ...result,
        status: result.data,
        skills: result.data?.skills ?? [],
        setEnabled: workspaceActions.setWorkspaceSkillEnabled,
        install: workspaceActions.installWorkspaceSkill,
        remove: workspaceActions.deleteWorkspaceSkill,
    };
}
//# sourceMappingURL=useDaemonSkills.js.map