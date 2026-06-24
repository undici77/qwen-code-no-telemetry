/**
 * DingTalk markdown normalization.
 *
 * DingTalk's markdown renderer is a limited subset with quirks:
 * - Tables don't render — convert to pipe-separated plain text
 * - Max message length ~3800 chars — split into chunks
 * - Code fences must be closed/reopened across chunk boundaries
 */
export declare function convertTables(text: string): string;
export declare function splitChunks(text: string): string[];
/** Extract a short title from the first line of markdown for the webhook payload. */
export declare function extractTitle(text: string): string;
/** Full normalization pipeline: tables → chunks. */
export declare function normalizeDingTalkMarkdown(text: string): string[];
