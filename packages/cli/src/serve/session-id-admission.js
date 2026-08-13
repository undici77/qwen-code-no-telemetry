/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionService } from '@qwen-code/qwen-code-core';
import { access } from 'node:fs/promises';
import { SessionNotFoundError, } from './acp-session-bridge.js';
import { normalizeSessionIdForLookup } from '../config/session-id.js';
export class RequestedSessionIdAdmissionError extends Error {
    code;
    sessionId;
    details;
    name = 'RequestedSessionIdAdmissionError';
    constructor(code, sessionId, message, details = {}) {
        super(message);
        this.code = code;
        this.sessionId = sessionId;
        this.details = details;
    }
}
async function persistedSessionExists(sessionService, sessionId) {
    if ((await sessionService.getSessionLocation(sessionId)) !== undefined) {
        return true;
    }
    if ((await sessionService.findSessionIdIgnoringCase?.(sessionId)) !== undefined) {
        return true;
    }
    for (const state of ['active', 'archived']) {
        try {
            await access(sessionService.getWorktreeSessionPathForArchiveState(sessionId, state));
            return true;
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
    }
    return false;
}
export function createRequestedSessionIdAdmission({ archiveCoordinator, getBridges, getPersistenceTargets, getBridgeWorkspaceId, }) {
    const pending = new Map();
    const liveOwners = (sessionId) => {
        const owners = [];
        let bridges;
        try {
            bridges = getBridges();
        }
        catch {
            throw new RequestedSessionIdAdmissionError('session_id_admission_unavailable', sessionId, `Unable to enumerate live bridges for session "${sessionId}".`, { retryable: true });
        }
        for (const bridge of new Set(bridges)) {
            try {
                const summary = bridge.getSessionSummary(sessionId);
                owners.push({
                    bridge,
                    workspaceCwd: summary.workspaceCwd,
                    workspaceId: getBridgeWorkspaceId?.(bridge),
                });
            }
            catch (error) {
                if (error instanceof SessionNotFoundError)
                    continue;
                throw new RequestedSessionIdAdmissionError('session_id_admission_unavailable', sessionId, `Unable to verify whether session "${sessionId}" is already live.`, { retryable: true });
            }
        }
        return owners;
    };
    const conflict = (sessionId, conflictKind, workspaceCwd) => new RequestedSessionIdAdmissionError('session_id_conflict', sessionId, `Session "${sessionId}" already exists or is being created.`, {
        conflict: conflictKind,
        ...(workspaceCwd ? { liveWorkspaceCwd: workspaceCwd } : {}),
    });
    const workspaceConflict = (sessionId, target, conflictKind, liveWorkspaceCwd, liveWorkspaceId) => new RequestedSessionIdAdmissionError('session_workspace_conflict', sessionId, `Session "${sessionId}" is already live or restoring in another workspace runtime.`, {
        conflict: conflictKind,
        workspaceCwd: target.workspaceCwd,
        ...(target.workspaceId ? { workspaceId: target.workspaceId } : {}),
        ...(liveWorkspaceCwd ? { liveWorkspaceCwd } : {}),
        ...(liveWorkspaceId ? { liveWorkspaceId } : {}),
    });
    const createReservation = (sessionId, state) => {
        let released = false;
        return {
            release() {
                if (released)
                    return;
                released = true;
                if (pending.get(sessionId) !== state)
                    return;
                if (state.kind === 'restore' && state.count > 1) {
                    state.count--;
                    return;
                }
                pending.delete(sessionId);
            },
        };
    };
    return {
        async reserveCreate(rawSessionId, target) {
            const sessionId = normalizeSessionIdForLookup(rawSessionId);
            const live = liveOwners(sessionId)[0];
            if (live)
                throw conflict(sessionId, 'live', live.workspaceCwd);
            if (pending.has(sessionId))
                throw conflict(sessionId, 'pending');
            const state = { kind: 'create', target };
            pending.set(sessionId, state);
            const reservation = createReservation(sessionId, state);
            try {
                let persisted;
                try {
                    persisted = await archiveCoordinator.runSharedMany([sessionId], async () => {
                        const targets = [
                            ...new Map(getPersistenceTargets().map((entry) => [
                                `${entry.runtimeBaseDir}\0${entry.workspaceCwd}`,
                                entry,
                            ])).values(),
                        ];
                        const results = await Promise.all(targets.map(async (entry) => {
                            const sessionService = new SessionService(entry.workspaceCwd, { runtimeBaseDir: entry.runtimeBaseDir });
                            return {
                                entry,
                                exists: await persistedSessionExists(sessionService, sessionId),
                            };
                        }));
                        return results.find((result) => result.exists)?.entry;
                    });
                }
                catch {
                    throw new RequestedSessionIdAdmissionError('session_id_admission_unavailable', sessionId, `Unable to verify persisted state for session "${sessionId}".`, { retryable: true });
                }
                if (persisted) {
                    throw conflict(sessionId, 'persisted', persisted.workspaceCwd);
                }
                return reservation;
            }
            catch (error) {
                reservation.release();
                throw error;
            }
        },
        reserveRestore(rawSessionId, target) {
            const sessionId = normalizeSessionIdForLookup(rawSessionId);
            const foreignLive = liveOwners(sessionId).find((owner) => owner.bridge !== target.bridge);
            if (foreignLive) {
                throw workspaceConflict(sessionId, target, 'live', foreignLive.workspaceCwd, foreignLive.workspaceId);
            }
            const existing = pending.get(sessionId);
            if (existing?.kind === 'create') {
                throw conflict(sessionId, 'pending');
            }
            if (existing?.kind === 'restore') {
                if (existing.target.bridge !== target.bridge) {
                    throw workspaceConflict(sessionId, target, 'pending', existing.target.workspaceCwd, existing.target.workspaceId);
                }
                existing.count++;
                return createReservation(sessionId, existing);
            }
            const state = { kind: 'restore', target, count: 1 };
            pending.set(sessionId, state);
            return createReservation(sessionId, state);
        },
    };
}
//# sourceMappingURL=session-id-admission.js.map