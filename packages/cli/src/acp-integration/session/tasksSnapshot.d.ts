/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import { type ServeSessionTasksStatus } from '@qwen-code/acp-bridge/status';
export declare function buildSessionTasksStatus(sessionId: string, config: Config, now?: number): ServeSessionTasksStatus;
