/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createDebugLogger } from '@qwen-code/qwen-code-core';
import { Command, keyMatchers } from '../keyMatchers.js';
import { escapeAnsiCtrlCodes } from '../utils/textUtils.js';
const VOICE_ERROR_RETRY_DELAY_MS = 2000;
const PREVIOUS_STOP_WAIT_TIMEOUT_MS = 5000;
// Terminals emit no key-up event. In hold mode we infer release from the gap
// between auto-repeat keypresses: arm a longer timer on first press (covers the
// OS initial-repeat delay), then a short timer on each repeat. When repeats stop
// (key released) the timer fires and we finalize. Requires terminal key repeat.
// Kept above typical OS initial key-repeat delays so a held key isn't cut off
// before its first auto-repeat arrives (which would truncate the utterance).
const HOLD_FIRST_PRESS_RELEASE_MS = 800;
const HOLD_REPEAT_RELEASE_MS = 250;
const debugLogger = createDebugLogger('VOICE_INPUT');
function formatError(error) {
    return error instanceof Error ? error.message : String(error);
}
function waitForPreviousStop(stopPromise) {
    if (!stopPromise) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const timer = setTimeout(resolve, PREVIOUS_STOP_WAIT_TIMEOUT_MS);
        void stopPromise
            .catch(() => undefined)
            .then(() => {
            clearTimeout(timer);
            resolve();
        });
    });
}
function insertTranscript(buffer, transcript) {
    const text = escapeAnsiCtrlCodes(transcript).trim();
    if (!text) {
        return null;
    }
    const needsSpace = buffer.text.length > 0 && !/\s$/.test(buffer.text);
    const segment = needsSpace ? ` ${text}` : text;
    // buffer.text is the pre-insert (rendered) value and buffer.insert dispatches
    // async, so compute the resulting prompt text now for callers that submit
    // immediately (tap mode) instead of reading the stale buffer.text back.
    const resulting = buffer.text + segment;
    buffer.insert(segment);
    return resulting;
}
function isCancelKey(key) {
    return key.name === 'escape' || (key.ctrl && key.name === 'c');
}
function logRecorderStopError(error) {
    debugLogger.warn('[voice] recorder stop failed:', error);
}
export function useVoiceInput({ enabled, mode = 'hold', voiceModel, buffer, addItem, createRecorder, transcribe, refine, onSubmit, warmup, streaming, openStream, }) {
    const [status, setStatus] = useState('idle');
    const [interimText, setInterimText] = useState('');
    const [audioLevel, setAudioLevelState] = useState(0);
    const statusRef = useRef('idle');
    const recorderRef = useRef(null);
    const startPromiseRef = useRef(null);
    const stopPromiseRef = useRef(null);
    const retryAfterErrorAtRef = useRef(0);
    const mountedRef = useRef(true);
    const cancelRecordingRef = useRef(() => { });
    const releaseTimerRef = useRef(null);
    const finalizeRef = useRef(() => { });
    const refineAbortRef = useRef(null);
    const streamSessionRef = useRef(null);
    const streamSessionPromiseRef = useRef(null);
    const pumpTimerRef = useRef(null);
    const sessionIdRef = useRef(0);
    const isStreaming = streaming === true && typeof openStream === 'function';
    const clearPump = useCallback(() => {
        if (pumpTimerRef.current) {
            clearInterval(pumpTimerRef.current);
            pumpTimerRef.current = null;
        }
    }, []);
    const resetStreamUi = useCallback(() => {
        if (mountedRef.current) {
            setInterimText('');
            setAudioLevelState(0);
        }
    }, []);
    const setVoiceStatus = useCallback((next) => {
        statusRef.current = next;
        if (mountedRef.current) {
            setStatus(next);
        }
    }, []);
    const clearReleaseTimer = useCallback(() => {
        if (releaseTimerRef.current) {
            clearTimeout(releaseTimerRef.current);
            releaseTimerRef.current = null;
        }
    }, []);
    const reportError = useCallback((error) => {
        retryAfterErrorAtRef.current = Date.now() + VOICE_ERROR_RETRY_DELAY_MS;
        addItem?.({
            type: 'error',
            text: `Voice transcription failed: ${formatError(error)}`,
        }, Date.now());
    }, [addItem]);
    const stopRecorderQuietly = useCallback(async (recorder) => {
        try {
            await recorder.stop();
        }
        catch (error) {
            logRecorderStopError(error);
        }
    }, []);
    const isCurrentSession = useCallback((recorder, sessionId) => recorderRef.current === recorder && sessionIdRef.current === sessionId, []);
    const handleStreamError = useCallback((recorder, sessionId, error) => {
        if (!isCurrentSession(recorder, sessionId)) {
            return;
        }
        clearReleaseTimer();
        clearPump();
        streamSessionRef.current?.abort();
        streamSessionRef.current = null;
        streamSessionPromiseRef.current = null;
        recorderRef.current = null;
        startPromiseRef.current = null;
        void stopRecorderQuietly(recorder);
        setVoiceStatus('idle');
        resetStreamUi();
        reportError(error);
    }, [
        clearPump,
        clearReleaseTimer,
        isCurrentSession,
        reportError,
        resetStreamUi,
        setVoiceStatus,
        stopRecorderQuietly,
    ]);
    const updateAudioLevel = useCallback((recorder, sessionId) => {
        if (!isCurrentSession(recorder, sessionId))
            return;
        const level = recorder.audioLevel?.();
        if (typeof level === 'number' && mountedRef.current) {
            setAudioLevelState(level);
        }
    }, [isCurrentSession]);
    const startRecording = useCallback((silenceDetection) => {
        const recorder = createRecorder();
        const sessionId = ++sessionIdRef.current;
        recorderRef.current = recorder;
        setVoiceStatus('recording');
        if (mountedRef.current) {
            setInterimText('');
            setAudioLevelState(0);
        }
        const startPromise = waitForPreviousStop(stopPromiseRef.current)
            .then(() => Promise.resolve(recorder.start({
            silenceDetection,
            onAutoStop: () => finalizeRef.current(true),
        })))
            .then(async () => {
            if (!isStreaming) {
                if (statusRef.current !== 'recording') {
                    return;
                }
                pumpTimerRef.current = setInterval(() => {
                    updateAudioLevel(recorder, sessionId);
                }, 100);
                return;
            }
            // Streaming: open the WS session and pump drained PCM into it while
            // recording, surfacing partial transcripts live.
            if (!isCurrentSession(recorder, sessionId)) {
                return;
            }
            if (recorder.supportsStreaming?.() === false) {
                throw new Error('Streaming voice transcription requires native audio capture. Install/rebuild @qwen-code/audio-capture or switch voiceModel to qwen3-asr-flash for batch transcription.');
            }
            const streamPromise = openStream({
                onInterim: (text) => {
                    if (mountedRef.current && isCurrentSession(recorder, sessionId)) {
                        setInterimText(text);
                    }
                },
                onError: (error) => handleStreamError(recorder, sessionId, error),
            });
            streamSessionPromiseRef.current = streamPromise;
            const session = await streamPromise;
            if (!isCurrentSession(recorder, sessionId)) {
                session.abort();
                void stopRecorderQuietly(recorder);
                return;
            }
            streamSessionRef.current = session;
            if (statusRef.current !== 'recording') {
                return;
            }
            pumpTimerRef.current = setInterval(() => {
                try {
                    if (!isCurrentSession(recorder, sessionId))
                        return;
                    const active = recorderRef.current;
                    if (!active)
                        return;
                    const pcm = active.drain?.();
                    if (pcm && pcm.length > 0)
                        session.pushAudio(pcm);
                    updateAudioLevel(active, sessionId);
                }
                catch (error) {
                    clearPump();
                    clearReleaseTimer();
                    const pendingStreamPromise = streamSessionRef.current
                        ? null
                        : streamSessionPromiseRef.current;
                    streamSessionRef.current?.abort();
                    streamSessionRef.current = null;
                    streamSessionPromiseRef.current = null;
                    void pendingStreamPromise
                        ?.then((pendingSession) => pendingSession.abort())
                        .catch(() => { });
                    const active = recorderRef.current;
                    recorderRef.current = null;
                    startPromiseRef.current = null;
                    if (active) {
                        void stopRecorderQuietly(active);
                    }
                    setVoiceStatus('idle');
                    resetStreamUi();
                    reportError(error);
                }
            }, 100);
        });
        startPromiseRef.current = startPromise;
        void startPromise.catch((error) => {
            if (isCurrentSession(recorder, sessionId) &&
                statusRef.current === 'recording') {
                recorderRef.current = null;
                startPromiseRef.current = null;
                clearReleaseTimer();
                clearPump();
                void stopRecorderQuietly(recorder);
                streamSessionRef.current?.abort();
                streamSessionRef.current = null;
                void streamSessionPromiseRef.current
                    ?.then((session) => session.abort())
                    .catch(() => { });
                streamSessionPromiseRef.current = null;
                setVoiceStatus('idle');
                resetStreamUi();
                if (!(error instanceof Error && /empty audio/i.test(error.message))) {
                    reportError(error);
                }
            }
        });
    }, [
        clearPump,
        clearReleaseTimer,
        createRecorder,
        handleStreamError,
        isCurrentSession,
        isStreaming,
        openStream,
        reportError,
        resetStreamUi,
        setVoiceStatus,
        stopRecorderQuietly,
        updateAudioLevel,
    ]);
    // Stop the active recorder, transcribe, and insert. In tap mode (submit) the
    // prompt is auto-submitted; in hold mode the transcript is inserted only.
    const finalize = useCallback((submit) => {
        const recorder = recorderRef.current;
        // Single-shot guard: a tap-stop and the native silence auto-stop can both
        // fire. setVoiceStatus below flips statusRef synchronously, so the second
        // concurrent call sees a non-'recording' status here and bails — avoiding
        // a double recorder.stop() and the spurious "transcription failed" error.
        if (!recorder || !voiceModel || statusRef.current !== 'recording') {
            return;
        }
        const sessionId = sessionIdRef.current;
        clearReleaseTimer();
        clearPump();
        const startPromise = startPromiseRef.current ?? Promise.resolve();
        const wasStreaming = isStreaming;
        setVoiceStatus('transcribing');
        void startPromise
            .then(async () => {
            const session = streamSessionRef.current ??
                (wasStreaming ? await streamSessionPromiseRef.current : null);
            if (session) {
                // Push any remaining audio, tear down the device, then flush the
                // stream and await the final transcript.
                try {
                    const pcm = recorder.drain?.();
                    if (pcm && pcm.length > 0)
                        session.pushAudio(pcm);
                    await stopRecorderQuietly(recorder);
                }
                catch (error) {
                    // drain()/pushAudio can throw (native crash); abort so the
                    // WebSocket isn't left open until the server idle-timeout.
                    session.abort();
                    throw error;
                }
                return session.finish();
            }
            const audio = await recorder.stop();
            return transcribe(audio, { voiceModel });
        })
            .then(async (transcript) => {
            if (!mountedRef.current || !isCurrentSession(recorder, sessionId)) {
                return;
            }
            let finalText = transcript;
            if (refine) {
                const escaped = escapeAnsiCtrlCodes(transcript).trim();
                if (escaped) {
                    // refine() never throws (falls back to its input), so a failed
                    // cleanup still inserts the raw transcript.
                    setVoiceStatus('refining');
                    const controller = new AbortController();
                    refineAbortRef.current = controller;
                    try {
                        finalText = await refine(escaped, controller.signal);
                    }
                    finally {
                        if (refineAbortRef.current === controller) {
                            refineAbortRef.current = null;
                        }
                    }
                    // A cancel or a new recording during refinement invalidates this
                    // result — drop it instead of inserting into a changed buffer.
                    if (!mountedRef.current ||
                        !isCurrentSession(recorder, sessionId)) {
                        return;
                    }
                }
            }
            const inserted = insertTranscript(buffer, finalText);
            if (submit && inserted !== null) {
                // Pass the resulting prompt text explicitly — buffer.text hasn't
                // re-rendered yet after the async insert.
                onSubmit?.(inserted);
            }
        })
            .catch((error) => {
            if (!isCurrentSession(recorder, sessionId)) {
                return;
            }
            if (wasStreaming) {
                void stopRecorderQuietly(recorder);
            }
            // A too-short/empty capture (quick tap, or cold-start race) isn't a
            // real failure — silently return to idle instead of a scary error.
            if (error instanceof Error && /empty audio/i.test(error.message)) {
                return;
            }
            reportError(error);
        })
            .finally(() => {
            if (!isCurrentSession(recorder, sessionId))
                return;
            recorderRef.current = null;
            streamSessionRef.current = null;
            streamSessionPromiseRef.current = null;
            startPromiseRef.current = null;
            setVoiceStatus('idle');
            resetStreamUi();
        });
    }, [
        buffer,
        clearPump,
        clearReleaseTimer,
        isCurrentSession,
        stopRecorderQuietly,
        isStreaming,
        onSubmit,
        refine,
        reportError,
        resetStreamUi,
        setVoiceStatus,
        transcribe,
        voiceModel,
    ]);
    finalizeRef.current = finalize;
    const cancelRecording = useCallback(() => {
        sessionIdRef.current += 1;
        clearReleaseTimer();
        clearPump();
        // Cancel any in-flight transcript refinement; the bumped sessionId already
        // drops its result, this just stops the wasted request.
        refineAbortRef.current?.abort();
        refineAbortRef.current = null;
        const session = streamSessionRef.current;
        streamSessionRef.current = null;
        session?.abort();
        void streamSessionPromiseRef.current
            ?.then((pendingSession) => pendingSession.abort())
            .catch(() => { });
        streamSessionPromiseRef.current = null;
        resetStreamUi();
        const recorder = recorderRef.current;
        setVoiceStatus('idle');
        if (!recorder) {
            return;
        }
        const startPromise = startPromiseRef.current ?? Promise.resolve();
        recorderRef.current = null;
        startPromiseRef.current = null;
        const stopPromise = startPromise
            .then(async () => {
            await recorder.stop();
        })
            .catch(logRecorderStopError)
            .finally(() => {
            if (recorderRef.current === null) {
                setVoiceStatus('idle');
            }
        });
        stopPromiseRef.current = stopPromise;
        void stopPromise.finally(() => {
            if (stopPromiseRef.current === stopPromise) {
                stopPromiseRef.current = null;
            }
        });
    }, [clearPump, clearReleaseTimer, resetStreamUi, setVoiceStatus]);
    cancelRecordingRef.current = cancelRecording;
    const armReleaseTimer = useCallback((ms) => {
        clearReleaseTimer();
        releaseTimerRef.current = setTimeout(() => {
            releaseTimerRef.current = null;
            finalizeRef.current(false);
        }, ms);
    }, [clearReleaseTimer]);
    // Preload the recorder backend when voice turns on, so the first keypress
    // isn't delayed by a cold native-module load (which would otherwise race the
    // hold-release timer and capture nothing).
    useEffect(() => {
        if (enabled && voiceModel) {
            void Promise.resolve(warmup?.()).catch(() => { });
        }
    }, [enabled, voiceModel, warmup]);
    useEffect(() => {
        if (enabled && voiceModel) {
            return;
        }
        cancelRecording();
    }, [cancelRecording, enabled, voiceModel]);
    useEffect(() => {
        // Reset on (re)mount so StrictMode's mount→unmount→remount (active when
        // DEBUG is set) doesn't leave mountedRef stuck false, which would no-op
        // every gated setState and freeze the voice UI.
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            cancelRecordingRef.current();
        };
    }, []);
    const handleKeypress = useCallback((key) => {
        if (!enabled ||
            !voiceModel ||
            !keyMatchers[Command.VOICE_PUSH_TO_TALK](key)) {
            if (statusRef.current !== 'idle' && isCancelKey(key)) {
                cancelRecording();
                return true;
            }
            return false;
        }
        if (statusRef.current === 'idle') {
            if (Date.now() < retryAfterErrorAtRef.current) {
                return true;
            }
            if (mode === 'hold') {
                startRecording(false);
                armReleaseTimer(HOLD_FIRST_PRESS_RELEASE_MS);
            }
            else {
                startRecording(true);
            }
            return true;
        }
        if (statusRef.current === 'recording') {
            if (mode === 'hold') {
                // Auto-repeat keypress while held: keep alive until repeats stop.
                armReleaseTimer(HOLD_REPEAT_RELEASE_MS);
            }
            else {
                finalize(true);
            }
            return true;
        }
        return true;
    }, [
        armReleaseTimer,
        cancelRecording,
        enabled,
        finalize,
        mode,
        startRecording,
        voiceModel,
    ]);
    return { status, interimText, audioLevel, handleKeypress };
}
//# sourceMappingURL=use-voice-input.js.map