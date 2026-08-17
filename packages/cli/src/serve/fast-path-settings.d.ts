/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Settings } from '../config/settingsSchema.js';
type ServeFastPathPolicy = Pick<
  NonNullable<Settings['policy']>,
  'consensusQuorum' | 'permissionStrategy'
>;
type ServeFastPathPolicyInput = {
  [Key in keyof ServeFastPathPolicy]?: unknown;
};
export type ServeFastPathSettings = Pick<
  Settings,
  'advanced' | 'context' | 'env' | 'security' | 'tools'
> & {
  general?: Pick<NonNullable<Settings['general']>, 'chatRecording'>;
  policy?: ServeFastPathPolicyInput;
};
export declare function preResolveServeFastPathHomeEnvOverrides(): void;
/** Test-only: reset the home-env bootstrap latch. */
export declare function resetServeFastPathHomeEnvBootstrapForTesting(): void;
export declare function loadServeFastPathEnvironment(
  settings: ServeFastPathSettings,
  startDir?: string,
): void;
export declare function consumeServeFastPathRejectedLoaderKeys(): readonly string[];
export declare function loadServeFastPathSettings(
  workspaceDir: string,
): ServeFastPathSettings;
export {};
