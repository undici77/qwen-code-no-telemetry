/**
 * Event Processor Hook
 *
 * Provides the event processor for use in App.tsx.
 * Manages streaming state per session and returns processed events.
 */
import { useCallback, useRef } from 'react';
import * as Sentry from '@sentry/electron/renderer';
import { processEvent } from './processor';
import { createEmptySession } from './helpers';
/**
 * Report agent error/typed_error events to Sentry as exceptions (not messages).
 * Using captureException gives proper stack traces and better error grouping in Sentry.
 * Called as a side effect after the pure processEvent function returns.
 * Keeps the event processor handlers pure while capturing every agent error shown in chat.
 */
function captureAgentError(event) {
    if (event.type === 'error') {
        const errorEvent = event;
        Sentry.captureException(new Error(errorEvent.error), {
            tags: { errorSource: 'agent' },
            extra: { sessionId: event.sessionId },
        });
    }
    else if (event.type === 'typed_error') {
        const typedEvent = event;
        const title = typedEvent.error.title ?? 'Agent Error';
        Sentry.captureException(new Error(`${title}: ${typedEvent.error.message}`), {
            tags: {
                errorSource: 'agent',
                errorCode: typedEvent.error.code ?? 'unknown',
            },
            extra: {
                sessionId: event.sessionId,
                // Include error metadata for debugging but omit details/originalError
                // which may contain sensitive user content or file paths
                canRetry: typedEvent.error.canRetry,
            },
        });
    }
}
/**
 * Hook that provides the event processor
 *
 * Manages streaming state per session (replaces streamingTextRef).
 * All event processing goes through pure functions.
 */
export function useEventProcessor() {
    // Streaming state per session (not in React state - just a ref for accumulation)
    const streamingStates = useRef(new Map());
    const processAgentEvent = useCallback((event, currentSession, workspaceId) => {
        // Create empty session if needed
        const session = currentSession ?? createEmptySession(event.sessionId, workspaceId);
        // Build current state
        const currentState = {
            session,
            streaming: streamingStates.current.get(event.sessionId) ?? null,
        };
        // Process through pure function
        const result = processEvent(currentState, event);
        // Side effect: capture error events to Sentry (outside the pure processor)
        if (event.type === 'error' || event.type === 'typed_error') {
            captureAgentError(event);
        }
        // Update streaming state ref
        if (result.state.streaming) {
            streamingStates.current.set(event.sessionId, result.state.streaming);
        }
        else {
            streamingStates.current.delete(event.sessionId);
        }
        return {
            session: result.state.session,
            effects: result.effects,
        };
    }, []);
    const clearStreamingState = useCallback((sessionId) => {
        streamingStates.current.delete(sessionId);
    }, []);
    const getStreamingState = useCallback((sessionId) => {
        return streamingStates.current.get(sessionId) ?? null;
    }, []);
    return {
        processAgentEvent,
        clearStreamingState,
        getStreamingState,
    };
}
//# sourceMappingURL=useEventProcessor.js.map