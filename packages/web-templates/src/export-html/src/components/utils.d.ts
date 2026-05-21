import type { ChatData, ChatViewerMessage } from './types.js';
/**
 * Type guard for ChatViewerMessage
 */
export declare const isChatViewerMessage: (value: unknown) => value is ChatViewerMessage;
/**
 * Parse chat data from the embedded script tag
 */
export declare const parseChatData: () => ChatData;
/**
 * Format session date for display
 */
export declare const formatSessionDate: (startTime?: string | null) => string;
/**
 * Format export time for display
 */
export declare const formatExportTime: (exportTime?: string | null) => string;
/**
 * Format relative time (e.g., "5 minutes ago")
 */
export declare const formatRelativeTime: (startTime?: string | null) => string;
/**
 * Format path with truncation
 */
export declare const formatPath: (path: string, maxLength?: number) => string;
/**
 * Format token limit for display (e.g., 128k, 200k, 1m)
 * Returns undefined if tokens is not provided.
 */
export declare const formatTokenLimit: (tokens?: number) => string | undefined;
