import { encodeHostControlMessage, type HostAction, type HostPermissions, type HostSelfChecks, type LiveStatus } from '../shared/protocol.ts';
import { BoundedReconnectPolicy } from './reconnect-policy.ts';
export type ConnectionPhase = 'disconnected' | 'connecting' | 'ready' | 'incompatible' | 'error';
export type ConnectionSnapshot = {
    phase: ConnectionPhase;
    error?: string;
    status?: LiveStatus;
};
export type HostReadiness = {
    permissions: HostPermissions;
    selfChecks: HostSelfChecks;
};
export declare function canSendHostControlMessage(message: Parameters<typeof encodeHostControlMessage>[0], socketOpen: boolean, welcomed: boolean, bufferedAmount: number): boolean;
type ConnectionCallbacks = {
    getReadiness: () => HostReadiness;
    onSnapshot: (snapshot: ConnectionSnapshot) => void;
    onOutputAudio: (audio: Uint8Array) => void;
    onClearOutput: () => void;
    setShortcut?: (shortcut: string) => {
        success: boolean;
        error?: string;
    };
    captureScreenContext?: () => Promise<{
        appName: string;
        windowTitle?: string;
        accessibilityText: string;
        screenshotPath: string;
    }>;
};
export declare class LiveDaemonConnection {
    private readonly hostVersion;
    private readonly callbacks;
    private readonly retryOptions;
    private readonly hostInstanceNonce;
    private readonly reconnectPolicy;
    private readonly discovery;
    private currentRecord;
    private currentSignature;
    private socket;
    private reconnectTimer;
    private handshakeTimer;
    private heartbeatTimer;
    private intentionalClose;
    private welcomed;
    private epoch;
    private heartbeatIntervalMs;
    private snapshot;
    constructor(hostVersion: string, callbacks: ConnectionCallbacks, discoveryPath?: string, retryOptions?: {
        policy?: BoundedReconnectPolicy;
        exhaustedRetryDelayMs?: number;
    });
    start(): void;
    stop(): void;
    reconnectNow(): void;
    forceReconnectNow(): void;
    sendAction(action: HostAction): boolean;
    sendAudio(frame: Uint8Array, epoch: number): boolean;
    getSnapshot(): ConnectionSnapshot;
    getEpoch(): number;
    getWebShellSessionUrl(target: NonNullable<LiveStatus['pendingPermission']>): string | undefined;
    private handleDiscovery;
    private connect;
    private scheduleReconnect;
    private sendControl;
    private captureScreenContext;
    private closeSocket;
    private terminateSocket;
    private cancelReconnect;
    private clearHandshakeTimer;
    private armHeartbeat;
    private clearHeartbeatTimer;
    private nonceMatches;
    private publish;
}
export {};
