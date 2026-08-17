/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
interface LocalGitConfigRisk {
  diffExternal: boolean;
  fsmonitor: boolean;
}
export declare function getLocalGitConfigRisk(cwd: string): LocalGitConfigRisk;
export {};
