/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExternalContextConfig } from './types.js';
export declare class ConfigurationError extends Error {
  constructor(message: string);
}
export declare function loadConfig(
  env?: NodeJS.ProcessEnv,
): Promise<ExternalContextConfig>;
