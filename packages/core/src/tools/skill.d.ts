/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseDeclarativeTool, BaseToolInvocation } from './tools.js';
import type { ToolResult, ToolResultDisplay } from './tools.js';
import type {
  Config,
  ModelInvocableCommandExecutorResult,
} from '../config/config.js';
import type { PermissionDecision } from '../permissions/types.js';
import type { SkillManager } from '../skills/skill-manager.js';
export interface SkillParams {
  skill: string;
  args?: string;
}
export { buildSkillLlmContent } from './skill-utils.js';
/**
 * Skill tool that enables the model to access skill definitions. The tool keeps
 * an in-memory set of the currently available skills (for validation) but exposes
 * a static description to the model — the live listing reaches the model via the
 * startup-prelude snapshot and per-turn `<system-reminder>` deltas.
 */
export declare class SkillTool extends BaseDeclarativeTool<
  SkillParams,
  ToolResult
> {
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
   * Refreshes the in-memory runtime sets — `availableSkills`,
   * `pendingConditionalSkillNames`, `modelInvocableCommands` — that back
   * `validateToolParams` / `execute`. Invoked on construction and whenever the
   * SkillManager fires a change (skill-file edit, conditional activation, config
   * toggle, or MCP-prompt provider change).
   *
   * It deliberately does NOT mutate the tool declaration or call
   * `geminiClient.setTools()`. The Skill tool's description is static
   * (`SKILL_TOOL_DESCRIPTION`), so the skill set no longer affects the tools
   * block — and the tools block is the front of the tools → system → messages
   * prompt-cache prefix, where any byte change invalidates the whole cached
   * prefix. These runtime sets are in-memory only and never serialized into a
   * request, so refreshing them is prompt-cache-neutral. The model's view of the
   * available skills comes from the `<available_skills>` snapshot in the startup
   * prelude plus per-turn `<system-reminder>` deltas.
   */
  refreshSkills(): Promise<void>;
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
   * accumulated listener's refreshSkills run.
   */
  dispose(): void;
}
declare class SkillToolInvocation extends BaseToolInvocation<
  SkillParams,
  ToolResult
> {
  private readonly config;
  private readonly skillManager;
  private readonly onSkillLoaded;
  private readonly commandExecutor;
  private readonly isSkillLoaded;
  private promptId;
  constructor(
    config: Config,
    skillManager: SkillManager,
    params: SkillParams,
    onSkillLoaded: (name: string) => void,
    commandExecutor?:
      | ((
          name: string,
          args?: string,
        ) => Promise<ModelInvocableCommandExecutorResult | null>)
      | null,
    isSkillLoaded?: (name: string) => boolean,
  );
  setPromptId(promptId: string): void;
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
  private recordAutoSkillUsageBestEffort;
  execute(
    _signal?: AbortSignal,
    _updateOutput?: (output: ToolResultDisplay) => void,
  ): Promise<ToolResult>;
}
