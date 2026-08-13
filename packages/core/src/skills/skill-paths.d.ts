/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const PROJECT_SKILLS_RELATIVE_DIR: string;
export declare const ARCHIVED_SKILLS_RELATIVE_DIR: string;
export declare const SKILL_FILE_NAME = "SKILL.md";
export declare function getProjectSkillsRoot(projectRoot: string): string;
export declare function getArchivedSkillsRoot(projectRoot: string): string;
export declare const PENDING_SKILLS_RELATIVE_DIR: string;
/**
 * Staging root for auto-skills awaiting user confirmation. Deliberately a
 * SIBLING of `.qwen/skills/` so `loadSkillsFromDir` never discovers
 * unconfirmed skills (it scans the skills root only).
 */
export declare function getPendingSkillsRoot(projectRoot: string): string;
export declare function isProjectSkillPath(filePath: string, projectRoot: string): boolean;
export declare function assertProjectSkillPath(targetPath: string, projectRoot: string): void;
/**
 * Async variant that also rejects symlink traversal.
 *
 * `path.resolve()` is a purely lexical operation and does not dereference
 * symlinks. If any component of `targetPath` (or its parent chain) is a
 * symlink pointing outside the skills directory, the lexical check passes
 * but `fs.writeFile/readFile/rm` will follow the link and mutate the real
 * target. This function resolves the nearest existing ancestor to its real
 * filesystem path and verifies it still sits under the real skills root.
 */
export declare function assertRealProjectSkillPath(targetPath: string, projectRoot: string): Promise<void>;
export declare function sanitizeSkillName(name: string): string;
