export interface ServiceInfo {
    pid: number;
    startedAt: string;
    channels: string[];
}
/**
 * Read the PID file and return service info if the process is still alive.
 * Returns null if no file, invalid file, or stale (dead process).
 * Automatically cleans up stale PID files.
 */
export declare function readServiceInfo(): ServiceInfo | null;
/** Write PID file with current process info. */
export declare function writeServiceInfo(channels: string[]): void;
/** Delete the PID file. */
export declare function removeServiceInfo(): void;
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
