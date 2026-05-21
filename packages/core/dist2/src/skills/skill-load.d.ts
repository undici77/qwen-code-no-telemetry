import { type SkillConfig, type SkillValidationResult } from './types.js';
export declare function loadSkillsFromDir(baseDir: string): Promise<SkillConfig[]>;
export declare function parseSkillContent(content: string, filePath: string): SkillConfig;
export declare function validateConfig(config: Partial<SkillConfig>): SkillValidationResult;
/**
 * Parse the optional `priority` frontmatter field for a skill.
 *
 * NOTE for adding new optional frontmatter fields: the SKILL.md parsing
 * logic exists in **two** places — `parseSkillContent` here (used for
 * extension skills) and `SkillManager.parseSkillContent` in
 * `skill-manager.ts` (used for project / user / bundled skills). Any new
 * field must be wired into both, or extension SKILL.md authors will see
 * the field silently dropped — the same regression that previously hit
 * `whenToUse`, `disable-model-invocation`, `paths`, and `priority`. Prefer
 * extracting the field's parsing into a shared helper (like this one)
 * rather than inlining `frontmatter['key']` twice.
 *
 * Strict typecheck: `priority` must be a finite JS number. The custom
 * YAML parser returns `true`/`false` as JS booleans and `null` as `null`,
 * all of which `Number()` would silently coerce to 1/0/0. Anything that
 * isn't already `typeof === 'number'` is rejected before checking
 * finiteness. Empty string is treated as omission for ergonomics
 * (matches `paths:` lenient handling).
 *
 * Returns `undefined` (and warns) for invalid values rather than
 * throwing — `priority` is a cosmetic ordering hint, not a load-blocking
 * field, so a typo in this single key shouldn't make a previously-working
 * skill silently disappear from the listing.
 */
export declare function parsePriorityField(frontmatter: Record<string, unknown>, filePath: string, warn?: (message: string) => void): number | undefined;
/**
 * Normalize a skill priority to a finite number for sort comparisons.
 * Used in the `listSkills()` sort comparator so extension-provided skills
 * (which bypass the frontmatter parser and validateConfig) can't poison
 * ordering with `NaN` or non-number values that `(a ?? 0) - (b ?? 0)`
 * would otherwise propagate as `NaN`.
 */
export declare function normalizeSkillPriority(priority: unknown): number;
