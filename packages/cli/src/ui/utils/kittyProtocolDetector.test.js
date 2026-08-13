/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
function installMockStreams() {
    const stdin = new EventEmitter();
    stdin.isTTY = true;
    stdin.isRaw = false;
    stdin.setRawMode = (raw) => {
        stdin.isRaw = raw;
    };
    const writes = [];
    vi.spyOn(process.stdout, 'write').mockImplementation(((chunk) => {
        writes.push(String(chunk));
        return true;
    }));
    Object.defineProperty(process, 'stdin', {
        value: stdin,
        configurable: true,
    });
    Object.defineProperty(process.stdout, 'isTTY', {
        value: true,
        configurable: true,
    });
    return { stdin, writes };
}
const KITTY_PUSH = '\x1b[>1u';
describe('kittyProtocolDetector', () => {
    const realStdin = process.stdin;
    const realStdoutIsTTY = process.stdout.isTTY;
    beforeEach(() => {
        vi.resetModules();
    });
    afterEach(() => {
        vi.restoreAllMocks();
        Object.defineProperty(process, 'stdin', {
            value: realStdin,
            configurable: true,
        });
        Object.defineProperty(process.stdout, 'isTTY', {
            value: realStdoutIsTTY,
            configurable: true,
        });
    });
    async function detectWithSupport(stdin) {
        const mod = await import('./kittyProtocolDetector.js');
        const promise = mod.detectAndEnableKittyProtocol();
        // Progressive-enhancement reply (CSI ? <flags> u) then device attributes
        // (CSI ? <attrs> c) — the pair the detector waits for to enable.
        stdin.emit('data', Buffer.from('\x1b[?1u'));
        stdin.emit('data', Buffer.from('\x1b[?62;c'));
        await promise;
        return mod;
    }
    it('pushes the enable sequence when the terminal supports the protocol', async () => {
        const { stdin, writes } = installMockStreams();
        const mod = await detectWithSupport(stdin);
        expect(mod.isKittyProtocolSupported()).toBe(true);
        expect(mod.isKittyProtocolEnabled()).toBe(true);
        expect(writes).toContain(KITTY_PUSH);
    });
    it('re-pushes the flags on demand (alternate-screen re-entry)', async () => {
        const { stdin, writes } = installMockStreams();
        const mod = await detectWithSupport(stdin);
        writes.length = 0;
        mod.pushKittyProtocolFlags();
        expect(writes).toEqual([KITTY_PUSH]);
    });
    it('is a no-op when the protocol is unsupported', async () => {
        const { writes } = installMockStreams();
        const mod = await import('./kittyProtocolDetector.js');
        // No detection ran → unsupported. Re-push must not write anything.
        writes.length = 0;
        mod.pushKittyProtocolFlags();
        expect(writes).toEqual([]);
        expect(mod.isKittyProtocolSupported()).toBe(false);
    });
});
//# sourceMappingURL=kittyProtocolDetector.test.js.map