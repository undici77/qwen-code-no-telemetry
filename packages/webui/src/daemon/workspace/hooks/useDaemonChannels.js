/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef } from 'react';
import { useDaemonWorkspace } from '../DaemonWorkspaceProvider.js';
import { useDaemonResource } from './useDaemonResource.js';
export function useDaemonChannels(options = {}) {
    const { actions, workspaceCwd } = useDaemonWorkspace();
    const enabled = options.enabled !== false && workspaceCwd !== undefined;
    const load = useCallback(async () => {
        if (!workspaceCwd) {
            throw new Error('Channel management requires a workspace.');
        }
        return {
            ...(await actions.loadChannels()),
            workspaceCwd,
        };
    }, [actions, workspaceCwd]);
    const resource = useDaemonResource(load, {
        ...options,
        autoLoad: false,
        enabled,
    });
    const resourceReload = resource.reload;
    const requestedRef = useRef(false);
    const previousWorkspaceRef = useRef(workspaceCwd);
    const reload = useCallback(async () => {
        requestedRef.current = true;
        return resourceReload();
    }, [resourceReload]);
    const reloadRef = useRef(reload);
    reloadRef.current = reload;
    useEffect(() => {
        const workspaceChanged = previousWorkspaceRef.current !== workspaceCwd;
        if (!enabled ||
            (options.autoLoad !== true && !(workspaceChanged && requestedRef.current))) {
            return;
        }
        previousWorkspaceRef.current = workspaceCwd;
        void reload();
    }, [enabled, options.autoLoad, reload, workspaceCwd]);
    const mutate = useCallback(async (operation) => {
        const result = await operation();
        await reloadRef.current();
        return result;
    }, []);
    const createOrUpdate = useCallback((name, request) => mutate(() => actions.upsertChannel(name, request)), [actions, mutate]);
    const remove = useCallback((name, request) => mutate(() => actions.removeChannel(name, request)), [actions, mutate]);
    const setStartup = useCallback((name, request) => mutate(() => actions.setChannelStartup(name, request)), [actions, mutate]);
    const start = useCallback((name) => mutate(() => actions.startChannel(name)), [actions, mutate]);
    const stop = useCallback((name) => mutate(() => actions.stopChannel(name)), [actions, mutate]);
    const restart = useCallback((name) => mutate(() => actions.restartChannel(name)), [actions, mutate]);
    const current = resource.data?.workspaceCwd === workspaceCwd ? resource.data : undefined;
    return {
        data: current
            ? { catalog: current.catalog, snapshot: current.snapshot }
            : undefined,
        loading: resource.loading,
        error: resource.error,
        reload,
        catalog: current?.catalog ?? [],
        snapshot: current?.snapshot,
        channels: current?.snapshot.instances ?? {},
        createOrUpdate,
        remove,
        setStartup,
        start,
        stop,
        restart,
        pairing: actions.channelPairing,
    };
}
//# sourceMappingURL=useDaemonChannels.js.map