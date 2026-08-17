/**
 * Feishu markdown / rich text helpers.
 *
 * Feishu supports Markdown in interactive cards but has quirks:
 * - Tables render only in card messages (not in plain text messages)
 * - Max message content ~4000 chars — split into chunks
 * - Code fences must be closed/reopened across chunk boundaries
 */
/**
 * Build a Feishu interactive card JSON structure with markdown content.
 * Uses a clean design with header, streaming indicator, and optional stop button.
 */
export declare function buildCardContent(
  markdown: string,
  options?: {
    title?: string;
    showStopButton?: boolean;
    isStreaming?: boolean;
    statusLabel?: string;
    collapsible?: boolean;
    collapsibleThreshold?: number;
  },
): Record<string, unknown>;
/** Extract a short title from the first line of markdown. */
export declare function extractTitle(text: string): string;
/**
 * Split long text into chunks that fit within Feishu's message size limit.
 * Handles code fence boundaries across chunks.
 */
export declare function splitChunks(text: string): string[];
