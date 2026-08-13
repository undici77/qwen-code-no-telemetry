/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
export interface MemoryWriteCandidate {
    toolName: string;
    args?: Record<string, unknown>;
    status?: string;
}
export interface RefreshMemoryAfterWriteOptions {
    logContext?: string;
}
export declare function didWriteManagedMemory(candidates: readonly MemoryWriteCandidate[], projectRoot: string): boolean;
export declare function didWriteProjectContextFile(candidates: readonly MemoryWriteCandidate[], projectRoot: string): boolean;
export declare function refreshMemoryInstruction(config: Config, options?: Pick<RefreshMemoryAfterWriteOptions, 'logContext'>): Promise<void>;
export declare function refreshMemoryAfterManagedWrite(config: Config, candidates: readonly MemoryWriteCandidate[], options?: RefreshMemoryAfterWriteOptions): Promise<boolean>;
