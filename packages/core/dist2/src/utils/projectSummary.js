/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'fs/promises';
import * as path from 'path';
const PROJECT_SUMMARY_FILENAME = 'PROJECT_SUMMARY.md';
const WELCOME_BACK_STATE_FILENAME = 'welcome-back-state.json';
function getProjectSummaryPath() {
    return path.join(process.cwd(), '.qwen', PROJECT_SUMMARY_FILENAME);
}
function getWelcomeBackStatePath() {
    return path.join(process.cwd(), '.qwen', WELCOME_BACK_STATE_FILENAME);
}
function buildSummaryFingerprint(stat) {
    return `${stat.mtimeMs}:${stat.size}`;
}
export async function getWelcomeBackState() {
    try {
        const raw = await fs.readFile(getWelcomeBackStatePath(), 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.version !== 1 ||
            parsed.lastChoice !== 'restart' ||
            typeof parsed.summaryFingerprint !== 'string') {
            return null;
        }
        return {
            lastChoice: parsed.lastChoice,
            summaryFingerprint: parsed.summaryFingerprint,
        };
    }
    catch {
        return null;
    }
}
export async function saveWelcomeBackRestartChoice(summaryFingerprint) {
    const statePath = getWelcomeBackStatePath();
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    const state = {
        version: 1,
        lastChoice: 'restart',
        summaryFingerprint,
    };
    await fs.writeFile(statePath, JSON.stringify(state, null, 2), 'utf-8');
}
export async function clearWelcomeBackState() {
    try {
        await fs.rm(getWelcomeBackStatePath(), { force: true });
    }
    catch {
        // Treat cleanup as best-effort so welcome back remains non-critical.
    }
}
/**
 * Reads and parses the project summary file to extract structured information
 */
export async function getProjectSummaryInfo() {
    const summaryPath = getProjectSummaryPath();
    try {
        await fs.access(summaryPath);
    }
    catch {
        return {
            hasHistory: false,
        };
    }
    try {
        const summaryStat = await fs.stat(summaryPath);
        const content = await fs.readFile(summaryPath, 'utf-8');
        const summaryFingerprint = buildSummaryFingerprint(summaryStat);
        // Extract timestamp if available
        const timestampMatch = content.match(/\*\*Update time\*\*: (.+)/);
        const timestamp = timestampMatch
            ? timestampMatch[1]
            : new Date().toISOString();
        // Calculate time ago
        const getTimeAgo = (timestamp) => {
            const date = new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            if (diffDays > 0) {
                return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
            }
            else if (diffHours > 0) {
                return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
            }
            else if (diffMinutes > 0) {
                return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
            }
            else {
                return 'just now';
            }
        };
        const timeAgo = getTimeAgo(timestamp);
        // Parse Overall Goal section
        const goalSection = content.match(/## Overall Goal\s*\n?([\s\S]*?)(?=\n## |$)/);
        const goalContent = goalSection ? goalSection[1].trim() : '';
        // Parse Current Plan section
        const planSection = content.match(/## Current Plan\s*\n?([\s\S]*?)(?=\n## |$)/);
        const planContent = planSection ? planSection[1] : '';
        const planLines = planContent.split('\n').filter((line) => line.trim());
        const doneCount = planLines.filter((line) => line.includes('[DONE]')).length;
        const inProgressCount = planLines.filter((line) => line.includes('[IN PROGRESS]')).length;
        const todoCount = planLines.filter((line) => line.includes('[TODO]')).length;
        const totalTasks = doneCount + inProgressCount + todoCount;
        // Extract pending tasks
        const pendingTasks = planLines
            .filter((line) => line.includes('[TODO]') || line.includes('[IN PROGRESS]'))
            .map((line) => line.replace(/^\d+\.\s*/, '').trim())
            .slice(0, 3);
        return {
            hasHistory: true,
            content,
            timestamp,
            timeAgo,
            goalContent,
            planContent,
            totalTasks,
            doneCount,
            inProgressCount,
            todoCount,
            pendingTasks,
            summaryFingerprint,
        };
    }
    catch (_error) {
        return {
            hasHistory: false,
        };
    }
}
//# sourceMappingURL=projectSummary.js.map