/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type MemoryManager, type MemoryTaskRecord } from './manager.js';
import type { AutoMemoryExtractCursor, AutoMemoryMetadata, AutoMemoryType } from './types.js';
export interface ManagedAutoMemoryTopicStatus {
    topic: AutoMemoryType;
    entryCount: number;
    filePaths: string[];
}
export interface ManagedAutoMemoryStatus {
    root: string;
    indexPath: string;
    indexContent: string;
    cursor?: AutoMemoryExtractCursor;
    metadata?: AutoMemoryMetadata;
    extractionRunning: boolean;
    topics: ManagedAutoMemoryTopicStatus[];
    extractionTasks: MemoryTaskRecord[];
    dreamTasks: MemoryTaskRecord[];
}
export declare function getManagedAutoMemoryStatus(projectRoot: string, manager: MemoryManager): Promise<ManagedAutoMemoryStatus>;
