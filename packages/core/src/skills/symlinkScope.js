/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'fs/promises';
/**
 * Validate that a symlink at `skillDir` (a) resolves and (b) targets a
 * directory. The target is allowed to live anywhere on disk.
 *
 * Used by both `skill-load.ts` (extension parser) and `skill-manager.ts`
 * (project/user/bundled parser) so the two paths stay in sync.
 */
export async function validateSymlinkTarget(skillDir) {
    let realPath;
    try {
        realPath = await fs.realpath(skillDir);
    }
    catch (error) {
        return { ok: false, reason: 'invalid', error };
    }
    let targetStat;
    try {
        targetStat = await fs.stat(realPath);
    }
    catch (error) {
        return { ok: false, reason: 'invalid', error };
    }
    if (!targetStat.isDirectory()) {
        return { ok: false, reason: 'not-directory' };
    }
    return { ok: true, realPath };
}
//# sourceMappingURL=symlinkScope.js.map