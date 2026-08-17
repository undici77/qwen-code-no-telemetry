/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Part, PartListUnion } from '@google/genai';
/**
 * Mandatory directory-name prefix for skills created by the `/learn` command.
 * The project `.gitignore` re-ignores directories matching
 * `.qwen/skills/learned-skill-<glob>` so these user-initiated learned skills
 * stay out of version control. The `source: learned` frontmatter marker is
 * the file-level signal for edit protection (analogous to `source: auto-skill`
 * for auto-generated skills).
 */
export declare const LEARNED_SKILL_DIR_PREFIX: 'learned-skill-';
export interface LearnVideoInput {
  source: string;
  focus?: string;
  mimeType: string;
  kind: 'local' | 'remote' | 'youtube';
}
export declare function parseLearnVideoInput(
  rawInput: string,
): LearnVideoInput | null;
/**
 * Build a prompt that instructs the main model to create a skill from the
 * given knowledge source. Used by the `/learn` slash command via
 * `submit_prompt` — the model runs in the normal turn with its full tool set.
 *
 * Enumerates existing skill directories so the model avoids name collisions.
 */
export declare function buildLearnSkillPrompt(
  rawInput: string,
  projectRoot: string,
): Promise<string>;
export declare function buildLearnVideoSkillRequest(
  video: LearnVideoInput,
  projectRoot: string,
  localVideoPart?: Part,
): Promise<PartListUnion>;
