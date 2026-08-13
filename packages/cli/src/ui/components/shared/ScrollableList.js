import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { VirtualizedList, } from './VirtualizedList.js';
import { useFrameCoalescedFlush } from '../../hooks/use-frame-coalesced-flush.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { keyMatchers, Command } from '../../keyMatchers.js';
import { useMouseEvents } from '../../hooks/useMouseEvents.js';
export { SCROLL_TO_ITEM_END } from './VirtualizedList.js';
function ScrollableList(props, ref) {
    // Separate ScrollableList-only props from the ones we pass through to
    // VirtualizedList. Spreading the full props would silently forward
    // `hasFocus` (which VirtualizedList does not declare) and create a
    // latent name collision if VirtualizedList ever adds the same prop.
    const { hasFocus, ...virtualizedListProps } = props;
    const virtualizedListRef = useRef(null);
    const isDraggingScrollbar = useRef(false);
    useImperativeHandle(ref, () => ({
        scrollBy: (delta) => virtualizedListRef.current?.scrollBy(delta),
        scrollTo: (offset) => virtualizedListRef.current?.scrollTo(offset),
        scrollToEnd: () => virtualizedListRef.current?.scrollToEnd(),
        scrollToIndex: (params) => virtualizedListRef.current?.scrollToIndex(params),
        scrollToItem: (params) => virtualizedListRef.current?.scrollToItem(params),
        hitTestScrollbar: (location) => virtualizedListRef.current?.hitTestScrollbar(location) ?? false,
        scrollToScrollbarRow: (row) => virtualizedListRef.current?.scrollToScrollbarRow(row),
        getScrollIndex: () => virtualizedListRef.current?.getScrollIndex() ?? 0,
        getScrollState: () => virtualizedListRef.current?.getScrollState() ?? {
            scrollTop: 0,
            scrollHeight: 0,
            innerHeight: 0,
        },
        getViewportRect: () => virtualizedListRef.current?.getViewportRect() ?? null,
    }), []);
    const getScrollState = useCallback(() => virtualizedListRef.current?.getScrollState() ?? {
        scrollTop: 0,
        scrollHeight: 0,
        innerHeight: 0,
    }, []);
    useKeypress(useCallback((key) => {
        if (keyMatchers[Command.SCROLL_UP](key)) {
            virtualizedListRef.current?.scrollBy(-1);
        }
        else if (keyMatchers[Command.SCROLL_DOWN](key)) {
            virtualizedListRef.current?.scrollBy(1);
        }
        else if (keyMatchers[Command.PAGE_UP](key)) {
            const state = getScrollState();
            const delta = state.innerHeight > 0 ? state.innerHeight : 20;
            virtualizedListRef.current?.scrollBy(-delta);
        }
        else if (keyMatchers[Command.PAGE_DOWN](key)) {
            const state = getScrollState();
            const delta = state.innerHeight > 0 ? state.innerHeight : 20;
            virtualizedListRef.current?.scrollBy(delta);
        }
        else if (keyMatchers[Command.SCROLL_HOME](key)) {
            virtualizedListRef.current?.scrollTo(0);
        }
        else if (keyMatchers[Command.SCROLL_END](key)) {
            virtualizedListRef.current?.scrollToEnd();
        }
    }, [getScrollState]), { isActive: hasFocus });
    // Mouse scrolling. Legacy `<Static>` mode let the host terminal scroll its
    // native scrollback. In VP mode the list owns the visible region, so route
    // wheel ticks and scrollbar drags to the virtualized viewport.
    const WHEEL_LINES_PER_TICK = 3;
    // Terminal mouse reporting emits one event per row the pointer crosses, so a
    // brisk wheel spin or scrollbar drag fires a rapid burst. Applying each event
    // synchronously forced one Ink reflow + terminal flush per event — the source
    // of the "一顿一顿" stutter. Accumulate the intent in refs and let
    // useFrameCoalescedFlush apply the latest at most once per frame. A drag is
    // absolute (snap to the newest row); a wheel burst is relative (sum the
    // ticks); a drag in the same window wins.
    const pendingWheelDelta = useRef(0);
    const pendingDragRow = useRef(null);
    const applyPendingScroll = useCallback(() => {
        const list = virtualizedListRef.current;
        const dragRow = pendingDragRow.current;
        const wheelDelta = pendingWheelDelta.current;
        pendingDragRow.current = null;
        pendingWheelDelta.current = 0;
        if (!list)
            return;
        if (dragRow !== null) {
            list.scrollToScrollbarRow(dragRow);
            return;
        }
        if (wheelDelta !== 0) {
            list.scrollBy(wheelDelta);
        }
    }, []);
    const { schedule: scheduleScrollFlush, cancel: cancelScrollFlush } = useFrameCoalescedFlush(applyPendingScroll);
    // Discard any queued wheel/drag intent and cancel an in-flight flush. Used
    // when a scrollbar press takes over: without it, a wheel burst scheduled
    // moments earlier would still fire and `scrollBy` the view away from the row
    // the user just clicked.
    const cancelPendingScroll = useCallback(() => {
        pendingWheelDelta.current = 0;
        pendingDragRow.current = null;
        cancelScrollFlush();
    }, [cancelScrollFlush]);
    const handleMouseEvent = useCallback((event) => {
        if (!virtualizedListRef.current)
            return;
        if (event.name === 'left-release') {
            isDraggingScrollbar.current = false;
            return;
        }
        if (event.name === 'left-press') {
            isDraggingScrollbar.current =
                virtualizedListRef.current.hitTestScrollbar(event);
            if (isDraggingScrollbar.current) {
                // A press should feel instant — apply now and drop any queued
                // wheel/drag intent (and its timer) so a flush scheduled moments
                // earlier can't yank the view off the clicked row.
                cancelPendingScroll();
                virtualizedListRef.current.scrollToScrollbarRow(event.row);
            }
            return;
        }
        if (event.name === 'move' && isDraggingScrollbar.current) {
            pendingDragRow.current = event.row;
            scheduleScrollFlush();
            return;
        }
        if (event.name === 'scroll-up') {
            pendingWheelDelta.current -= WHEEL_LINES_PER_TICK;
            scheduleScrollFlush();
        }
        else if (event.name === 'scroll-down') {
            pendingWheelDelta.current += WHEEL_LINES_PER_TICK;
            scheduleScrollFlush();
        }
    }, [scheduleScrollFlush, cancelPendingScroll]);
    // The VP viewport owns the wheel (this IS the in-app scroller), so opt out
    // of the VP gate — though in practice ScrollableList only mounts in VP mode.
    useMouseEvents(handleMouseEvent, { isActive: hasFocus, bypassVpGate: true });
    // ScrollableList is a thin keyboard / mouse wrapper around VirtualizedList.
    // The previous outer <Box flexGrow={1}> wrapper carried a never-read
    // containerRef and collapsed to zero height in test renderers (no flex
    // parent). MainContent passes an explicit `containerHeight`, which
    // VirtualizedList's outermost Box honours, so the wrapper added nothing
    // beyond the dead ref.
    return _jsx(VirtualizedList, { ref: virtualizedListRef, ...virtualizedListProps });
}
const ScrollableListWithForwardRef = forwardRef(ScrollableList);
export { ScrollableListWithForwardRef as ScrollableList };
//# sourceMappingURL=ScrollableList.js.map