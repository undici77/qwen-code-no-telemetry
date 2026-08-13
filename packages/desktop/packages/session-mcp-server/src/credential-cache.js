"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentialCachePath = getCredentialCachePath;
exports.readCredentialCache = readCredentialCache;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const session_tools_core_1 = require("@craft-agent/session-tools-core");
/**
 * Get the path to a source's credential cache file.
 * The main process writes decrypted credentials to these files.
 */
function getCredentialCachePath(workspaceRootPath, sourceSlug) {
    (0, session_tools_core_1.assertValidSourceSlug)(sourceSlug);
    return (0, node_path_1.join)(workspaceRootPath, 'sources', sourceSlug, '.credential-cache.json');
}
/**
 * Read credentials from the cache file for a source.
 * Returns null if the cache doesn't exist, the slug is invalid, or the cache is expired.
 */
function readCredentialCache(workspaceRootPath, sourceSlug) {
    try {
        const cachePath = getCredentialCachePath(workspaceRootPath, sourceSlug);
        if (!(0, node_fs_1.existsSync)(cachePath)) {
            return null;
        }
        const content = (0, node_fs_1.readFileSync)(cachePath, 'utf-8');
        const cache = JSON.parse(content);
        if (cache.expiresAt && Date.now() > cache.expiresAt) {
            return null;
        }
        return cache.value || null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=credential-cache.js.map