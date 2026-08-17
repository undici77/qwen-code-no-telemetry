/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum PackageManager {
  NPM = 'npm',
  YARN = 'yarn',
  PNPM = 'pnpm',
  PNPX = 'pnpx',
  BUN = 'bun',
  BUNX = 'bunx',
  HOMEBREW = 'homebrew',
  STANDALONE = 'standalone',
  NPX = 'npx',
  UNKNOWN = 'unknown',
}
export declare function getNpmCliPath(
  nodePath?: string,
  platform?: NodeJS.Platform,
): string;
export declare function resolveUpdateCommand(
  updateCommand: string,
  latestVersion: string,
): string;
export declare function formatUpdateInstructions(
  installationInfo: InstallationInfo,
  latestVersion: string,
): string[];
export interface InstallationInfo {
  packageManager: PackageManager;
  isGlobal: boolean;
  isStandalone?: boolean;
  standaloneDir?: string;
  updateCommand?: string;
  updateMessage?: string;
}
export declare function getInstallationInfo(
  projectRoot: string,
  isAutoUpdateEnabled: boolean,
): InstallationInfo;
