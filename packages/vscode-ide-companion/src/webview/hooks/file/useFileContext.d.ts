/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { VSCodeAPI } from '../../hooks/useVSCode.js';
/**
 * File context management Hook
 * Manages active file, selection content, and workspace file list
 */
export declare const useFileContext: (vscode: VSCodeAPI) => {
    activeFileName: string | null;
    activeFilePath: string | null;
    activeSelection: {
        startLine: number;
        endLine: number;
    } | null;
    workspaceFiles: {
        id: string;
        label: string;
        description: string;
        path: string;
    }[];
    hasRequestedFiles: boolean;
    setActiveFileName: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    setActiveFilePath: import("react").Dispatch<import("react").SetStateAction<string | null>>;
    setActiveSelection: import("react").Dispatch<import("react").SetStateAction<{
        startLine: number;
        endLine: number;
    } | null>>;
    setWorkspaceFiles: import("react").Dispatch<import("react").SetStateAction<{
        id: string;
        label: string;
        description: string;
        path: string;
    }[]>>;
    setWorkspaceFilesFromResponse: (files: Array<{
        id: string;
        label: string;
        description: string;
        path: string;
    }>, requestId?: number) => void;
    addFileReference: (fileName: string, filePath: string) => void;
    getFileReference: (fileName: string) => string | undefined;
    clearFileReferences: () => void;
    requestWorkspaceFiles: (query?: string) => void;
    requestActiveEditor: () => void;
    focusActiveEditor: () => void;
};
