/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@qwen-code/webui/daemon-react-sdk';
const LIVE_FEATURE = 'realtime_voice';
const POLL_INTERVAL_MS = 1_000;
function unavailableStatus(message) {
    return {
        v: 1,
        available: false,
        state: 'error',
        shortcut: '',
        message,
    };
}
export function useLiveVoice() {
    const workspace = useWorkspace();
    const supported = (workspace.capabilities?.features ?? []).includes(LIVE_FEATURE);
    const [status, setStatus] = useState();
    const [loading, setLoading] = useState(false);
    const [mutating, setMutating] = useState(false);
    const mountedRef = useRef(true);
    const generationRef = useRef(0);
    const contextRef = useRef({ client: workspace.client, supported });
    const requestRef = useRef(undefined);
    const mutationRef = useRef(undefined);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);
    const refresh = useCallback(async () => {
        if (!supported)
            return;
        const generation = generationRef.current;
        if (mutationRef.current === generation)
            return;
        if (requestRef.current?.generation === generation) {
            return await requestRef.current.promise;
        }
        const request = (async () => {
            setLoading(true);
            try {
                const next = await workspace.client.liveStatus();
                if (mountedRef.current && generationRef.current === generation) {
                    setStatus(next);
                }
            }
            catch (error) {
                if (mountedRef.current && generationRef.current === generation) {
                    setStatus(unavailableStatus(error instanceof Error ? error.message : String(error)));
                }
            }
            finally {
                if (mountedRef.current && generationRef.current === generation) {
                    setLoading(false);
                }
                if (requestRef.current?.generation === generation) {
                    requestRef.current = undefined;
                }
            }
        })();
        requestRef.current = { generation, promise: request };
        return await request;
    }, [supported, workspace.client]);
    useEffect(() => {
        if (contextRef.current.client !== workspace.client ||
            contextRef.current.supported !== supported) {
            contextRef.current = { client: workspace.client, supported };
            generationRef.current += 1;
            mutationRef.current = undefined;
        }
        setStatus(undefined);
        setLoading(false);
        setMutating(false);
        if (!supported)
            return undefined;
        void refresh();
        const timer = window.setInterval(() => {
            if (document.visibilityState === 'visible')
                void refresh();
        }, POLL_INTERVAL_MS);
        const onVisible = () => {
            if (document.visibilityState === 'visible')
                void refresh();
        };
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onVisible);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onVisible);
        };
    }, [refresh, supported, workspace.client]);
    const mutate = useCallback(async (operation) => {
        const generation = generationRef.current;
        if (mutationRef.current === generation)
            return;
        generationRef.current += 1;
        const mutationGeneration = generationRef.current;
        mutationRef.current = mutationGeneration;
        setLoading(false);
        setMutating(true);
        try {
            const next = await operation();
            if (mountedRef.current &&
                generationRef.current === mutationGeneration) {
                setStatus(next);
            }
        }
        catch (error) {
            if (mountedRef.current &&
                generationRef.current === mutationGeneration) {
                setStatus(unavailableStatus(error instanceof Error ? error.message : String(error)));
            }
        }
        finally {
            if (mutationRef.current === mutationGeneration) {
                mutationRef.current = undefined;
                if (mountedRef.current)
                    setMutating(false);
            }
        }
    }, []);
    const start = useCallback(async (mode = 'resume') => mutate(() => workspace.client.startLive(mode)), [mutate, workspace.client]);
    const stop = useCallback(async () => mutate(() => workspace.client.stopLive()), [mutate, workspace.client]);
    const setMute = useCallback(async (update) => mutate(() => workspace.client.setLiveMute(update)), [mutate, workspace.client]);
    return {
        supported,
        status,
        loading,
        mutating,
        refresh,
        start,
        stop,
        setMute,
    };
}
//# sourceMappingURL=useLiveVoice.js.map