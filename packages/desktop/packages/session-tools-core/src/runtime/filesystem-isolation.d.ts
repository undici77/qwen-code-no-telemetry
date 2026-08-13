export interface FilesystemIsolationPlan {
    status: 'enforced' | 'unavailable';
    backend: 'sandbox-exec' | 'bwrap' | 'firejail' | 'none';
    command: string;
    args: string[];
}
export interface FilesystemIsolationOptions {
    includeNetworkDeny?: boolean;
    isolateIpc?: boolean;
}
export declare function buildDarwinSandboxProfile(sessionDir: string, options?: FilesystemIsolationOptions): string;
/**
 * Wrap command execution to deny writes outside the current session directory.
 *
 * Current support:
 * - macOS: sandbox-exec profile
 * - Linux: bubblewrap
 * - others: unavailable (fail-safe for script_sandbox)
 */
export declare function applyFilesystemIsolation(command: string, args: string[], sessionDir: string, options?: FilesystemIsolationOptions): FilesystemIsolationPlan;
