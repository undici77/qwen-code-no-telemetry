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
