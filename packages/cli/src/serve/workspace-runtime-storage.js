/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionService, Storage, } from '@qwen-code/qwen-code-core';
export function runWithWorkspaceRuntimeStorage(runtime, fn) {
    return Storage.runWithResolvedRuntimeBaseDir(runtime.sessionRuntimeBaseDir, fn);
}
export function createWorkspaceRuntimeSessionService(runtime, options = {}) {
    return new SessionService(runtime.workspaceCwd, {
        ...options,
        runtimeBaseDir: runtime.sessionRuntimeBaseDir,
    });
}
//# sourceMappingURL=workspace-runtime-storage.js.map