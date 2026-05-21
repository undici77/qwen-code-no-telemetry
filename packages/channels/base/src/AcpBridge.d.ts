import { EventEmitter } from 'node:events';
export interface AcpBridgeOptions {
    cliEntryPath: string;
    cwd: string;
    model?: string;
}
export interface AvailableCommand {
    name: string;
    description: string;
    input?: {
        hint: string;
    } | null;
}
export interface ToolCallEvent {
    sessionId: string;
    toolCallId: string;
    kind: string;
    title: string;
    status: string;
    rawInput?: Record<string, unknown>;
}
export declare class AcpBridge extends EventEmitter {
    private child;
    private connection;
    private options;
    private _availableCommands;
    constructor(options: AcpBridgeOptions);
    get availableCommands(): AvailableCommand[];
    start(): Promise<void>;
    newSession(cwd: string): Promise<string>;
    loadSession(sessionId: string, cwd: string): Promise<string>;
    prompt(sessionId: string, text: string, options?: {
        imageBase64?: string;
        imageMimeType?: string;
    }): Promise<string>;
    cancelSession(sessionId: string): Promise<void>;
    stop(): void;
    get isConnected(): boolean;
    private handleSessionUpdate;
    private ensureConnection;
}
