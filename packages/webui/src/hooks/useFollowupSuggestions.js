/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { INITIAL_FOLLOWUP_STATE } from '../types/followup.js';
// ---------------------------------------------------------------------------
// Controller (framework-agnostic)
// ---------------------------------------------------------------------------
/** Delay before showing suggestion after response completes */
const SUGGESTION_DELAY_MS = 300;
/** Debounce lock duration to prevent rapid-fire accepts */
const ACCEPT_DEBOUNCE_MS = 100;
function createFollowupController(options) {
    const { enabled = true, onStateChange, getOnAccept, onOutcome } = options;
    let currentState = INITIAL_FOLLOWUP_STATE;
    let timeoutId = null;
    let accepting = false;
    let acceptTimeoutId = null;
    function applyState(next) {
        currentState = next;
        onStateChange(next);
    }
    function clearTimers() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (acceptTimeoutId) {
            clearTimeout(acceptTimeoutId);
            acceptTimeoutId = null;
        }
    }
    const setSuggestion = (text) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (!text) {
            applyState(INITIAL_FOLLOWUP_STATE);
            return;
        }
        if (!enabled) {
            return;
        }
        timeoutId = setTimeout(() => {
            applyState({ suggestion: text, isVisible: true, shownAt: Date.now() });
        }, SUGGESTION_DELAY_MS);
    };
    const accept = (method, options) => {
        if (accepting) {
            return;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        accepting = true;
        const text = currentState.suggestion;
        const { shownAt } = currentState;
        if (!text) {
            accepting = false;
            return;
        }
        try {
            onOutcome?.({
                outcome: 'accepted',
                accept_method: method,
                time_ms: shownAt > 0 ? Date.now() - shownAt : 0,
                suggestion_length: text.length,
            });
        }
        catch (e) {
            console.error('[followup] onOutcome callback threw:', e);
        }
        applyState(INITIAL_FOLLOWUP_STATE);
        queueMicrotask(() => {
            try {
                if (!options?.skipOnAccept) {
                    getOnAccept?.()?.(text);
                }
            }
            catch (error) {
                console.error('[followup] onAccept callback threw:', error);
            }
            finally {
                if (acceptTimeoutId) {
                    clearTimeout(acceptTimeoutId);
                }
                acceptTimeoutId = setTimeout(() => {
                    accepting = false;
                }, ACCEPT_DEBOUNCE_MS);
            }
        });
    };
    const dismiss = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (!currentState.isVisible && !currentState.suggestion) {
            return;
        }
        if (currentState.isVisible && currentState.suggestion) {
            try {
                onOutcome?.({
                    outcome: 'ignored',
                    time_ms: currentState.shownAt > 0 ? Date.now() - currentState.shownAt : 0,
                    suggestion_length: currentState.suggestion.length,
                });
            }
            catch (e) {
                console.error('[followup] onOutcome callback threw:', e);
            }
        }
        applyState(INITIAL_FOLLOWUP_STATE);
    };
    const clear = () => {
        clearTimers();
        accepting = false;
        applyState(INITIAL_FOLLOWUP_STATE);
    };
    const cleanup = () => {
        clearTimers();
        accepting = false;
    };
    return { setSuggestion, accept, dismiss, clear, cleanup };
}
export function useFollowupSuggestions(options = {}) {
    const { enabled = true, onAccept, onOutcome } = options;
    const [state, setState] = useState(INITIAL_FOLLOWUP_STATE);
    const onAcceptRef = useRef(onAccept);
    onAcceptRef.current = onAccept;
    const onOutcomeRef = useRef(onOutcome);
    onOutcomeRef.current = onOutcome;
    const controller = useMemo(() => createFollowupController({
        enabled,
        onStateChange: setState,
        getOnAccept: () => onAcceptRef.current,
        onOutcome: (params) => onOutcomeRef.current?.(params),
    }), [enabled]);
    useEffect(() => {
        if (!enabled) {
            controller.clear();
        }
        return () => controller.cleanup();
    }, [controller, enabled]);
    const getPlaceholder = useCallback((defaultPlaceholder) => {
        if (state.isVisible && state.suggestion) {
            return state.suggestion;
        }
        return defaultPlaceholder;
    }, [state.isVisible, state.suggestion]);
    return useMemo(() => ({
        state,
        getPlaceholder,
        setSuggestion: controller.setSuggestion,
        accept: controller.accept,
        dismiss: controller.dismiss,
        clear: controller.clear,
    }), [state, getPlaceholder, controller]);
}
//# sourceMappingURL=useFollowupSuggestions.js.map