/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandContext } from '../ui/commands/types.js';
import type { DoctorCheckResult } from '../ui/types.js';
/**
 * Run all doctor diagnostic checks.
 */
export declare function runDoctorChecks(context: CommandContext): Promise<DoctorCheckResult[]>;
