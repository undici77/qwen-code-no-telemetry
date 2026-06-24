import type { ChannelConfig, Envelope } from './types.js';
import type { GroupGate } from './GroupGate.js';
import type { SenderGate } from './SenderGate.js';
import type { SessionRouter } from './SessionRouter.js';
import type { AcpBridge, ToolCallEvent } from './AcpBridge.js';
export interface ChannelBaseOptions {
    router?: SessionRouter;
    proxy?: string;
}
/** Handler for a slash command. Return true if handled, false to forward to agent. */
type CommandHandler = (envelope: Envelope, args: string) => Promise<boolean>;
export declare abstract class ChannelBase {
    protected config: ChannelConfig;
    protected bridge: AcpBridge;
    protected groupGate: GroupGate;
    protected gate: SenderGate;
    protected router: SessionRouter;
    protected name: string;
    /** Resolved proxy URL, available to subclasses for adapter-specific clients. */
    protected proxy?: string;
    private instructedSessions;
    private commands;
    /** Per-session promise chain to serialize prompt + send (followup mode). */
    private sessionQueues;
    /** Per-session active prompt tracking for dispatch modes. */
    private activePrompts;
    /** Per-session message buffer for collect mode. */
    private collectBuffers;
    constructor(name: string, config: ChannelConfig, bridge: AcpBridge, options?: ChannelBaseOptions);
    abstract connect(): Promise<void>;
    abstract sendMessage(chatId: string, text: string): Promise<void>;
    abstract disconnect(): void;
    /** Replace the bridge instance (used after crash recovery restart). */
    setBridge(bridge: AcpBridge): void;
    onToolCall(_chatId: string, _event: ToolCallEvent): void;
    /**
     * Called when a prompt actually begins processing (inside the session queue).
     * Override to show a platform-specific working indicator (e.g., typing, reaction).
     * Not called for buffered messages (collect mode) or gated/blocked messages.
     */
    protected onPromptStart(_chatId: string, _sessionId: string, _messageId?: string): void;
    /**
     * Called when a prompt finishes (response sent or cancelled).
     * Override to hide the working indicator.
     */
    protected onPromptEnd(_chatId: string, _sessionId: string, _messageId?: string): void;
    /**
     * Called for each text chunk as the agent streams its response.
     * Override to implement progressive display (e.g., updating an AI card in-place).
     * Default: no-op (chunks are collected internally and delivered via onResponseComplete).
     */
    protected onResponseChunk(_chatId: string, _chunk: string, _sessionId: string): void;
    /**
     * Called when the agent's full response is ready.
     * Override to customize delivery (e.g., finalize an AI card).
     * Default: calls sendMessage() with the full response text.
     */
    protected onResponseComplete(chatId: string, fullText: string, _sessionId: string): Promise<void>;
    /**
     * Register a slash command handler. Subclasses can call this to add
     * platform-specific commands (e.g., /start for Telegram).
     * Overrides shared commands if the same name is registered.
     */
    protected registerCommand(name: string, handler: CommandHandler): void;
    /** Register shared slash commands. Called from constructor. */
    private registerSharedCommands;
    /** Check if a message text matches a registered local command. */
    protected isLocalCommand(text: string): boolean;
    /**
     * Parse a slash command from message text.
     * Returns { command, args } or null if not a slash command.
     */
    private parseCommand;
    handleInbound(envelope: Envelope): Promise<void>;
    protected onPairingRequired(chatId: string, code: string | null): Promise<void>;
}
export {};
