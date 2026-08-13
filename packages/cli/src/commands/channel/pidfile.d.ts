export interface ServiceInfoWorker {
    workspaceId?: string;
    workspaceCwd?: string;
    channels: string[];
    workerPid?: number;
}
export interface ServiceInfo {
    owner: 'channel' | 'serve';
    pid: number;
    startedAt: string;
    channels: string[];
    servePid?: number;
    workerPid?: number;
    /**
     * Per-workspace channel workers for a multi-workspace `qwen serve`. Additive
     * to the single-worker `channels` / `workerPid` fields, which stay populated
     * (union of channels; primary worker pid) for older readers.
     */
    workers?: ServiceInfoWorker[];
}
/**
 * Read the PID file and return service info if the process is still alive.
 * Returns null if no file, invalid file, or stale (dead process).
 * Automatically cleans up stale PID files.
 */
export declare function readServiceInfo(): ServiceInfo | null;
/** Write PID file with current standalone channel process info. */
export declare function writeServiceInfo(channels: string[]): void;
export declare function writeServeServiceInfo({ channels, servePid, workerPid, workers, }: {
    channels: string[];
    servePid?: number;
    workerPid?: number;
    workers?: ServiceInfoWorker[];
}): void;
export declare function reserveServeServiceInfo({ channels, servePid, }: {
    channels: string[];
    servePid?: number;
}): void;
/** Delete the PID file. */
export declare function removeServiceInfo(): void;
export declare function removeServeServiceInfo(servePid?: number): boolean;
/**
 * Send a signal to the running service.
 * Returns true if signal was sent, false if process not found.
 */
export declare function signalService(pid: number, signal?: NodeJS.Signals): boolean;
/**
 * Wait for a process to exit, polling at intervals.
 * Returns true if process exited, false if timeout.
 */
export declare function waitForExit(pid: number, timeoutMs?: number, pollMs?: number): Promise<boolean>;
