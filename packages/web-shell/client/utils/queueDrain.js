// Pure gate for the queued-prompt auto-drain, extracted from App's drain effect
// so the "may I drain the next prompt right now?" conditions are a named,
// tested contract. This covers the boolean gate only — the effect still owns
// the timing (arming the turn-start gate, the setTimeout submit). The race that
// gate guards against is inherently effect-level and is verified separately.
/**
 * Whether the next queued prompt may be auto-drained into a new turn right now.
 * Every condition must hold; any one being unmet holds the queue.
 */
export function canDrainQueue(gate) {
    return (!gate.draining &&
        !gate.awaitingTurnStart &&
        gate.connected &&
        !gate.streaming &&
        !gate.interactionBlocked &&
        !gate.pendingApproval &&
        gate.queueLength > 0);
}
//# sourceMappingURL=queueDrain.js.map