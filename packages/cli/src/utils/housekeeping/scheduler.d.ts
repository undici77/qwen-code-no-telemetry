/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Config } from '@qwen-code/qwen-code-core';
import type { LoadedSettings } from '../../config/settings.js';
export declare function startBackgroundHousekeeping(
  config: Config,
  settings: LoadedSettings,
): void;
declare function getFirstPassDelay(
  config: Config,
  settings: LoadedSettings,
): Promise<number>;
declare function needsCatchUp(markerPath: string): Promise<boolean>;
declare function getSubagentMarkerPath(
  qwenDir: string,
  projectDir: string,
): string;
declare function getOpenAILogsMarkerPath(
  qwenDir: string,
  logDir: string,
): string;
export declare function startNonInteractiveOpenAILogHousekeeping(
  config: Config,
  settings: LoadedSettings,
): void;
export declare function stopNonInteractiveOpenAILogHousekeeping(): Promise<void>;
declare function runPass(
  config: Config,
  settings: LoadedSettings,
): Promise<void>;
declare function runHousekeeping(
  config: Config,
  settings: LoadedSettings,
): Promise<void>;
export declare function _resetForTesting(): void;
export declare function _resetNonInteractiveForTesting(): Promise<void>;
export declare const _needsCatchUpForTesting: typeof needsCatchUp;
export declare const _getFirstPassDelayForTesting: typeof getFirstPassDelay;
export declare const _runHousekeepingForTesting: typeof runHousekeeping;
export declare const _runPassForTesting: typeof runPass;
export declare const _FILE_HISTORY_MARKER_FOR_TESTING = '.file-history-cleanup';
export declare const _getSubagentMarkerPathForTesting: typeof getSubagentMarkerPath;
export declare const _getOpenAILogsMarkerPathForTesting: typeof getOpenAILogsMarkerPath;
export {};
