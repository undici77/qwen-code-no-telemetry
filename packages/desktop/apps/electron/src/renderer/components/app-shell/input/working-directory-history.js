import * as storage from '@/lib/local-storage';
export const MAX_RECENT_WORKING_DIRS = 25;
/**
 * Add a directory path to recent history.
 * - Deduplicates existing entries
 * - Inserts at top
 * - Caps list length
 */
export function addPathToRecentWorkingDirs(recentDirs, path, maxEntries = MAX_RECENT_WORKING_DIRS) {
    const normalized = path.trim();
    if (!normalized)
        return [...recentDirs];
    const filtered = recentDirs.filter(p => p !== normalized);
    return [normalized, ...filtered].slice(0, maxEntries);
}
/** Remove a directory path from recent history. */
export function removePathFromRecentWorkingDirs(recentDirs, path) {
    const normalized = path.trim();
    if (!normalized)
        return [...recentDirs];
    return recentDirs.filter(p => p !== normalized);
}
/**
 * Normalize a directory history list:
 * - Trims entries
 * - Drops empty values
 * - Deduplicates while preserving first-seen order
 * - Caps length
 */
export function normalizeRecentWorkingDirs(paths, maxEntries = MAX_RECENT_WORKING_DIRS) {
    const unique = [];
    const seen = new Set();
    for (const value of paths) {
        const normalized = value.trim();
        if (!normalized || seen.has(normalized))
            continue;
        seen.add(normalized);
        unique.push(normalized);
        if (unique.length >= maxEntries)
            break;
    }
    return unique;
}
/** Read recent working directories from local storage (workspace-scoped when workspaceId provided). */
export function getRecentWorkingDirs(workspaceId) {
    return storage.get(storage.KEYS.recentWorkingDirs, [], workspaceId);
}
/** Persist a full recent working directory list. */
export function setRecentWorkingDirs(paths, workspaceId) {
    const normalized = normalizeRecentWorkingDirs(paths);
    storage.set(storage.KEYS.recentWorkingDirs, normalized, workspaceId);
    return normalized;
}
/** Add one path to recent working directory history and persist. */
export function addRecentWorkingDir(path, workspaceId) {
    const updated = addPathToRecentWorkingDirs(getRecentWorkingDirs(workspaceId), path);
    storage.set(storage.KEYS.recentWorkingDirs, updated, workspaceId);
    return updated;
}
/** Remove one path from recent working directory history and persist. */
export function removeRecentWorkingDir(path, workspaceId) {
    const updated = removePathFromRecentWorkingDirs(getRecentWorkingDirs(workspaceId), path);
    storage.set(storage.KEYS.recentWorkingDirs, updated, workspaceId);
    return updated;
}
//# sourceMappingURL=working-directory-history.js.map