export class BoundedReconnectPolicy {
    delaysMs;
    jitterFraction;
    random;
    attempt = 0;
    constructor(delaysMs = [
        250, 500, 1_000, 2_000, 4_000, 8_000, 10_000, 10_000,
    ], jitterFraction = 0.2, random = Math.random) {
        this.delaysMs = delaysMs;
        this.jitterFraction = jitterFraction;
        this.random = random;
    }
    nextDelayMs() {
        const base = this.delaysMs[this.attempt];
        if (base === undefined)
            return undefined;
        this.attempt += 1;
        const jitter = base * this.jitterFraction * (this.random() * 2 - 1);
        return Math.max(0, Math.round(base + jitter));
    }
    reset() {
        this.attempt = 0;
    }
    get attemptsUsed() {
        return this.attempt;
    }
}
//# sourceMappingURL=reconnect-policy.js.map