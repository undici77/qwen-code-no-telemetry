/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** The three git operations resolving a merge-base needs. */
export interface GitProbe {
  /** Update the remote-tracking ref. False when the fetch failed. */
  fetch(remote: string, ref: string): boolean;
  /** Does this ref resolve locally? */
  refExists(ref: string): boolean;
  /** Merge-base of two refs, or null when there is none. */
  mergeBase(a: string, b: string): string | null;
}
export interface MergeBaseResult {
  /** The diff's left side. Null when no candidate ref resolved. */
  sha: string | null;
  /**
   * True when the base branch could not be fetched.
   *
   * Not fatal — a local tracking ref may still exist — but it may be stale. If
   * the base branch was force-pushed, `merge-base` resolves against the old tip
   * and the review silently examines the wrong diff. The caller says so.
   */
  baseFetchFailed: boolean;
}
/**
 * Resolve the merge-base of a PR head and its base branch.
 *
 * The remote-tracking ref (`origin/main`) is preferred because a CI checkout
 * has no local base branch; the local ref is the fallback for a developer who
 * has one but is offline. Null means neither resolved, and the caller degrades
 * to a diff-less report rather than failing the whole review.
 */
export declare function resolveMergeBase(
  remote: string,
  baseRefName: string,
  headRef: string,
  git: GitProbe,
): MergeBaseResult;
