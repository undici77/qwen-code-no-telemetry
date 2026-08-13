/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonToolTranscriptBlock, DaemonTranscriptBlock } from '@qwen-code/sdk/daemon';
import type { DaemonPromptStatus, DaemonTodoItem, DaemonTodoList } from './types.js';
export type DaemonStreamingState = 'idle' | 'waiting' | 'responding' | 'thinking';
export declare function selectDaemonPendingPermissions(blocks: readonly DaemonTranscriptBlock[]): ReadonlyArray<Extract<DaemonTranscriptBlock, {
    kind: 'permission';
}>>;
export declare function selectDaemonTodoLists(blocks: readonly DaemonTranscriptBlock[]): DaemonTodoList[];
export declare function selectDaemonLatestTodoList(blocks: readonly DaemonTranscriptBlock[]): DaemonTodoList | undefined;
export declare function selectDaemonActiveTodoList(blocks: readonly DaemonTranscriptBlock[]): DaemonTodoList | undefined;
export declare function extractDaemonTodosFromToolBlock(block: DaemonToolTranscriptBlock): DaemonTodoItem[] | undefined;
export declare function parseDaemonTodoItemsFromEntries(entries: readonly unknown[]): DaemonTodoItem[];
export declare function hasDaemonActiveTodos(items: readonly DaemonTodoItem[]): boolean;
export declare function isDaemonSubAgentToolBlock(block: DaemonToolTranscriptBlock): boolean;
export declare function selectDaemonSubAgentToolBlocks(blocks: readonly DaemonTranscriptBlock[]): DaemonToolTranscriptBlock[];
export declare function selectDaemonTranscriptStreamingState(blocks: readonly DaemonTranscriptBlock[]): Exclude<DaemonStreamingState, 'waiting'>;
export declare function selectDaemonStreamingState(blocks: readonly DaemonTranscriptBlock[], promptStatus?: DaemonPromptStatus): DaemonStreamingState;
