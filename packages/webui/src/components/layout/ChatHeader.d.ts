/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * ChatHeader component - Header for chat interface
 * Displays current session title with navigation controls
 */
import type { FC } from 'react';
/**
 * Props for ChatHeader component
 */
export interface ChatHeaderProps {
    /** Current session title to display */
    currentSessionTitle: string;
    /** Callback when user clicks to load session list */
    onLoadSessions: () => void;
    /** Callback when user clicks to create new session */
    onNewSession: () => void;
}
/**
 * ChatHeader component
 *
 * Features:
 * - Displays current session title with dropdown indicator
 * - Button to view past conversations
 * - Button to create new session
 *
 * @example
 * ```tsx
 * <ChatHeader
 *   currentSessionTitle="My Chat"
 *   onLoadSessions={() => console.log('Load sessions')}
 *   onNewSession={() => console.log('New session')}
 * />
 * ```
 */
export declare const ChatHeader: FC<ChatHeaderProps>;
