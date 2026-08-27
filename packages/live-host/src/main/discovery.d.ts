export type LiveDiscoveryRecord = {
    url: string;
    token?: string;
    protocolVersion: number;
    pid: number;
    instanceNonce: string;
};
export type DiscoveryResult = {
    kind: 'ready';
    record: LiveDiscoveryRecord;
    signature: string;
} | {
    kind: 'missing';
} | {
    kind: 'invalid';
    reason: string;
};
export declare function resolveDiscoveryPath(environment?: NodeJS.ProcessEnv): string;
export declare function buildHostWebSocketUrl(value: string): string;
export declare function buildWebShellSessionUrl(record: LiveDiscoveryRecord, target: {
    workspaceId: string;
    sessionId: string;
}): string;
export declare function readDiscoveryFile(path: string): Promise<DiscoveryResult>;
export declare class DiscoveryMonitor {
    readonly path: string;
    private readonly listener;
    private readonly intervalMs;
    private readonly reader;
    private timer;
    private lastIdentity;
    private pollInFlight;
    private lifecycleGeneration;
    constructor(path: string, listener: (result: DiscoveryResult) => void, intervalMs?: number, reader?: typeof readDiscoveryFile);
    start(): void;
    stop(): void;
    poll(): Promise<void>;
    private pollOnce;
}
