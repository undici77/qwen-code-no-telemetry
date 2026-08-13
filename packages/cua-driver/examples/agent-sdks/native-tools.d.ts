/** Narrow agent-tool adapter over the same-process Cua Driver TypeScript SDK. */
type McpContent = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    data: string;
    mimeType: string;
};
export type NativeToolResult = {
    content: McpContent[];
    isError?: boolean;
};
export declare class NativeDesktopTools {
    private readonly timeoutMs;
    readonly driver: any;
    readonly session: string;
    private started;
    constructor(timeoutMs?: number);
    start(): Promise<void>;
    close(): Promise<void>;
    observe(): Promise<NativeToolResult>;
    click(x: number, y: number): Promise<NativeToolResult>;
    typeText(text: string): Promise<NativeToolResult>;
    pressKey(key: string): Promise<NativeToolResult>;
    private mutateThenObserve;
    private bounded;
    private content;
}
export {};
