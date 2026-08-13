/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export function isWithinRoot(childPath, parentPath) {
    const relativePath = path.relative(parentPath, childPath);
    return (relativePath === '' ||
        (!relativePath.startsWith(`..${path.sep}`) &&
            relativePath !== '..' &&
            !path.isAbsolute(relativePath)));
}
export function getPathComparisonVariants(rawPath) {
    const variants = new Set([path.normalize(path.resolve(rawPath))]);
    try {
        variants.add(path.normalize(fs.realpathSync(rawPath)));
    }
    catch {
        // Non-existent paths still compare by their resolved lexical form.
    }
    return variants;
}
export function arePathsEquivalent(left, right) {
    const rightVariants = getPathComparisonVariants(right);
    for (const leftVariant of getPathComparisonVariants(left)) {
        if (rightVariants.has(leftVariant)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=path-comparison.js.map