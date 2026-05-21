/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CommandContext, type SlashCommand } from './types.js';
export declare function completeExtensions(context: CommandContext, partialArg: string): Promise<string[]>;
export declare function completeExtensionsAndScopes(context: CommandContext, partialArg: string): Promise<string[]>;
export declare function completeExtensionsExplore(context: CommandContext, partialArg: string): Promise<string[]>;
export declare const extensionsCommand: SlashCommand;
