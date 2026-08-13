/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { MessageBus } from '../confirmation-bus/message-bus.js';
/**
 * Ceiling on how long {@link MessageDisplayDispatcher.finish} waits for the
 * final payload's delivery to complete before letting the turn's teardown
 * proceed anyway. Well short of `DEFAULT_HOOK_TIMEOUT` (60s, hookRunner.ts)
 * because a slow or hung MessageDisplay hook shouldn't be able to freeze
 * `qwen -p` or an ACP stream loop's `finally` for anywhere near that long.
 * The budget is shared across finish() calls (client.ts calls it from an
 * explicit exit site and again from a finally), so this constant is the
 * ceiling itself, not a per-call increment. The hook has already received
 * the `is_final` payload by the time this wait starts — the timeout only
 * bounds how long the caller waits for the hook to finish executing, and
 * delivery keeps running in the background past it.
 */
export declare const MESSAGE_DISPLAY_DRAIN_TIMEOUT_MS = 5000;
/**
 * Owns the delivery side of the MessageDisplay hook for ONE streamed message:
 * mints the `message_id`, folds streamed chunks through the pure
 * {@link stepMessageDisplay} debounce, and dispatches due flushes through
 * MessageBus without ever blocking the streaming loop that feeds it.
 *
 * Mid-stream delivery is coalescing, not queueing: at most one hook request
 * is in flight at a time, and at most one payload is held pending behind it.
 * A newer flush simply overwrites the pending payload — lossless, because
 * `displayed_text` is cumulative, so the newest payload strictly supersedes
 * any older one. This bounds a slow hook's backlog to O(1) instead of letting
 * undelivered batches accumulate for the length of the stream.
 *
 * The final payload is the one exception to the single-request rule:
 * {@link finish} dispatches it immediately, alongside any still-running
 * mid-stream delivery, rather than queueing behind it. The same supersession
 * argument applies one slot further — an in-flight mid-stream payload carries
 * strictly less information than the final one, so waiting for it to settle
 * would only delay `is_final` by a full hook execution, and in a short-lived
 * process (headless `-p`) could drop it entirely when the process exits with
 * the final payload still queued. A hook may therefore see its last
 * mid-stream execution overlap the final one.
 *
 * {@link finish} is idempotent and resolves once the final payload's
 * delivery has completed, or after {@link MESSAGE_DISPLAY_DRAIN_TIMEOUT_MS}
 * — whichever comes first — so callers can await it before ending the turn
 * without a hung hook holding the turn hostage.
 */
export declare class MessageDisplayDispatcher {
    private readonly messageBus;
    private readonly signal;
    private readonly warn;
    readonly messageId: string;
    private state;
    /** Newest undelivered mid-stream text, coalesced behind {@link inFlight}. */
    private pending;
    /** The one in-flight mid-stream delivery (single-request rule). */
    private inFlight;
    /** The final payload's delivery, dispatched by {@link finish}. */
    private finalDelivery;
    private finished;
    /**
     * The one bounded wait on {@link finalDelivery}, shared by every finish()
     * call — a single timeout budget, no matter how many times (or how
     * concurrently) finish() is invoked.
     */
    private drain;
    /**
     * @param warn Additional sink for delivery warnings — typically the
     *   surface's debug-file logger. The dispatcher always mirrors warnings to
     *   `console.warn` itself, so callers don't need (and shouldn't add) their
     *   own console wiring: a warning here means a documented delivery
     *   guarantee is at stake, which must be visible by default even when no
     *   debug-log session is active.
     */
    constructor(messageBus: MessageBus, signal: AbortSignal, warn: (message: string) => void, nowMs?: number);
    /**
     * Fold one streamed text chunk into the accumulator, firing a debounced
     * mid-stream flush if one is due. Never blocks: dispatch happens in the
     * background, and the caller's streaming loop continues immediately.
     */
    addChunk(chunk: string, nowMs?: number): void;
    /**
     * Close out this message: dispatch the `is_final: true` payload (skipped
     * when no text ever streamed — a tool-call-only message — or when the turn
     * was aborted, matching the Stop hook's cancellation guard), then wait for
     * its delivery to complete, bounded by the shared drain budget. Idempotent
     * — extra calls just re-await the (already spent or already settled)
     * drain, so it is safe to call from both an explicit exit site and a
     * `finally` block without doubling the ceiling. The final flush
     * intentionally re-sends the same cumulative text as the last debounced
     * flush when nothing changed since then: `is_final` is itself new
     * information (it tells subscribers this message is done), so the event
     * still fires even when the text didn't.
     */
    finish(): Promise<void>;
    /** Send one payload through MessageBus; failures are logged, never thrown. */
    private dispatch;
    /**
     * Route a warning to the console AND the injected sink. The sink is
     * typically a gated debug-file logger (a no-op without an active debug-log
     * session), and these warnings fire exactly when a documented delivery
     * guarantee is at stake — they must reach stderr by default on every
     * surface (headless, ACP — stdout carries the protocol, stderr is free —
     * and the TUI, where ink's patchConsole renders them above the app).
     */
    private emitWarning;
    private pump;
    /**
     * Resolves once the final payload's delivery has settled, or after
     * {@link MESSAGE_DISPLAY_DRAIN_TIMEOUT_MS} elapses — whichever comes
     * first. A superseded mid-stream delivery still running in the background
     * never holds the drain; only the final payload's own delivery does. The
     * wait is memoized: every finish() call — sequential or concurrent —
     * shares the same single promise and timer, so the ceiling is the constant
     * itself, never a multiple of it, and a call after the delivery settled
     * costs nothing.
     */
    private drainWithTimeout;
}
