/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type AcpSessionBridge } from './acp-session-bridge.js';
import type { SessionArchiveCoordinator } from './server/session-archive.js';
export interface RequestedSessionIdTarget {
    readonly bridge: AcpSessionBridge;
    readonly workspaceCwd: string;
    readonly workspaceId?: string;
}
export interface RequestedSessionIdPersistenceTarget {
    readonly workspaceCwd: string;
    readonly runtimeBaseDir: string;
}
export interface RequestedSessionIdReservation {
    release(): void;
}
export type RequestedSessionIdAdmissionErrorCode = 'session_id_conflict' | 'session_workspace_conflict' | 'session_id_admission_unavailable';
export declare class RequestedSessionIdAdmissionError extends Error {
    readonly code: RequestedSessionIdAdmissionErrorCode;
    readonly sessionId: string;
    readonly details: {
        conflict?: 'live' | 'pending' | 'persisted';
        workspaceCwd?: string;
        workspaceId?: string;
        liveWorkspaceCwd?: string;
        liveWorkspaceId?: string;
        retryable?: boolean;
    };
    readonly name = "RequestedSessionIdAdmissionError";
    constructor(code: RequestedSessionIdAdmissionErrorCode, sessionId: string, message: string, details?: {
        conflict?: 'live' | 'pending' | 'persisted';
        workspaceCwd?: string;
        workspaceId?: string;
        liveWorkspaceCwd?: string;
        liveWorkspaceId?: string;
        retryable?: boolean;
    });
}
export interface RequestedSessionIdAdmissionOptions {
    readonly archiveCoordinator: SessionArchiveCoordinator;
    readonly getBridges: () => readonly AcpSessionBridge[];
    readonly getPersistenceTargets: () => readonly RequestedSessionIdPersistenceTarget[];
    /**
     * Resolves the registered workspace id for a live bridge, so conflict
     * responses can name the foreign owner. Absent for bridges whose runtime
     * is no longer registered (a replaced generation still draining).
     */
    readonly getBridgeWorkspaceId?: (bridge: AcpSessionBridge) => string | undefined;
}
export interface RequestedSessionIdAdmission {
    reserveCreate(sessionId: string, target: RequestedSessionIdTarget): Promise<RequestedSessionIdReservation>;
    reserveRestore(sessionId: string, target: RequestedSessionIdTarget): RequestedSessionIdReservation;
}
export declare function createRequestedSessionIdAdmission({ archiveCoordinator, getBridges, getPersistenceTargets, getBridgeWorkspaceId, }: RequestedSessionIdAdmissionOptions): RequestedSessionIdAdmission;
