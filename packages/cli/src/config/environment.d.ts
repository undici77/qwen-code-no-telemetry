/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export {
  DEFAULT_EXCLUDED_ENV_VARS,
  ENV_CORRUPTED_PATH,
  ENV_WAS_RECOVERED,
} from './shared-env-keys.js';
import type { Settings } from './settingsSchema.js';
export declare const SETTINGS_DIRECTORY_NAME = '.qwen';
export declare function preResolveHomeEnvOverrides(): void;
/** Test-only: reset the home-env bootstrap latch. */
export declare function resetHomeEnvBootstrapForTesting(): void;
/** Test-only: reset environment reload provenance between tests. */
export declare function resetEnvironmentTrackingForTesting(): void;
/**
 * Collects environment variables from user-level `.env` files and returns
 * them as a plain dictionary **without** mutating `process.env`.
 *
 * Candidates are iterated most-specific-first (`~/.qwen/.env` before
 * `~/.env`). `??=` ensures the first file to define a key wins, matching
 * dotenv's first-occurrence-wins semantics used elsewhere.
 */
export declare function getHomeEnvFallbackVars(
  onReadError?: (message: string) => void,
): Record<string, string>;
/**
 * Finds the .env files to load, respecting workspace trust settings.
 *
 * When workspace is untrusted, only allow user-level .env files at:
 * - ~/.qwen/.env
 * - ~/.env
 * - <QWEN_HOME>/.env (when set)
 *
 * Exported so `settings-cache.ts` can re-run the exact same discovery when
 * validating its fingerprint; keep the discovery semantics in this single
 * implementation.
 */
export declare function findEnvFiles(
  settings: Settings,
  startDir: string,
  userLevelPaths?: Set<string>,
  workspaceTrusted?: boolean,
): string[];
export declare function setUpCloudShellEnvironment(
  envFilePath: string | null,
): void;
export interface EnvFileReadFailure {
  readonly path: string;
  readonly error: string;
}
export interface RuntimeEnvironmentSnapshot {
  readonly effectiveEnv: Readonly<NodeJS.ProcessEnv>;
  readonly overlayKeys: readonly string[];
  readonly envFilePaths: readonly string[];
  readonly envFileReadFailed: boolean;
  readonly envFileReadFailures: readonly EnvFileReadFailure[];
}
export declare function buildRuntimeEnvironment(
  settings: Settings,
  startDir?: string,
  baseEnv?: Readonly<NodeJS.ProcessEnv>,
  workspaceTrusted?: boolean,
): RuntimeEnvironmentSnapshot;
/**
 * Loads environment variables from .env files and settings.env.
 *
 * Priority order (highest to lowest):
 * 1. CLI flags
 * 2. process.env (system/export/inline environment variables)
 * 3. .env files (no-override mode)
 * 4. settings.env (no-override mode)
 * 5. defaults
 */
export declare function loadEnvironment(
  settings: Settings,
  startDir?: string,
): void;
export interface EnvReloadResult {
  updatedKeys: string[];
  removedKeys: string[];
}
/**
 * Only keys previously set by loadEnvironment() are overwritten;
 * shell-exported variables are never touched.
 * Fully synchronous — no TOCTOU window between delete and re-add.
 */
export declare function reloadEnvironment(
  settings: Settings,
  workspaceCwd: string,
  workspaceTrusted?: boolean,
): EnvReloadResult;
