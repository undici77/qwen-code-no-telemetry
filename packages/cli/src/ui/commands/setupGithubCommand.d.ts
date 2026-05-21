/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SlashCommand } from './types.js';
export declare const GITHUB_WORKFLOW_PATHS: string[];
export declare function updateGitignore(gitRepoRoot: string): Promise<void>;
export declare const setupGithubCommand: SlashCommand;
