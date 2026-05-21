/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Subagents — file-based configuration layer.
 *
 * This module provides the foundation for the subagents feature by implementing
 * a file-based configuration system that builds on the agent runtime.
 *
 */
export type { SubagentConfig, SubagentLevel, SubagentRuntimeConfig, ValidationResult, ListSubagentsOptions, CreateSubagentOptions, } from './types.js';
export { SubagentError, SubagentErrorCode } from './types.js';
export { BuiltinAgentRegistry, DEFAULT_BUILTIN_SUBAGENT_TYPE, } from './builtin-agents.js';
export { SubagentValidator } from './validation.js';
export { SubagentManager } from './subagent-manager.js';
