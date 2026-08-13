/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { GenerateContentConfig } from '@google/genai';
export type SystemPromptInteractionMode = 'interactive' | 'headless' | 'acp';
/**
 * Resolve the system-prompt interaction mode from a config. Single source of
 * truth for the ACP > interactive > headless precedence so callers that build
 * the core system prompt (generation and `/context` token estimation) cannot
 * drift apart. Uses a structural type to avoid a hard dependency on the full
 * Config class.
 */
export declare function resolveInteractionMode(config: {
    getExperimentalZedIntegration(): boolean;
    getInputFormat?(): string;
    isInteractive(): boolean;
}): SystemPromptInteractionMode;
export declare function resolvePathFromEnv(envVar?: string): {
    isSwitch: boolean;
    value: string | null;
    isDisabled: boolean;
};
/**
 * Processes a custom system instruction by appending user memory if available.
 * This function should only be used when there is actually a custom instruction.
 *
 * @param customInstruction - Custom system instruction (ContentUnion from @google/genai)
 * @param userMemory - Back-compat convenience slot for context files.
 *   @deprecated Prefer composing layers explicitly via `assembleSystemPrompt`
 *   (e.g. `assembleSystemPrompt({ base: getCustomSystemPrompt(instruction), contextFiles })`)
 *   so a single site owns the layer order. Passing memory here *and* wrapping
 *   the result in `assembleSystemPrompt({ contextFiles })` double-includes it.
 * @param appendInstruction - Back-compat convenience slot for the append prompt.
 *   @deprecated Prefer the `appendPrompt` slot of `assembleSystemPrompt`.
 * @returns Processed custom system instruction with user memory and extra append instructions applied
 */
export declare function getCustomSystemPrompt(customInstruction: GenerateContentConfig['systemInstruction'], userMemory?: string, appendInstruction?: string): string;
/**
 * Builds the stable base system prompt (identity, mandates, tool guidance).
 *
 * @param userMemory - Back-compat convenience slot for context files.
 *   @deprecated Prefer composing layers explicitly via `assembleSystemPrompt`
 *   (e.g. `assembleSystemPrompt({ base: getCoreSystemPrompt(undefined, model), contextFiles })`)
 *   so a single site owns the layer order. Passing memory here *and* wrapping
 *   the result in `assembleSystemPrompt({ contextFiles })` double-includes it.
 * @param model - Model id, used to select model-specific prompt variants.
 * @param appendInstruction - Back-compat convenience slot for the append prompt.
 *   @deprecated Prefer the `appendPrompt` slot of `assembleSystemPrompt`.
 * @param interactionMode - Interactive vs. headless prompt variant.
 */
export declare function getCoreSystemPrompt(userMemory?: string, model?: string, appendInstruction?: string, interactionMode?: SystemPromptInteractionMode): string;
/**
 * System prompt segments, one slot per segment, ordered stable → context →
 * volatile. Callers only classify content into slots; `assembleSystemPrompt`
 * is the single place that knows the order, so a segment cannot be appended
 * in the wrong position at a call site.
 */
export interface SystemPromptLayers {
    /**
     * Stable layer: the base prompt (identity, mandates, tool guidance) —
     * fixed for the whole session.
     */
    base: string;
    /**
     * Context layer: concatenated context files (QWEN.md hierarchy, baseline
     * rules, extension files). Reloaded only on explicit refresh.
     */
    contextFiles?: string;
    /** Context layer: caller-supplied append prompt (e.g. --append-system-prompt). */
    appendPrompt?: string;
    /**
     * Context layer: repo snapshot (branch + recent commits), computed once
     * per session. Joined without a `---` separator — it carries its own
     * heading.
     */
    gitStatus?: string | null;
    /**
     * Volatile layer: the managed auto-memory section, rewritten in-session on
     * every memory save. Always last, so a save invalidates the shortest
     * possible cached prompt prefix.
     */
    autoMemory?: string;
}
export declare function assembleSystemPrompt(layers: SystemPromptLayers): string;
/**
 * Provides the system prompt for the history compression process.
 *
 * Asks the summary model to wrap its chain-of-thought in an `<analysis>`
 * block (stripped before the result enters history) and then emit a
 * `<state_snapshot>` XML envelope with 9 sub-sections aligned to
 * claude-code's compaction format: primary_request_and_intent,
 * key_technical_concepts, files_and_code_sections, errors_and_fixes,
 * problem_solving, all_user_messages, pending_tasks, current_work,
 * next_step.
 *
 * The resume trailer ("do not acknowledge the summary, ..." etc.) is
 * NOT in this prompt — it is appended once by `postProcessSummary` in
 * `postCompactAttachments.ts` so the summary model does not re-generate
 * it every compaction.
 */
export declare function getCompressionPrompt(): string;
/**
 * Provides the system prompt for generating project summaries in markdown format.
 * This prompt instructs the model to create a structured markdown summary
 * that can be saved to a file for future reference.
 */
export declare function getProjectSummaryPrompt(): string;
/**
 * Generates a system reminder message for plan mode operation.
 *
 * This function creates an internal system message that enforces plan mode constraints,
 * preventing the AI from making any modifications to the system until the user confirms
 * the proposed plan. It overrides other instructions to ensure read-only behavior.
 *
 * @returns A formatted system reminder string that enforces plan mode restrictions
 *
 * @example
 * ```typescript
 * const reminder = getPlanModeSystemReminder();
 * // Returns: "<system-reminder>Plan mode is active..."
 * ```
 *
 * @remarks
 * Plan mode ensures the AI will:
 * - Only perform read-only operations (research, analysis)
 * - Present a comprehensive plan via ExitPlanMode tool
 * - Wait for user confirmation before making any changes
 * - Override any other instructions that would modify system state
 */
export declare function getPlanModeSystemReminder(planOnly?: boolean): string;
/**
 * One-shot reminder injected on the first model-bound turn after Plan mode
 * changes outside the approved `exit_plan_mode` flow. While Plan mode is
 * active {@link getPlanModeSystemReminder} is re-injected every turn, so the
 * reminder silently disappearing is not a signal models reliably notice
 * (#7671).
 *
 * @param currentMode - The approval mode active when delivery is claimed
 */
export declare function getManualPlanExitSystemReminder(currentMode: string): string;
/**
 * Generates a system reminder about an active Arena session.
 *
 * @param configFilePath - Absolute path to the arena session's `config.json`
 * @returns A formatted system reminder string wrapped in XML tags
 */
export declare function getArenaSystemReminder(configFilePath: string): string;
type InsightPromptType = 'analysis' | 'impressive_workflows' | 'project_areas' | 'future_opportunities' | 'friction_points' | 'memorable_moment' | 'improvements' | 'interaction_style' | 'at_a_glance';
/**
 * Get an insight analysis prompt by type.
 * @param type - The type of insight prompt to retrieve
 * @returns The prompt string for the specified type
 */
export declare function getInsightPrompt(type: InsightPromptType): string;
export {};
