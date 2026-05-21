/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * SessionSelector component - Session list dropdown
 * Displays sessions grouped by date with search and infinite scroll
 */
import type { FC } from 'react';
/**
 * Props for SessionSelector component
 */
export interface SessionSelectorProps {
    /** Whether the selector is visible */
    visible: boolean;
    /** List of session objects */
    sessions: Array<Record<string, unknown>>;
    /** Currently selected session ID */
    currentSessionId: string | null;
    /** Current search query */
    searchQuery: string;
    /** Callback when search query changes */
    onSearchChange: (query: string) => void;
    /** Callback when a session is selected */
    onSelectSession: (sessionId: string) => void;
    /** Callback when a session is renamed */
    onRenameSession?: (sessionId: string, newTitle: string) => void;
    /** Callback when a session is deleted */
    onDeleteSession?: (sessionId: string) => void;
    /** Callback when selector should close */
    onClose: () => void;
    /** Whether there are more sessions to load */
    hasMore?: boolean;
    /** Whether loading is in progress */
    isLoading?: boolean;
    /** Callback to load more sessions */
    onLoadMore?: () => void;
}
/**
 * SessionSelector component
 *
 * Features:
 * - Sessions grouped by date (Today, Yesterday, This Week, Older)
 * - Search filtering
 * - Infinite scroll to load more sessions
 * - Click outside to close
 * - Active session highlighting
 *
 * @example
 * ```tsx
 * <SessionSelector
 *   visible={true}
 *   sessions={sessions}
 *   currentSessionId="abc123"
 *   searchQuery=""
 *   onSearchChange={(q) => setQuery(q)}
 *   onSelectSession={(id) => loadSession(id)}
 *   onClose={() => setVisible(false)}
 * />
 * ```
 */
export declare const SessionSelector: FC<SessionSelectorProps>;
