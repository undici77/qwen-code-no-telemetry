export interface QueueDrainGate {
    /** A drain is already in flight this tick. */
    draining: boolean;
    /** Waiting for the previously drained prompt's turn to start. */
    awaitingTurnStart: boolean;
    /** The daemon connection is live. */
    connected: boolean;
    /** A turn is in flight (streamingState !== 'idle'). */
    streaming: boolean;
    /** Some interaction (dialog, catch-up) is blocking input. */
    interactionBlocked: boolean;
    /** A tool approval is pending. */
    pendingApproval: boolean;
    /** Number of prompts currently queued. */
    queueLength: number;
}
/**
 * Whether the next queued prompt may be auto-drained into a new turn right now.
 * Every condition must hold; any one being unmet holds the queue.
 */
export declare function canDrainQueue(gate: QueueDrainGate): boolean;
