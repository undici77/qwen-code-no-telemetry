/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type RepositoryContextProvider } from './lib/repository-context.js';
interface RepoContextArgs {
    plan: string;
    worktree: string;
    out: string;
}
export declare const REPOSITORY_CONTEXT_PROVIDERS: readonly RepositoryContextProvider[];
export declare function runRepoContext(args: RepoContextArgs, providers?: readonly RepositoryContextProvider[]): void;
export declare const repoContextCommand: CommandModule;
export {};
