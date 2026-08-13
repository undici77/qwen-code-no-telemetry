/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionService, } from '@qwen-code/qwen-code-core';
import { SessionArchivedError, SessionArchivingError, SessionConflictError, SessionNotArchivedError, SessionNotFoundError, } from '../acp-session-bridge.js';
import { writeStderrLine } from '../../utils/stdioHelpers.js';
import { safeLogValue } from './request-helpers.js';
import { disableTasksForSessions, enableTasksForSessions, removeTasksForSessions, } from '../scheduled-task-session-lifecycle.js';
export class DaemonDrainingError extends Error {
    name = 'DaemonDrainingError';
    code = 'daemon_draining';
    constructor() {
        super('The daemon is draining and no longer accepts session maintenance.');
    }
}
export class SessionArchiveCoordinator {
    exclusive = new Set();
    shared = new Map();
    maintenanceSealed = false;
    activeMaintenance = 0;
    maintenanceDrain;
    assertNotTransitioning(sessionId) {
        if (this.exclusive.has(sessionId)) {
            throw new SessionArchivingError(sessionId);
        }
    }
    async runExclusiveMany(sessionIds, fn) {
        if (this.maintenanceSealed) {
            throw new DaemonDrainingError();
        }
        const uniqueSessionIds = [...new Set(sessionIds)];
        for (const sessionId of uniqueSessionIds) {
            this.assertNotTransitioning(sessionId);
            if ((this.shared.get(sessionId) ?? 0) > 0) {
                throw new SessionArchivingError(sessionId, 'shared');
            }
        }
        for (const sessionId of uniqueSessionIds) {
            this.exclusive.add(sessionId);
        }
        this.activeMaintenance++;
        try {
            return await fn();
        }
        finally {
            for (const sessionId of uniqueSessionIds) {
                this.exclusive.delete(sessionId);
            }
            this.activeMaintenance--;
            if (this.activeMaintenance === 0) {
                this.maintenanceDrain?.resolve();
                this.maintenanceDrain = undefined;
            }
        }
    }
    sealMaintenanceAndWait() {
        this.maintenanceSealed = true;
        if (this.activeMaintenance === 0) {
            return Promise.resolve();
        }
        if (!this.maintenanceDrain) {
            let resolve;
            const promise = new Promise((done) => {
                resolve = done;
            });
            this.maintenanceDrain = { promise, resolve };
        }
        return this.maintenanceDrain.promise;
    }
    async runSharedMany(sessionIds, fn) {
        const uniqueSessionIds = [...new Set(sessionIds)];
        for (const sessionId of uniqueSessionIds) {
            this.assertNotTransitioning(sessionId);
        }
        for (const sessionId of uniqueSessionIds) {
            this.shared.set(sessionId, (this.shared.get(sessionId) ?? 0) + 1);
        }
        try {
            return await fn();
        }
        finally {
            for (const sessionId of uniqueSessionIds) {
                const count = (this.shared.get(sessionId) ?? 1) - 1;
                if (count <= 0) {
                    this.shared.delete(sessionId);
                }
                else {
                    this.shared.set(sessionId, count);
                }
            }
        }
    }
}
async function runWithDaemonWriterLease(params) {
    const { action, sessionId, service, mutate, mutationAppliedAfterError, afterMutationApplied, } = params;
    let lease;
    try {
        lease = await service.acquireSessionWriterLease(sessionId, {
            processKind: 'daemon',
            reclaimPolicy: 'never',
        });
    }
    catch (error) {
        return { mutationApplied: false, error };
    }
    let value;
    let mutationApplied = false;
    let mutationError;
    try {
        const mutation = await mutate(() => lease.assertOwnedAndUnchanged());
        value = mutation.value;
        mutationApplied = mutation.mutationApplied;
    }
    catch (error) {
        mutationError = error;
        try {
            mutationApplied = await mutationAppliedAfterError();
        }
        catch {
            mutationApplied = false;
        }
    }
    let maintenanceError;
    if (mutationApplied) {
        try {
            await afterMutationApplied();
        }
        catch (error) {
            maintenanceError = error;
            logSessionArchiveWarning(`scheduled task lifecycle update failed action=${action} workspace=${safeLogValue(service.getProjectRoot())} session=${safeLogValue(sessionId)} error=${safeLogValue(errorMessage(error))}`);
        }
    }
    let releaseError;
    try {
        await lease.release();
    }
    catch (error) {
        releaseError = error;
    }
    if (releaseError !== undefined) {
        logMaintenanceLeaseReleaseFailure({
            action,
            workspace: service.getProjectRoot(),
            sessionId,
            error: releaseError,
            mutationApplied,
        });
        if (mutationError !== undefined) {
            logSessionArchiveWarning(`session maintenance mutation also failed action=${action} workspace=${safeLogValue(service.getProjectRoot())} session=${safeLogValue(sessionId)} error=${safeLogValue(errorMessage(mutationError))}`);
        }
        return { mutationApplied, error: releaseError, maintenanceError };
    }
    if (mutationError !== undefined) {
        return { mutationApplied, error: mutationError, maintenanceError };
    }
    return { value, mutationApplied, maintenanceError };
}
function logMaintenanceLeaseReleaseFailure(params) {
    const errorKind = typeof params.error === 'object' &&
        params.error !== null &&
        typeof params.error.errorKind === 'string'
        ? params.error.errorKind
        : 'unknown';
    logSessionArchiveWarning(`session maintenance lease release failed action=${params.action} workspace=${safeLogValue(params.workspace)} session=${safeLogValue(params.sessionId)} errorKind=${safeLogValue(errorKind)} mutationApplied=${params.mutationApplied}`);
}
async function classifySessionLocation(service, sessionId) {
    return service.getSessionLocation(sessionId);
}
function sessionLocationError(sessionId) {
    return new Error(`Session archive conflict: ${sessionId}`);
}
function updateScheduledTaskForMaintenance(service, sessionId, action) {
    if (action === 'archive') {
        return disableTasksForSessions(service.getProjectRoot(), [sessionId]);
    }
    if (action === 'unarchive') {
        return enableTasksForSessions(service.getProjectRoot(), [sessionId]);
    }
    return removeTasksForSessions(service.getProjectRoot(), [sessionId]);
}
async function deletePersistedSessionWithLease(service, sessionId) {
    const initialLocation = await classifySessionLocation(service, sessionId);
    if (initialLocation === undefined) {
        return { kind: 'notFound', mutationApplied: false };
    }
    if (initialLocation === 'conflict') {
        return {
            kind: 'error',
            error: sessionLocationError(sessionId),
            mutationApplied: false,
        };
    }
    const mutation = await runWithDaemonWriterLease({
        action: 'delete',
        sessionId,
        service,
        mutate: async (assertOwnedAndUnchanged) => {
            const lockedLocation = await classifySessionLocation(service, sessionId);
            if (lockedLocation === undefined) {
                return {
                    value: 'notFound',
                    mutationApplied: false,
                };
            }
            if (lockedLocation === 'conflict') {
                throw sessionLocationError(sessionId);
            }
            await assertOwnedAndUnchanged();
            const removed = await service.removeSession(sessionId);
            return {
                value: removed ? 'removed' : 'notFound',
                mutationApplied: removed,
            };
        },
        mutationAppliedAfterError: async () => (await classifySessionLocation(service, sessionId)) === undefined,
        afterMutationApplied: () => updateScheduledTaskForMaintenance(service, sessionId, 'delete'),
    });
    if (mutation.error !== undefined) {
        return {
            kind: 'error',
            error: mutation.error,
            mutationApplied: mutation.mutationApplied,
        };
    }
    return {
        kind: mutation.value ?? 'notFound',
        mutationApplied: mutation.mutationApplied,
    };
}
export async function deleteDaemonSessions(params) {
    const { sessionIds, service, bridge, coordinator, onError } = params;
    const uniqueSessionIds = [...new Set(sessionIds)];
    for (const sessionId of uniqueSessionIds) {
        coordinator.assertNotTransitioning(sessionId);
    }
    const results = await Promise.all(uniqueSessionIds.map(async (sessionId) => {
        try {
            return await coordinator.runExclusiveMany([sessionId], async () => {
                try {
                    await bridge.closeSession(sessionId);
                }
                catch (error) {
                    if (isSessionNotFoundError(error)) {
                        const result = await deletePersistedSessionWithLease(service, sessionId);
                        if (result.kind === 'error') {
                            onError?.({
                                phase: 'remove',
                                sessionId,
                                error: errorMessage(result.error),
                            });
                        }
                        return result;
                    }
                    onError?.({
                        phase: 'close',
                        sessionId,
                        error: errorMessage(error),
                    });
                    return {
                        kind: 'error',
                        error,
                        mutationApplied: false,
                    };
                }
                const result = await deletePersistedSessionWithLease(service, sessionId);
                if (result.kind === 'error') {
                    onError?.({
                        phase: 'remove',
                        sessionId,
                        error: errorMessage(result.error),
                    });
                }
                return result;
            });
        }
        catch (error) {
            if (error instanceof DaemonDrainingError) {
                throw error;
            }
            onError?.({
                phase: 'delete',
                sessionId,
                error: errorMessage(error),
            });
            return {
                kind: 'error',
                error,
                mutationApplied: false,
            };
        }
    }));
    const removed = [];
    const notFound = [];
    const errors = [];
    for (let i = 0; i < results.length; i++) {
        const sessionId = uniqueSessionIds[i];
        const result = results[i];
        if (result.kind === 'removed') {
            removed.push(sessionId);
        }
        else if (result.kind === 'notFound') {
            notFound.push(sessionId);
        }
        else {
            errors.push({ sessionId, error: errorMessage(result.error) });
        }
    }
    return { removed, notFound, errors };
}
export async function deleteDaemonSessionIfOrphan(params) {
    const { sessionId, service, bridge, coordinator } = params;
    coordinator.assertNotTransitioning(sessionId);
    const result = await coordinator.runExclusiveMany([sessionId], async () => {
        let killed = false;
        try {
            killed = await bridge.killSession(sessionId, {
                requireZeroAttaches: true,
            });
        }
        catch (error) {
            if (!isSessionNotFoundError(error))
                throw error;
            killed = true;
        }
        if (!killed) {
            return undefined;
        }
        return deletePersistedSessionWithLease(service, sessionId);
    });
    if (result === undefined) {
        return false;
    }
    if (result.kind === 'error') {
        throw result.error;
    }
    return true;
}
export async function assertSessionLoadable(workspaceCwd, sessionId, runtimeBaseDir) {
    const location = await new SessionService(workspaceCwd, {
        runtimeBaseDir,
    }).getSessionLocation(sessionId);
    if (location === 'archived') {
        throw new SessionArchivedError(sessionId);
    }
    if (location === 'conflict') {
        throw new SessionConflictError(sessionId);
    }
    return location;
}
export async function assertSessionArchived(workspaceCwd, sessionId, runtimeBaseDir) {
    const location = await new SessionService(workspaceCwd, {
        runtimeBaseDir,
    }).getSessionLocation(sessionId);
    if (location === 'active') {
        throw new SessionNotArchivedError(sessionId);
    }
    if (location === 'conflict') {
        throw new SessionConflictError(sessionId);
    }
    if (location === undefined) {
        throw new SessionNotFoundError(sessionId);
    }
}
function isSessionNotFoundError(err) {
    return (err instanceof SessionNotFoundError ||
        (err instanceof Error && err.name === 'SessionNotFoundError'));
}
function logSessionArchiveResult(action, result) {
    const changedLabel = action === 'archive' ? 'archived' : 'unarchived';
    const alreadyLabel = action === 'archive' ? 'alreadyArchived' : 'alreadyActive';
    const details = [
        `requested=${result.requested.length} requestedIds=${formatSessionIds(result.requested)}`,
        `${changedLabel}=${result.changed.length} ${changedLabel}Ids=${formatSessionIds(result.changed)}`,
        `${alreadyLabel}=${result.already.length} ${alreadyLabel}Ids=${formatSessionIds(result.already)}`,
        `notFound=${result.notFound.length} notFoundIds=${formatSessionIds(result.notFound)}`,
        `errors=${result.errors.length} errorIds=${formatSessionErrors(result.errors)}`,
    ].join(' ');
    writeStderrLine(`qwen serve: sessions ${action} result ${details}`);
}
function formatSessionIds(sessionIds) {
    return `[${sessionIds.map((sessionId) => safeLogValue(sessionId)).join(',')}]`;
}
function formatSessionErrors(errors) {
    return `[${errors
        .map(({ sessionId, error }) => `${safeLogValue(sessionId)}:${safeLogValue(errorMessage(error))}`)
        .join(',')}]`;
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
export function logSessionArchiveWarning(message) {
    writeStderrLine(`qwen serve: ${sanitizeLogLine(message)}`);
}
// Control characters are intentionally stripped from daemon log lines.
/* eslint-disable no-control-regex */
const LOG_LINE_UNSAFE_RE = /[\x00-\x1f\x7f-\x9f\u200b-\u200f\u2028-\u202e\u2066-\u2069\ufeff]/g;
/* eslint-enable no-control-regex */
function sanitizeLogLine(message) {
    return message.replace(LOG_LINE_UNSAFE_RE, ' ').slice(0, 4096);
}
export async function archiveDaemonSessions(params) {
    const { sessionIds, service, bridge, coordinator } = params;
    const uniqueSessionIds = [...new Set(sessionIds)];
    for (const sessionId of uniqueSessionIds) {
        coordinator.assertNotTransitioning(sessionId);
    }
    const results = await Promise.all(uniqueSessionIds.map(async (sessionId) => {
        try {
            return await coordinator.runExclusiveMany([sessionId], async () => {
                try {
                    await bridge.closeSession(sessionId, undefined, {
                        requireAgentClose: true,
                    });
                }
                catch (error) {
                    if (!isSessionNotFoundError(error)) {
                        return {
                            kind: 'error',
                            error,
                            mutationApplied: false,
                        };
                    }
                }
                const initialLocation = await classifySessionLocation(service, sessionId);
                if (initialLocation === undefined) {
                    return { kind: 'notFound', mutationApplied: false };
                }
                if (initialLocation === 'archived') {
                    return {
                        kind: 'alreadyArchived',
                        mutationApplied: false,
                    };
                }
                if (initialLocation === 'conflict') {
                    return {
                        kind: 'error',
                        error: sessionLocationError(sessionId),
                        mutationApplied: false,
                    };
                }
                const mutation = await runWithDaemonWriterLease({
                    action: 'archive',
                    sessionId,
                    service,
                    mutate: async (assertOwnedAndUnchanged) => {
                        const lockedLocation = await classifySessionLocation(service, sessionId);
                        if (lockedLocation === undefined) {
                            return {
                                value: 'notFound',
                                mutationApplied: false,
                            };
                        }
                        if (lockedLocation === 'archived') {
                            return {
                                value: 'alreadyArchived',
                                mutationApplied: false,
                            };
                        }
                        if (lockedLocation === 'conflict') {
                            throw sessionLocationError(sessionId);
                        }
                        await assertOwnedAndUnchanged();
                        const result = await service.archiveSessions([sessionId], {
                            knownLocation: 'active',
                        });
                        if (result.errors[0])
                            throw result.errors[0].error;
                        if (result.archived.length > 0) {
                            return {
                                value: 'archived',
                                mutationApplied: true,
                            };
                        }
                        return {
                            value: result.alreadyArchived.length > 0
                                ? 'alreadyArchived'
                                : 'notFound',
                            mutationApplied: false,
                        };
                    },
                    mutationAppliedAfterError: async () => (await classifySessionLocation(service, sessionId)) ===
                        'archived',
                    afterMutationApplied: () => updateScheduledTaskForMaintenance(service, sessionId, 'archive'),
                });
                if (mutation.error !== undefined) {
                    return {
                        kind: 'error',
                        error: mutation.error,
                        mutationApplied: mutation.mutationApplied,
                    };
                }
                return {
                    kind: mutation.value ?? 'notFound',
                    mutationApplied: mutation.mutationApplied,
                };
            });
        }
        catch (error) {
            if (error instanceof DaemonDrainingError) {
                throw error;
            }
            return {
                kind: 'error',
                error,
                mutationApplied: false,
                maintenanceError: undefined,
            };
        }
    }));
    const archived = [];
    const alreadyArchived = [];
    const notFound = [];
    const errors = [];
    for (let i = 0; i < results.length; i++) {
        const sessionId = uniqueSessionIds[i];
        const result = results[i];
        if (result.kind === 'archived')
            archived.push(sessionId);
        else if (result.kind === 'alreadyArchived') {
            alreadyArchived.push(sessionId);
        }
        else if (result.kind === 'notFound')
            notFound.push(sessionId);
        else
            errors.push({ sessionId, error: result.error });
    }
    logSessionArchiveResult('archive', {
        requested: uniqueSessionIds,
        changed: archived,
        already: alreadyArchived,
        notFound,
        errors,
    });
    return { archived, alreadyArchived, notFound, errors };
}
export async function unarchiveDaemonSessions(params) {
    const { sessionIds, service, coordinator } = params;
    const uniqueSessionIds = [...new Set(sessionIds)];
    for (const sessionId of uniqueSessionIds) {
        coordinator.assertNotTransitioning(sessionId);
    }
    const results = await Promise.all(uniqueSessionIds.map(async (sessionId) => {
        try {
            return await coordinator.runExclusiveMany([sessionId], async () => {
                const initialLocation = await classifySessionLocation(service, sessionId);
                if (initialLocation === undefined) {
                    return { kind: 'notFound', mutationApplied: false };
                }
                if (initialLocation === 'active') {
                    let maintenanceError;
                    try {
                        await updateScheduledTaskForMaintenance(service, sessionId, 'unarchive');
                    }
                    catch (error) {
                        maintenanceError = error;
                        logSessionArchiveWarning(`scheduled task lifecycle update failed action=unarchive workspace=${safeLogValue(service.getProjectRoot())} session=${safeLogValue(sessionId)} error=${safeLogValue(errorMessage(error))}`);
                    }
                    return {
                        kind: 'alreadyActive',
                        mutationApplied: false,
                        maintenanceError,
                    };
                }
                if (initialLocation === 'conflict') {
                    return {
                        kind: 'error',
                        error: sessionLocationError(sessionId),
                        mutationApplied: false,
                    };
                }
                const mutation = await runWithDaemonWriterLease({
                    action: 'unarchive',
                    sessionId,
                    service,
                    mutate: async (assertOwnedAndUnchanged) => {
                        const lockedLocation = await classifySessionLocation(service, sessionId);
                        if (lockedLocation === undefined) {
                            return {
                                value: 'notFound',
                                mutationApplied: false,
                            };
                        }
                        if (lockedLocation === 'active') {
                            return {
                                value: 'alreadyActive',
                                mutationApplied: false,
                            };
                        }
                        if (lockedLocation === 'conflict') {
                            throw sessionLocationError(sessionId);
                        }
                        await assertOwnedAndUnchanged();
                        const result = await service.unarchiveSessions([sessionId], {
                            knownLocation: 'archived',
                        });
                        if (result.errors[0])
                            throw result.errors[0].error;
                        if (result.unarchived.length > 0) {
                            return {
                                value: 'unarchived',
                                mutationApplied: true,
                            };
                        }
                        return {
                            value: result.alreadyActive.length > 0
                                ? 'alreadyActive'
                                : 'notFound',
                            mutationApplied: false,
                        };
                    },
                    mutationAppliedAfterError: async () => (await classifySessionLocation(service, sessionId)) === 'active',
                    afterMutationApplied: () => updateScheduledTaskForMaintenance(service, sessionId, 'unarchive'),
                });
                if (mutation.error !== undefined) {
                    return {
                        kind: 'error',
                        error: mutation.error,
                        mutationApplied: mutation.mutationApplied,
                    };
                }
                return {
                    kind: mutation.value ?? 'notFound',
                    mutationApplied: mutation.mutationApplied,
                    maintenanceError: mutation.maintenanceError,
                };
            });
        }
        catch (error) {
            if (error instanceof DaemonDrainingError) {
                throw error;
            }
            return {
                kind: 'error',
                error,
                mutationApplied: false,
                maintenanceError: undefined,
            };
        }
    }));
    const unarchived = [];
    const alreadyActive = [];
    const notFound = [];
    const errors = [];
    for (let i = 0; i < results.length; i++) {
        const sessionId = uniqueSessionIds[i];
        const result = results[i];
        if (result.kind === 'unarchived')
            unarchived.push(sessionId);
        else if (result.kind === 'alreadyActive')
            alreadyActive.push(sessionId);
        else if (result.kind === 'notFound')
            notFound.push(sessionId);
        else
            errors.push({ sessionId, error: result.error });
        if (result.maintenanceError !== undefined) {
            errors.push({ sessionId, error: result.maintenanceError });
        }
    }
    logSessionArchiveResult('unarchive', {
        requested: uniqueSessionIds,
        changed: unarchived,
        already: alreadyActive,
        notFound,
        errors,
    });
    return { unarchived, alreadyActive, notFound, errors };
}
//# sourceMappingURL=session-archive.js.map