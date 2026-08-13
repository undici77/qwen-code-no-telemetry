/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionService, type SessionServiceOptions } from '@qwen-code/qwen-code-core';
import type { WorkspaceRuntime } from './workspace-registry.js';
export declare function runWithWorkspaceRuntimeStorage<T>(runtime: WorkspaceRuntime, fn: () => T): T;
export declare function createWorkspaceRuntimeSessionService(runtime: WorkspaceRuntime, options?: Omit<SessionServiceOptions, 'runtimeBaseDir'>): SessionService;
