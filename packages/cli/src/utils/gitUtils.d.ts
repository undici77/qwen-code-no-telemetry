/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface GitCommandOptions {
    cwd?: string;
}
export declare const isGitHubRepositoryAsync: (opts?: GitCommandOptions) => Promise<boolean>;
export declare const getGitRepoRootAsync: (opts?: GitCommandOptions) => Promise<string>;
/**
 * getLatestGitHubRelease returns the release tag as a string.
 * @returns string of the release tag (e.g. "v1.2.3").
 */
export declare const getLatestGitHubRelease: (proxy?: string) => Promise<string>;
export declare function getGitHubRepoInfoAsync(opts?: GitCommandOptions): Promise<{
    owner: string;
    repo: string;
}>;
export {};
