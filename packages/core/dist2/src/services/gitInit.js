/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export async function initRepositoryWithMainBranch(git) {
    await git.init(false);
    await git.raw(['symbolic-ref', 'HEAD', 'refs/heads/main']);
}
//# sourceMappingURL=gitInit.js.map