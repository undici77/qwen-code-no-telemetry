export { formatToolDisplayName, localizeToolDisplayName, truncateText, } from '../toolFormatting';
export declare function StatusIcon({ status }: {
    status: string;
}): import("react/jsx-runtime").JSX.Element | null;
export declare function formatElapsed(start?: number, end?: number): string;
export declare function formatDurationMs(ms?: number): string;
export declare function formatLiveElapsed(ms: number): string;
