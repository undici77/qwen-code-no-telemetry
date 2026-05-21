/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType } from '../../core/contentGenerator.js';
import type { ProviderConfig } from '../types.js';
export declare const CUSTOM_API_KEY_ENV_PREFIX = "QWEN_CUSTOM_API_KEY_";
export declare function generateCustomEnvKey(protocol: AuthType, baseUrl: string): string;
export declare const customProvider: ProviderConfig;
