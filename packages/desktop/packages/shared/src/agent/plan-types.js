/**
 * Plan Types
 *
 * Defines the structure for plans and plan-related types.
 * Plans are used for structured task execution with user review.
 */
import { randomUUID } from 'crypto';
/**
 * Helper to create a new plan
 */
export function createPlan(title, context) {
    return {
        id: randomUUID(),
        title,
        state: 'creating',
        steps: [],
        context,
        refinementRound: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
}
/**
 * Helper to create a plan step
 */
export function createPlanStep(description, details) {
    return {
        id: randomUUID(),
        description,
        status: 'pending',
        details,
    };
}
/**
 * Helper to update plan state
 */
export function updatePlanState(plan, state) {
    return {
        ...plan,
        state,
        updatedAt: Date.now(),
    };
}
/**
 * Helper to add refinement entry to plan
 */
export function addRefinementEntry(plan, questions, feedback) {
    const entry = {
        round: plan.refinementRound + 1,
        questions,
        feedback,
        timestamp: Date.now(),
    };
    return {
        ...plan,
        refinementRound: plan.refinementRound + 1,
        refinementHistory: [...(plan.refinementHistory || []), entry],
        updatedAt: Date.now(),
    };
}
import { PERMISSION_MODE_CONFIG } from './mode-types.ts';
/** User-visible messages for each permission mode */
export const PERMISSION_MODE_MESSAGES = {
    'safe': `${PERMISSION_MODE_CONFIG['safe'].displayName} active. Plan-first workflow enabled.`,
    'ask': `${PERMISSION_MODE_CONFIG['ask'].displayName} mode active. Prompts before edits and dangerous operations.`,
    'auto-edit': `${PERMISSION_MODE_CONFIG['auto-edit'].displayName} mode active. File edits are automatic; other risky operations may prompt.`,
    'allow-all': `${PERMISSION_MODE_CONFIG['allow-all'].displayName} mode active. All operations permitted.`,
};
/** System prompts sent to the agent when mode changes */
export const PERMISSION_MODE_PROMPTS = {
    'safe': `The user has switched to ${PERMISSION_MODE_CONFIG['safe'].displayName}. You can read files, search, and explore the codebase, but write operations (Bash, Write, Edit, API calls) are blocked until a plan is accepted or the mode changes.`,
    'ask': `The user has switched to ${PERMISSION_MODE_CONFIG['ask'].displayName} mode. Most operations are allowed, but edits and dangerous commands will prompt for user approval.`,
    'auto-edit': `The user has switched to ${PERMISSION_MODE_CONFIG['auto-edit'].displayName} mode. File edits can be applied without prompting, but other risky operations may still ask for user approval.`,
    'allow-all': `The user has switched to ${PERMISSION_MODE_CONFIG['allow-all'].displayName} mode. All operations are permitted without prompts. Use with care.`,
};
//# sourceMappingURL=plan-types.js.map