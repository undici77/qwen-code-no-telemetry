/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type WorkspacePackage } from './workspaces.js';
import type { ReviewToolchainAdapter } from './toolchain.js';
/**
 * Workspace packages the compiler said it could not resolve.
 *
 * Only names that belong to a workspace of *this* repo are returned. A missing
 * third-party module is a broken install or a genuine defect in the diff — not
 * something a wider build set can fix — and widening on it would loop.
 */
export declare function unresolvedWorkspaceDeps(
  output: string,
  packages: WorkspacePackage[],
): string[];
export declare const npmToolchainAdapter: ReviewToolchainAdapter;
