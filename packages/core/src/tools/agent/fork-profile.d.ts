/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ForkProfile {
  readonly name: string;
  readonly tools: readonly string[];
  readonly promptHint?: string;
}
export declare function validateForkProfileName(
  name: unknown,
): string | undefined;
export declare function loadForkProfile(
  projectRoot: string,
  requestedName: string,
): ForkProfile;
