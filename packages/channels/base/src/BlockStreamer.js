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
export class BlockStreamer {
    buffer = '';
    idleTimer = null;
    sending = Promise.resolve();
    opts;
    /** Number of blocks emitted so far. */
    blockCount = 0;
    constructor(opts) {
        this.opts = opts;
    }
    /** Feed a new text chunk from the agent stream. */
    push(chunk) {
        this.buffer += chunk;
        this.clearIdleTimer();
        this.checkEmit();
        if (this.buffer.length > 0 && this.opts.idleMs > 0) {
            this.idleTimer = setTimeout(() => this.onIdle(), this.opts.idleMs);
        }
    }
    /** Flush all remaining buffered text. Awaits all pending sends. */
    async flush() {
        this.clearIdleTimer();
        if (this.buffer.length > 0) {
            this.emitBlock(this.buffer);
            this.buffer = '';
        }
        await this.sending;
    }
    /** Drop buffered text and cancel future idle emission. */
    stop() {
        this.clearIdleTimer();
        this.buffer = '';
    }
    // ---------------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------------
    checkEmit() {
        // 1. Force-split if buffer exceeds maxChars
        while (this.buffer.length >= this.opts.maxChars) {
            const bp = this.findBreakPoint(this.buffer, this.opts.maxChars);
            this.emitBlock(this.buffer.slice(0, bp));
            this.buffer = this.buffer.slice(bp);
        }
        // 2. Emit at paragraph boundary if we have enough text
        if (this.buffer.length >= this.opts.minChars) {
            const bp = this.findBlockBoundary(this.buffer);
            if (bp > 0) {
                this.emitBlock(this.buffer.slice(0, bp));
                this.buffer = this.buffer.slice(bp);
            }
        }
    }
    onIdle() {
        this.idleTimer = null;
        if (this.buffer.length >= this.opts.minChars) {
            this.emitBlock(this.buffer);
            this.buffer = '';
        }
    }
    emitBlock(text) {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        this.blockCount++;
        this.sending = this.sending
            .then(() => this.opts.send(trimmed))
            .catch(() => { });
    }
    /**
     * Find the last paragraph boundary (\n\n) in the buffer.
     * Returns the position after the boundary, or -1 if no suitable boundary
     * exists at or after minChars.
     */
    findBlockBoundary(text) {
        const last = text.lastIndexOf('\n\n');
        if (last < 0 || last < this.opts.minChars)
            return -1;
        return last + 2;
    }
    /**
     * Find the best break point at or before maxPos.
     * Prefers paragraph break > newline > space > maxPos.
     */
    findBreakPoint(text, maxPos) {
        const sub = text.slice(0, maxPos);
        const para = sub.lastIndexOf('\n\n');
        if (para > 0)
            return para + 2;
        const nl = sub.lastIndexOf('\n');
        if (nl > 0)
            return nl + 1;
        const sp = sub.lastIndexOf(' ');
        if (sp > 0)
            return sp + 1;
        return maxPos;
    }
    clearIdleTimer() {
        if (this.idleTimer !== null) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }
}
//# sourceMappingURL=BlockStreamer.js.map