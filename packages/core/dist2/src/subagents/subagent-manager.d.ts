/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SubagentConfig, SubagentRuntimeConfig, SubagentLevel, ListSubagentsOptions, CreateSubagentOptions } from './types.js';
import type { PromptConfig, ModelConfig, RunConfig, ToolConfig } from '../agents/runtime/agent-types.js';
import { AgentHeadless } from '../agents/runtime/agent-headless.js';
import type { AgentEventEmitter, AgentHooks } from '../agents/runtime/agent-events.js';
import type { Config } from '../config/config.js';
/**
 * Manages subagent configurations stored as Markdown files with YAML frontmatter.
 * Provides CRUD operations, validation, and integration with the runtime system.
 */
export declare class SubagentManager {
    private readonly config;
    private readonly validator;
    private subagentsCache;
    private readonly changeListeners;
    constructor(config: Config);
    addChangeListener(listener: () => void): () => void;
    private notifyChangeListeners;
    /**
     * Creates a new subagent configuration.
     *
     * @param config - Subagent configuration to create
     * @param options - Creation options
     * @throws SubagentError if creation fails
     */
    createSubagent(config: SubagentConfig, options: CreateSubagentOptions): Promise<void>;
    /**
     * Loads a subagent configuration by name.
     * If level is specified, only searches that level.
     * If level is omitted, searches project-level first, then user-level, then built-in.
     *
     * @param name - Name of the subagent to load
     * @param level - Optional level to limit search to specific level
     * @returns SubagentConfig or null if not found
     */
    loadSubagent(name: string, level?: SubagentLevel): Promise<SubagentConfig | null>;
    /**
     * Updates an existing subagent configuration.
     *
     * @param name - Name of the subagent to update
     * @param updates - Partial configuration updates
     * @throws SubagentError if subagent not found or update fails
     */
    updateSubagent(name: string, updates: Partial<SubagentConfig>, level?: SubagentLevel): Promise<void>;
    /**
     * Deletes a subagent configuration.
     *
     * @param name - Name of the subagent to delete
     * @param level - Specific level to delete from, or undefined to delete from both
     * @throws SubagentError if deletion fails
     */
    deleteSubagent(name: string, level?: SubagentLevel, extensionName?: string): Promise<void>;
    /**
     * Lists all available subagents.
     *
     * @param options - Filtering and sorting options
     * @returns Array of subagent metadata
     */
    listSubagents(options?: ListSubagentsOptions): Promise<SubagentConfig[]>;
    /**
     * Loads session-level subagents into the cache.
     * Session subagents are provided directly via config and are read-only.
     *
     * @param subagents - Array of session subagent configurations
     */
    loadSessionSubagents(subagents: SubagentConfig[]): void;
    /**
     * Refreshes the subagents cache by loading all subagents from disk.
     * This method is called automatically when cache is null or when force=true.
     *
     * @private
     */
    refreshCache(): Promise<void>;
    /**
     * Finds a subagent by name and returns its metadata.
     *
     * @param name - Name of the subagent to find
     * @returns SubagentConfig or null if not found
     */
    findSubagentByName(name: string, level?: SubagentLevel): Promise<SubagentConfig | null>;
    /**
     * Parses a subagent file and returns the configuration.
     *
     * @param filePath - Path to the subagent file
     * @returns SubagentConfig
     * @throws SubagentError if parsing fails
     */
    parseSubagentFile(filePath: string, level: SubagentLevel): Promise<SubagentConfig>;
    /**
     * Parses subagent content from a string.
     *
     * @param content - File content
     * @param filePath - File path for error reporting
     * @returns SubagentConfig
     * @throws SubagentError if parsing fails
     */
    parseSubagentContent(content: string, filePath: string, level: SubagentLevel): SubagentConfig;
    /**
     * Serializes a subagent configuration to Markdown format.
     *
     * @param config - Configuration to serialize
     * @returns Markdown content with YAML frontmatter
     */
    serializeSubagent(config: SubagentConfig): string;
    /**
     * Creates an AgentHeadless from a subagent configuration.
     *
     * @param config - Subagent configuration
     * @param runtimeContext - Runtime context
     * @returns Promise resolving to AgentHeadless
     */
    createAgentHeadless(config: SubagentConfig, runtimeContext: Config, options?: {
        eventEmitter?: AgentEventEmitter;
        hooks?: AgentHooks;
        promptConfigOverrides?: Partial<PromptConfig>;
        modelConfigOverrides?: Partial<ModelConfig>;
        runConfigOverrides?: Partial<RunConfig>;
        toolConfigOverride?: ToolConfig;
    }): Promise<AgentHeadless>;
    /**
     * Build the per-subagent Config override used as the AgentHeadless
     * runtime context. The override is a thin prototype-delegation wrapper
     * (`Object.create(runtimeContext)`): no method changes, but a distinct
     * instance triggers the lazy own-property init in
     * `Config.getFileReadCache()` so the subagent gets its own cache
     * rather than inheriting the parent's recorded reads — which would
     * silently weaken prior-read enforcement on its mutation paths.
     *
     * The tool registry is also rebuilt on the override so `EditTool` /
     * `WriteFileTool` / `ReadFileTool` resolve `this.config` to the
     * subagent — without that step, the parent's cached tool instances
     * still reach the parent's FileReadCache. The rebuild is skipped when
     * a wrapper above `runtimeContext` already rebuilt one (typically
     * `agent.ts:createApprovalModeOverride`, which marks itself via a
     * Symbol-keyed flag — Symbol lookup walks the prototype chain, so
     * this also catches wrapper-on-wrapper layering like
     * `bgConfig = Object.create(agentConfig)` from the background path).
     * Rebuilding twice would waste work, leak listeners on shared
     * managers, and split caches across registry layers.
     */
    private buildSubagentContextOverride;
    /**
     * When a subagent's model selector resolves to a concrete model, build a
     * dedicated ContentGenerator and the view the agent runtime should publish
     * via AsyncLocalStorage during the run. Returns `undefined` when no
     * override is needed — including `inherit`, an unset `fast` selector, or
     * any selector that fails to resolve to a configured model.
     *
     * FileReadCache isolation and tool-registry rebuilding are handled
     * separately in {@link buildSubagentContextOverride} — every subagent
     * (inherit or explicit) gets that, regardless of whether a runtime
     * view is built here.
     */
    private buildRuntimeContentGeneratorView;
    private resolveModelOverride;
    /**
     * Converts a file-based SubagentConfig to runtime configuration
     * compatible with AgentHeadless.create().
     *
     * @param config - File-based subagent configuration
     * @returns Runtime configuration for AgentHeadless
     */
    convertToRuntimeConfig(config: SubagentConfig, runtimeContext?: Config): Promise<SubagentRuntimeConfig>;
    /**
     * Transforms a tools array that may contain tool names or display names
     * into an array containing only tool names.
     *
     * @param tools - Array of tool names or display names
     * @returns Array of tool names
     * @private
     */
    private transformToToolNames;
    /**
     * Merges partial configurations with defaults, useful for updating
     * existing configurations.
     *
     * @param base - Base configuration
     * @param updates - Partial updates to apply
     * @returns New configuration with updates applied
     */
    mergeConfigurations(base: SubagentConfig, updates: Partial<SubagentConfig>): SubagentConfig;
    /**
     * Gets the file path for a subagent at a specific level.
     *
     * @param name - Subagent name
     * @param level - Storage level
     * @returns Absolute file path
     */
    getSubagentPath(name: string, level: SubagentLevel): string;
    /**
     * Lists subagent files at a specific level.
     * Handles both builtin agents and file-based agents.
     *
     * @param level - Storage level to scan
     * @returns Array of subagent configurations
     */
    private listSubagentsAtLevel;
    /**
     * Finds a subagent by name at a specific level by scanning all files.
     * This method ensures we find subagents even if the filename doesn't match the name.
     *
     * @param name - Name of the subagent to find
     * @param level - Storage level to search
     * @returns SubagentConfig or null if not found
     */
    private findSubagentByNameAtLevel;
    /**
     * Validates that a subagent name is available (not already in use).
     *
     * @param name - Name to check
     * @param level - Level to check, or undefined to check both
     * @returns True if name is available
     */
    isNameAvailable(name: string, level?: SubagentLevel): Promise<boolean>;
}
export declare function loadSubagentFromDir(baseDir: string): Promise<SubagentConfig[]>;
