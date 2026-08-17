/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ReloadPluginsSummary } from '../../config/extension-runtime-reload.js';
import { type SlashCommand } from './types.js';
export declare function formatReloadPluginsSummary(
  summary: ReloadPluginsSummary,
): string;
export declare const reloadPluginsCommand: SlashCommand;
