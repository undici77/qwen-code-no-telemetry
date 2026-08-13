/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContentBlock, RequestPermissionRequest, RequestPermissionResponse, SessionNotification } from '@agentclientprotocol/sdk';
import type { AskUserQuestionRequest } from '../types/acpTypes.js';
export interface DaemonIdeEvent {
    id?: number;
    v: 1;
    type: string;
    data: unknown;
    originatorClientId?: string;
}
export interface DaemonIdePromptResult {
    stopReason?: string;
    [key: string]: unknown;
}
export interface DaemonIdeSetModelResult {
    [key: string]: unknown;
}
export interface DaemonIdeSessionClient {
    readonly sessionId: string;
    readonly workspaceCwd: string;
    readonly lastEventId?: number;
    setLastEventId?(lastEventId: number | undefined): void;
    prompt(req: {
        prompt: ContentBlock[];
    }, signal?: AbortSignal): Promise<DaemonIdePromptResult>;
    events(opts?: {
        signal?: AbortSignal;
        lastEventId?: number;
        resume?: boolean;
    }): AsyncGenerator<DaemonIdeEvent>;
    cancel(): Promise<void>;
    setModel(modelId: string): Promise<DaemonIdeSetModelResult>;
    respondToPermission(requestId: string, response: RequestPermissionResponse): Promise<boolean>;
}
export interface DaemonIdeSessionFactoryOptions {
    baseUrl: string;
    token?: string;
    workspaceCwd?: string;
    modelServiceId?: string;
    lastEventId?: number;
}
export type DaemonIdeSessionFactory = (opts: DaemonIdeSessionFactoryOptions) => Promise<DaemonIdeSessionClient>;
export interface DaemonIdeConnectionOptions extends DaemonIdeSessionFactoryOptions {
    sessionFactory?: DaemonIdeSessionFactory;
}
export declare function createSdkDaemonSessionFactory(): DaemonIdeSessionFactory;
export declare class DaemonIdeConnection {
    private session;
    private eventController;
    private eventPump;
    private lastSeenEventId;
    private connectPromise;
    private pumpGeneration;
    onSessionUpdate: (data: SessionNotification) => void;
    onPermissionRequest: (data: RequestPermissionRequest) => Promise<{
        optionId?: string;
    }>;
    onAskUserQuestion: (data: AskUserQuestionRequest) => Promise<{
        optionId: string;
        answers?: Record<string, string>;
    }>;
    onEndTurn: (reason?: string) => void;
    onDisconnected: (code: number | null, signal: string | null) => void;
    connect(options: DaemonIdeConnectionOptions): Promise<void>;
    private connectInternal;
    sendPrompt(prompt: string | ContentBlock[]): Promise<DaemonIdePromptResult>;
    cancelSession(): Promise<void>;
    setModel(modelId: string): Promise<DaemonIdeSetModelResult>;
    disconnect(): Promise<void>;
    get isConnected(): boolean;
    get hasActiveSession(): boolean;
    get currentSessionId(): string | null;
    get lastEventId(): number | undefined;
    private ensureSession;
    private pumpEvents;
    private handleEvent;
    private handlePermissionRequest;
    private resolvePermissionResponseUntilAbort;
    private resolvePermissionResponse;
    private handleSessionDied;
    private isCancelledOption;
    private resolvePermissionOptionId;
    private clearCurrentSession;
}
