/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SubagentConfig } from './types.js';
/**
 * Canonical name of the default builtin subagent. Exported so UI
 * surfaces (e.g. `LiveAgentPanel`'s default-type elision) can compare
 * against the same source of truth instead of redeclaring the literal
 * — a rename here would otherwise silently break "skip the type
 * prefix when it's the default" logic.
 */
export declare const DEFAULT_BUILTIN_SUBAGENT_TYPE = "general-purpose";
/**
 * Registry of built-in subagents that are always available to all users.
 * These agents are embedded in the codebase and cannot be modified or deleted.
 */
export declare class BuiltinAgentRegistry {
    private static readonly BUILTIN_AGENTS;
    /**
     * Gets all built-in agent configurations.
     * @returns Array of built-in subagent configurations
     */
    static getBuiltinAgents(): SubagentConfig[];
    /**
     * Gets a specific built-in agent by name.
     * @param name - Name of the built-in agent
     * @returns Built-in agent configuration or null if not found
     */
    static getBuiltinAgent(name: string): SubagentConfig | null;
    /**
     * Checks if an agent name corresponds to a built-in agent.
     * @param name - Agent name to check
     * @returns True if the name is a built-in agent
     */
    static isBuiltinAgent(name: string): boolean;
    /**
     * Gets the names of all built-in agents.
     * @returns Array of built-in agent names
     */
    static getBuiltinAgentNames(): string[];
}
