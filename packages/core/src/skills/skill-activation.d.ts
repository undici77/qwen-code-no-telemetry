/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SkillConfig } from './types.js';
export { resolveProjectRelativePath } from '../utils/projectPath.js';
/**
 * Splits a skill list into unconditional skills (no `paths:`) and conditional
 * skills (with non-empty `paths:`). Unconditional skills are always offered to
 * the model; conditional skills only appear after activation.
 */
export declare function splitConditionalSkills(skills: readonly SkillConfig[]): {
    unconditional: SkillConfig[];
    conditional: SkillConfig[];
};
/**
 * Tracks which conditional skills have been activated during the session by
 * matching tool-invocation file paths against each skill's `paths` globs.
 *
 * Once activated, a skill stays active for the rest of the registry's
 * lifetime. A new registry is constructed on every `refreshCache()` so that
 * edits to skill files (adding/removing `paths`) take effect; prior
 * activations do not carry over across rebuilds (same as
 * ConditionalRulesRegistry).
 */
/**
 * Optional callback invoked by the registry when picomatch rejects a
 * `paths:` entry. SkillManager wires this into its `parseErrors` map
 * so the failure is surfaced via `getParseErrors()` (and the `/skills`
 * UI) instead of only landing in debug logs.
 */
export type InvalidPatternHandler = (skill: SkillConfig, pattern: string, error: Error) => void;
export declare class SkillActivationRegistry {
    private readonly compiled;
    private readonly activated;
    private readonly projectRoot;
    constructor(conditionalSkills: readonly SkillConfig[], projectRoot: string, onInvalidPattern?: InvalidPatternHandler);
    /**
     * Activate any conditional skills whose `paths` globs match `filePath`.
     * Returns the names of skills newly activated by this call (empty when
     * either no skill matched, or every match was already active).
     */
    matchAndConsume(filePath: string): string[];
    isActivated(name: string): boolean;
    getActivatedNames(): ReadonlySet<string>;
    get totalCount(): number;
    get activatedCount(): number;
}
