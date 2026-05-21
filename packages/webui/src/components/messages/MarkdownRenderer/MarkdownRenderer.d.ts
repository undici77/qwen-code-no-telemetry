/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * MarkdownRenderer component - renders markdown content with syntax highlighting and clickable file paths
 */
import type { FC } from 'react';
import './MarkdownRenderer.css';
export interface MarkdownRendererProps {
    content: string;
    onFileClick?: (filePath: string) => void;
    /** When false, do not convert file paths into clickable links. Default: true */
    enableFileLinks?: boolean;
}
/**
 * MarkdownRenderer component - renders markdown content with enhanced features
 */
export declare const MarkdownRenderer: FC<MarkdownRendererProps>;
