/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import './ThinkingMessage.css';
/**
 * ThinkingMessage component props interface
 */
export interface ThinkingMessageProps {
    /** Thinking content */
    content: string;
    /** Message timestamp */
    timestamp: number;
    /** File click callback */
    onFileClick?: (path: string) => void;
    /** Whether to expand by default, defaults to false */
    defaultExpanded?: boolean;
    /** Status: 'loading' means thinking in progress, 'default' means thinking complete */
    status?: 'loading' | 'default';
}
export declare const ThinkingMessage: import("react").NamedExoticComponent<ThinkingMessageProps>;
