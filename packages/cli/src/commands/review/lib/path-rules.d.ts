/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface PathRule {
  /** Named in the brief, so an agent can say which rule it applied. */
  title: string;
  /** Does this rule govern `path`? */
  matches(path: string): boolean;
  /** The checklist, agent-facing. */
  checklist: string;
}
/** Every rule, in the order their checklists are appended. */
export declare const PATH_RULES: PathRule[];
/**
 * The checklists that govern `paths`, as a brief section — or `''` when none do.
 *
 * Scoped to what the agent can actually see. An agent whose territory holds no
 * workflow is not handed the workflow checklist: a rule that fires on every review
 * is a rule that gets skimmed, and this one has to be read.
 */
export declare function pathRulesFor(paths: readonly string[]): string;
