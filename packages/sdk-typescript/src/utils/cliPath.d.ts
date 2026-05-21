/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Executable types supported by the SDK
 */
export type ExecutableType = 'node' | 'bun' | 'tsx' | 'native';
/**
 * Spawn information for CLI process
 */
export type SpawnInfo = {
    /** Command to execute (e.g., 'node', 'bun', 'tsx', or native binary path) */
    command: string;
    /** Arguments to pass to command */
    args: string[];
    /** Type of executable detected */
    type: ExecutableType;
    /** Original input that was resolved */
    originalInput: string;
};
/**
 * Find the bundled CLI path or throw error
 */
export declare function findBundledCliPath(): string;
/**
 * Prepare spawn information for CLI process
 */
export declare function prepareSpawnInfo(executableSpec?: string): SpawnInfo;
