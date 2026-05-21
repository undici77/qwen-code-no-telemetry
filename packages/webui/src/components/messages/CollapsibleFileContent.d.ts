/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
/**
 * Parsed segment of user message content
 */
export interface ContentSegment {
    type: 'text' | 'file_reference';
    content: string;
    /** File path for file_reference type */
    filePath?: string;
    /** File name extracted from path */
    fileName?: string;
}
/**
 * Parse content to identify file references and regular text
 * @param content - The raw content string
 * @returns Array of content segments
 */
export declare function parseContentWithFileReferences(content: string): ContentSegment[];
/**
 * Props for CollapsibleFileContent
 */
export interface CollapsibleFileContentProps {
    content: string;
    onFileClick?: (path: string) => void;
    enableFileLinks?: boolean;
}
/**
 * CollapsibleFileContent - Renders content with collapsible file references
 *
 * Detects file reference patterns in user messages and renders them as
 * collapsible blocks to improve readability.
 */
export declare const CollapsibleFileContent: FC<CollapsibleFileContentProps>;
export default CollapsibleFileContent;
