import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync, } from 'node:fs';
import * as path from 'node:path';
import { Storage } from '@qwen-code/qwen-code-core';
function pidFilePath() {
    return path.join(Storage.getGlobalQwenDir(), 'channels', 'service.pid');
}
/** Check if a process is alive. */
function isProcessAlive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Read the PID file and return service info if the process is still alive.
 * Returns null if no file, invalid file, or stale (dead process).
 * Automatically cleans up stale PID files.
 */
export function readServiceInfo() {
    const filePath = pidFilePath();
    if (!existsSync(filePath))
        return null;
    let info;
    try {
        info = JSON.parse(readFileSync(filePath, 'utf-8'));
    }
    catch {
        // Corrupt file — clean up
        try {
            unlinkSync(filePath);
        }
        catch {
            // best-effort
        }
        return null;
    }
    if (!isProcessAlive(info.pid)) {
        // Stale PID — process is dead, clean up
        try {
            unlinkSync(filePath);
        }
        catch {
            // best-effort
        }
        return null;
    }
    return info;
}
/** Write PID file with current process info. */
export function writeServiceInfo(channels) {
    const filePath = pidFilePath();
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    const info = {
        pid: process.pid,
        startedAt: new Date().toISOString(),
        channels,
    };
    writeFileSync(filePath, JSON.stringify(info, null, 2), 'utf-8');
}
/** Delete the PID file. */
export function removeServiceInfo() {
    const filePath = pidFilePath();
    if (existsSync(filePath)) {
        try {
            unlinkSync(filePath);
        }
        catch {
            // best-effort
        }
    }
}
/**
 * Send a signal to the running service.
 * Returns true if signal was sent, false if process not found.
 */
export function signalService(pid, signal = 'SIGTERM') {
    try {
        process.kill(pid, signal);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Wait for a process to exit, polling at intervals.
 * Returns true if process exited, false if timeout.
 */
export async function waitForExit(pid, timeoutMs = 5000, pollMs = 200) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (!isProcessAlive(pid))
            return true;
        await new Promise((r) => setTimeout(r, pollMs));
    }
    return !isProcessAlive(pid);
}
//# sourceMappingURL=pidfile.js.map