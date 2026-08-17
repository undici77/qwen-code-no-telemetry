/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../config/settings.js';
import type { InitializationResult } from '../core/initializer.js';
import type { ExtensionRefreshState } from '../config/extension-refresh-state.js';
export interface StartInteractiveUIOptions {
  postRenderConnectIde?: boolean;
  postRenderInitializeTelemetry?: boolean;
  extensionRefreshState?: ExtensionRefreshState;
}
export declare function startInteractiveUI(
  config: Config,
  settings: LoadedSettings,
  startupWarnings: string[],
  workspaceRoot: string | undefined,
  initializationResult: InitializationResult,
  options?: StartInteractiveUIOptions,
): Promise<void>;
