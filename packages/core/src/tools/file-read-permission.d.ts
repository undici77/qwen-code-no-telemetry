/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { PermissionDecision } from '../permissions/types.js';
export declare function getFileReadDefaultPermission(
  config: Config,
  requestedPath: string,
): PermissionDecision;
