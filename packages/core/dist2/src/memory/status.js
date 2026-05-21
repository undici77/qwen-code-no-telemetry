/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import {} from './manager.js';
import { getAutoMemoryExtractCursorPath, getAutoMemoryIndexPath, getAutoMemoryMetadataPath, getAutoMemoryRoot, } from './paths.js';
import { scanAutoMemoryTopicDocuments } from './scan.js';
import { AUTO_MEMORY_TYPES } from './types.js';
async function readJsonFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return undefined;
    }
}
export async function getManagedAutoMemoryStatus(projectRoot, manager) {
    const root = getAutoMemoryRoot(projectRoot);
    const indexPath = getAutoMemoryIndexPath(projectRoot);
    const [indexContent, cursor, metadata, docs] = await Promise.all([
        fs.readFile(indexPath, 'utf-8').catch(() => ''),
        readJsonFile(getAutoMemoryExtractCursorPath(projectRoot)),
        readJsonFile(getAutoMemoryMetadataPath(projectRoot)),
        scanAutoMemoryTopicDocuments(projectRoot),
    ]);
    // Aggregate per-entry files by topic
    const byTopic = new Map();
    for (const doc of docs) {
        const list = byTopic.get(doc.type) ?? [];
        list.push(doc.filePath);
        byTopic.set(doc.type, list);
    }
    const topics = AUTO_MEMORY_TYPES.map((topic) => ({
        topic,
        entryCount: byTopic.get(topic)?.length ?? 0,
        filePaths: byTopic.get(topic) ?? [],
    }));
    const extractTaskType = 'extract';
    const dreamTaskType = 'dream';
    return {
        root,
        indexPath,
        indexContent,
        cursor,
        metadata,
        extractionRunning: manager
            .listTasksByType(extractTaskType, projectRoot)
            .some((t) => t.status === 'running'),
        topics,
        extractionTasks: manager
            .listTasksByType(extractTaskType, projectRoot)
            .slice(0, 8),
        dreamTasks: manager.listTasksByType(dreamTaskType, projectRoot).slice(0, 5),
    };
}
//# sourceMappingURL=status.js.map