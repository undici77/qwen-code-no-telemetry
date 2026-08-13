/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The anchor/focus selection model in visible-frame coordinates. The state is
 * pure: coordinate mapping (terminal → frame) and clearing on scroll live in the
 * hook that drives it. In VP mode (B1) the selection is visible-region only and
 * is cleared on scroll, so frame coordinates are sufficient.
 */
export class SelectionState {
    anchor = null;
    focus = null;
    dragging = false;
    mode = 'char';
    start(point, mode = 'char') {
        this.anchor = point;
        this.focus = point;
        this.dragging = true;
        this.mode = mode;
    }
    extend(point) {
        if (this.anchor) {
            this.focus = point;
        }
    }
    finish() {
        this.dragging = false;
    }
    clear() {
        this.anchor = null;
        this.focus = null;
        this.dragging = false;
        this.mode = 'char';
    }
    get isEmpty() {
        return this.anchor === null || this.focus === null;
    }
    /** True when the selection is a single point (a click with no drag). */
    get isCollapsed() {
        return (!this.isEmpty &&
            this.anchor.x === this.focus.x &&
            this.anchor.y === this.focus.y);
    }
    /**
     * A collapsed range is a real single-cell span in word/line mode, but only a
     * bare click in char mode.
     */
    get isBareClick() {
        return this.isCollapsed && this.mode === 'char';
    }
    /** Anchor/focus ordered into reading order, or null when empty. */
    normalized() {
        if (!this.anchor || !this.focus) {
            return null;
        }
        const { anchor, focus } = this;
        const anchorFirst = anchor.y < focus.y || (anchor.y === focus.y && anchor.x <= focus.x);
        const start = anchorFirst ? anchor : focus;
        const end = anchorFirst ? focus : anchor;
        return { sx: start.x, sy: start.y, ex: end.x, ey: end.y };
    }
}
//# sourceMappingURL=selection-state.js.map