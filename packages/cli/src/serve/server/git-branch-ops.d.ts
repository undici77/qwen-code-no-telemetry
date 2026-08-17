/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function branchExists(
  cwd: string,
  name: string,
): Promise<boolean>;
export declare function isDirtyTree(cwd: string): Promise<boolean>;
export declare function getHeadCommit(cwd: string): Promise<string | undefined>;
export declare function createBranch(cwd: string, name: string): Promise<void>;
export declare function checkoutRef(cwd: string, ref: string): Promise<void>;
export declare function deleteBranch(cwd: string, name: string): Promise<void>;
