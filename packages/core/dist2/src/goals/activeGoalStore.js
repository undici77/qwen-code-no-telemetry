/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
const store = new Map();
export function activeGoalEquals(left, right) {
    if (left === right)
        return true;
    if (!left || !right)
        return false;
    return stableActiveGoalKey(left) === stableActiveGoalKey(right);
}
function stableActiveGoalKey(goal) {
    const comparable = {};
    for (const key of Object.keys(goal).sort()) {
        const value = goal[key];
        if (value !== undefined) {
            comparable[key] = value;
        }
    }
    return JSON.stringify(comparable);
}
export function getActiveGoal(sessionId) {
    return store.get(sessionId);
}
export function setActiveGoal(sessionId, goal) {
    store.set(sessionId, goal);
}
export function clearActiveGoal(sessionId) {
    const previous = store.get(sessionId);
    store.delete(sessionId);
    return previous;
}
export function recordGoalIteration(sessionId, lastReason) {
    const current = store.get(sessionId);
    if (!current)
        return undefined;
    const updated = {
        ...current,
        iterations: current.iterations + 1,
        lastReason,
    };
    store.set(sessionId, updated);
    return updated;
}
/**
 * Test-only escape hatch — production code must scope by sessionId.
 */
export function __resetActiveGoalStoreForTests() {
    store.clear();
    observers.clear();
    lastTerminal.clear();
}
const observers = new Map();
export function setGoalTerminalObserver(sessionId, observer) {
    observers.set(sessionId, observer);
}
export function clearGoalTerminalObserver(sessionId) {
    observers.delete(sessionId);
}
export function notifyGoalTerminal(sessionId, event) {
    // Stash the last terminal event so an empty `/goal` after the loop ends
    // can surface a summary of what just happened. We keep the cache in core so
    // the CLI command can read it without having access to UI history.
    recordLastTerminalEvent(sessionId, event);
    const observer = observers.get(sessionId);
    if (!observer)
        return;
    try {
        observer(event);
    }
    catch {
        // Observers are best-effort. Do not let UI-side errors poison the hook
        // callback — losing a card is acceptable; losing the /goal loop is not.
    }
}
// ───────────────────────────────────────────────────────────────────────────
// Last-completed-goal cache
//
// Empty `/goal` after the active goal is gone should show the most recent
// actually-finished goal. Automatic terminal states (`achieved`, `aborted`,
// and `failed`) qualify; the user-driven `/goal clear` path emits a
// `cleared` history card directly and never flows through this notifier.
// ───────────────────────────────────────────────────────────────────────────
const lastTerminal = new Map();
function recordLastTerminalEvent(sessionId, event) {
    lastTerminal.set(sessionId, event);
}
export function getLastGoalTerminal(sessionId) {
    return lastTerminal.get(sessionId);
}
/**
 * Used by session resume to repopulate the cache from persisted history when
 * an in-memory restart loses the cache but the transcript still has the
 * achievement record.
 */
export function setLastGoalTerminal(sessionId, event) {
    if (!event) {
        lastTerminal.delete(sessionId);
        return;
    }
    lastTerminal.set(sessionId, event);
}
//# sourceMappingURL=activeGoalStore.js.map