/**
 * BlockStreamer — progressive multi-message delivery for channels.
 *
 * Accumulates text chunks from the agent's streaming response and emits
 * completed "blocks" (paragraphs / sections) as separate channel messages
 * while the agent is still working. This gives users a natural conversation
 * flow instead of waiting 30–120 seconds for a single wall of text.
 *
 * Emission triggers:
 *  1. Buffer ≥ maxChars → force-split at best break point
 *  2. Buffer ≥ minChars AND a paragraph boundary (\n\n) exists → emit up to boundary
 *  3. Idle timer fires (no chunk for idleMs) AND buffer ≥ minChars → emit buffer
 *  4. flush() called (response complete) → emit everything remaining
 *
 * All sends are serialized — the next block waits for the previous send to complete.
 */
export interface BlockStreamerOptions {
    /** Minimum characters before emitting a block. Default: 400. */
    minChars: number;
    /** Force-emit when buffer exceeds this size. Default: 1000. */
    maxChars: number;
    /** Emit buffered text after this many ms of inactivity. Default: 1500. */
    idleMs: number;
    /** Callback to deliver a completed block. Called with trimmed text. */
    send: (text: string) => Promise<void>;
}
export declare class BlockStreamer {
    private buffer;
    private idleTimer;
    private sending;
    private opts;
    /** Number of blocks emitted so far. */
    blockCount: number;
    constructor(opts: BlockStreamerOptions);
    /** Feed a new text chunk from the agent stream. */
    push(chunk: string): void;
    /** Flush all remaining buffered text. Awaits all pending sends. */
    flush(): Promise<void>;
    private checkEmit;
    private onIdle;
    private emitBlock;
    /**
     * Find the last paragraph boundary (\n\n) in the buffer.
     * Returns the position after the boundary, or -1 if no suitable boundary
     * exists at or after minChars.
     */
    private findBlockBoundary;
    /**
     * Find the best break point at or before maxPos.
     * Prefers paragraph break > newline > space > maxPos.
     */
    private findBreakPoint;
    private clearIdleTimer;
}
