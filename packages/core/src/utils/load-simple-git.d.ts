/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CheckRepoActions, SimpleGitFactory } from 'simple-git';
export type SimpleGitModule = {
    CheckRepoActions: typeof CheckRepoActions;
    simpleGit: SimpleGitFactory;
};
export declare function loadSimpleGit(): Promise<SimpleGitModule>;
