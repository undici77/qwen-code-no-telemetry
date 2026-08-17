/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type DaemonTranscriptBlock,
  type DaemonTranscriptState,
  type DaemonTranscriptStore,
  type DaemonUiEvent,
} from '@qwen-code/sdk/daemon';
import type {
  DaemonConnectionState,
  DaemonPromptStatus,
  DaemonSessionActions,
  DaemonSessionContextValue,
  DaemonSessionNotice,
  DaemonSessionProviderProps,
  DaemonSessionOwnerGuard,
  DaemonWorkspaceEventSignals,
} from './types.js';
export type {
  DaemonCommandInfo,
  DaemonConnectionState,
  DaemonConnectionStatus,
  DaemonModelInfo,
  DaemonNoticeCategory,
  DaemonNoticeOperation,
  DaemonNoticeSeverity,
  DaemonPromptImage,
  DaemonPromptStatus,
  DaemonSessionActions,
  DaemonSessionContextValue,
  DaemonSessionNotice,
  DaemonSessionProviderProps,
  DaemonTodoItem,
  DaemonTodoList,
  DaemonTodoPriority,
  DaemonTodoStatus,
  DaemonWorkspaceEventSignals,
  SendPromptOptions,
} from './types.js';
export interface DaemonTranscriptHistory {
  hasMore: boolean;
  loading: boolean;
  capacityReached: boolean;
  paginationError: boolean;
  loadMore(options?: { force?: boolean }): Promise<void>;
}
declare function projectMainTranscriptEvents(
  events: DaemonUiEvent[],
): DaemonUiEvent[];
export declare const projectMainTranscriptEventsForTesting: typeof projectMainTranscriptEvents;
export declare function DaemonSessionProvider(
  props: DaemonSessionProviderProps,
): import('react/jsx-runtime').JSX.Element;
export declare function useDaemonSession(): DaemonSessionContextValue;
export declare function useDaemonTranscriptStore(): DaemonTranscriptStore;
export declare function useDaemonTranscriptHistory(): DaemonTranscriptHistory;
export declare function useDaemonTranscriptState(): DaemonTranscriptState;
export declare function useDaemonTranscriptBlocks(): readonly DaemonTranscriptBlock[];
export declare function useDaemonPendingPermissions(): readonly import('@qwen-code/sdk/daemon').DaemonPermissionTranscriptBlock[];
export declare function useDaemonActiveTodoList():
  | import('./types.js').DaemonTodoList
  | undefined;
export declare function useDaemonStreamingState(): import('./selectors.js').DaemonStreamingState;
export declare function useDaemonActions(): DaemonSessionActions;
export declare function useOptionalDaemonActions():
  | DaemonSessionActions
  | undefined;
export declare function useDaemonSessionOwnerGuard(): DaemonSessionOwnerGuard;
export declare function useDaemonWorkspaceEventSignals():
  | DaemonWorkspaceEventSignals
  | undefined;
export declare function useDaemonPromptStatus(): DaemonPromptStatus;
export declare function useDaemonConnection(): DaemonConnectionState;
export declare function useDaemonSessionNotices(): {
  notices: readonly DaemonSessionNotice[];
  dismissNotice(id: string): void;
  clearNotices(): void;
};
