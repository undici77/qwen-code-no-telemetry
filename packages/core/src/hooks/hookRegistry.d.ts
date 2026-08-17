/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookDefinition, HookConfig } from './types.js';
import { HookEventName, HooksConfigSource } from './types.js';
/**
 * Extension with hooks support
 */
export interface ExtensionWithHooks {
  isActive: boolean;
  hooks?: {
    [K in HookEventName]?: HookDefinition[];
  };
}
/**
 * Configuration interface for HookRegistry
 * This abstracts the Config dependency to make the registry more flexible
 */
export interface HookRegistryConfig {
  getProjectRoot(): string;
  isTrustedFolder(): boolean;
  getUserHooks():
    | {
        [K in HookEventName]?: HookDefinition[];
      }
    | undefined;
  getProjectHooks():
    | {
        [K in HookEventName]?: HookDefinition[];
      }
    | undefined;
  getExtensions(): ExtensionWithHooks[];
}
/**
 * Feedback emitter interface for warning/info messages
 */
export interface FeedbackEmitter {
  emitFeedback(type: 'warning' | 'info' | 'error', message: string): void;
}
/**
 * Hook registry entry with source information
 */
export interface HookRegistryEntry {
  config: HookConfig;
  source: HooksConfigSource;
  eventName: HookEventName;
  matcher?: string;
  sequential?: boolean;
  enabled: boolean;
  /**
   * Identifier for ephemeral entries attached at runtime by a specific
   * subagent (via {@link HookRegistry.addAgentHooks}). Used by the matching
   * unregister callback to remove the entries when the subagent ends. Plain
   * (session/user/project/extension) entries leave this undefined.
   */
  agentScope?: string;
}
/**
 * Hook registry that loads and validates hook definitions from multiple sources
 */
export declare class HookRegistry {
  private readonly config;
  private readonly feedbackEmitter?;
  private entries;
  constructor(config: HookRegistryConfig, feedbackEmitter?: FeedbackEmitter);
  /**
   * Initialize the registry by processing hooks from config
   */
  initialize(): Promise<void>;
  reloadConfiguredHooks(): Promise<void>;
  /**
   * Get all hook entries for a specific event
   */
  getHooksForEvent(eventName: HookEventName): HookRegistryEntry[];
  /**
   * Get all registered hooks
   */
  getAllHooks(): HookRegistryEntry[];
  /**
   * Append ephemeral hook entries scoped to a specific subagent. Used by
   * `SubagentManager` to wire the `hooks` field from a declarative agent
   * frontmatter into the live registry when the subagent spawns.
   *
   * The hooks are validated through the same per-definition pipeline as
   * session/user/project hooks (`processHookDefinition`), so a malformed
   * entry is logged and dropped instead of breaking the spawn. Returns an
   * unregister callback that removes exactly the entries added by this call;
   * the caller is responsible for invoking it when the subagent finishes.
   *
   * v1 scope limitation: entries added here fire for every event of their
   * declared type while they remain in the registry, regardless of which
   * agent is currently active. If two subagents with different per-agent
   * hook sets run concurrently, both sets fire for both agents. Proper
   * per-agent scope filtering at firing time is left to a follow-up.
   */
  addAgentHooks(
    hooks: {
      [K in HookEventName]?: HookDefinition[];
    },
    agentScope: string,
  ): () => void;
  /**
   * Enable or disable a specific hook
   */
  setHookEnabled(hookName: string, enabled: boolean): void;
  /**
   * Get a stable unique identity for duplicate detection.
   * Uses full values (not truncated) to ensure accurate duplicate detection.
   */
  private getHookIdentity;
  /**
   * Get hook name for display purposes (may be truncated for readability).
   */
  private getHookName;
  private getHookStateKey;
  /**
   * Process hooks from the config that was already loaded by the CLI
   */
  private processHooksFromConfig;
  /**
   * Process hooks configuration and add entries
   */
  private processHooksConfiguration;
  /**
   * Process a single hook definition
   */
  private processHookDefinition;
  /**
   * Validate a hook configuration
   */
  private validateHookConfig;
  /**
   * Check if an event name is valid
   */
  private isValidEventName;
  /**
   * Get source priority (lower number = higher priority)
   */
  private getSourcePriority;
}
