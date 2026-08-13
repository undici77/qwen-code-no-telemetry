/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export const TODO_STOP_GUARD_MAX_ATTEMPTS = 2;
function parseStructuredTodos(value) {
    if (typeof value !== 'object' || value === null)
        return null;
    const record = value;
    if (record['type'] !== 'todo_list' || !Array.isArray(record['todos'])) {
        return null;
    }
    for (const item of record['todos']) {
        if (typeof item !== 'object' || item === null)
            return null;
        const todo = item;
        if (typeof todo['id'] !== 'string' ||
            typeof todo['content'] !== 'string' ||
            (todo['status'] !== 'pending' &&
                todo['status'] !== 'in_progress' &&
                todo['status'] !== 'completed')) {
            return null;
        }
    }
    return record['todos'];
}
export class DaemonTodoStopGuard {
    enabled;
    #armed = false;
    #unfinishedCount = 0;
    #attempts = 0;
    #suspended = false;
    #retryPaused = false;
    #awaitingQueuedPrompt = false;
    #exhaustionReported = false;
    constructor(enabled) {
        this.enabled = enabled;
    }
    get hasTrustedUnfinishedState() {
        return (this.enabled &&
            this.#armed &&
            !this.#suspended &&
            this.#unfinishedCount > 0);
    }
    get isHardSuspended() {
        return this.enabled && this.#suspended;
    }
    get hasCommittedContinuation() {
        return this.enabled && this.#attempts > 0;
    }
    get blocksUnrelatedAutomaticTurns() {
        return (this.enabled &&
            this.#armed &&
            !this.#suspended &&
            this.#unfinishedCount > 0);
    }
    get needsStopInspection() {
        return (this.enabled &&
            this.#armed &&
            !this.#suspended &&
            !this.#retryPaused &&
            !this.#awaitingQueuedPrompt &&
            this.#unfinishedCount > 0);
    }
    clearTrust() {
        this.#armed = false;
        this.#unfinishedCount = 0;
        this.#attempts = 0;
        this.#suspended = false;
        this.#retryPaused = false;
        this.#awaitingQueuedPrompt = false;
        this.#exhaustionReported = false;
    }
    startOrdinaryPrompt() {
        this.clearTrust();
    }
    resumeTrustedPrompt() {
        this.#awaitingQueuedPrompt = false;
        this.#retryPaused = false;
    }
    blockUntilOrdinaryPromptStarts() {
        this.clearTrust();
        this.#suspended = true;
    }
    acceptMidTurnUserInput() {
        if (!this.enabled || this.#suspended)
            return;
        if (!this.#armed && this.#attempts === 0)
            return;
        this.#attempts = 0;
        this.#retryPaused = false;
        this.#awaitingQueuedPrompt = false;
        this.#exhaustionReported = false;
    }
    observeTodoWrite(resultDisplay, allowArm) {
        if (!this.enabled)
            return false;
        const todos = parseStructuredTodos(resultDisplay);
        if (todos === null)
            return false;
        if (!allowArm) {
            this.blockUntilOrdinaryPromptStarts();
            return true;
        }
        this.#unfinishedCount = todos.filter((todo) => todo.status === 'pending' || todo.status === 'in_progress').length;
        this.#exhaustionReported = false;
        if (this.#unfinishedCount === 0) {
            this.#armed = false;
            return true;
        }
        if (!this.#suspended)
            this.#armed = true;
        return true;
    }
    suspend() {
        if (!this.enabled)
            return;
        this.#suspended = true;
        this.#awaitingQueuedPrompt = false;
    }
    pauseForTrustedRetry() {
        if (!this.#armed)
            return;
        this.#retryPaused = true;
        this.#awaitingQueuedPrompt = false;
    }
    awaitQueuedPrompt() {
        if ((!this.#armed && this.#attempts === 0) || this.#suspended)
            return false;
        this.#awaitingQueuedPrompt = true;
        return true;
    }
    decide(hasRelevantBackgroundInput) {
        if (!this.needsStopInspection)
            return { kind: 'inactive' };
        if (hasRelevantBackgroundInput)
            return { kind: 'deferred' };
        if (this.#attempts >= TODO_STOP_GUARD_MAX_ATTEMPTS) {
            return {
                kind: 'exhausted',
                attempt: this.#attempts,
                maxAttempts: TODO_STOP_GUARD_MAX_ATTEMPTS,
                unfinishedCount: this.#unfinishedCount,
            };
        }
        return {
            kind: 'continue',
            attempt: this.#attempts + 1,
            maxAttempts: TODO_STOP_GUARD_MAX_ATTEMPTS,
            unfinishedCount: this.#unfinishedCount,
        };
    }
    decideToolClosure(currentAttempt, hasRelevantBackgroundInput) {
        if (this.#unfinishedCount > 0) {
            return this.decide(hasRelevantBackgroundInput);
        }
        if (!this.enabled ||
            this.#suspended ||
            this.#retryPaused ||
            this.#awaitingQueuedPrompt ||
            this.#attempts !== currentAttempt) {
            return { kind: 'inactive' };
        }
        if (hasRelevantBackgroundInput)
            return { kind: 'deferred' };
        if (currentAttempt >= TODO_STOP_GUARD_MAX_ATTEMPTS) {
            return { kind: 'inactive' };
        }
        return {
            kind: 'continue',
            attempt: currentAttempt + 1,
            maxAttempts: TODO_STOP_GUARD_MAX_ATTEMPTS,
            unfinishedCount: 0,
            toolClosure: true,
        };
    }
    commitContinuation(attempt) {
        const canCloseTools = this.enabled &&
            this.#unfinishedCount === 0 &&
            this.#attempts > 0 &&
            !this.#suspended &&
            !this.#retryPaused &&
            !this.#awaitingQueuedPrompt;
        if ((!this.needsStopInspection && !canCloseTools) ||
            attempt !== this.#attempts + 1 ||
            attempt > TODO_STOP_GUARD_MAX_ATTEMPTS) {
            return false;
        }
        this.#attempts = attempt;
        return true;
    }
    markExhaustionReported() {
        if (this.#exhaustionReported)
            return false;
        this.#exhaustionReported = true;
        this.#suspended = true;
        return true;
    }
}
//# sourceMappingURL=daemon-todo-stop-guard.js.map