/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createDebugLogger, resolveOpenAILogDir, Storage, } from '@qwen-code/qwen-code-core';
const debugLogger = createDebugLogger('SESSION_PATHS');
const OPENAI_LOG_SCAN_LIMIT = 100;
export async function collectSessionPathInfo(context) {
    const config = context.services.config;
    const sessionId = config?.getSessionId() || context.session.stats.sessionId || 'unknown';
    const contentGeneratorConfig = config?.getContentGeneratorConfig();
    const workingDir = config?.getWorkingDir() || process.cwd();
    const openAILogDir = resolveOpenAILogDir(contentGeneratorConfig?.openAILoggingDir, workingDir);
    const openAILoggingEnabled = contentGeneratorConfig?.enableOpenAILogging === true;
    const latestOpenAILog = openAILoggingEnabled && sessionId !== 'unknown'
        ? await findLatestOpenAILogForSession(openAILogDir, sessionId)
        : undefined;
    const transcriptPath = config?.getTranscriptPath() || '';
    const debugLogPath = config?.getDebugMode() && sessionId !== 'unknown'
        ? Storage.getDebugLogPath(sessionId)
        : '';
    const planFilePath = config?.getPlanFilePath() ||
        (sessionId === 'unknown' ? '' : Storage.getPlanFilePath(sessionId));
    const planFileExists = planFilePath ? await pathExists(planFilePath) : false;
    const sections = [
        {
            title: 'Session files',
            entries: [
                { label: 'Session ID', value: sessionId },
                ...(transcriptPath
                    ? [{ label: 'Transcript', value: transcriptPath }]
                    : []),
                ...(debugLogPath ? [{ label: 'Debug log', value: debugLogPath }] : []),
                ...(planFileExists
                    ? [{ label: 'Plan file', value: planFilePath }]
                    : []),
            ],
        },
    ];
    if (openAILoggingEnabled) {
        sections.push({
            title: 'OpenAI logs',
            entries: [
                { label: 'Directory', value: openAILogDir },
                { label: 'Latest for session', value: latestOpenAILog ?? 'none yet' },
            ],
        });
    }
    return {
        sections,
    };
}
export function formatSessionPathInfo(info) {
    const lines = [];
    for (const [index, section] of info.sections.entries()) {
        if (index > 0) {
            lines.push('');
        }
        lines.push(`${section.title}:`);
        for (const entry of section.entries) {
            lines.push(`  ${entry.label}: ${entry.value}`);
        }
    }
    return lines.join('\n');
}
async function findLatestOpenAILogForSession(logDir, sessionId) {
    const files = await listLogFiles(logDir, (name) => /^openai-.*\.json$/.test(name));
    for (const file of files) {
        try {
            const raw = await fs.readFile(file, 'utf-8');
            const parsed = JSON.parse(raw);
            if (hasContextSessionId(parsed, sessionId)) {
                return file;
            }
        }
        catch (error) {
            if (error instanceof SyntaxError ||
                error.code === 'ENOENT') {
                continue;
            }
            debugLogger.warn('Error reading OpenAI log file', file, error);
        }
    }
    return undefined;
}
async function listLogFiles(dir, predicate) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files = [];
        for (const entry of entries) {
            if (!entry.isFile() || !predicate(entry.name)) {
                continue;
            }
            insertRecentFile(files, path.join(dir, entry.name));
        }
        return files;
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            debugLogger.warn('Unable to list OpenAI log directory', dir, error);
        }
        return [];
    }
}
function insertRecentFile(files, file) {
    const insertAt = files.findIndex((existing) => file > existing);
    if (insertAt === -1) {
        if (files.length < OPENAI_LOG_SCAN_LIMIT) {
            files.push(file);
        }
        return;
    }
    files.splice(insertAt, 0, file);
    if (files.length > OPENAI_LOG_SCAN_LIMIT) {
        files.pop();
    }
}
async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
function hasContextSessionId(value, sessionId) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const context = value.context;
    if (!context || typeof context !== 'object') {
        return false;
    }
    const ctx = context;
    return ctx.sessionId === sessionId || ctx.promptId === sessionId;
}
//# sourceMappingURL=sessionPaths.js.map