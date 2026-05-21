/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared layout components for tool call UI
 * Platform-agnostic version using webui components
 */
import type { FC } from 'react';
import './LayoutComponents.css';
/**
 * Props for ToolCallContainer
 */
export interface ToolCallContainerProps {
    /** Operation label (e.g., "Read", "Write", "Search") */
    label: string;
    /** Status for bullet color: 'success' | 'error' | 'warning' | 'loading' | 'default' */
    status?: 'success' | 'error' | 'warning' | 'loading' | 'default';
    /** Main content to display (optional - some tool calls only show title) */
    children?: React.ReactNode;
    /** Tool call ID for debugging */
    toolCallId?: string;
    /** Optional trailing content rendered next to label (e.g., clickable filename) */
    labelSuffix?: React.ReactNode;
    /** Optional custom class name */
    className?: string;
    /** Whether this is the first item in an AI response sequence (for timeline) */
    isFirst?: boolean;
    /** Whether this is the last item in an AI response sequence (for timeline) */
    isLast?: boolean;
}
/**
 * ToolCallContainer - Main container for tool call displays
 * Features timeline connector line and status bullet
 */
export declare const ToolCallContainer: FC<ToolCallContainerProps>;
/**
 * Props for ToolCallCard
 */
interface ToolCallCardProps {
    icon: string;
    children: React.ReactNode;
}
/**
 * ToolCallCard - Legacy card wrapper for complex layouts like diffs
 */
export declare const ToolCallCard: FC<ToolCallCardProps>;
/**
 * Props for ToolCallRow
 */
interface ToolCallRowProps {
    label: string;
    children: React.ReactNode;
}
/**
 * ToolCallRow - A single row in the tool call grid (legacy - for complex layouts)
 */
export declare const ToolCallRow: FC<ToolCallRowProps>;
/**
 * Props for StatusIndicator
 */
interface StatusIndicatorProps {
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    text: string;
}
/**
 * StatusIndicator - Status indicator with colored dot
 */
export declare const StatusIndicator: FC<StatusIndicatorProps>;
/**
 * Props for CodeBlock
 */
interface CodeBlockProps {
    children: string;
}
/**
 * CodeBlock - Code block for displaying formatted code or output
 */
export declare const CodeBlock: FC<CodeBlockProps>;
/**
 * Props for LocationsList
 */
interface LocationsListProps {
    locations: Array<{
        path: string;
        line?: number | null;
    }>;
}
/**
 * LocationsList - List of file locations with clickable links
 */
export declare const LocationsList: FC<LocationsListProps>;
export {};
