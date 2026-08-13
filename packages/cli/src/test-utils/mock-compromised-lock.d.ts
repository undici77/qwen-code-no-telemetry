/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import lockfile from 'proper-lockfile';
/**
 * Simulates a proper-lockfile compromise on the next `lockfile.lock` call.
 * After a real compromise, proper-lockfile marks the lock released before
 * invoking `onCompromised`, so the later `release()` rejects with
 * `ERELEASED`; the mocked release reproduces that exact state.
 */
export declare function mockCompromisedLock(): {
    lockSpy: import("vitest").MockInstance<typeof lockfile.lock>;
    getLockedFile: () => string | undefined;
    getOnCompromised: () => ((error: Error) => void) | undefined;
};
