/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ExtensionManager, type Extension } from '@qwen-code/qwen-code-core';
export declare function getExtensionManager(): Promise<ExtensionManager>;
export declare function extensionToOutputString(extension: Extension, extensionManager: ExtensionManager, workspaceDir: string, inline?: boolean): string;
