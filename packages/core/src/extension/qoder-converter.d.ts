/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExtensionConfig } from './extensionManager.js';
export declare const QODER_PLUGIN_MANIFEST = '.qoder-plugin/plugin.json';
export declare function convertQoderPlugin(extensionDir: string): Promise<{
  config: ExtensionConfig;
  convertedDir: string;
}>;
