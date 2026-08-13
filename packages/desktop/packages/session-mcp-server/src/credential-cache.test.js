"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const credential_cache_1 = require("./credential-cache");
(0, bun_test_1.describe)('credential cache source slug validation', () => {
    (0, bun_test_1.it)('resolves valid source slugs under the workspace sources directory', () => {
        const workspaceRoot = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'credential-cache-'));
        (0, bun_test_1.expect)((0, credential_cache_1.getCredentialCachePath)(workspaceRoot, 'valid-source')).toBe((0, node_path_1.join)(workspaceRoot, 'sources', 'valid-source', '.credential-cache.json'));
    });
    (0, bun_test_1.it)('rejects traversal source slugs before constructing credential cache paths', () => {
        const workspaceRoot = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'credential-cache-'));
        (0, bun_test_1.expect)(() => (0, credential_cache_1.getCredentialCachePath)(workspaceRoot, '../sessions')).toThrow('Invalid source slug: "../sessions"');
    });
    (0, bun_test_1.it)('returns null for invalid source slugs instead of reading neighboring cache files', () => {
        const workspaceRoot = (0, node_fs_1.mkdtempSync)((0, node_path_1.join)((0, node_os_1.tmpdir)(), 'credential-cache-'));
        const sessionsDir = (0, node_path_1.join)(workspaceRoot, 'sessions');
        (0, node_fs_1.mkdirSync)(sessionsDir, { recursive: true });
        (0, node_fs_1.writeFileSync)((0, node_path_1.join)(sessionsDir, '.credential-cache.json'), JSON.stringify({ value: 'secret-token' }));
        (0, bun_test_1.expect)((0, credential_cache_1.readCredentialCache)(workspaceRoot, '../sessions')).toBeNull();
    });
});
//# sourceMappingURL=credential-cache.test.js.map