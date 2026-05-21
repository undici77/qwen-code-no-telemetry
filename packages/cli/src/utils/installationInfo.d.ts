/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare enum PackageManager {
    NPM = "npm",
    YARN = "yarn",
    PNPM = "pnpm",
    PNPX = "pnpx",
    BUN = "bun",
    BUNX = "bunx",
    HOMEBREW = "homebrew",
    NPX = "npx",
    UNKNOWN = "unknown"
}
export interface InstallationInfo {
    packageManager: PackageManager;
    isGlobal: boolean;
    updateCommand?: string;
    updateMessage?: string;
}
export declare function getInstallationInfo(projectRoot: string, isAutoUpdateEnabled: boolean): InstallationInfo;
