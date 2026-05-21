/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { AgentViewActions } from '../contexts/AgentViewContext.js';
/**
 * Bridge arena in-process events to agent tab registration/unregistration.
 *
 * Called by AgentViewProvider — accepts config and actions directly so the
 * hook has no dependency on AgentViewContext (avoiding a circular import).
 */
export declare function useArenaInProcess(config: Config | null, actions: AgentViewActions): void;
