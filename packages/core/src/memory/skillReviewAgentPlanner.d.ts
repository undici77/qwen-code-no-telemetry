/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Content } from '@google/genai';
import type { Config } from '../config/config.js';
export declare const SKILL_REVIEW_AGENT_NAME: "managed-skill-extractor";
export declare const DEFAULT_AUTO_SKILL_MAX_TURNS = 8;
export declare const DEFAULT_AUTO_SKILL_TIMEOUT_MS = 120000;
/**
 * Mandatory directory-name prefix for skills created by the review agent.
 * The project `.gitignore` re-ignores directories matching
 * `.qwen/skills/auto-skill-<glob>` so these transient, session-specific
 * skills stay out of version control while hand-authored project skills
 * remain tracked. This is a prompt-level convention only — skill discovery
 * (`SkillManager`) is prefix-agnostic, and the `source: auto-skill`
 * frontmatter marker remains the file-level signal for edit protection.
 */
export declare const AUTO_SKILL_DIR_PREFIX: "auto-skill-";
export interface SkillReviewExecutionResult {
    touchedSkillFiles: string[];
    systemMessage?: string;
}
export declare function createSkillScopedAgentConfig(config: Config, projectRoot: string): Config;
export declare const SKILL_REVIEW_SYSTEM_PROMPT: string;
/**
 * Enumerate active project skill directory names.
 *
 * Best-effort: an unreadable root contributes no names, so a temporary read
 * failure downgrades enumeration rather than aborting the task. Exported for
 * tests.
 */
export declare function listExistingSkillDirNames(projectRoot: string): Promise<string[]>;
/**
 * Exported for tests. The "(do not reuse these names)" line is the soft
 * guard for #4437 — the hard guard is `evaluateScopedDecision`'s WRITE_FILE
 * branch denying any write to an existing path.
 *
 * Takes `projectRoot` (not `skillsRoot`) so the displayed path and the
 * enumeration both derive from the same source — keeps them from drifting
 * if a future caller passes a non-standard root.
 */
export declare function buildTaskPrompt(projectRoot: string): Promise<string>;
export declare function runSkillReviewByAgent(params: {
    config: Config;
    projectRoot: string;
    history: Content[];
    /** Per-call turn override; the shared memory setting is used otherwise. */
    maxTurns?: number;
    /** Per-call timeout override; the shared memory setting is used otherwise. */
    timeoutMs?: number;
}): Promise<SkillReviewExecutionResult>;
