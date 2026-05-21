/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useCallback } from 'react';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createDebugLogger, isNodeError, Storage, } from '@qwen-code/qwen-code-core';
const MAX_HISTORY_LENGTH = 100;
const debugLogger = createDebugLogger('SHELL_HISTORY');
async function getHistoryFilePath(projectRoot, configStorage) {
    const storage = configStorage ?? new Storage(projectRoot);
    return storage.getHistoryFilePath();
}
// Handle multiline commands
async function readHistoryFile(filePath) {
    try {
        const text = await fs.readFile(filePath, 'utf-8');
        const result = [];
        let cur = '';
        for (const raw of text.split(/\r?\n/)) {
            if (!raw.trim())
                continue;
            const line = raw;
            const m = cur.match(/(\\+)$/);
            if (m && m[1].length % 2) {
                // odd number of trailing '\'
                cur = cur.slice(0, -1) + ' ' + line;
            }
            else {
                if (cur)
                    result.push(cur);
                cur = line;
            }
        }
        if (cur)
            result.push(cur);
        return result;
    }
    catch (err) {
        if (isNodeError(err) && err.code === 'ENOENT')
            return [];
        debugLogger.error('Error reading history:', err);
        return [];
    }
}
async function writeHistoryFile(filePath, history) {
    try {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, history.join('\n'));
    }
    catch (error) {
        debugLogger.error('Error writing shell history:', error);
    }
}
export function useShellHistory(projectRoot, storage) {
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [historyFilePath, setHistoryFilePath] = useState(null);
    useEffect(() => {
        async function loadHistory() {
            const filePath = await getHistoryFilePath(projectRoot, storage);
            setHistoryFilePath(filePath);
            const loadedHistory = await readHistoryFile(filePath);
            setHistory(loadedHistory.reverse()); // Newest first
        }
        loadHistory();
    }, [projectRoot, storage]);
    const addCommandToHistory = useCallback((command) => {
        if (!command.trim() || !historyFilePath) {
            return;
        }
        const newHistory = [command, ...history.filter((c) => c !== command)]
            .slice(0, MAX_HISTORY_LENGTH)
            .filter(Boolean);
        setHistory(newHistory);
        // Write to file in reverse order (oldest first)
        writeHistoryFile(historyFilePath, [...newHistory].reverse());
        setHistoryIndex(-1);
    }, [history, historyFilePath]);
    const getPreviousCommand = useCallback(() => {
        if (history.length === 0) {
            return null;
        }
        const newIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(newIndex);
        return history[newIndex] ?? null;
    }, [history, historyIndex]);
    const getNextCommand = useCallback(() => {
        if (historyIndex < 0) {
            return null;
        }
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        if (newIndex < 0) {
            return '';
        }
        return history[newIndex] ?? null;
    }, [history, historyIndex]);
    const resetHistoryPosition = useCallback(() => {
        setHistoryIndex(-1);
    }, []);
    return {
        history,
        addCommandToHistory,
        getPreviousCommand,
        getNextCommand,
        resetHistoryPosition,
    };
}
//# sourceMappingURL=useShellHistory.js.map