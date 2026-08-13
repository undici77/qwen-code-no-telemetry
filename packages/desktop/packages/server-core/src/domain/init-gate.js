/**
 * Tracks startup initialization state and coordinates async waiters.
 * Waiters are settled exactly once as either ready (resolve) or failed (reject).
 */
export class InitGate {
    settled = false;
    promise;
    resolvePromise;
    rejectPromise;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolvePromise = resolve;
            this.rejectPromise = reject;
        });
    }
    wait() {
        return this.promise;
    }
    markReady() {
        if (this.settled)
            return;
        this.settled = true;
        this.resolvePromise();
    }
    markFailed(error) {
        if (this.settled)
            return;
        this.settled = true;
        this.rejectPromise(error);
    }
}
//# sourceMappingURL=init-gate.js.map