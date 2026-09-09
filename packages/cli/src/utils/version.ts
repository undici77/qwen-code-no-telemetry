/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { CLI_VERSION, CLI_VERSION_DISPLAY } from '../generated/git-commit.js';

export async function getCliVersion(): Promise<string> {
  return CLI_VERSION;
}

export async function getCliVersionDisplay(): Promise<string> {
  return CLI_VERSION_DISPLAY;
}

/**
 * Format the version for display. Real semver releases get a "v" prefix
 * ("v0.19.4"); a non-semver fallback such as "unknown" (from getCliVersion when
 * the package version can't be resolved) is shown as-is so we never render a
 * bogus "vunknown".
 */
export function formatVersionLabel(version: string): string {
  return /^\d/.test(version) ? `v${version}` : version;
}
