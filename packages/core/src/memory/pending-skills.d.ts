export interface PendingSkill {
  /** Skill directory name, e.g. `auto-skill-foo`. */
  name: string;
  /** One-line description parsed from frontmatter (may be empty). */
  description: string;
  /** Absolute path of the SKILL.md while staged under pending root. */
  stagedManifestPath: string;
  /** Absolute path the SKILL.md will occupy once accepted (skills root). */
  finalManifestPath: string;
}
/**
 * Move NEWLY CREATED auto-skill directories from the skills root into the
 * pending (staging) root so they are not loaded until the user confirms.
 *
 * `touchedFiles` (from the skill-review agent) mixes freshly-created skills
 * with in-place edits of pre-existing ones. Only directories NOT in
 * `preExistingDirNames` are staged — editing an already-confirmed skill takes
 * effect in place and never enters the confirmation flow, so a later Discard
 * can never delete a skill the user already accepted. A file is staged only
 * when it (a) lives under the skills root, (b) is a `<dir>/SKILL.md`, (c) is a
 * direct child of the skills root, (d) is not pre-existing, and (e) still
 * exists on disk.
 */
export declare function stageSkillDirs(
  touchedFiles: string[],
  projectRoot: string,
  preExistingDirNames?: ReadonlySet<string>,
  taskId?: string,
): Promise<PendingSkill[]>;
/**
 * Promote a staged skill back into the skills root. A missing staged dir is
 * treated as already-handled (no throw). A genuine fs failure throws so the
 * caller can surface it instead of silently losing the skill.
 */
export declare function acceptPendingSkill(
  pending: PendingSkill,
): Promise<void>;
/** Delete a staged skill. Never touches the skills root. */
export declare function rejectPendingSkill(
  pending: PendingSkill,
): Promise<void>;
