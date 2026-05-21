/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import { type LoadedSettings } from './config/settings.js';
export declare function validateNonInteractiveAuth(useExternalAuth: boolean | undefined, nonInteractiveConfig: Config, settings: LoadedSettings): Promise<Config>;
