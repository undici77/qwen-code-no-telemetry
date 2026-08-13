/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** One 60Hz frame — the coalescing window for burst scroll input. */
export declare const SCROLL_FRAME_MS = 16;
/**
 * Coalesce a burst of imperative updates into at most one `flush` per frame.
 *
 * Terminal mouse reporting emits one event per row the pointer crosses, so a
 * brisk wheel spin or scrollbar drag fires many events in quick succession.
 * Applying each synchronously forces one Ink reflow + terminal write per event
 * — the source of choppy scrolling. Callers accumulate their intent in their
 * own ref(s) and call `schedule()`; the latest accumulated state is applied
 * once when the timer fires. `cancel()` drops a pending flush (e.g. when a new
 * gesture takes over). The timer is always cleared on unmount.
 *
 * The timer is real (not gated on NODE_ENV), so tests exercise the same path
 * production does; they just need to advance ~`frameMs` before asserting.
 */
export declare function useFrameCoalescedFlush(flush: () => void, frameMs?: number): {
    schedule: () => void;
    cancel: () => void;
};
