/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useDaemonWorkspaceActions } from '../DaemonWorkspaceProvider.js';
export function useDaemonFiles() {
    const actions = useDaemonWorkspaceActions();
    return {
        glob: actions.globWorkspace,
        globWorkspace: actions.globWorkspace,
        readFileBytes: actions.readFileBytes,
        writeFile: actions.writeFile,
        editFile: actions.editFile,
        stat: actions.stat,
        listDirectory: actions.listDirectory,
    };
}
//# sourceMappingURL=useDaemonFiles.js.map