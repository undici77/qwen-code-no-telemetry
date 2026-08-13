export class LiveGlobalShortcut {
    backend;
    onToggle;
    onState;
    accelerator;
    healthy = false;
    constructor(backend, onToggle, onState) {
        this.backend = backend;
        this.onToggle = onToggle;
        this.onState = onState;
    }
    replace(accelerator) {
        if (this.healthy && accelerator === (this.accelerator ?? '')) {
            return { accelerator, healthy: true };
        }
        if (accelerator === '') {
            this.unregisterCurrent();
            return this.publish({ accelerator, healthy: true });
        }
        const previous = this.accelerator;
        const previousHealthy = this.healthy;
        let registered = false;
        let invalid = false;
        try {
            registered = this.backend.register(accelerator, this.onToggle);
        }
        catch {
            invalid = true;
        }
        if (!registered) {
            const state = {
                accelerator,
                healthy: false,
                error: invalid
                    ? 'That shortcut is invalid.'
                    : 'That shortcut is already in use.',
            };
            if (!previousHealthy)
                this.publish(state);
            return state;
        }
        this.accelerator = accelerator;
        this.healthy = true;
        if (previous && previous !== accelerator)
            this.unregister(previous);
        return this.publish({ accelerator, healthy: true });
    }
    stop() {
        const wasRegistered = Boolean(this.accelerator) || this.healthy;
        this.unregisterCurrent();
        if (wasRegistered)
            this.publish({ healthy: false });
    }
    unregisterCurrent() {
        if (this.accelerator)
            this.unregister(this.accelerator);
        this.accelerator = undefined;
        this.healthy = false;
    }
    unregister(accelerator) {
        try {
            this.backend.unregister(accelerator);
        }
        catch {
            // A failed unregister must not leave the shortcut marked healthy.
        }
    }
    publish(state) {
        this.healthy = state.healthy;
        this.onState(state);
        return state;
    }
}
//# sourceMappingURL=global-shortcut.js.map