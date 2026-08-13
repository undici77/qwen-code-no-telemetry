/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { sendUntrustedWorkspaceResponse, sendWorkspaceRuntimeUnavailable, } from '../workspace-route-runtime.js';
import { setDaemonTelemetryWorkspace } from '../server/telemetry.js';
export function requirePrimarySessionRuntime(workspaceRegistry, res) {
    const entry = workspaceRegistry.primaryEntry;
    const runtime = entry.state === 'active' ? entry.current?.runtime : undefined;
    if (runtime) {
        setDaemonTelemetryWorkspace(res, runtime.workspaceCwd);
        return runtime;
    }
    sendWorkspaceRuntimeUnavailable(res, entry);
    return undefined;
}
export function requireSessionRuntime(opts) {
    const { sessionId, route, res, workspaceRegistry, daemonLog, details = {}, } = opts;
    if (workspaceRegistry.listEntries().length === 1) {
        return requirePrimarySessionRuntime(workspaceRegistry, res);
    }
    const resolution = workspaceRegistry.resolveLiveSessionOwner(sessionId);
    if (resolution.kind === 'found') {
        const runtime = resolution.runtime;
        setDaemonTelemetryWorkspace(res, runtime.workspaceCwd);
        if (!runtime.primary && !runtime.trusted) {
            daemonLog?.warn('session routing failed', {
                route,
                resolutionKind: 'untrusted_workspace',
                sessionId,
                workspaceId: runtime.workspaceId,
                workspaceCwd: runtime.workspaceCwd,
                ...details,
            });
            sendUntrustedWorkspaceResponse(res, {
                sessionId,
                workspaceCwd: runtime.workspaceCwd,
                workspaceId: runtime.workspaceId,
            });
            return undefined;
        }
        return runtime;
    }
    if (resolution.kind === 'not_found') {
        daemonLog?.warn('session routing failed', {
            route,
            resolutionKind: 'not_found',
            sessionId,
            ...details,
        });
        res.status(404).json({
            error: `No session with id "${sessionId}"`,
            code: 'session_not_found',
            sessionId,
        });
        return undefined;
    }
    const workspaceIds = resolution.runtimes.map((runtime) => runtime.workspaceId);
    daemonLog?.warn('session routing failed', {
        route,
        resolutionKind: 'ambiguous',
        sessionId,
        workspaceIds,
        ...details,
    });
    res.status(500).json({
        error: `Session owner is ambiguous for "${sessionId}"`,
        code: 'ambiguous_session_owner',
        sessionId,
        route,
        workspaceIds,
    });
    return undefined;
}
//# sourceMappingURL=session-runtime.js.map