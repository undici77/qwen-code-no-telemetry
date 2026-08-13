/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config, type GoalStateCause } from '@qwen-code/qwen-code-core';
export declare function shouldDisplayGoalStateCause(cause: GoalStateCause): boolean;
export declare function waitForGoalRuntime(config: Pick<Config, 'getGoalRuntimeReady'>): Promise<void>;
