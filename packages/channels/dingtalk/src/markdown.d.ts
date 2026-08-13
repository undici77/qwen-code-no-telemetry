/**
 * DingTalk markdown normalization.
 *
 * DingTalk's markdown renderer is a limited subset with quirks:
 * - Max message length ~3800 chars — split into chunks
 * - Code fences must be closed/reopened across chunk boundaries
 */
export declare function splitChunks(text: string): string[];
/** Extract a short title from the first line of markdown for the webhook payload. */
export declare function extractTitle(text: string): string;
/** Split long Markdown messages without changing their formatting. */
export declare function normalizeDingTalkMarkdown(text: string): string[];
