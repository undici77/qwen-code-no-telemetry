import type { SessionTarget } from './types.js';
export type ChannelLoopStatus = 'ok' | 'error';
export interface ChannelLoop {
    id: string;
    channelName: string;
    target: SessionTarget;
    cwd: string;
    cron: string;
    prompt: string;
    label?: string;
    recurring: boolean;
    enabled: boolean;
    createdBy: string;
    createdAt: string;
    lastFiredAt?: string;
    lastFinishedAt?: string;
    lastResultPreview?: string;
    lastStatus?: ChannelLoopStatus;
    lastError?: string;
    consecutiveFailures: number;
    runningSince?: string;
    runCount: number;
}
export type ChannelLoopInput = Omit<ChannelLoop, 'id' | 'enabled' | 'createdAt' | 'lastFiredAt' | 'lastFinishedAt' | 'lastResultPreview' | 'lastStatus' | 'lastError' | 'consecutiveFailures' | 'runningSince' | 'runCount'>;
export type ChannelLoopPatch = Partial<Pick<ChannelLoop, 'enabled' | 'lastFiredAt' | 'lastFinishedAt' | 'lastResultPreview' | 'lastStatus' | 'lastError' | 'consecutiveFailures' | 'runningSince' | 'runCount'>>;
export interface ChannelLoopStoreOptions {
    filePath: string;
    now?: () => Date;
    idFactory?: () => string;
}
export declare class ChannelLoopStore {
    private readonly filePath;
    private readonly now;
    private readonly idFactory;
    private pendingUpdate;
    constructor(options: ChannelLoopStoreOptions);
    list(): Promise<ChannelLoop[]>;
    listForTarget(channelName: string, target: SessionTarget): Promise<ChannelLoop[]>;
    create(input: ChannelLoopInput): Promise<ChannelLoop>;
    createForTarget(input: ChannelLoopInput, maxEnabledLoops: number): Promise<ChannelLoop | undefined>;
    update(id: string, patch: ChannelLoopPatch): Promise<boolean>;
    disable(id: string): Promise<boolean>;
    private buildLoop;
    private updateJobs;
    private readJobs;
    private writeJobs;
}
