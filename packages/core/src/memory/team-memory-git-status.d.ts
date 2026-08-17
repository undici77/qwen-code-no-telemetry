/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Team memory only actually reaches collaborators when its directory is
 * git-tracked. Two silent-inert cases defeat that: there is no git root (saved
 * memories land in an untracked local dir), or the directory is git-ignored —
 * e.g. a `.qwen/` directory-form ignore, which git never descends into, so a
 * `!`-reinclude below it is a no-op. Both leave the tier looking enabled while
 * sharing nothing.
 *
 * Returns a one-line user-facing warning for those cases, or null when team
 * memory will be shared normally. Call only when the tier is actually active.
 */
export declare function getTeamMemoryShareabilityWarning(
  projectRoot: string,
): string | null;
