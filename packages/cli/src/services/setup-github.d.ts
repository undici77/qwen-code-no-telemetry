/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const GITHUB_WORKFLOW_PATHS: string[];
export declare const MAX_WORKFLOW_DOWNLOAD_BYTES: number;
export type GithubSetupGitignoreStatus = 'created' | 'updated' | 'unchanged' | 'failed' | 'skipped';
export interface GithubSetupWriteMetadata {
    sizeBytes: number;
}
export interface SetupGithubFileOps {
    assertCanWrite?(): void;
    ensureWorkflowDirectory(gitRepoRoot: string): Promise<void>;
    writeTextFile(gitRepoRoot: string, relativePath: string, content: string): Promise<GithubSetupWriteMetadata>;
    readTextFile(gitRepoRoot: string, relativePath: string): Promise<string | undefined>;
}
export interface GithubSetupWorkflowResult {
    sourcePath: string;
    path: string;
    status: 'written' | 'failed';
    sizeBytes?: number;
    error?: string;
}
export interface GithubSetupGitignoreResult {
    path: '.gitignore';
    status: GithubSetupGitignoreStatus;
    added?: string[];
    error?: string;
}
export interface SetupGithubResult {
    kind: 'github_setup';
    workspaceCwd: string;
    gitRepoRoot: string;
    releaseTag: string;
    readmeUrl: string;
    secretsUrl?: string;
    workflows: GithubSetupWorkflowResult[];
    gitignore: GithubSetupGitignoreResult;
    warnings: string[];
    partial?: boolean;
}
export interface SetupGithubOptions {
    cwd?: string;
    workspaceRoot?: string;
    proxy?: string;
    abortSignal?: AbortSignal;
    fetchImpl?: typeof fetch;
    fileOps?: SetupGithubFileOps;
}
export declare class SetupGithubError extends Error {
    readonly code: string;
    readonly status: number;
    readonly partial: boolean;
    readonly partialResult?: SetupGithubResult;
    constructor(code: string, message: string, status: number, partialResult?: SetupGithubResult);
}
export declare function setupGithub(options?: SetupGithubOptions): Promise<SetupGithubResult>;
export declare function updateGitignore(gitRepoRoot: string, fileOps?: SetupGithubFileOps): Promise<GithubSetupGitignoreResult>;
