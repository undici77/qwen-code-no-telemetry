/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { ToolResult, ToolResultDisplay } from './tools.js';
import type { Config } from '../config/config.js';
import type { PermissionDecision } from '../permissions/types.js';
import type { SkillManager } from '../skills/skill-manager.js';
export interface SkillParams {
    skill: string;
}
export { buildSkillLlmContent } from './skill-utils.js';
/**
 * Skill tool that enables the model to access skill definitions.
 * The tool dynamically loads available skills and includes them in its description
 * for the model to choose from.
 */
export declare class SkillTool extends BaseDeclarativeTool<SkillParams, ToolResult> {
    private readonly config;
    static readonly Name: string;
    private skillManager;
    private availableSkills;
    private pendingConditionalSkillNames;
    private modelInvocableCommands;
    private loadedSkillNames;
    private removeChangeListener;
    constructor(config: Config);
    /**
     * Asynchronously initializes the tool by loading available skills
     * and updating the description and schema.
     */
    refreshSkills(): Promise<void>;
    /**
     * Updates the tool's description and schema based on available skills and
     * model-invocable commands (e.g. bundled skills, file commands, MCP prompts).
     */
    private updateDescriptionAndSchema;
    validateToolParams(params: SkillParams): string | null;
    protected createInvocation(params: SkillParams): SkillToolInvocation;
    toAutoClassifierInput(params: SkillParams): Record<string, unknown>;
    getAvailableSkillNames(): string[];
    /**
     * Returns the set of skill names that have been successfully loaded
     * (invoked) during the current session. Used by /context to attribute
     * loaded skill body tokens separately from the tool-definition cost.
     */
    getLoadedSkillNames(): ReadonlySet<string>;
    /**
     * Clears the loaded-skills tracking. Should be called when the session
     * is reset (e.g. /clear) so that stale body-token data is not shown.
     */
    clearLoadedSkills(): void;
    /**
     * Detach the change listener from SkillManager. Tool registries call
     * this on teardown (mirroring AgentTool's pattern). Per-subagent
     * SkillTool instances share the parent's SkillManager via
     * `InProcessBackend.createPerAgentConfig`, so without dispose the
     * SkillManager would accumulate one stale listener per subagent
     * lifetime — and `notifyChangeListeners` is now `await`-ed
     * sequentially, so each path activation would serialize through every
     * accumulated listener's refreshSkills + setTools round-trip.
     */
    dispose(): void;
}
declare class SkillToolInvocation extends BaseToolInvocation<SkillParams, ToolResult> {
    private readonly config;
    private readonly skillManager;
    private readonly onSkillLoaded;
    private readonly commandExecutor;
    constructor(config: Config, skillManager: SkillManager, params: SkillParams, onSkillLoaded: (name: string) => void, commandExecutor?: ((name: string, args?: string) => Promise<string | null>) | null);
    getDescription(): string;
    /**
     * Skills load user-defined code that runs with the agent's tool
     * access — they're a privileged sink. In AUTO mode the classifier
     * needs to inspect the skill name and any inline args before the
     * skill loads, but the scheduler short-circuits at L4 when
     * `finalPermission === 'allow'`. The L3 default must be `'ask'` so
     * the classifier projection added in this PR can be reached.
     */
    getDefaultPermission(): Promise<PermissionDecision>;
    execute(_signal?: AbortSignal, _updateOutput?: (output: ToolResultDisplay) => void): Promise<ToolResult>;
}
