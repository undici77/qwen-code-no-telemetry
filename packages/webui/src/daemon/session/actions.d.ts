/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Dispatch, SetStateAction } from 'react';
import type { DaemonSessionClient, CreateSessionRequest, DaemonTranscriptStore, DaemonCapabilities } from '@qwen-code/sdk/daemon';
import { type TimerRef } from '../timing.js';
import type { ActivePrompt, AddDaemonSessionNotice, DaemonConnectionState, DaemonPromptStatus, DaemonSessionActions, SettledPrompt, PendingSessionLoad } from './types.js';
interface RefBox<T> {
    current: T;
}
export declare function resolveSessionRestoreTimeouts(capabilities: DaemonCapabilities | undefined): {
    requestTimeoutMs: number;
    watchdogTimeoutMs: number | undefined;
};
export declare function normalizeWorkspaceIdentity(value: string | undefined): string;
export interface CreateDaemonSessionActionsArgs {
    store: DaemonTranscriptStore;
    sessionRef: RefBox<DaemonSessionClient | undefined>;
    activePromptsRef: RefBox<Map<string, ActivePrompt>>;
    settledPromptsRef: RefBox<Map<string, SettledPrompt>>;
    pendingSessionLoadRef: RefBox<PendingSessionLoad | undefined>;
    pendingSessionLoadIdRef: RefBox<number>;
    heartbeatSupportedRef: RefBox<boolean>;
    manualSessionClearRef: RefBox<boolean>;
    skipNextCleanupDetachSessionRef: RefBox<DaemonSessionClient | undefined>;
    passiveAssistantDoneTimerRef: TimerRef;
    getCreateSessionRequest: () => CreateSessionRequest;
    createDetachedSession: (workspaceCwd?: string, overrides?: Pick<CreateSessionRequest, 'approvalMode' | 'sourceType' | 'worktree' | 'branch'>) => Promise<DaemonSessionClient>;
    getConnection: () => DaemonConnectionState;
    hasSessionActivePrompt: () => boolean;
    resetCurrentSessionActivePrompt: () => void;
    restartEventStream: (sessionId: string) => void;
    addNotice: AddDaemonSessionNotice;
    setConnection: Dispatch<SetStateAction<DaemonConnectionState>>;
    setPromptStatus: Dispatch<SetStateAction<DaemonPromptStatus>>;
    setRestoreSessionId: Dispatch<SetStateAction<string | undefined>>;
    setRestoreWorkspaceCwd: Dispatch<SetStateAction<string | undefined>>;
    setRestoreMode: Dispatch<SetStateAction<'load' | 'resume'>>;
    setRestoreSessionNonce: Dispatch<SetStateAction<number>>;
    setAttachSessionNonce: Dispatch<SetStateAction<number>>;
    setNewSessionNonce: Dispatch<SetStateAction<number>>;
    clearLiveJournalRepair?: () => void;
    beginCrossSessionTransition?: (request: {
        sessionId: string;
        mode: 'load' | 'resume';
        workspaceCwd?: string;
        origin: 'action' | 'controlled';
        sameLogical?: boolean;
        signal?: AbortSignal;
    }, startLegacy: () => Promise<void>) => Promise<void>;
    cancelCrossSessionTransition?: (reason: string) => void;
    isCrossSessionTransitionPending?: () => boolean;
    isDifferentLogicalTransitionPending?: () => boolean;
    isSourceBoundOperationInFlight?: () => boolean;
    setSourceBoundOperationInFlight?: (inFlight: boolean) => void;
    sessionConfigGeneration?: WeakMap<DaemonSessionClient, number>;
    getTransitionOrigin?: () => 'action' | 'controlled';
}
export declare function getConnectionAfterSessionClear(current: DaemonConnectionState, clearedSessionId: string | undefined): DaemonConnectionState;
export declare function createDaemonSessionActions({ store, sessionRef, activePromptsRef, settledPromptsRef, pendingSessionLoadRef, pendingSessionLoadIdRef, heartbeatSupportedRef, manualSessionClearRef, skipNextCleanupDetachSessionRef, passiveAssistantDoneTimerRef, getCreateSessionRequest, createDetachedSession, getConnection, hasSessionActivePrompt, resetCurrentSessionActivePrompt, restartEventStream, addNotice, setConnection, setPromptStatus, setRestoreSessionId, setRestoreWorkspaceCwd, setRestoreMode, setRestoreSessionNonce, setAttachSessionNonce, setNewSessionNonce, clearLiveJournalRepair, beginCrossSessionTransition, cancelCrossSessionTransition, isCrossSessionTransitionPending, isDifferentLogicalTransitionPending, isSourceBoundOperationInFlight, setSourceBoundOperationInFlight, sessionConfigGeneration, getTransitionOrigin, }: CreateDaemonSessionActionsArgs): DaemonSessionActions;
export declare function getPromptSettledKey(sessionId: string, promptId: string): string;
export {};
