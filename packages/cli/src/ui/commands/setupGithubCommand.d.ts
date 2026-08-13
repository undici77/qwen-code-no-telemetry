/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { GITHUB_WORKFLOW_PATHS } from '../../services/setup-github.js';
import type { SlashCommand } from './types.js';
export { GITHUB_WORKFLOW_PATHS };
export declare function updateGitignore(gitRepoRoot: string): Promise<void>;
export declare const setupGithubCommand: SlashCommand;
