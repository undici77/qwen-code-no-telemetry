/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Prompt Suggestion Hook for CLI
 *
 * Thin React wrapper around the framework-agnostic controller from core.
 */
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { INITIAL_FOLLOWUP_STATE, createFollowupController, logPromptSuggestion, PromptSuggestionEvent, } from '@qwen-code/qwen-code-core';
/**
 * Hook for managing prompt suggestions in CLI.
 *
 * Delegates all timer/debounce/state logic to the shared
 * `createFollowupController` from core.
 */
export function useFollowupSuggestionsCLI(options = {}) {
    const { enabled = true, onAccept, config, isFocused = true } = options;
    const [state, setState] = useState(INITIAL_FOLLOWUP_STATE);
    // Keep mutable refs so the controller always sees the latest callbacks
    const onAcceptRef = useRef(onAccept);
    onAcceptRef.current = onAccept;
    const configRef = useRef(config);
    configRef.current = config;
    // Engagement tracking refs
    const firstKeystrokeAtRef = useRef(0);
    const prevShownAtRef = useRef(0);
    const wasFocusedWhenShownRef = useRef(true);
    // Track when a new suggestion appears (in useEffect to avoid render-time side effects)
    useEffect(() => {
        if (state.shownAt > 0 && state.shownAt !== prevShownAtRef.current) {
            prevShownAtRef.current = state.shownAt;
            wasFocusedWhenShownRef.current = isFocused;
            firstKeystrokeAtRef.current = 0;
        }
        else if (state.shownAt === 0) {
            prevShownAtRef.current = 0;
        }
    }, [state.shownAt, isFocused]);
    const recordKeystroke = useCallback(() => {
        if (firstKeystrokeAtRef.current === 0 && state.isVisible) {
            firstKeystrokeAtRef.current = Date.now();
        }
    }, [state.isVisible]);
    // Telemetry callback from controller (accept/dismiss)
    const onOutcome = useCallback((params) => {
        const cfg = configRef.current;
        if (!cfg)
            return;
        logPromptSuggestion(cfg, new PromptSuggestionEvent({
            outcome: params.outcome,
            accept_method: params.accept_method,
            ...(params.outcome === 'accepted'
                ? { time_to_accept_ms: params.time_ms }
                : { time_to_ignore_ms: params.time_ms }),
            ...(firstKeystrokeAtRef.current > 0 &&
                prevShownAtRef.current > 0 && {
                time_to_first_keystroke_ms: firstKeystrokeAtRef.current - prevShownAtRef.current,
            }),
            suggestion_length: params.suggestion_length,
            similarity: params.outcome === 'accepted' ? 1.0 : 0.0,
            was_focused_when_shown: wasFocusedWhenShownRef.current,
        }));
    }, []);
    // Create the controller once — it is stable across renders
    const controller = useMemo(() => createFollowupController({
        enabled,
        onStateChange: setState,
        getOnAccept: () => onAcceptRef.current,
        onOutcome,
    }), [enabled, onOutcome]);
    // Clear state when disabled; clean up timers on unmount
    useEffect(() => {
        if (!enabled) {
            controller.clear();
        }
        return () => controller.cleanup();
    }, [controller, enabled]);
    return useMemo(() => ({
        state,
        setSuggestion: controller.setSuggestion,
        accept: controller.accept,
        dismiss: controller.dismiss,
        clear: controller.clear,
        recordKeystroke,
    }), [state, controller, recordKeystroke]);
}
//# sourceMappingURL=useFollowupSuggestions.js.map