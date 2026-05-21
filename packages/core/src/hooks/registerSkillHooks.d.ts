/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionHooksManager } from './sessionHooksManager.js';
import type { SkillConfig } from '../skills/types.js';
/**
 * Registers hooks from a skill's configuration as session hooks.
 *
 * Hooks are registered as session-scoped hooks that persist for the duration
 * of the session. If a hook has `once: true` in its configuration, it will be
 * automatically removed after its first successful execution.
 *
 * @param sessionHooksManager - The session hooks manager instance
 * @param sessionId - The current session ID
 * @param skill - The skill configuration containing hooks
 * @returns Number of hooks registered
 */
export declare function registerSkillHooks(sessionHooksManager: SessionHooksManager, sessionId: string, skill: SkillConfig): number;
/**
 * Unregisters all hooks from a skill.
 *
 * Note: This is typically not needed as session hooks are cleared
 * when the session ends. However, it can be useful for cleanup
 * in certain scenarios.
 *
 * @param sessionHooksManager - The session hooks manager instance
 * @param sessionId - The current session ID
 * @param skill - The skill configuration
 * @returns Number of hooks unregistered
 */
export declare function unregisterSkillHooks(sessionHooksManager: SessionHooksManager, sessionId: string, skill: SkillConfig): number;
