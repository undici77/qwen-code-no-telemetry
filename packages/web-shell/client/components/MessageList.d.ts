import { type ReactNode } from 'react';
import type { DaemonSessionArtifact } from '@qwen-code/sdk/daemon';
import type { Message, ACPToolCall, TurnCollapseHead } from '../adapters/types';
import type { PermissionRequest } from '../adapters/types';
import type { SessionContentGenerator } from './messages/AssistantMessage';
import {
  type TurnOutputFileChange,
  type TurnOutputOpenRequest,
  type TurnOutputScheduledTask,
} from './artifacts/TurnOutputs';
interface MessageListProps {
  messages: Message[];
  pendingApproval: PermissionRequest | null;
  /** Run /context detail, exactly like typing it (context-usage panels). */
  onShowContextDetail?: () => void;
  /** Click an uploaded image in a user message to preview it in the right panel. */
  onImagePreview?: (src: string, alt?: string) => void;
  loadingTranscript?: boolean;
  catchingUp?: boolean;
  hasOlderHistory?: boolean;
  loadingOlderHistory?: boolean;
  historyCapacityReached?: boolean;
  historyPaginationError?: boolean;
  onLoadOlderHistory?: (options?: { force?: boolean }) => Promise<void>;
  transcriptBlockCount?: number;
  transcriptActivity?: {
    getSnapshot(): {
      lastEventId?: number;
      blocks?: {
        readonly length: number;
      };
    };
    subscribe(listener: () => void): () => void;
  };
  onReloadTranscript?: (signal: AbortSignal) => Promise<void>;
  /**
   * True while the agent is still answering. The newest turn then stays
   * expanded and un-collapsible so streaming output is never hidden.
   */
  isResponding?: boolean;
  welcomeHeader?: ReactNode;
  centerWelcomeHeader?: boolean;
  workspaceCwd?: string;
  tailContent?: ReactNode;
  tailKey?: string;
  virtualScrollThreshold?: number;
  activeTurnStartedAt?: number;
  /**
   * When true, scroll the tail content into view the moment it first appears
   * even if the user had scrolled up. Opt-in per caller so unrelated inline
   * panels don't yank the reader to the bottom. Defaults to false.
   */
  autoScrollTailIntoView?: boolean;
  /**
   * Height reserved for app-level floating UI below the transcript, such as the
   * bottom todo/status panel. When it changes while the transcript is following
   * the bottom, perform one more bottom alignment after layout settles.
   */
  bottomOverlayInset?: number;
  hideSessionTimeline?: boolean;
  hideFirstUserMessage?: boolean;
  firstTurnMetrics?: {
    durationMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
  };
  includeSubagentToolUsageInMetrics?: boolean;
  showRetryHint?: boolean;
  onRetryClick?: () => void;
  failedPromptMessageId?: string;
  onRetryFailedPrompt?: () => void;
  onBranchSession?: () => void;
  onCanScrollToBottomChange?: (canScrollToBottom: boolean) => void;
  turnFileChanges?: ReadonlyMap<string, readonly TurnOutputFileChange[]>;
  turnArtifacts?: ReadonlyMap<string, readonly DaemonSessionArtifact[]>;
  turnScheduledTasks?: ReadonlyMap<string, readonly TurnOutputScheduledTask[]>;
  onReviewChanges?: (
    changes: readonly TurnOutputFileChange[],
    selectedPath?: string,
  ) => void;
  onOpenArtifact?: (artifactId: string, previewContent?: string) => void;
  onOpenScheduledTask?: (task: TurnOutputScheduledTask) => void;
  onTurnOutputOpen?: (request: TurnOutputOpenRequest) => void;
  onError?: (error: unknown, fallback: string) => void;
  generateContent?: SessionContentGenerator;
}
export type DisplayItem =
  | {
      type: 'message';
      key: string;
      message: Message;
      /** Metrics info for the final answer assistant message. */
      turnCollapse?: TurnCollapseHead;
    }
  | {
      type: 'turn_collapse';
      key: string;
      turnCollapse: TurnCollapseHead;
    }
  | {
      type: 'parallel_agents';
      key: string;
      turnId: string;
      agents: ACPToolCall[];
      /**
       * Wall-clock time of the first grouped launch, carried so the grouped
       * box reveals its time on hover exactly like a standalone message row.
       */
      timestamp?: number;
    }
  | {
      type: 'turn_outputs';
      key: string;
      turnId: string;
      changes: readonly TurnOutputFileChange[];
      artifacts: readonly DaemonSessionArtifact[];
      scheduledTasks: readonly TurnOutputScheduledTask[];
    };
export type TurnTimelineNodeKind =
  | 'thought'
  | 'commentary'
  | 'tool'
  | 'agents'
  | 'plan'
  | 'status'
  | 'none';
export interface TurnTimelineNode {
  kind: TurnTimelineNodeKind;
  timestamp?: number;
  label?: string;
}
export interface SessionTimelineEntry {
  id: string;
  label: string;
  detail: string;
  timestamp?: number;
  nodeKinds: TurnTimelineNodeKind[];
  isScheduledTask?: boolean;
}
export interface SessionTimelineRange {
  startIndex: number;
  endIndex: number;
  currentIndex: number;
}
export declare function groupParallelAgents(messages: Message[]): DisplayItem[];
export declare function getDisplayItemVirtualKey(item: DisplayItem): string;
export declare function attachTurnOutputs(
  items: DisplayItem[],
  isResponding: boolean,
  turnFileChanges?: ReadonlyMap<string, readonly TurnOutputFileChange[]>,
  turnArtifacts?: ReadonlyMap<string, readonly DaemonSessionArtifact[]>,
  turnScheduledTasks?: ReadonlyMap<string, readonly TurnOutputScheduledTask[]>,
): DisplayItem[];
export declare function pinActiveParallelAgentsToTurnEnd(
  items: DisplayItem[],
  automaticallyExpandedKeys?: ReadonlySet<string>,
): DisplayItem[];
export interface ApplyTurnCollapseOptions {
  /**
   * Per-turn user override keyed by the turn's user-message id:
   * `true` = forced expanded, `false` = forced collapsed. Turns absent from the
   * map follow the default (completed turns collapse).
   */
  overrides: ReadonlyMap<string, boolean>;
  /**
   * True while the agent is still answering. The final turn then stays expanded
   * and un-collapsible so live output is never hidden.
   */
  isResponding: boolean;
  activeTurnStartedAt?: number;
  backgroundSummaryGraceActive?: boolean;
  automaticallyExpandedAgentKeys?: ReadonlySet<string>;
  /**
   * Tool-call id of a pending approval, if any. The turn containing it is
   * force-expanded so the inline approve/reject UI is never folded away (mirrors
   * compact mode's `isForceExpandGroup`).
   */
  pendingApprovalCallId?: string | null;
  includeSubagentToolUsageInMetrics?: boolean;
  /** Master switch; when false the items pass through untouched. */
  enabled: boolean;
}
export declare function getTurnTimelineNode(
  item: DisplayItem,
  t?: (key: string, vars?: Record<string, string | number>) => string,
): TurnTimelineNode;
export declare function getSessionTimelineEntries(
  messages: readonly Message[],
  t?: (key: string, vars?: Record<string, string | number>) => string,
): SessionTimelineEntry[];
export declare function getSessionTimelineSignature(
  messages: readonly Message[],
): string;
/**
 * Walk backwards from `index` to the user-message row that heads its turn and
 * return that turn's id, or null when `index` precedes the first turn.
 */
export declare function findTurnIdForIndex(
  items: readonly DisplayItem[],
  index: number,
): string | null;
export declare function getTurnIdByDisplayIndex(
  items: readonly DisplayItem[],
): Array<string | null>;
export declare function getSessionTimelineRangeForIndexes(
  visibleItems: readonly DisplayItem[],
  visibleItemIndexes: readonly number[],
  entryIndexById: ReadonlyMap<string, number>,
  currentItemIndex?: number | null,
  turnIdByDisplayIndex?: readonly (string | null)[],
): SessionTimelineRange | null;
export declare function applyTurnCollapse(
  items: DisplayItem[],
  {
    overrides,
    isResponding,
    activeTurnStartedAt,
    backgroundSummaryGraceActive,
    automaticallyExpandedAgentKeys,
    pendingApprovalCallId,
    includeSubagentToolUsageInMetrics,
    enabled,
  }: ApplyTurnCollapseOptions,
): DisplayItem[];
/**
 * Locate a display item by message id, falling back to the tool call id for
 * tool groups that were merged (compact mode) or grouped (parallel agents)
 * under another message's id.
 */
export declare function findDisplayItemIndex(
  items: readonly DisplayItem[],
  messageId: string,
  callId?: string,
): number;
export interface MessageListHandle {
  /**
   * Scroll the transcript so the given message is visible and briefly
   * highlight it. Returns false when the message is not in the list.
   */
  scrollToMessage: (messageId: string, callId?: string) => boolean;
  /** Resume bottom-follow mode and scroll to the latest output. */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}
export declare const VIRTUAL_SCROLL_THRESHOLD = 200;
export declare function shouldUseVirtualScroll(
  totalCount: number,
  threshold?: number,
): boolean;
export declare function shouldAdjustVirtualScrollPosition(
  itemEnd: number,
  scrollOffset: number,
): boolean;
export declare const MessageList: import('react').NamedExoticComponent<
  MessageListProps & import('react').RefAttributes<MessageListHandle>
>;
export {};
