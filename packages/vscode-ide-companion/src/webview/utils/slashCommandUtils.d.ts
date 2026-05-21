/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AvailableCommand } from '@agentclientprotocol/sdk';
import type { CompletionItem } from '../../types/completionItemTypes.js';
export declare function shouldAllowCompletionQuery(trigger: '@' | '/', query: string): boolean;
export declare function isExpandableSlashCommand(commandName: string): boolean;
export declare function buildSlashCommandItems(query: string, availableCommands: readonly AvailableCommand[]): CompletionItem[];
