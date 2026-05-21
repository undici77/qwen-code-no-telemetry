import { EventEmitter } from 'node:events';
import type { RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk';
import type { AvailableCommand } from './AcpBridge.js';
import type { SessionScope } from './types.js';
export interface DaemonChannelEvent {
    id?: number;
    v: 1;
    type: string;
    data: unknown;
    originatorClientId?: string;
}
export interface DaemonChannelSessionClient {
    readonly sessionId: string;
    readonly workspaceCwd: string;
    readonly lastEventId?: number;
    prompt(req: {
        prompt: Array<Record<string, unknown>>;
    }, signal?: AbortSignal): Promise<{
        stopReason?: string;
        [key: string]: unknown;
    }>;
    events(opts?: {
        signal?: AbortSignal;
        lastEventId?: number;
        resume?: boolean;
    }): AsyncGenerator<DaemonChannelEvent>;
    cancel(): Promise<void>;
    setModel(modelId: string): Promise<Record<string, unknown>>;
    respondToPermission(requestId: string, response: RequestPermissionResponse): Promise<boolean>;
}
export interface DaemonChannelSessionFactoryRequest {
    workspaceCwd: string;
    modelServiceId?: string;
    sessionId?: string;
    sessionScope?: SessionScope;
}
export type DaemonChannelSessionFactory = (req: DaemonChannelSessionFactoryRequest) => Promise<DaemonChannelSessionClient>;
export interface DaemonChannelBridgeOptions {
    cwd: string;
    sessionFactory: DaemonChannelSessionFactory;
    modelServiceId?: string;
    sessionScope?: SessionScope;
}
export interface DaemonPermissionRequestEvent {
    requestId: string;
    sessionId: string;
    request: RequestPermissionRequest;
}
export interface DaemonPermissionResolvedEvent {
    requestId: string;
    outcome?: DaemonPermissionOutcome;
}
export interface DaemonPromptCompleteEvent {
    sessionId: string;
    text: string;
    stopReason?: string;
}
type DaemonPermissionOutcome = {
    outcome: 'cancelled';
} | {
    outcome: 'selected';
    optionId: string;
};
export declare class DaemonChannelBridge extends EventEmitter {
    private readonly options;
    private readonly sessions;
    private readonly eventControllers;
    private readonly requestToSession;
    private readonly respondedRequestToSession;
    private readonly activePrompts;
    private readonly activePromptControllers;
    private readonly availableCommandsBySession;
    private connected;
    private latestAvailableCommandsSessionId;
    private lastError;
    constructor(options: DaemonChannelBridgeOptions);
    get availableCommands(): AvailableCommand[];
    get lastDaemonError(): unknown;
    getAvailableCommands(sessionId: string): AvailableCommand[];
    start(): Promise<void>;
    newSession(cwd: string): Promise<string>;
    loadSession(sessionId: string, cwd: string): Promise<string>;
    prompt(sessionId: string, text: string, options?: {
        imageBase64?: string;
        imageMimeType?: string;
    }): Promise<string>;
    cancelSession(sessionId: string): Promise<void>;
    setSessionModel(sessionId: string, modelId: string): Promise<Record<string, unknown>>;
    respondToPermission(requestId: string, response: RequestPermissionResponse): Promise<boolean>;
    stop(): void;
    get isConnected(): boolean;
    private attachSession;
    private ensureSession;
    private pumpEvents;
    private isCurrentPump;
    private handleEvent;
    private handleSessionUpdate;
    private handlePermissionRequest;
    private rememberRespondedPermissionRequest;
    private handlePermissionResolved;
    private handleModelSwitched;
    private handleModelSwitchFailed;
    private handleSessionDied;
    private dropSession;
    private getReason;
    private getError;
    private abortActivePrompts;
    private emitProtocolError;
}
export {};
