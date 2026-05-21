/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
export declare function runNonInteractiveStreamJson(config: Config, input: string, settings?: LoadedSettings): Promise<void>;
