import type { ChannelAgentBridge } from './ChannelAgentBridge.js';
import type { ChannelBaseOptions } from './ChannelBase.js';
import { ChannelBase } from './ChannelBase.js';
import type { ChannelConfig } from './types.js';
export declare abstract class PollingChannelBase<Cursor> extends ChannelBase {
    protected cursor: Cursor;
    private abortController;
    private running;
    private consecutiveErrors;
    protected abortableSleep(ms: number): Promise<void>;
    constructor(name: string, config: ChannelConfig, bridge: ChannelAgentBridge, options?: ChannelBaseOptions);
    protected abstract pollOnce(): Promise<void>;
    protected abstract createInitialCursor(): Cursor;
    protected validateCursor(parsed: unknown): Cursor | null;
    protected get pollInterval(): number;
    protected saveCursor(): void;
    protected startPollLoop(): void;
    protected stopPollLoop(): void;
    private runLoop;
    private loadCursorFromDisk;
    private cursorPath;
}
