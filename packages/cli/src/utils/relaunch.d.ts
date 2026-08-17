/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface RelaunchOptions {
  afterSpawn?: () => void;
  childEnv?: Readonly<Record<string, string>>;
  onUpdateRelaunch?: (relaunchOnFailure: boolean) => Promise<number> | number;
}
export declare function relaunchOnExitCode(
  runner: () => Promise<number>,
  options?: Pick<RelaunchOptions, 'onUpdateRelaunch'>,
): Promise<void>;
export declare function relaunchAppInChildProcess(
  additionalNodeArgs: string[],
  additionalScriptArgs: string[],
  options?: RelaunchOptions,
): Promise<void>;
export {};
