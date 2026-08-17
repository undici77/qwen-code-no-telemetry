/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function isPathWithin(root: string, candidate: string): boolean;
export declare function resolveContainedExistingPath(
  root: string,
  candidate: string,
): string;
export declare function resolveContainedPotentialPath(
  root: string,
  candidate: string,
): string;
export declare function resolveExistingPathPrefix(candidate: string): string;
