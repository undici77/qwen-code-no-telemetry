/**
 * Keybinding Context
 *
 * Provides context keys for when-clause evaluation in the action registry.
 * Inspired by VSCode's context keys but much simpler.
 *
 * Context is computed at keydown time from the DOM + a module-level ref.
 * No React state, no re-renders — just a synchronous snapshot.
 */
import { hasOpenOverlay } from '@/lib/overlay-detection';
// ─────────────────────────────────────────────
// Module-level zone ref
// Updated by:
//   1. FocusContext.focusZone() → setCurrentZone() (keyboard navigation: Cmd+1/2/3, Tab)
//   2. focusin listener below (click-based focus changes)
// The keyboard handler reads it synchronously via getKeybindingContext().
// ─────────────────────────────────────────────
let _currentZone = 'chat';
export function setCurrentZone(zone) {
    _currentZone = zone;
}
// Track zone from DOM focus events (clicks, programmatic focus).
// Zone containers are stamped with data-focus-zone by useFocusZone.
// This is a module-level variable assignment — zero React re-renders.
if (typeof document !== 'undefined') {
    document.addEventListener('focusin', (e) => {
        const target = e.target;
        const zoneEl = target.closest('[data-focus-zone]');
        if (zoneEl) {
            _currentZone = zoneEl.getAttribute('data-focus-zone');
        }
    });
}
// ─────────────────────────────────────────────
// Context snapshot
// ─────────────────────────────────────────────
/**
 * Build a context snapshot from DOM state at event time.
 * Called synchronously in the keyboard handler's capture phase.
 */
export function getKeybindingContext(e) {
    const target = e.target;
    const isInput = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
    const hasSelection = (() => {
        if (!isInput)
            return false;
        // For contenteditable (rich text), check window selection
        if (target.isContentEditable) {
            const sel = window.getSelection();
            return sel !== null && sel.toString().length > 0;
        }
        // For INPUT/TEXTAREA, check selectionStart/End
        const input = target;
        if (typeof input.selectionStart === 'number' &&
            typeof input.selectionEnd === 'number') {
            return input.selectionStart !== input.selectionEnd;
        }
        return false;
    })();
    return {
        inputFocus: isInput,
        hasSelection,
        chatFocus: _currentZone === 'chat',
        navigatorFocus: _currentZone === 'navigator',
        sidebarFocus: _currentZone === 'sidebar',
        menuOpen: hasOpenOverlay(),
    };
}
// ─────────────────────────────────────────────
// When-clause evaluator
// ─────────────────────────────────────────────
/**
 * Evaluate a when-clause expression against the current context.
 *
 * Syntax (subset of VSCode's when-clause syntax):
 *   undefined        → always true (action fires everywhere)
 *   'inputFocus'     → true when input has focus
 *   '!inputFocus'    → true when input does NOT have focus
 *   'a && b'         → logical AND (all terms must be true)
 *   'a || b'         → logical OR  (any group must be true)
 *   'a && !b || c'   → OR has lower precedence than AND
 *
 * @example evaluateWhen(undefined, ctx)                // always true
 * @example evaluateWhen('!inputFocus', ctx)            // outside text inputs
 * @example evaluateWhen('chatFocus && !hasSelection', ctx)
 */
export function evaluateWhen(when, ctx) {
    if (when === undefined)
        return true;
    // Split by || (OR groups) — any group must be true
    const orGroups = when.split(/\s*\|\|\s*/);
    return orGroups.some((group) => {
        // Split by && (AND terms) — all terms must be true
        const terms = group.split(/\s*&&\s*/);
        return terms.every((term) => {
            const trimmed = term.trim();
            const negated = trimmed.startsWith('!');
            const key = (negated ? trimmed.slice(1) : trimmed);
            const value = ctx[key] ?? false;
            return negated ? !value : value;
        });
    });
}
//# sourceMappingURL=keybinding-context.js.map