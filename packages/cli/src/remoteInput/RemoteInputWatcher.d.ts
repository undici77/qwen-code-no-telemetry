/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * JSONL command shapes written by an external process (IDE extension,
 * web frontend, automation script) into the file passed to --input-file.
 *
 * - `submit`: enqueue a user message that the TUI processes as if typed
 *   into the prompt.
 * - `confirmation_response`: reply to a pending tool-permission
 *   `control_request` previously emitted on the dual-output channel.
 */
export type RemoteInputCommand = {
    type: 'submit';
    text: string;
} | {
    type: 'confirmation_response';
    request_id: string;
    allowed: boolean;
};
/**
 * Callback invoked when a `confirmation_response` command is read.
 */
export type ConfirmationHandler = (requestId: string, allowed: boolean) => void;
/**
 * Callback type for submitting a query from remote input.
 * Returns true if the submit was accepted, false if rejected (TUI busy).
 */
export type SubmitFn = (query: string) => Promise<boolean | void> | boolean | void;
/**
 * Watches a JSONL file for remote input commands and calls the registered
 * submit function when new commands arrive.
 *
 * The watcher queues commands and retries when the TUI is busy (responding).
 * Call `notifyIdle()` when the TUI transitions to idle state to trigger
 * processing of queued commands.
 */
export declare class RemoteInputWatcher {
    private submitFn;
    private confirmationHandler;
    private queue;
    private processing;
    private active;
    private bytesRead;
    private consumedPrefixHash;
    private reading;
    private filePath;
    private retryTimer;
    private readonly pollIntervalMs;
    constructor(filePath: string, options?: {
        pollIntervalMs?: number;
    });
    /**
     * Register the TUI's submit function. Called from AppContainer
     * once useGeminiStream's submitQuery is available.
     */
    setSubmitFn(fn: SubmitFn): void;
    /**
     * Register the handler invoked when a `confirmation_response` command is
     * read from the input file. Used to bridge external approvals back into
     * the tool's `onConfirm` callback.
     */
    setConfirmationHandler(fn: ConfirmationHandler): void;
    /**
     * Notify the watcher that the TUI has become idle.
     * Call this when streamingState transitions to Idle — it triggers
     * processing of any queued commands that were deferred due to TUI busy.
     */
    notifyIdle(): void;
    private startWatching;
    /**
     * Manually trigger a check for new input. Returns a promise that resolves
     * once any new lines have been read and processed. In production the
     * `watchFile` poll calls this automatically; tests can call it directly
     * to avoid depending on filesystem-polling timing.
     */
    checkForNewInput(): Promise<void>;
    private readNewLines;
    private findLastCompleteRecordEnd;
    private hasConsumedPrefixChanged;
    private hashFilePrefix;
    private processQueue;
    private scheduleRetry;
    shutdown(): void;
}
