/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Message } from '../types.js';
import type { Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
export declare function createShowMemoryAction(config: Config | null, settings: LoadedSettings, addMessage: (message: Message) => void): () => Promise<void>;
