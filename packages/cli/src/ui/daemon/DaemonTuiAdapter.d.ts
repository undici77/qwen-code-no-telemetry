/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentBlock, RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk';
import { type HistoryItemToolGroup, type HistoryItemWithoutId, type IndividualToolCallDisplay } from '../types.js';
export interface DaemonTuiEvent {
    id?: number;
    v: 1;
    type: string;
    data: unknown;
    originatorClientId?: string;
}
export interface DaemonTuiPromptResult {
    stopReason?: string;
    [key: string]: unknown;
}
export interface DaemonTuiSessionClient {
    readonly sessionId: string;
    readonly workspaceCwd: string;
    readonly lastEventId?: number;
    prompt(req: {
        prompt: ContentBlock[];
    }, signal?: AbortSignal): Promise<DaemonTuiPromptResult>;
    events(opts?: {
        signal?: AbortSignal;
        lastEventId?: number;
        resume?: boolean;
    }): AsyncGenerator<DaemonTuiEvent>;
    cancel(): Promise<void>;
    setModel(modelId: string): Promise<Record<string, unknown>>;
    respondToPermission(requestId: string, response: RequestPermissionResponse): Promise<boolean>;
}
export type DaemonTuiUpdate = {
    type: 'history';
    item: HistoryItemWithoutId;
    daemonEventId?: number;
} | {
    type: 'permission_request';
    requestId: string;
    request: RequestPermissionRequest;
    daemonEventId?: number;
} | {
    type: 'tool_group_update';
    item: HistoryItemToolGroup;
    daemonEventId?: number;
} | {
    type: 'permission_resolved';
    requestId: string;
    outcome?: unknown;
    daemonEventId?: number;
} | {
    type: 'model_switched';
    modelId: string;
    daemonEventId?: number;
} | {
    type: 'disconnected';
    reason: string;
    daemonEventId?: number;
};
export interface DaemonTuiAdapterOptions {
    session: DaemonTuiSessionClient;
    onUpdate: (update: DaemonTuiUpdate) => void;
}
export interface DaemonTuiReducerState {
    toolCallsById: Map<string, IndividualToolCallDisplay>;
    toolCallOrder: string[];
}
export declare function createDaemonTuiReducerState(): DaemonTuiReducerState;
export declare function reduceDaemonEventToTuiUpdates(event: DaemonTuiEvent, state?: DaemonTuiReducerState): DaemonTuiUpdate[];
export declare class DaemonTuiAdapter {
    private readonly session;
    private readonly onUpdate;
    private readonly reducerState;
    private eventController;
    private eventPump;
    private lastSeenEventId;
    private lifecycle;
    private restartAfterStop;
    private pumpGeneration;
    private busy;
    constructor(options: DaemonTuiAdapterOptions);
    start(): void;
    private startPump;
    stop(): Promise<void>;
    sendPrompt(prompt: string | ContentBlock[]): Promise<DaemonTuiPromptResult>;
    cancel(): Promise<void>;
    setModel(modelId: string): Promise<Record<string, unknown>>;
    approvePermission(requestId: string, optionId: string): Promise<boolean>;
    rejectPermission(requestId: string): Promise<boolean>;
    get currentSessionId(): string;
    get workspaceCwd(): string;
    get lastEventId(): number | undefined;
    private pumpEvents;
    private reportDaemonFailure;
    private emit;
    private assertRunning;
    private waitForPumpToDrain;
    private forceIdleAfterPumpTimeout;
}
