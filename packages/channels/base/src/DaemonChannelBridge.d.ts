import { EventEmitter } from 'node:events';
import type { RequestPermissionRequest, RequestPermissionResponse } from '@agentclientprotocol/sdk';
import { type AvailableCommand, type BridgeSessionInfo, type ChannelAgentBridge, type ChannelAgentBridgePromptOptions, type ChannelAgentBridgeSessionOptions, type ChannelLoopToolHandler } from './ChannelAgentBridge.js';
import { type JsonRpcMessage } from './ChannelLoopTools.js';
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
        _meta?: Record<string, unknown>;
    }, signal?: AbortSignal): Promise<{
        stopReason?: string;
        [key: string]: unknown;
    }>;
    events(opts?: {
        signal?: AbortSignal;
        lastEventId?: number;
        resume?: boolean;
    }): AsyncGenerator<DaemonChannelEvent>;
    detach?(): Promise<void>;
    cancel(): Promise<void>;
    setModel(modelId: string): Promise<Record<string, unknown>>;
    respondToPermission(requestId: string, response: RequestPermissionResponse): Promise<boolean>;
    shellCommand?(command: string, signal?: AbortSignal): Promise<{
        exitCode: number | null;
        output: string;
        aborted: boolean;
    }>;
}
export interface DaemonChannelSessionFactoryRequest {
    workspaceCwd: string;
    modelServiceId?: string;
    sessionId?: string;
    sessionScope?: SessionScope;
    approvalMode?: string;
    /** Channel instance name stamped as daemon `sourceId` (new sessions only). */
    sourceId?: string;
}
export type DaemonChannelSessionFactory = (req: DaemonChannelSessionFactoryRequest) => Promise<DaemonChannelSessionClient>;
export interface DaemonChannelLoopMcpHost {
    register(sessionId: string, handler: (message: JsonRpcMessage) => Promise<JsonRpcMessage | undefined>): Promise<void>;
    unregister(sessionId: string): Promise<void>;
}
export interface DaemonChannelBridgeOptions {
    cwd: string;
    sessionFactory: DaemonChannelSessionFactory;
    modelServiceId?: string;
    sessionScope?: SessionScope;
    channelLoopMcpHost?: DaemonChannelLoopMcpHost;
    deleteSessionData?: (sessionId: string) => Promise<void>;
    promptAuthorization?: string;
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
export declare class DaemonChannelBridge extends EventEmitter implements ChannelAgentBridge {
    private readonly options;
    private readonly sessions;
    private readonly sessionBindingTokens;
    private readonly eventControllers;
    private readonly requestToSession;
    private readonly respondedRequestToSession;
    private readonly activePrompts;
    private readonly activePromptControllers;
    private readonly availableCommandsBySession;
    private readonly turnBarriers;
    private readonly channelLoopToolHandlers;
    private readonly registeredChannelLoopMcpSessions;
    private readonly channelLoopMcpRegistrations;
    private channelLoopMcpServer;
    private connected;
    private lifecycleGeneration;
    private latestAvailableCommandsSessionId;
    private lastError;
    readonly deleteSessionData?: (sessionId: string) => Promise<void>;
    constructor(options: DaemonChannelBridgeOptions);
    get availableCommands(): AvailableCommand[];
    get lastDaemonError(): unknown;
    getAvailableCommands(sessionId: string): AvailableCommand[];
    listSessions(): BridgeSessionInfo[];
    start(): Promise<void>;
    newSession(cwd: string, options?: ChannelAgentBridgeSessionOptions, bindingToken?: object): Promise<string>;
    loadSession(sessionId: string, cwd: string, options?: ChannelAgentBridgeSessionOptions, bindingToken?: object): Promise<string>;
    registerChannelLoopToolHandler(handler: ChannelLoopToolHandler): void;
    prompt(sessionId: string, text: string, options?: ChannelAgentBridgePromptOptions): Promise<string>;
    shellCommand(sessionId: string, command: string, signal?: AbortSignal): Promise<{
        exitCode: number | null;
        output: string;
        aborted: boolean;
    }>;
    cancelSession(sessionId: string): Promise<void>;
    discardSession(sessionId: string, expectedBindingToken?: object): Promise<void>;
    private releaseSessionClient;
    setSessionModel(sessionId: string, modelId: string): Promise<Record<string, unknown>>;
    respondToPermission(requestId: string, response: RequestPermissionResponse): Promise<boolean>;
    stop(): void;
    get isConnected(): boolean;
    private attachSession;
    private rejectStaleSession;
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
    private removeSessionBinding;
    private registerChannelLoopMcpForSession;
    private unregisterChannelLoopMcpForSession;
    private resolveChannelLoopToolHandler;
    private getStringField;
    private abortActivePrompts;
    private emitResponseBoundary;
    private createTurnBarrier;
    private resolveTurnBarrier;
    private clearTurnBarrier;
    private emitProtocolError;
}
export {};
