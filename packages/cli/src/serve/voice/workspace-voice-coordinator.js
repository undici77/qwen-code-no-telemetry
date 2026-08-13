/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export const MAX_CONCURRENT_VOICE_SESSIONS = 8;
const DISPOSE_WAIT_MS = 5_000;
export class VoiceLeaseAbortError extends Error {
    kind;
    constructor(kind, message) {
        super(message);
        this.kind = kind;
        this.name = 'VoiceLeaseAbortError';
    }
}
class Lease {
    onRelease;
    controller = new AbortController();
    signal = this.controller.signal;
    released = false;
    constructor(onRelease) {
        this.onRelease = onRelease;
    }
    release() {
        if (this.released)
            return;
        this.released = true;
        this.onRelease(this);
    }
    abort(reason) {
        if (!this.signal.aborted)
            this.controller.abort(reason);
    }
}
export class WorkspaceVoiceCoordinator {
    states = new Map();
    disposed = new WeakSet();
    active = 0;
    acquire(runtime) {
        if (this.disposed.has(runtime)) {
            return { kind: 'rejected', reason: 'draining' };
        }
        const state = this.stateFor(runtime);
        if (state.draining)
            return { kind: 'rejected', reason: 'draining' };
        if (this.active >= MAX_CONCURRENT_VOICE_SESSIONS) {
            return { kind: 'rejected', reason: 'capacity' };
        }
        const lease = new Lease((current) => this.release(runtime, current));
        state.leases.add(lease);
        this.active++;
        return { kind: 'admitted', lease };
    }
    beginWorkspaceDrain(runtime) {
        this.stateFor(runtime).draining = true;
    }
    cancelWorkspaceDrain(runtime) {
        const state = this.states.get(runtime);
        if (!state || state.completed)
            return;
        state.draining = false;
        if (state.leases.size === 0)
            this.states.delete(runtime);
    }
    completeWorkspaceDrain(runtime) {
        this.disposed.add(runtime);
        const state = this.states.get(runtime);
        if (!state)
            return;
        state.draining = true;
        state.completed = true;
        const abortReason = new VoiceLeaseAbortError('workspace_removed', 'Workspace drain completed');
        for (const lease of state.leases)
            lease.abort(abortReason);
        this.deleteIfIdle(runtime, state);
    }
    getWorkspaceActivity(runtime) {
        return this.states.get(runtime)?.leases.size ?? 0;
    }
    async disposeRuntime(runtime, reason) {
        this.disposed.add(runtime);
        const state = this.states.get(runtime);
        if (!state)
            return;
        state.draining = true;
        state.completed = true;
        const abortReason = new VoiceLeaseAbortError(reason, reason === 'daemon_shutdown'
            ? 'Daemon is shutting down'
            : reason === 'workspace_removed'
                ? 'Workspace runtime was removed'
                : 'Workspace trust was reconfigured');
        for (const lease of state.leases)
            lease.abort(abortReason);
        if (state.leases.size === 0) {
            this.deleteIfIdle(runtime, state);
            return;
        }
        let resolveIdle;
        const idle = new Promise((resolve) => {
            resolveIdle = resolve;
            state.idleWaiters.add(resolve);
        });
        let timeout;
        let timedOut = false;
        try {
            await Promise.race([
                idle,
                new Promise((resolve) => {
                    timeout = setTimeout(() => {
                        timedOut = true;
                        resolve();
                    }, DISPOSE_WAIT_MS);
                    timeout.unref?.();
                }),
            ]);
        }
        finally {
            if (timeout)
                clearTimeout(timeout);
            if (resolveIdle)
                state.idleWaiters.delete(resolveIdle);
        }
        if (timedOut && state.leases.size > 0) {
            process.stderr.write(`qwen serve: Voice runtime disposal timed out with ${state.leases.size} active lease(s).\n`);
        }
    }
    stateFor(runtime) {
        let state = this.states.get(runtime);
        if (!state) {
            state = {
                draining: false,
                completed: false,
                leases: new Set(),
                idleWaiters: new Set(),
            };
            this.states.set(runtime, state);
        }
        return state;
    }
    release(runtime, lease) {
        const state = this.states.get(runtime);
        if (!state || !state.leases.delete(lease))
            return;
        this.active--;
        if (state.leases.size === 0) {
            for (const resolve of state.idleWaiters)
                resolve();
            state.idleWaiters.clear();
        }
        this.deleteIfIdle(runtime, state);
    }
    deleteIfIdle(runtime, state) {
        if (state.completed && state.leases.size === 0)
            this.states.delete(runtime);
    }
}
//# sourceMappingURL=workspace-voice-coordinator.js.map