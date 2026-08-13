import { type ReactNode } from 'react';
interface MessageTimestampProps {
    /** Wall-clock epoch ms of the message; omitted for synthetic messages. */
    timestamp?: number;
    children: ReactNode;
    /** When true, show the timestamp permanently at bottom-right instead of hover tooltip. */
    chatMode?: boolean;
    /** Use the larger vertical rhythm for tool summaries in thinking-hidden mode. */
    toolGroupSpacing?: boolean;
    copyText?: string;
    copyTitle?: string;
}
/**
 * Wraps a rendered history message and reveals its wall-clock time as a
 * CSS-only tooltip on hover.
 */
export declare function MessageTimestamp({ timestamp, children, chatMode, toolGroupSpacing, copyText, copyTitle, }: MessageTimestampProps): import("react/jsx-runtime").JSX.Element;
/**
 * Local-time clock, dropping the date only for same-day timestamps:
 * - same day → `HH:mm:ss`
 * - earlier  → `yyyy-MM-dd HH:mm:ss`
 *
 * Fixed order and zero-padded (unlike toLocaleString) so stacked timestamps
 * align. `now` is injectable so the branch logic is unit-testable without
 * depending on the wall clock.
 */
export declare function formatTimestamp(ts: number, now?: Date): string;
export {};
