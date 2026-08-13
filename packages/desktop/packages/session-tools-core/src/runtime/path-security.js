import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { lstatSync, realpathSync } from 'node:fs';
function normalizePathForBoundary(path) {
    return process.platform === 'win32' ? path.toLowerCase() : path;
}
/**
 * Check whether targetPath is baseDir or a child path of baseDir.
 */
export function isPathInsideOrEqual(baseDir, targetPath) {
    const resolvedBase = normalizePathForBoundary(resolve(baseDir));
    const resolvedTarget = normalizePathForBoundary(resolve(targetPath));
    const relativePath = relative(resolvedBase, resolvedTarget);
    return (relativePath === '' ||
        (relativePath !== '..' &&
            !relativePath.startsWith(`..${sep}`) &&
            !isAbsolute(relativePath)));
}
function pathEntryExists(path) {
    try {
        lstatSync(path);
        return true;
    }
    catch (error) {
        const code = error && typeof error === 'object'
            ? error.code
            : undefined;
        return code !== 'ENOENT' && code !== 'ENOTDIR';
    }
}
function realpathOrNull(path) {
    try {
        return realpathSync.native(path);
    }
    catch {
        return null;
    }
}
function realpathIfEntryExists(path) {
    return pathEntryExists(path) ? realpathOrNull(path) : resolve(path);
}
/**
 * Lexical + symlink-aware containment check for existing paths.
 */
export function isPathWithinDirectory(targetPath, baseDir) {
    const resolvedTarget = resolve(targetPath);
    const resolvedBase = resolve(baseDir);
    if (!isPathInsideOrEqual(resolvedBase, resolvedTarget)) {
        return false;
    }
    const realBase = realpathIfEntryExists(resolvedBase);
    const realTarget = realpathIfEntryExists(resolvedTarget);
    if (!realBase || !realTarget) {
        return false;
    }
    return isPathInsideOrEqual(realBase, realTarget);
}
/**
 * Containment check for output/creation paths.
 *
 * Prevents symlink escapes by validating the nearest existing ancestor's real path.
 */
export function isPathWithinDirectoryForCreation(targetPath, baseDir) {
    const resolvedTarget = resolve(targetPath);
    const resolvedBase = resolve(baseDir);
    if (!isPathInsideOrEqual(resolvedBase, resolvedTarget)) {
        return false;
    }
    const realBase = realpathIfEntryExists(resolvedBase);
    if (!realBase) {
        return false;
    }
    if (pathEntryExists(resolvedTarget)) {
        return isPathWithinDirectory(resolvedTarget, resolvedBase);
    }
    let current = dirname(resolvedTarget);
    while (true) {
        if (pathEntryExists(current)) {
            const realCurrent = realpathOrNull(current);
            return !!realCurrent && isPathInsideOrEqual(realBase, realCurrent);
        }
        const parent = dirname(current);
        if (parent === current) {
            return false;
        }
        current = parent;
    }
}
//# sourceMappingURL=path-security.js.map