export class HostAudioLifecycle {
    queue = Promise.resolve();
    generation = 0;
    activate(operation) {
        const generation = ++this.generation;
        return this.enqueue(generation, operation);
    }
    runIfCurrent(operation) {
        return this.enqueue(this.generation, operation);
    }
    deactivate(deactivateNow, cleanup) {
        this.generation += 1;
        deactivateNow();
        return this.enqueue(undefined, cleanup);
    }
    enqueue(generation, operation) {
        const pending = this.queue
            .catch(() => undefined)
            .then(async () => {
            if (generation !== undefined && generation !== this.generation)
                return;
            await operation();
        });
        this.queue = pending;
        return pending;
    }
}
//# sourceMappingURL=audio-lifecycle.js.map