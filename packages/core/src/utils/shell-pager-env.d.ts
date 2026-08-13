/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function getDefaultShellPager(platform?: NodeJS.Platform): string | undefined;
export declare function getShellPagerEnv(pager: string | undefined, options?: {
    includeGitPager?: boolean;
    platform?: NodeJS.Platform;
}): NodeJS.ProcessEnv;
