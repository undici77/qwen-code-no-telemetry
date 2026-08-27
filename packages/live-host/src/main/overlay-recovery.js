const OVERLAY_RECOVERY_DELAY_MS = 500;
const scheduleOverlayRecovery = (callback, delayMs) => {
    const timer = setTimeout(callback, delayMs);
    timer.unref();
    return () => clearTimeout(timer);
};
export function isRecoverableOverlayLoadFailure(errorCode, isMainFrame) {
    return isMainFrame && errorCode !== -3;
}
export class OverlayRecoveryController {
    onFailure;
    onRecover;
    scheduler;
    cancelRecovery;
    stopped = false;
    constructor(onFailure, onRecover, scheduler = scheduleOverlayRecovery) {
        this.onFailure = onFailure;
        this.onRecover = onRecover;
        this.scheduler = scheduler;
    }
    handleFailure(reason) {
        if (this.stopped)
            return;
        this.onFailure(reason);
        if (this.cancelRecovery)
            return;
        this.cancelRecovery = this.scheduler(() => {
            this.cancelRecovery = undefined;
            if (!this.stopped)
                this.onRecover();
        }, OVERLAY_RECOVERY_DELAY_MS);
    }
    markReady() {
        if (this.stopped)
            return;
        this.cancelScheduledRecovery();
    }
    stop() {
        this.stopped = true;
        this.cancelScheduledRecovery();
    }
    cancelScheduledRecovery() {
        this.cancelRecovery?.();
        this.cancelRecovery = undefined;
    }
}
//# sourceMappingURL=overlay-recovery.js.map