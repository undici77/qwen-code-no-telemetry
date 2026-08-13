/**
 * IPC protocol between the main process (WhatsAppAdapter) and the
 * whatsapp worker subprocess.
 *
 * Transport: newline-delimited JSON (NDJSON) over the worker's stdin/stdout.
 * - Main → Worker: one WorkerCommand per line (stdin).
 * - Worker → Main: one WorkerEvent per line (stdout).
 * - Worker stderr is reserved for free-form logs (not parsed).
 *
 * The protocol is intentionally small — the worker owns all Baileys state;
 * the main process only drives lifecycle and relays incoming/outgoing messages.
 */
// ---------------------------------------------------------------------------
// NDJSON helpers
// ---------------------------------------------------------------------------
export function encodeMessage(msg) {
    return JSON.stringify(msg) + '\n';
}
/**
 * Parse a newline-delimited JSON stream incrementally. Returns parsed
 * messages and the residual unparsed tail for the next chunk.
 */
export function parseFrames(buffer) {
    const messages = [];
    let rest = buffer;
    while (true) {
        const nl = rest.indexOf('\n');
        if (nl === -1)
            break;
        const line = rest.slice(0, nl).trim();
        rest = rest.slice(nl + 1);
        if (!line)
            continue;
        try {
            messages.push(JSON.parse(line));
        }
        catch {
            // Skip malformed lines — worker stderr leakage is already filtered,
            // but be defensive so a single bad line doesn't kill the stream.
        }
    }
    return { messages, rest };
}
//# sourceMappingURL=protocol.js.map