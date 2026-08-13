/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// Tracks the wall-clock time of the user's last keyboard interaction so the
// background housekeeping scheduler can defer work when the user is active.
// Updated from the Ink keypress dispatcher (see KeypressContext.tsx).
let lastInteractionAt = Date.now();
export function noteInteraction() {
    lastInteractionAt = Date.now();
}
export function msSinceLastInteraction() {
    return Date.now() - lastInteractionAt;
}
export function _resetForTesting() {
    lastInteractionAt = Date.now();
}
export function _setLastInteractionForTesting(timestamp) {
    lastInteractionAt = timestamp;
}
//# sourceMappingURL=lastInteractionAt.js.map