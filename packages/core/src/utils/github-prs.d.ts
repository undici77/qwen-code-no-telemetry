/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Display cap applied by the route after path sanitization. */
export declare const GITHUB_PR_ERROR_MESSAGE_MAX = 512;
export declare const GITHUB_PR_LIST_LIMIT = 30;
export type GitHubPullRequestState = 'open' | 'draft';
export type GitHubPullRequestReviewDecision =
  | 'approved'
  | 'changes_requested'
  | 'review_required';
export type GitHubPullRequestChecks =
  | 'passing'
  | 'failing'
  | 'pending'
  | 'none';
export interface GitHubPullRequest {
  number: number;
  title: string;
  url: string;
  /** Author login, or empty when the account was deleted. */
  author: string;
  headRefName: string;
  state: GitHubPullRequestState;
  reviewDecision: GitHubPullRequestReviewDecision | null;
  /** Aggregated CI rollup — the raw per-check array stays on the daemon. */
  checks: GitHubPullRequestChecks;
  /** Epoch seconds. */
  updatedAt: number;
}
export type FetchGitHubPullRequestsResult =
  | {
      kind: 'ok';
      pullRequests: GitHubPullRequest[];
    }
  | {
      kind: 'not_a_repo';
    }
  | {
      kind: 'cli_unavailable';
    }
  | {
      kind: 'failed';
      message: string;
      gitRoot: string;
    };
/** Exported for tests — the exec wrapper stays thin on purpose. */
export declare function parseGhPrList(stdout: string): GitHubPullRequest[];
/**
 * List open pull requests for the GitHub repo containing `cwd`, newest
 * `updatedAt` first. Shells out to the `gh` CLI so the user's existing
 * `gh auth` login applies; returns a discriminated union instead of throwing
 * so route layers can map each failure mode to a distinct wire code. The
 * optional `env` supplies workspace credentials (e.g. GH_TOKEN / GH_CONFIG_DIR)
 * while the denylist still strips repository selectors.
 */
export declare function fetchGitHubPullRequests(
  cwd: string,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<FetchGitHubPullRequestsResult>;
export interface CreateGitHubPullRequestOptions {
  title: string;
  body?: string;
  base?: string;
  head?: string;
}
export type CreateGitHubPullRequestResult =
  | {
      kind: 'ok';
      url: string;
      number: number | null;
    }
  | {
      kind: 'not_a_repo';
    }
  | {
      kind: 'cli_unavailable';
    }
  | {
      kind: 'failed';
      message: string;
      gitRoot: string;
    };
/**
 * Create a pull request via `gh pr create`. Returns the PR URL on success.
 */
export declare function createGitHubPullRequest(
  cwd: string,
  opts: CreateGitHubPullRequestOptions,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<CreateGitHubPullRequestResult>;
/**
 * Get the default branch as a fully-qualified remote ref (e.g.
 * "origin/main").
 */
export declare function getDefaultBranch(
  cwd: string,
  env?: Readonly<Record<string, string | undefined>>,
): Promise<string | null>;
