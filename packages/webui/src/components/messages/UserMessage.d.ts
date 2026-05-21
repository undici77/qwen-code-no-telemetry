/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface FileContext {
    fileName: string;
    filePath: string;
    startLine?: number;
    endLine?: number;
}
export interface UserMessageProps {
    content: string;
    timestamp: number;
    onFileClick?: (path: string) => void;
    fileContext?: FileContext;
    onEdit?: () => void;
    editDisabled?: boolean;
}
export declare const UserMessage: import("react").NamedExoticComponent<UserMessageProps>;
