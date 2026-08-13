import type { ChannelAgentBridge, ChannelBaseOptions, ChannelConfig } from '@qwen-code/channel-base';
import { PollingChannelBase } from '@qwen-code/channel-base';
interface GitlabConfig extends ChannelConfig {
    baseUrl?: string;
    action_prompt_template?: Record<string, string>;
}
interface GitlabCursor {
    lastProcessedId: number;
    initialized: boolean;
}
export declare class GitlabChannel extends PollingChannelBase<GitlabCursor> {
    private api;
    private apiHost;
    private botUsername;
    private descriptionCache;
    private readonly reactions;
    constructor(name: string, config: GitlabConfig & Record<string, unknown>, bridge: ChannelAgentBridge, options?: ChannelBaseOptions);
    protected createInitialCursor(): GitlabCursor;
    protected validateCursor(parsed: unknown): GitlabCursor | null;
    connect(): Promise<void>;
    disconnect(): void;
    sendMessage(_chatId: string, _text: string): Promise<void>;
    protected sendThreadMessage(chatId: string, threadId: string | undefined, text: string): Promise<void>;
    protected onPromptStart(chatId: string, _sessionId: string, messageId?: string): void;
    protected onPromptEnd(chatId: string, _sessionId: string, messageId?: string): void;
    protected pollOnce(): Promise<void>;
    private skipTodo;
    private resolveTemplate;
    private processTodo;
    private fetchDescription;
    private buildEnvelope;
    private buildMetadata;
    private createNote;
}
export {};
