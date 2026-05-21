/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * FileLink component - Clickable file path links
 * Platform-agnostic version using PlatformContext
 * Supports clicking to open files and jump to specified line and column numbers
 */
import type { FC } from 'react';
/**
 * Props for FileLink component
 */
export interface FileLinkProps {
    /** File path */
    path: string;
    /** Optional line number (starting from 1) */
    line?: number | null;
    /** Optional column number (starting from 1) */
    column?: number | null;
    /** Whether to show full path, default false (show filename only) */
    showFullPath?: boolean;
    /** Optional custom class name */
    className?: string;
    /** Whether to disable click behavior (use when parent element handles clicks) */
    disableClick?: boolean;
}
/**
 * FileLink component - Clickable file link
 *
 * Features:
 * - Click to open file using platform-specific handler
 * - Support line and column number navigation
 * - Hover to show full path
 * - Optional display mode (full path vs filename only)
 * - Full keyboard accessibility (Enter and Space keys)
 *
 * @example
 * ```tsx
 * <FileLink path="/src/App.tsx" line={42} />
 * <FileLink path="/src/components/Button.tsx" line={10} column={5} showFullPath={true} />
 * ```
 */
export declare const FileLink: FC<FileLinkProps>;
