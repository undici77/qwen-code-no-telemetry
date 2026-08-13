/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SandboxConfig } from '@qwen-code/qwen-code-core';
import type { Settings } from './settings.js';
interface SandboxCliArgs {
    sandbox?: boolean | string;
    sandboxImage?: string;
}
/** Clears the per-process probe cache so tests stay hermetic. */
export declare function resetSandboxProbeCacheForTest(): void;
export declare function loadSandboxConfig(settings: Settings, argv: SandboxCliArgs): Promise<SandboxConfig | undefined>;
export {};
