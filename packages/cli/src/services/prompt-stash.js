/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { atomicWriteFileSync, Storage } from '@qwen-code/qwen-code-core';
const PROMPT_STASH_FILE = 'prompt-stash.json';
function getPromptStashPath(targetDir) {
    return path.join(new Storage(targetDir).getProjectDir(), PROMPT_STASH_FILE);
}
export function savePromptStash(targetDir, text) {
    try {
        const filePath = getPromptStashPath(targetDir);
        fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 });
        const data = { version: 1, text };
        atomicWriteFileSync(filePath, JSON.stringify(data), {
            mode: 0o600,
            forceMode: true,
            noFollow: true,
        });
        return true;
    }
    catch {
        return false;
    }
}
export function loadPromptStash(targetDir) {
    try {
        const raw = fs.readFileSync(getPromptStashPath(targetDir), 'utf8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' &&
            parsed !== null &&
            !Array.isArray(parsed) &&
            parsed.version === 1 &&
            typeof parsed.text === 'string') {
            return parsed.text;
        }
    }
    catch {
        // A missing or malformed stash must never prevent CLI startup.
    }
    return null;
}
export function restorePromptStash(targetDir, currentText, onRestore) {
    const stashedPrompt = loadPromptStash(targetDir);
    if (stashedPrompt === null || currentText.length > 0) {
        return false;
    }
    onRestore(stashedPrompt);
    return true;
}
export function clearPromptStash(targetDir) {
    try {
        fs.unlinkSync(getPromptStashPath(targetDir));
        return true;
    }
    catch (error) {
        return error.code === 'ENOENT';
    }
}
//# sourceMappingURL=prompt-stash.js.map