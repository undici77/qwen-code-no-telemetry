export declare class BoundedReconnectPolicy {
    private readonly delaysMs;
    private readonly jitterFraction;
    private readonly random;
    private attempt;
    constructor(delaysMs?: readonly number[], jitterFraction?: number, random?: () => number);
    nextDelayMs(): number | undefined;
    reset(): void;
    get attemptsUsed(): number;
}
