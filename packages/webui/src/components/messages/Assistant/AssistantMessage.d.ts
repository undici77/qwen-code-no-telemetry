/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import './AssistantMessage.css';
export type AssistantMessageStatus = 'default' | 'success' | 'error' | 'warning' | 'loading';
export interface AssistantMessageProps {
    content: string;
    timestamp?: number;
    onFileClick?: (path: string) => void;
    status?: AssistantMessageStatus;
    /** When true, render without the left status bullet (no ::before dot) */
    hideStatusIcon?: boolean;
    /** Whether this is the first item in an AI response sequence (for timeline) */
    isFirst?: boolean;
    /** Whether this is the last item in an AI response sequence (for timeline) */
    isLast?: boolean;
}
export declare const AssistantMessage: import("react").NamedExoticComponent<AssistantMessageProps>;
