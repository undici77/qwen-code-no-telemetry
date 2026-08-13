/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef, useState } from 'react';
export function useDaemonResource(load, options) {
    const { autoLoad = false, enabled = true } = options;
    const [state, setState] = useState({
        data: undefined,
        loading: false,
        error: undefined,
    });
    const requestSeqRef = useRef(0);
    const reload = useCallback(async () => {
        if (!enabled)
            return undefined;
        const seq = ++requestSeqRef.current;
        setState((current) => ({
            ...current,
            loading: true,
            error: undefined,
        }));
        try {
            const data = await load();
            if (seq !== requestSeqRef.current)
                return undefined;
            setState({ data, loading: false, error: undefined });
            return data;
        }
        catch (error) {
            if (seq !== requestSeqRef.current)
                return undefined;
            const normalized = error instanceof Error ? error : new Error(String(error));
            setState((current) => ({
                ...current,
                loading: false,
                error: normalized,
            }));
            return undefined;
        }
    }, [enabled, load]);
    useEffect(() => {
        if (!autoLoad || !enabled)
            return;
        void reload();
    }, [autoLoad, enabled, reload]);
    return {
        ...state,
        reload,
    };
}
//# sourceMappingURL=useDaemonResource.js.map