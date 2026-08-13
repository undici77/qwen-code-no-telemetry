import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
function existsOnPath(binary) {
    const checker = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(checker, [binary], { stdio: 'ignore' });
    return result.status === 0;
}
let sandboxExecUsableCache = null;
function canUseSandboxExec() {
    if (sandboxExecUsableCache !== null)
        return sandboxExecUsableCache;
    if (!existsOnPath('sandbox-exec')) {
        sandboxExecUsableCache = false;
        return false;
    }
    const probe = spawnSync('sandbox-exec', ['-p', '(version 1) (allow default)', '/usr/bin/true'], { stdio: 'ignore' });
    sandboxExecUsableCache = probe.status === 0;
    return sandboxExecUsableCache;
}
function escapeSandboxPath(path) {
    return path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
function sandboxWriteRoots(sessionDir) {
    const resolved = resolve(sessionDir);
    try {
        const real = realpathSync.native(resolved);
        return real === resolved ? [resolved] : [resolved, real];
    }
    catch {
        return [resolved];
    }
}
export function buildDarwinSandboxProfile(sessionDir, options) {
    const writeAllows = sandboxWriteRoots(sessionDir).map((root) => `(allow file-write* (subpath "${escapeSandboxPath(root)}"))`);
    const profileParts = [
        '(version 1)',
        '(deny default)',
        '(allow process*)',
        '(allow sysctl-read)',
        '(allow file-read*)',
        '(deny file-write*)',
        ...writeAllows,
    ];
    if (options?.includeNetworkDeny) {
        profileParts.push('(deny network*)');
    }
    return profileParts.join(' ');
}
/**
 * Wrap command execution to deny writes outside the current session directory.
 *
 * Current support:
 * - macOS: sandbox-exec profile
 * - Linux: bubblewrap
 * - others: unavailable (fail-safe for script_sandbox)
 */
export function applyFilesystemIsolation(command, args, sessionDir, options) {
    const sessionRoot = resolve(sessionDir);
    if (process.platform === 'darwin' && canUseSandboxExec()) {
        const profile = buildDarwinSandboxProfile(sessionRoot, options);
        return {
            status: 'enforced',
            backend: 'sandbox-exec',
            command: 'sandbox-exec',
            args: ['-p', profile, command, ...args],
        };
    }
    if (process.platform === 'linux') {
        if (existsOnPath('bwrap')) {
            // Read-only root + writable bind mount for the session subtree.
            // This limits writes to sessionRoot while preserving runtime/library access.
            const namespaceArgs = [];
            if (options?.isolateIpc) {
                namespaceArgs.push('--unshare-ipc');
            }
            if (options?.includeNetworkDeny) {
                namespaceArgs.push('--unshare-net');
            }
            return {
                status: 'enforced',
                backend: 'bwrap',
                command: 'bwrap',
                args: [
                    '--die-with-parent',
                    ...namespaceArgs,
                    '--ro-bind',
                    '/',
                    '/',
                    '--bind',
                    sessionRoot,
                    sessionRoot,
                    '--proc',
                    '/proc',
                    '--dev',
                    '/dev',
                    '--',
                    command,
                    ...args,
                ],
            };
        }
        // firejail --private only affects $HOME, so it cannot provide the same
        // write containment as bwrap's read-only root with one writable bind.
    }
    return {
        status: 'unavailable',
        backend: 'none',
        command,
        args,
    };
}
//# sourceMappingURL=filesystem-isolation.js.map