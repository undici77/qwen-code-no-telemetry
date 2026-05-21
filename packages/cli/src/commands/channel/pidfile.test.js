import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { homedir } from 'node:os';
import { join } from 'node:path';
// vi.hoisted runs before vi.mock hoisting, so fsStore is available in the factory
const fsStore = vi.hoisted(() => {
    const store = {};
    return store;
});
vi.mock('node:fs', () => {
    const mock = {
        existsSync: (p) => p in fsStore,
        readFileSync: (p) => {
            if (!(p in fsStore))
                throw new Error('ENOENT');
            return fsStore[p];
        },
        writeFileSync: (p, data) => {
            fsStore[p] = data;
        },
        mkdirSync: () => { },
        unlinkSync: (p) => {
            delete fsStore[p];
        },
    };
    return { ...mock, default: mock };
});
import { readServiceInfo, writeServiceInfo, removeServiceInfo, signalService, waitForExit, } from './pidfile.js';
// We need to mock process.kill for isProcessAlive / signalService
const originalKill = process.kill;
function getPidFilePath() {
    return join(homedir(), '.qwen', 'channels', 'service.pid');
}
beforeEach(() => {
    for (const k of Object.keys(fsStore))
        delete fsStore[k];
});
afterEach(() => {
    process.kill = originalKill;
});
describe('writeServiceInfo + readServiceInfo', () => {
    it('writes and reads back service info for a live process', () => {
        // Mock process.kill(pid, 0) to indicate alive
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        process.kill = vi.fn(() => true);
        writeServiceInfo(['telegram', 'dingtalk']);
        const info = readServiceInfo();
        expect(info).not.toBeNull();
        expect(info.pid).toBe(process.pid);
        expect(info.channels).toEqual(['telegram', 'dingtalk']);
        expect(info.startedAt).toBeTruthy();
    });
    it('returns null when no PID file exists', () => {
        const info = readServiceInfo();
        expect(info).toBeNull();
    });
    it('cleans up and returns null for corrupt PID file', () => {
        const filePath = getPidFilePath();
        fsStore[filePath] = 'not-json!!!';
        const info = readServiceInfo();
        expect(info).toBeNull();
        // File should be cleaned up
        expect(filePath in fsStore).toBe(false);
    });
    it('cleans up and returns null for stale PID (dead process)', () => {
        // First write with alive process
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        process.kill = vi.fn(() => true);
        writeServiceInfo(['telegram']);
        // Now simulate dead process
        process.kill = vi.fn(() => {
            throw new Error('ESRCH');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        });
        const info = readServiceInfo();
        expect(info).toBeNull();
    });
});
describe('removeServiceInfo', () => {
    it('removes existing PID file', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        process.kill = vi.fn(() => true);
        writeServiceInfo(['test']);
        removeServiceInfo();
        const info = readServiceInfo();
        expect(info).toBeNull();
    });
    it('is a no-op when no PID file exists', () => {
        expect(() => removeServiceInfo()).not.toThrow();
    });
});
describe('signalService', () => {
    it('returns true when signal is delivered', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        process.kill = vi.fn(() => true);
        expect(signalService(1234, 'SIGTERM')).toBe(true);
        expect(process.kill).toHaveBeenCalledWith(1234, 'SIGTERM');
    });
    it('returns false when process is not found', () => {
        process.kill = vi.fn(() => {
            throw new Error('ESRCH');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        });
        expect(signalService(9999)).toBe(false);
    });
    it('defaults to SIGTERM', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        process.kill = vi.fn(() => true);
        signalService(1234);
        expect(process.kill).toHaveBeenCalledWith(1234, 'SIGTERM');
    });
});
describe('waitForExit', () => {
    it('returns true immediately if process is already dead', async () => {
        process.kill = vi.fn(() => {
            throw new Error('ESRCH');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        });
        const result = await waitForExit(9999, 1000, 50);
        expect(result).toBe(true);
    });
    it('returns true when process dies within timeout', async () => {
        let alive = true;
        process.kill = vi.fn(() => {
            if (!alive)
                throw new Error('ESRCH');
            return true;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        });
        // Kill after 100ms
        setTimeout(() => {
            alive = false;
        }, 100);
        const result = await waitForExit(1234, 2000, 50);
        expect(result).toBe(true);
    });
    it('returns false on timeout when process stays alive', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        process.kill = vi.fn(() => true);
        const result = await waitForExit(1234, 150, 50);
        expect(result).toBe(false);
    });
});
//# sourceMappingURL=pidfile.test.js.map