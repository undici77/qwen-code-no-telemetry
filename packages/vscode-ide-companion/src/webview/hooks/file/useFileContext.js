/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useCallback, useRef } from 'react';
/**
 * File context management Hook
 * Manages active file, selection content, and workspace file list
 */
export const useFileContext = (vscode) => {
    const [activeFileName, setActiveFileName] = useState(null);
    const [activeFilePath, setActiveFilePath] = useState(null);
    const [activeSelection, setActiveSelection] = useState(null);
    const [workspaceFiles, setWorkspaceFiles] = useState([]);
    // File reference mapping: @filename -> full path
    const fileReferenceMap = useRef(new Map());
    // Whether workspace files have been requested
    const hasRequestedFilesRef = useRef(false);
    // Use request ids to avoid applying stale workspace file responses.
    const workspaceFilesRequestIdRef = useRef(0);
    const latestWorkspaceFilesRequestIdRef = useRef(null);
    // Last non-empty query to decide when to refetch full list
    const lastQueryRef = useRef(undefined);
    // Search debounce timer
    const searchTimerRef = useRef(null);
    /**
     * Request workspace files
     */
    const requestWorkspaceFiles = useCallback((query) => {
        const normalizedQuery = query?.trim();
        const normalizedQueryKey = normalizedQuery?.toLowerCase();
        // If there's a query, clear previous timer and set up debounce
        if (normalizedQuery && normalizedQuery.length >= 1) {
            if (normalizedQueryKey === lastQueryRef.current) {
                return;
            }
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
            const requestId = workspaceFilesRequestIdRef.current + 1;
            workspaceFilesRequestIdRef.current = requestId;
            latestWorkspaceFilesRequestIdRef.current = requestId;
            searchTimerRef.current = setTimeout(() => {
                vscode.postMessage({
                    type: 'getWorkspaceFiles',
                    data: { query: normalizedQuery, requestId },
                });
            }, 300);
            lastQueryRef.current = normalizedQueryKey;
        }
        else {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
                searchTimerRef.current = null;
            }
            // For empty query, request once initially and whenever we are returning from a search
            const shouldRequestFullList = !hasRequestedFilesRef.current || lastQueryRef.current !== undefined;
            if (shouldRequestFullList) {
                const requestId = workspaceFilesRequestIdRef.current + 1;
                workspaceFilesRequestIdRef.current = requestId;
                latestWorkspaceFilesRequestIdRef.current = requestId;
                lastQueryRef.current = undefined;
                hasRequestedFilesRef.current = true;
                vscode.postMessage({
                    type: 'getWorkspaceFiles',
                    data: { requestId },
                });
            }
        }
    }, [vscode]);
    /**
     * Apply workspace file responses only if they are current.
     */
    const setWorkspaceFilesFromResponse = useCallback((files, requestId) => {
        if (typeof requestId === 'number' &&
            latestWorkspaceFilesRequestIdRef.current !== requestId) {
            return;
        }
        setWorkspaceFiles(files);
    }, []);
    /**
     * Add file reference (called when user selects a file from completion)
     * Also resets the last query so that backspacing and re-typing will trigger a fresh search
     */
    const addFileReference = useCallback((fileName, filePath) => {
        fileReferenceMap.current.set(fileName, filePath);
        lastQueryRef.current = undefined;
    }, []);
    /**
     * Get file reference
     */
    const getFileReference = useCallback((fileName) => fileReferenceMap.current.get(fileName), []);
    /**
     * Clear file references
     */
    const clearFileReferences = useCallback(() => {
        fileReferenceMap.current.clear();
    }, []);
    /**
     * Request active editor info
     */
    const requestActiveEditor = useCallback(() => {
        vscode.postMessage({ type: 'getActiveEditor', data: {} });
    }, [vscode]);
    /**
     * Focus on active editor
     */
    const focusActiveEditor = useCallback(() => {
        vscode.postMessage({
            type: 'focusActiveEditor',
            data: {},
        });
    }, [vscode]);
    return {
        // State
        activeFileName,
        activeFilePath,
        activeSelection,
        workspaceFiles,
        hasRequestedFiles: hasRequestedFilesRef.current,
        // State setters
        setActiveFileName,
        setActiveFilePath,
        setActiveSelection,
        setWorkspaceFiles,
        setWorkspaceFilesFromResponse,
        // File reference operations
        addFileReference,
        getFileReference,
        clearFileReferences,
        // Operations
        requestWorkspaceFiles,
        requestActiveEditor,
        focusActiveEditor,
    };
};
//# sourceMappingURL=useFileContext.js.map