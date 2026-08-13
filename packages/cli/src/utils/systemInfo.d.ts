/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandContext } from '../ui/commands/types.js';
/**
 * The subset of {@link CommandContext} these helpers actually read: only
 * `services.config` and `services.settings`. Narrowing the parameter to this
 * shape lets call sites that don't have a full `CommandContext` (e.g. the
 * Settings dialog, which holds `config` + `settings` as props) pass a plain
 * object without an unsafe cast. A full `CommandContext` is still assignable.
 */
type SystemInfoContext = {
    services: Partial<Pick<CommandContext['services'], 'config' | 'settings'>>;
};
/**
 * System information interface containing all system-related details
 * that can be collected for debugging and reporting purposes.
 */
export interface SystemInfo {
    cliVersion: string;
    osPlatform: string;
    osArch: string;
    osRelease: string;
    nodeVersion: string;
    npmVersion: string;
    sandboxEnv: string;
    modelVersion: string;
    selectedAuthType: string;
    ideClient: string;
    sessionId: string;
    proxy?: string;
}
/**
 * Additional system information for bug reports
 */
export interface ExtendedSystemInfo extends SystemInfo {
    memoryUsage: string;
    baseUrl?: string;
    apiKeyEnvKey?: string;
    gitCommit?: string;
    cliVersionDisplay?: string;
    proxy?: string;
    fastModel?: string;
    lspStatus?: string;
}
/**
 * Gets the NPM version, handling cases where npm might not be available.
 * Returns 'unknown' if npm command fails, is not found, or exceeds the
 * version-probe timeout.
 */
export declare function getNpmVersion(): Promise<string>;
/**
 * Gets the Git version, handling cases where git might not be available.
 * Returns 'unknown' if git command fails, is not found, or exceeds the
 * version-probe timeout.
 */
export declare function getGitVersion(): Promise<string>;
/**
 * Gets the IDE client name if IDE mode is enabled.
 * Returns empty string if IDE mode is disabled or IDE client is not detected.
 */
export declare function getIdeClientName(context: SystemInfoContext): Promise<string>;
/**
 * Gets the sandbox environment information.
 * Handles different sandbox types including sandbox-exec and custom sandbox environments.
 * For bug reports, removes 'qwen-' or 'qwen-code-' prefixes from sandbox names.
 *
 * @param stripPrefix - Whether to strip 'qwen-' prefix (used for bug reports)
 */
export declare function getSandboxEnv(stripPrefix?: boolean): string;
/**
 * Collects comprehensive system information for debugging and reporting.
 * This function gathers all system-related details including OS, versions,
 * sandbox environment, authentication, and session information.
 *
 * @param context - Command context containing config and settings
 * @returns Promise resolving to SystemInfo object with all collected information
 */
export declare function getSystemInfo(context: SystemInfoContext): Promise<SystemInfo>;
/**
 * Collects extended system information for bug reports.
 * Includes all standard system info plus memory usage and optional base URL.
 *
 * @param context - Command context containing config and settings
 * @returns Promise resolving to ExtendedSystemInfo object
 */
export declare function getExtendedSystemInfo(context: SystemInfoContext): Promise<ExtendedSystemInfo>;
export {};
