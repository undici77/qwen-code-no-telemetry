/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import { type LoadedSettings } from '../config/settings.js';
export type { LoadedSettings } from '../config/settings.js';
export interface InitializationResult {
  authError: string | null;
  themeError: string | null;
  shouldOpenAuthDialog: boolean;
  geminiMdFileCount: number;
}
export interface InitializeAppOptions {
  /**
   * When true, skip the awaited IDE connection inside initializeApp().
   * Ordinary interactive TUI startup uses this so IDE IPC can run after first
   * paint; non-TUI paths leave it false so the first request keeps IDE context.
   */
  deferIdeConnection?: boolean;
}
/**
 * Establishes the startup IDE connection and records the connection telemetry.
 *
 * Callers choose whether to await this on the startup critical path. Headless,
 * stream-json, and ACP/Zed await it before their first request; ordinary TUI
 * startup schedules it post-render through startup prefetch.
 */
export declare function connectIdeForStartup(config: Config): Promise<void>;
/**
 * Orchestrates the application's startup initialization.
 * This runs BEFORE the React UI is rendered.
 * @param config The application config.
 * @param settings The loaded application settings.
 * @returns The results of the initialization.
 */
export declare function initializeApp(
  config: Config,
  settings: LoadedSettings,
  options?: InitializeAppOptions,
): Promise<InitializationResult>;
