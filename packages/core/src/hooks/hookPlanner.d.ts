/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookRegistry } from './hookRegistry.js';
import type { HookExecutionPlan } from './types.js';
import { HookEventName } from './types.js';
export declare function getToolMatcherTargets(toolName: string): string[];
type HookMatcherTargetKind = 'toolName' | 'commandName' | 'agentType' | 'trigger' | 'sessionTrigger' | 'error' | 'notificationType' | 'filePath';
interface HookMatcherTarget {
    kind: HookMatcherTargetKind;
    target: string;
}
export declare function getHookMatcherTarget(eventName: HookEventName, context?: HookEventContext): HookMatcherTarget | undefined;
export declare function hookEventSupportsMatcher(eventName: HookEventName): boolean;
/**
 * Hook planner that selects matching hooks and creates execution plans
 */
export declare class HookPlanner {
    private readonly hookRegistry;
    constructor(hookRegistry: HookRegistry);
    /**
     * Create execution plan for a hook event
     */
    createExecutionPlan(eventName: HookEventName, context?: HookEventContext): HookExecutionPlan | null;
    /**
     * Check if a hook entry matches the given context.
     * Uses explicit event-based dispatch to avoid ambiguity between events
     * that share similar context fields (e.g., SessionStart and SubagentStart
     * both have agentType, but use different matcher semantics).
     */
    private matchesContext;
    /**
     * Match notification type against matcher pattern
     */
    private matchesNotificationType;
    /**
     * Match loaded instruction file path against matcher pattern.
     */
    private matchesFilePath;
    /**
     * Match session source or end reason against matcher pattern
     */
    private matchesSessionTrigger;
    /**
     * Match tool name against matcher pattern
     */
    private matchesToolName;
    /**
     * Match slash command name against matcher pattern.
     */
    private matchesCommandName;
    /**
     * Match trigger/source against matcher pattern
     */
    private matchesTrigger;
    /**
     * Match agent type against matcher pattern.
     * Supports regex matching, same as tool name matching.
     */
    private matchesAgentType;
    /**
     * Deduplicate identical hook configurations
     */
    private deduplicateHooks;
}
/**
 * Context information for hook event matching
 */
export interface HookEventContext {
    toolName?: string;
    /** Command name for UserPromptExpansion matcher filtering */
    commandName?: string;
    trigger?: string;
    notificationType?: string;
    /** Agent type for SubagentStart/SubagentStop matcher filtering */
    agentType?: string;
    /** Error type for StopFailure matcher filtering (fieldToMatch: 'error') */
    error?: string;
    /** Loaded instruction/context file path for InstructionsLoaded matcher filtering */
    filePath?: string;
}
export {};
