import {
  jsx as _jsx,
  Fragment as _Fragment,
  jsxs as _jsxs,
} from 'react/jsx-runtime';
import './styles/globals.css';
import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DAEMON_APPROVAL_MODES,
  useActions,
  useConnection,
  useDaemonFollowupSuggestion,
  useSettings,
  useProviders,
  useSessionNotices,
  useDaemonSessionOwnerGuard,
  useStreamingState,
  useTranscriptHistory,
  useTranscriptStore,
  useWorkspace,
  useWorkspaceActions,
  useWorkspaceEventSignals,
} from '@qwen-code/webui/daemon-react-sdk';
import { DaemonHttpError, isDaemonTurnError } from '@qwen-code/sdk/daemon';
import {} from './components/GitModePopover';
import {
  SESSION_LIST_PAGE_SIZE,
  SESSION_MONITOR_TOOL_CORRELATION_FEATURE,
  SESSION_SIDE_TASK_FEATURE,
  SESSION_TRANSCRIPT_PAGINATION_FEATURE,
  WEB_SHELL_SIDE_TASK_SOURCE_TYPE,
} from './constants/sessions';
import { extractPendingPermission } from './adapters/transcriptAdapter';
import { MessageList } from './components/MessageList';
import { SubagentDetailsProvider } from './subagentDetailsContext';
import { MonitorDetailsProvider } from './monitorDetailsContext';
import { findMonitorTaskForTool } from './utils/monitorTasks';
import { extractVoiceModels } from './voice/voiceModels';
import {
  loadVoiceProviders,
  resolveVoiceWorkspaceTarget,
  setVoiceModelSetting,
  supportsVoiceModelSettings,
} from './voice/voice-workspace-target';
import { useVoiceWorkspaceSettings } from './voice/use-voice-workspace-settings';
import { useSessionCatalogController } from './session-catalog/session-catalog-hooks';
import {
  loadSessionCatalogOnce,
  SESSION_CATALOG_TRAILING_REFRESH_MS,
} from './session-catalog/session-catalog-store';
import { useLiveVoiceSetup } from './live/useLiveVoiceSetup';
import { ChatEditor } from './components/ChatEditor';
import { StatusBar } from './components/StatusBar';
import { StreamingStatus } from './components/StreamingStatus';
import { ToastHost } from './components/ToastHost';
import { TodoPanel } from './components/panels/TodoPanel';
import { EnvironmentPanel } from './components/panels/EnvironmentPanel';
import { ChatContextHeader } from './components/ChatContextHeader';
import { WelcomeHeader } from './components/WelcomeHeader';
import { NewSessionDotField } from './components/NewSessionDotField';
import { ApprovalModeDialog } from './components/dialogs/ApprovalModeDialog';
import { ResumeDialog } from './components/dialogs/ResumeDialog';
import { DialogShell } from './components/dialogs/DialogShell';
import { ModelDialog } from './components/dialogs/ModelDialog';
import { ModelFallbacksDialog } from './components/dialogs/ModelFallbacksDialog';
import { AgentsManagerPage } from './components/agents/AgentsManagerPage';
import { MemoryMessage } from './components/messages/MemoryMessage';
import { AuthMessage } from './components/messages/AuthMessage';
import { ToolsDialog } from './components/dialogs/ToolsDialog';
import { GitDialog } from './components/dialogs/GitDialog';
import { SkillsManagerPage } from './components/skills/SkillsManagerPage';
import { DaemonStatusDialog } from './components/dialogs/DaemonStatusDialog';
import { SessionOverviewPanel } from './components/SessionOverviewPanel';
import { SplitView } from './components/SplitView';
import { ArtifactPanel } from './components/artifacts/ArtifactPanel';
import { Drawer, DrawerContent, DrawerTitle } from './components/ui/drawer';
import {
  displayPath,
  getFileChangePreviewContent,
  TURN_OUTPUT_KINDS,
} from './components/artifacts/TurnOutputs';
import { useArtifactWorkspaceTarget } from './components/artifacts/useArtifactWorkspaceTarget';
import {
  getArtifactsByTurn,
  getFileChangesByTurn,
  getScheduledTasksByTurn,
} from './components/artifacts/turnOutputSelectors';
import { useIsLargeScreen } from './hooks/useIsLargeScreen';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import {
  clearSplitSessions,
  loadSplitSessions,
  MAX_SPLIT_PANES,
  parseSplitSessionIds,
  saveSplitSessions,
} from './utils/splitUrl';
import { ScheduledTasksDialog } from './components/dialogs/ScheduledTasksDialog';
import { GoalsDialog } from './components/dialogs/GoalsDialog';
import {
  goalArgOf,
  isGoalClearCommand,
  isGoalClearKeyword,
} from './utils/goalCondition';
import { ExtensionsManagerPage } from './components/extensions/ExtensionsManagerPage';
import { PluginManagerPage } from './components/plugins/PluginManagerPage';
import { ChannelsManagerPage } from './components/channels/ChannelsManagerPage';
import { ShadowDomBoundary } from './components/ShadowDomBoundary';
import { SettingsMessage } from './components/messages/SettingsMessage';
import { isAskUserPermission } from './utils/askUserPermission';
import { ToolApproval } from './components/messages/ToolApproval';
import { AskUserQuestion } from './components/messages/AskUserQuestion';
import { HelpDialog } from './components/dialogs/HelpDialog';
import { ThemeDialog } from './components/dialogs/ThemeDialog';
import { DeleteSessionDialog } from './components/dialogs/DeleteSessionDialog';
import { ReleaseSessionDialog } from './components/dialogs/ReleaseSessionDialog';
import { RewindDialog } from './components/dialogs/RewindDialog';
import { AddWorkspaceDialog } from './components/dialogs/AddWorkspaceDialog';
import { Button } from './components/ui/button';
import {
  isPluginShadowPanel,
  installWebShellShadowStyles,
  resolveWebShellShadowDom,
} from './shadowDom';
import { WebShellSidebar } from './components/sidebar/WebShellSidebar';
import { isSidebarToggleShortcut } from './components/sidebar/sidebarToggleShortcut';
import { workspaceLabel } from './utils/workspace';
import {
  getLocalCommands,
  localizeBuiltinDescriptions,
  skillDescriptionKey,
} from './constants/localCommands';
import { mergeCommands } from './hooks/daemonSessionMappers';
import { useAnimationFrameTranscriptBlocks } from './hooks/useAnimationFrameTranscriptBlocks';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { isSessionDisconnectedError } from './utils/sessionErrors';
import { useMessagesFromBlocks } from './hooks/useMessages';
import { useSessionArtifacts } from './hooks/useSessionArtifacts';
import { useShallowMemo, useStableArray } from './hooks/useShallowMemo';
import {
  I18nProvider,
  getTranslator,
  languageSettingToWebShellLanguage,
  languageLabel,
  normalizeLanguage,
} from './i18n';
import {
  copyFromLastAssistantMessage,
  COPY_MESSAGES,
} from './utils/copyCommand';
import { getShadowAwareActiveElement, isEditableTarget } from './utils/dom';
import {
  invokeSlashCommandHandler,
  SLASH_COMMAND_PATTERN,
} from './utils/slash-command-action';
import { getModelDisplayName } from './utils/modelDisplay';
import { isVisibleComposerModel } from './utils/composerModels';
import { filterModelSwitchMessages } from './utils/modelSwitchMessages';
import { decideEscapeIntent } from './utils/escapeIntent';
import { collectSystemInfo } from './utils/systemInfo';
import {
  decodeVisionModelForPicker,
  encodeVisionModelForSetting,
  extractBareModelId,
} from './utils/modelEncoding';
import { appendOrDeferLocalUserMessage } from './utils/localCommandQueue';
import { QueuedPromptDisplay } from './components/QueuedPromptDisplay';
import { useQueuedPrompts } from './hooks/useQueuedPrompts';
import { useNewSessionSuggestion } from './hooks/useNewSessionSuggestion';
import { TasksStatusMessage } from './components/messages/TasksStatusMessage';
import { serializeContextUsageMessage } from './components/messages/ContextUsageMessage';
import { serializeStatsMessage } from './components/messages/StatsMessage';
import { serializeStatusMessage } from './components/messages/StatusMessage';
import { McpManagerPage } from './components/mcp/McpManagerPage';
import {
  GOAL_STATUS_ACTIVE_EVENT,
  parseGoalStatusMessage,
  serializeGoalStatusMessage,
} from './components/messages/GoalStatusMessage';
import { BtwMessage } from './components/messages/BtwMessage';
import {
  createAndAttachSessionForPrompt,
  isDaemonApprovalMode,
} from './utils/sessionPreparation';
import {
  getComposerPlaceholderKey,
  getComposerPlaceholderState,
  shouldBlockComposerSubmit,
  shouldDisableComposerInput,
} from './utils/composerInputState';
import { isDefinitelyRejectedPromptAdmission } from './utils/promptAdmission';
import { isBackgroundSubAgentToolCall } from './adapters/toolClassification';
import {
  computeTodoDetails,
  computeTodoTimeline,
  getAgentToolsForPlan,
  getFloatingTodos,
  getActiveTodosForPlanRevision,
  isExitPlanApprovalRequest,
  todoDetailSignature,
  todoTimelineSignature,
} from './utils/todos';
import { ThemeProvider } from './themeContext';
import { InteractionBlockContext } from './interactionBlockContext';
import {
  WebShellThemeId,
  THEME_SETTING_KEY,
  LANGUAGE_SETTING_KEY,
  themeSettingToWebShellTheme,
  webShellThemeToSettingValue,
} from './themeContext';
import { WebShellCustomizationProvider } from './customization';
import { WebShellPortalRootContext } from './portalRoot';
import styles from './App.module.css';
export const CompactModeContext = createContext(false);
/**
 * Per-snapshot status diffs (keyed by tool callId or plan message id), so a
 * history row can render what changed in that snapshot without re-deriving it
 * from the whole transcript. Empty by default so a row rendered outside the
 * provider still falls back gracefully.
 */
export const TodoTimelineContext = createContext(new Map());
/**
 * Per-todo timing and resource detail keyed by todoStateKey, consumed by the
 * expanded todo list so a finished task can reveal when it ran and what it
 * spent. Empty by default so a row rendered outside the provider (or in tests)
 * simply shows no expander.
 */
export const TodoDetailContext = createContext(new Map());
/**
 * Provides both todo contexts in one wrapper so the message list stays at a
 * single nesting level (one provider in the tree, not two).
 */
function TodoContextsProvider({ timeline, details, children }) {
  return _jsx(TodoTimelineContext.Provider, {
    value: timeline,
    children: _jsx(TodoDetailContext.Provider, {
      value: details,
      children: children,
    }),
  });
}
const MODES_CYCLE = DAEMON_APPROVAL_MODES;
const MAX_TOASTS = 4;
const TOAST_AUTO_DISMISS_MS = 5000;
const DEFAULT_REVIEW_PANEL_WIDTH = 500;
const MIN_ARTIFACT_PANEL_WIDTH = 320;
const MIN_CHAT_PANE_WIDTH_WITH_ARTIFACT_PANEL = 500;
const SUBAGENT_PANEL_ANIMATION_FALLBACK_MS = 700;
const MIN_DOCKED_MESSAGE_AREA_WIDTH = 800;
const DOCKED_ENVIRONMENT_PANEL_WIDTH = 332;
// The docked fullscreen surface contains Tab itself instead of going through
// Radix FocusScope: FocusScope registers every mounted scope in a
// module-global stack and pauses the current head even with trapped={false},
// so a docked panel mounting under an open DialogShell would pause the
// modal's trap. The surface covers the viewport, so the keyboard is the only
// escape route; wrap it at the tabbable edges like FocusScope's loop does.
function getFullscreenSurfaceTabEdges(container) {
  const candidates = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const element = node;
      if (element.hidden) return NodeFilter.FILTER_SKIP;
      if (element instanceof HTMLInputElement && element.type === 'hidden') {
        return NodeFilter.FILTER_SKIP;
      }
      if (
        (element instanceof HTMLButtonElement ||
          element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement) &&
        element.disabled
      ) {
        return NodeFilter.FILTER_SKIP;
      }
      return element.tabIndex >= 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });
  while (walker.nextNode()) {
    candidates.push(walker.currentNode);
  }
  const visible = candidates.filter((element) =>
    typeof element.checkVisibility === 'function'
      ? element.checkVisibility({ checkVisibilityCSS: true })
      : true,
  );
  return [visible[0] ?? null, visible[visible.length - 1] ?? null];
}
const DEFAULT_COMPOSER_TOOLBAR_ACTIONS = [
  'approvalMode',
  'contextUsage',
  'model',
  'widthMode',
  'voice',
  'workspace',
];
const DEFAULT_EMPTY_COMPOSER_TOOLBAR_ACTIONS = [
  ...DEFAULT_COMPOSER_TOOLBAR_ACTIONS,
  'gitBranch',
];
const MAX_ARTIFACT_PANEL_SESSION_STATES = 20;
const BOUND_RUN_SWITCH_TIMEOUT_MS = 30_000;
function availableSkillInfos(status) {
  return (status.skills ?? [])
    .filter((skill) => skill.status === 'ok')
    .map((skill) => ({
      name: skill.name,
      description: skill.description ?? '',
      ...(skill.argumentHint ? { argumentHint: skill.argumentHint } : {}),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
const COMPACT_MODE_SETTING_KEY = 'ui.compactMode';
const HIDE_TIPS_SETTING_KEY = 'ui.hideTips';
/** Maps each ModelDialogMode to its i18n title key — single source of truth. */
const MODE_TITLE_KEY = {
  main: 'model.select',
  fast: 'model.setFast',
  voice: 'model.setVoice',
  vision: 'model.setVision',
};
function normalizeHiddenCommand(command) {
  return command.trim().replace(/^\/+/, '').toLowerCase();
}
function retryOwnerMatchesCurrent(
  owner,
  sessionId,
  workspaceCwd,
  sourceVersion,
) {
  const workspaceMatches =
    (owner.workspaceCwd !== undefined && owner.workspaceCwd === workspaceCwd) ||
    owner.snapshot.isCurrent();
  return (
    owner.sessionId === sessionId &&
    owner.sourceVersion === sourceVersion &&
    workspaceMatches
  );
}
function mergeCancelledRetryEntries(current, incoming) {
  return incoming.reduce(
    (merged, candidate) => {
      const existing = merged.find(
        (entry) => entry.state.kind === candidate.state.kind,
      );
      if (existing && existing.state.attemptId >= candidate.state.attemptId) {
        return merged;
      }
      return [
        ...merged.filter((entry) => entry.state.kind !== candidate.state.kind),
        candidate,
      ];
    },
    [...current],
  );
}
function getLatestUserBlockId(blocks) {
  return getLatestUserBlock(blocks)?.id;
}
function getLatestUserBlock(blocks) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (
      block?.kind === 'user' &&
      block.meta?.['source'] !== 'background_notification'
    ) {
      return block;
    }
  }
  return undefined;
}
function matchesUserMessageIdentity(block, identity, allowLocalId = false) {
  if (!identity) return block === undefined;
  if (!block || block.kind !== 'user' || identity.block.kind !== 'user') {
    return false;
  }
  if (block === identity.block) return true;
  if (allowLocalId && block.id === identity.block.id) return true;
  const expectedRecords = identity.block.sourceRecordIds;
  const currentRecords = block.sourceRecordIds;
  return (
    expectedRecords !== undefined &&
    expectedRecords.length > 0 &&
    currentRecords !== undefined &&
    currentRecords.length === expectedRecords.length &&
    currentRecords.every((record, index) => record === expectedRecords[index])
  );
}
function findUserMessageByIdentity(blocks, identity, allowLocalId = false) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const block = blocks[index];
    if (
      block?.kind === 'user' &&
      block.meta?.['source'] !== 'background_notification' &&
      matchesUserMessageIdentity(block, identity, allowLocalId)
    ) {
      return block;
    }
  }
  return undefined;
}
function getLogicalSessionKey(sessionId, workspaceCwd) {
  return sessionId ? `${workspaceCwd ?? ''}\0${sessionId}` : undefined;
}
function getRetryableTurnError(blocks) {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block?.kind === 'user') {
      if (block.meta?.['source'] === 'background_notification') continue;
      break;
    }
    if (block?.kind === 'error' && block.source === 'turn_error') {
      return block;
    }
    if (block?.kind !== 'debug') break;
  }
  return undefined;
}
function matchesTurnErrorIdentity(block, identity) {
  if (
    !block ||
    block.kind !== 'error' ||
    block.source !== 'turn_error' ||
    identity.block.kind !== 'error' ||
    identity.block.source !== 'turn_error'
  ) {
    return false;
  }
  if (block === identity.block) return true;
  const expectedPromptId = identity.block.promptId;
  if (expectedPromptId) return block.promptId === expectedPromptId;
  return (
    identity.block.eventId !== undefined &&
    block.eventId === identity.block.eventId
  );
}
function retryTranscriptIdentityMatches(
  blocks,
  transcriptIdentity,
  allowLocalUserId = false,
) {
  return transcriptIdentity.kind === 'failed-prompt'
    ? matchesUserMessageIdentity(
        getLatestUserBlock(blocks),
        transcriptIdentity.identity,
        allowLocalUserId,
      )
    : matchesTurnErrorIdentity(
        getRetryableTurnError(blocks),
        transcriptIdentity.identity,
      );
}
function parseGoalStatusFromBlock(block) {
  const statusBlock = block;
  if (statusBlock.source !== 'goal') return null;
  return (
    parseGoalStatusMessage(statusBlock.data) ??
    parseGoalStatusMessage(statusBlock.text)
  );
}
function getLatestActiveGoalFromBlocks(blocks) {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i];
    if (block.kind !== 'status') continue;
    const status = parseGoalStatusFromBlock(block);
    if (!status) continue;
    if (status.kind === 'set' || status.kind === 'checking') {
      return {
        condition: status.condition,
        setAt: status.setAt ?? block.serverTimestamp ?? block.createdAt,
      };
    }
    return null;
  }
  return null;
}
const emptyComposerApi = {
  insertText: () => {},
  setText: () => {},
  addTags: () => {},
  removeTag: () => {},
  clear: () => {},
  submit: () => {},
};
const EMPTY_BOTTOM_STATUS_ITEMS = [];
const DEFAULT_CHAT_MAX_WIDTH = 1000;
const DEFAULT_CHAT_HEADER_ITEMS = ['title', 'environment', 'rightPanel'];
const DEFAULT_RIGHT_PANEL_ITEMS = ['review', 'sideTask'];
const DEFAULT_ENVIRONMENT_PANEL_ITEMS = [
  'environment',
  'subagents',
  'backgroundTasks',
];
const BOTTOM_PANEL_GAP_PX = 6;
const BOTTOM_PANEL_FALLBACK_INSET_PX = 40;
// One preview tab per image, keyed by its content, so opening several images
// keeps a tab each while re-clicking the same image just focuses its tab.
function imageTabId(src) {
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = (hash * 31 + src.charCodeAt(i)) | 0;
  }
  return `image:${hash.toString(36)}`;
}
const CHAT_WIDTH_STORAGE_KEY = 'qwen-code-web-shell-chat-width';
const CHAT_SHELL_HORIZONTAL_PADDING = 40;
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'qwen-code-web-shell-sidebar-collapsed';
function resolveSidebarOptions(sidebar) {
  if (sidebar === true) {
    return { enabled: true, defaultCollapsed: false, showCompactToggle: true };
  }
  if (!sidebar) {
    return { enabled: false, defaultCollapsed: false, showCompactToggle: true };
  }
  return {
    enabled: sidebar.enabled ?? true,
    defaultCollapsed: sidebar.defaultCollapsed ?? false,
    showCompactToggle: sidebar.showCompactToggle ?? true,
    branding: sidebar.branding,
    primaryNav: sidebar.primaryNav,
    hideProjectHeader: sidebar.hideProjectHeader,
    sessionActions: sidebar.sessionActions,
    footer: sidebar.footer,
    lockedWorkspace: sidebar.lockedWorkspace,
  };
}
function readSidebarCollapsed(defaultCollapsed) {
  if (typeof window === 'undefined') return defaultCollapsed;
  try {
    const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // localStorage can be unavailable in private or embedded contexts.
  }
  return defaultCollapsed;
}
function writeSidebarCollapsed(collapsed) {
  try {
    window.localStorage.setItem(
      SIDEBAR_COLLAPSED_STORAGE_KEY,
      String(collapsed),
    );
  } catch {
    // localStorage can be unavailable in private or embedded contexts.
  }
}
function getDefaultChatWidthMode() {
  return `${DEFAULT_CHAT_MAX_WIDTH}`;
}
function readChatWidthMode() {
  if (typeof window === 'undefined') return getDefaultChatWidthMode();
  try {
    return window.localStorage.getItem(CHAT_WIDTH_STORAGE_KEY) === 'wide'
      ? 'wide'
      : getDefaultChatWidthMode();
  } catch {
    return getDefaultChatWidthMode();
  }
}
function writeChatWidthMode(mode) {
  try {
    window.localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, mode);
  } catch {
    // localStorage can be unavailable in private or embedded contexts.
  }
}
function getChatMaxWidth(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_CHAT_MAX_WIDTH;
}
function getChatWidthStyle(mode, chatMaxWidth) {
  const contentWidth = `${getChatMaxWidth(chatMaxWidth)}px`;
  const shellWidth = `calc(${contentWidth} + ${CHAT_SHELL_HORIZONTAL_PADDING}px)`;
  return {
    '--chat-regular-content-width': contentWidth,
    '--chat-regular-shell-width': shellWidth,
    '--chat-content-width': mode === 'wide' ? '100%' : contentWidth,
    '--chat-shell-width': mode === 'wide' ? '100%' : shellWidth,
  };
}
function assignComposerRef(ref, value) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  ref.current = value;
}
function assignShellRef(ref, value) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  ref.current = value;
}
function areSessionIdsEqual(a, b) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}
function getInitialLanguage() {
  if (typeof window === 'undefined') return 'en';
  const params = new URLSearchParams(window.location.search);
  return normalizeLanguage(
    params.get('language') ?? params.get('lang') ?? navigator.language,
  );
}
function formatError(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}
function isAbortError(error) {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}
function isAlreadyDispatched(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    error._alreadyDispatched === true
  );
}
function shouldToastNotice(notice) {
  return (
    notice.category === 'validation' ||
    notice.category === 'user_action' ||
    notice.category === 'system'
  );
}
function toastToneFromNotice(notice) {
  if (notice.severity === 'warning') return 'warning';
  if (notice.severity === 'info') return 'info';
  return 'error';
}
function isRecord(value) {
  return typeof value === 'object' && value !== null;
}
function getModelSwitchSummary(result) {
  if (!isRecord(result)) return null;
  const meta = result._meta;
  if (!isRecord(meta)) return null;
  const summary = meta.qwenModelSwitch;
  if (!isRecord(summary)) return null;
  const authType = summary.authType;
  const modelId = summary.modelId;
  const baseUrl = summary.baseUrl;
  const apiKey = summary.apiKey;
  if (
    typeof authType !== 'string' ||
    typeof modelId !== 'string' ||
    typeof baseUrl !== 'string' ||
    typeof apiKey !== 'string'
  ) {
    return null;
  }
  return {
    authType,
    modelId,
    baseUrl,
    apiKey,
    ...(typeof summary.isRuntime === 'boolean'
      ? { isRuntime: summary.isRuntime }
      : {}),
  };
}
function serializeModelSwitchSummary(summary, t) {
  return t('model.usingModel', {
    isRuntime: summary.isRuntime ? 1 : 0,
    modelId: summary.modelId,
  });
}
function isEditToolPermission(request) {
  return request.toolKind === 'edit';
}
function parseRenameArgument(raw) {
  const trimmed = raw.trim().replace(/[\r\n]+/g, ' ');
  if (!trimmed) return { type: 'auto' };
  if (trimmed === '--') return { type: 'manual', displayName: '' };
  if (trimmed.startsWith('-- ')) {
    return { type: 'manual', displayName: trimmed.slice(3).trim() };
  }
  if (trimmed.toLowerCase() === '--auto') return { type: 'auto' };
  if (trimmed.startsWith('--')) return { type: 'delegate' };
  return { type: 'manual', displayName: trimmed };
}
function isBackgroundTaskToolCall(tool) {
  const name = tool.toolName.toLowerCase();
  if (name === 'monitor') return true;
  if (tool.args?.is_background !== true) return false;
  return (
    name === 'shell' ||
    name === 'bash' ||
    name === 'run_shell_command' ||
    name === 'exec'
  );
}
export function getTaskActivityKey(messages) {
  const parts = [];
  const visit = (tools) => {
    for (const tool of tools) {
      if (
        isBackgroundTaskToolCall(tool) ||
        isBackgroundSubAgentToolCall(tool)
      ) {
        parts.push(`${tool.callId}:${tool.status}`);
      }
      if (tool.subTools) visit(tool.subTools);
    }
  };
  for (const message of messages) {
    if (message.role !== 'tool_group') continue;
    visit(message.tools);
  }
  return parts.join('|');
}
export function mergeMonitorTaskSnapshot(current, next) {
  return current.status !== 'running' && next.status === 'running'
    ? current
    : next;
}
function mergeShellTaskSnapshot(current, next) {
  return current.status !== 'running' && next.status === 'running'
    ? current
    : next;
}
// Merge a fresh side-task listing into the cached catalog. The listing is
// authoritative: a cached item survives only while it is still listed or is a
// locally created draft the daemon has not echoed back yet (optimisticIds).
// Without the optimistic guard, a task deleted or archived on another client
// would be re-added from the cache forever.
export function mergeSideTaskCatalog(
  catalog,
  parentSessionId,
  listedItems,
  optimisticIds,
) {
  if (catalog.parentSessionId !== parentSessionId) {
    return { parentSessionId, items: listedItems, loaded: true };
  }
  const listedIds = new Set(listedItems.map((item) => item.sessionId));
  return {
    parentSessionId,
    loaded: true,
    items: [
      ...listedItems,
      ...catalog.items.filter(
        (item) =>
          !listedIds.has(item.sessionId) && optimisticIds.has(item.sessionId),
      ),
    ],
  };
}
function agentStatusFromTool(tool) {
  if (tool.status === 'pending' || tool.status === 'in_progress') {
    return 'running';
  }
  if (tool.status === 'failed') return 'failed';
  const rawOutput = isRecord(tool.rawOutput) ? tool.rawOutput : undefined;
  if (rawOutput?.['status'] === 'cancelled') return 'cancelled';
  return rawOutput?.['status'] === 'failed' ? 'failed' : 'completed';
}
function agentTaskAsToolCall(task) {
  const status =
    task.status === 'running' || task.status === 'paused'
      ? 'in_progress'
      : task.status === 'failed'
        ? 'failed'
        : 'completed';
  return {
    callId: task.id,
    toolName: 'agent',
    title: `Agent: ${task.label}`,
    status,
    args: {
      description: task.description,
      ...(task.prompt ? { prompt: task.prompt } : {}),
      ...(task.subagentType ? { subagent_type: task.subagentType } : {}),
      run_in_background: task.isBackgrounded,
    },
    rawOutput: {
      type: 'task_execution',
      subagentName: task.subagentType,
      status: task.status,
    },
    startTime: task.startTime,
    ...(task.endTime !== undefined ? { endTime: task.endTime } : {}),
  };
}
function isEnvironmentAgentToolCall(tool) {
  const name = tool.toolName.toLowerCase();
  if (name === 'agent' || name === 'task') return true;
  if (typeof tool.args?.subagent_type === 'string') return true;
  return (
    isRecord(tool.rawOutput) && tool.rawOutput['type'] === 'task_execution'
  );
}
function derivedTaskIdForTool(tool) {
  const rawOutput = isRecord(tool.rawOutput) ? tool.rawOutput : undefined;
  const subagentName =
    typeof rawOutput?.['subagentName'] === 'string'
      ? rawOutput['subagentName']
      : undefined;
  const subagentType =
    typeof tool.args?.subagent_type === 'string'
      ? tool.args.subagent_type
      : undefined;
  return subagentName
    ? `${subagentName}-${tool.callId}`
    : subagentType
      ? `${subagentType}-${tool.callId}`
      : undefined;
}
export function getEnvironmentAgentTasks(messages, sessionTasks) {
  const liveAgents = sessionTasks.filter((task) => task.kind === 'agent');
  const taskIdsByToolUseId = new Map();
  for (const message of messages) {
    if (message.role !== 'system' || !isRecord(message.data)) continue;
    const taskId = message.data['taskId'];
    const toolUseId = message.data['toolUseId'];
    if (typeof taskId === 'string' && typeof toolUseId === 'string') {
      taskIdsByToolUseId.set(toolUseId, taskId);
    }
  }
  // A live task already linked precisely (by toolUseId, message taskId, or
  // derived id) to some transcript tool call must never be claimed by the loose
  // content fallback: two agents sharing a description would otherwise collapse
  // into one (the fallback steals the linked task, its owner re-matches it, and
  // the orphan is dropped).
  const envToolCallIds = new Set();
  const preciselyClaimedTaskIds = new Set(taskIdsByToolUseId.values());
  const collectPreciseLinks = (tools) => {
    for (const tool of tools) {
      if (
        isEnvironmentAgentToolCall(tool) &&
        !envToolCallIds.has(tool.callId)
      ) {
        envToolCallIds.add(tool.callId);
        const derivedTaskId = derivedTaskIdForTool(tool);
        if (derivedTaskId) preciselyClaimedTaskIds.add(derivedTaskId);
      }
      if (tool.subTools) collectPreciseLinks(tool.subTools);
    }
  };
  for (const message of messages) {
    if (message.role === 'tool_group') collectPreciseLinks(message.tools);
  }
  const isPreciselyClaimed = (task) =>
    (task.toolUseId != null && envToolCallIds.has(task.toolUseId)) ||
    preciselyClaimedTaskIds.has(task.id);
  const agents = [];
  const seenTaskIds = new Set();
  const seenToolCallIds = new Set();
  const visit = (tools) => {
    for (const tool of tools) {
      if (
        isEnvironmentAgentToolCall(tool) &&
        !seenToolCallIds.has(tool.callId)
      ) {
        seenToolCallIds.add(tool.callId);
        const rawOutput = isRecord(tool.rawOutput) ? tool.rawOutput : undefined;
        const color =
          typeof rawOutput?.['subagentColor'] === 'string'
            ? rawOutput['subagentColor']
            : undefined;
        const description =
          typeof tool.args?.description === 'string'
            ? tool.args.description
            : undefined;
        const prompt =
          typeof tool.args?.prompt === 'string' ? tool.args.prompt : undefined;
        const subagentType =
          typeof tool.args?.subagent_type === 'string'
            ? tool.args.subagent_type
            : undefined;
        const subagentName =
          typeof rawOutput?.['subagentName'] === 'string'
            ? rawOutput['subagentName']
            : undefined;
        const taskId = taskIdsByToolUseId.get(tool.callId);
        const derivedTaskId = derivedTaskIdForTool(tool);
        // Completed background agents can lose their toolUseId / derived-id
        // linkage (e.g. across a daemon reload); fall back to content matching,
        // the same signal the daemon's legacy resolver uses.
        const matchesLiveTaskContent = (task) => {
          if (prompt && task.prompt === prompt) return true;
          if (
            description &&
            task.description === description &&
            subagentType &&
            task.subagentType === subagentType
          ) {
            return true;
          }
          return !!description && task.description === description;
        };
        const liveTask = liveAgents.find(
          (task) =>
            task.toolUseId === tool.callId ||
            task.id === taskId ||
            task.id === derivedTaskId ||
            (!seenTaskIds.has(task.id) &&
              !isPreciselyClaimed(task) &&
              matchesLiveTaskContent(task)),
        );
        const title = tool.title?.replace(/^Agent:\s*/i, '').trim();
        const meaningfulTitle =
          title && title.toLowerCase() !== 'agent' ? title : undefined;
        const label =
          meaningfulTitle ??
          description ??
          prompt ??
          subagentName ??
          subagentType ??
          '';
        const taskDescription =
          description ?? prompt ?? subagentName ?? subagentType ?? '';
        const startTime = tool.startTime ?? 0;
        agents.push(
          liveTask
            ? {
                ...liveTask,
                label,
                description: taskDescription || liveTask.description,
                ...(subagentType ? { subagentType } : {}),
                ...(color ? { color } : {}),
              }
            : {
                kind: 'agent',
                id: taskId ?? derivedTaskId ?? tool.callId,
                label,
                description: taskDescription,
                status: agentStatusFromTool(tool),
                startTime,
                ...(tool.endTime !== undefined
                  ? { endTime: tool.endTime }
                  : {}),
                runtimeMs: Math.max(
                  0,
                  (tool.endTime ?? tool.startTime ?? startTime) - startTime,
                ),
                ...(subagentType ? { subagentType } : {}),
                ...(color ? { color } : {}),
                isBackgrounded: isBackgroundSubAgentToolCall(tool),
                toolUseId: tool.callId,
              },
        );
        if (liveTask) seenTaskIds.add(liveTask.id);
      }
      if (tool.subTools) visit(tool.subTools);
    }
  };
  for (const message of messages) {
    if (message.role === 'tool_group') visit(message.tools);
  }
  for (const task of liveAgents) {
    if (
      seenTaskIds.has(task.id) ||
      (task.toolUseId && seenToolCallIds.has(task.toolUseId))
    ) {
      continue;
    }
    const alreadyListed = agents.some(
      (a) =>
        (a.toolUseId != null && a.toolUseId === task.toolUseId) ||
        (a.description !== '' && a.description === task.description),
    );
    if (alreadyListed) continue;
    agents.push(task);
  }
  return agents;
}
function findToolCall(messages, callId) {
  const findNested = (tools) => {
    for (const tool of tools) {
      if (tool.callId === callId) return tool;
      const nested = tool.subTools ? findNested(tool.subTools) : undefined;
      if (nested) return nested;
    }
    return undefined;
  };
  for (const message of messages) {
    if (message.role !== 'tool_group') continue;
    const tool = findNested(message.tools);
    if (tool) return tool;
  }
  return undefined;
}
function mapToWebShellTaskInfo(task) {
  const base = {
    id: task.id,
    label: task.label,
    description: task.description,
    runtimeMs: task.runtimeMs,
    startTime: task.startTime,
    endTime: task.endTime,
    error: task.error,
  };
  switch (task.kind) {
    case 'agent':
      return {
        ...base,
        kind: 'agent',
        status: task.status,
        subagentType: task.subagentType,
        isBackgrounded: task.isBackgrounded,
        prompt: task.prompt,
      };
    case 'shell':
      return {
        ...base,
        kind: 'shell',
        status: task.status,
        command: task.command,
        cwd: task.cwd,
        pid: task.pid,
        exitCode: task.exitCode,
      };
    case 'monitor':
      return {
        ...base,
        kind: 'monitor',
        status: task.status,
        command: task.command,
        pid: task.pid,
        exitCode: task.exitCode,
      };
    default:
      return task;
  }
}
function translateCopyMessage(message, t) {
  if (message === COPY_MESSAGES.NO_OUTPUT) return t('copy.noOutput');
  if (message === COPY_MESSAGES.NO_TEXT) return t('copy.noText');
  if (message === COPY_MESSAGES.CODE_MISSING) return t('copy.codeMissing');
  if (message === COPY_MESSAGES.LATEX_MISSING) return t('copy.latexMissing');
  if (message === COPY_MESSAGES.INLINE_LATEX_MISSING) {
    return t('copy.inlineLatexMissing');
  }
  if (message === COPY_MESSAGES.OUTPUT_COPIED) return t('copy.outputCopied');
  if (message.startsWith(COPY_MESSAGES.CLIPBOARD_PREFIX)) {
    return `${t('copy.failedFallback')}. ${message.slice(COPY_MESSAGES.CLIPBOARD_PREFIX.length)}`;
  }
  if (message.endsWith(COPY_MESSAGES.COPIED_SUFFIX)) {
    return t('copy.toClipboard', {
      label: message.slice(0, -COPY_MESSAGES.COPIED_SUFFIX.length),
    });
  }
  return message;
}
function isSameGitStatus(current, next) {
  if (current === next) return true;
  if (!current || !next) return false;
  return (
    current.v === next.v &&
    current.workspaceCwd === next.workspaceCwd &&
    current.branch === next.branch &&
    current.detached === next.detached &&
    current.staged === next.staged &&
    current.unstaged === next.unstaged &&
    current.untracked === next.untracked &&
    current.conflicted === next.conflicted &&
    current.hasUpstream === next.hasUpstream &&
    current.ahead === next.ahead &&
    current.behind === next.behind &&
    current.stashCount === next.stashCount &&
    current.operation === next.operation
  );
}
/**
 * Read a model setting's value for the scope currently being edited. Model
 * pickers persist to `modelSettingScope`, so their "current" value reflects
 * only that scope's own value (not the merged/effective one) — otherwise the
 * User tab would show, and appear to clear, an inherited workspace value.
 */
function readScopedModelSetting(settings, scope, key) {
  const setting = settings.find((s) => s.key === key);
  if (!setting) return undefined;
  return scope === 'user' ? setting.values.user : setting.values.workspace;
}
export function App({
  desiredSessionTargetPending = false,
  onSessionIdChange,
  onSessionCreated,
  theme: providedTheme,
  onThemeChange,
  language: providedLanguage,
  onLanguageChange,
  className: externalClassName,
  style: externalStyle,
  shadowDom,
  onConnectionChange,
  onStreamingStateChange,
  onError,
  onBugReport,
  hiddenSlashCommands,
  slashCommandCategoryOrder,
  onSlashCommand,
  builtinAtProviders,
  atProviders,
  composerTagIcons,
  fileUploadEnabled,
  renderToolHeaderExtra,
  renderWelcomeHeader,
  renderWelcomeFooter,
  mobileWelcomeFooterMiddle = false,
  parseUserMessageContent,
  renderUserMessageContent,
  renderComposerTag,
  renderComposerTagTooltip,
  onComposerTagClick,
  renderAssistantTurnFooter,
  renderComposerToolbarStart,
  renderComposerToolbarEnd,
  renderComposerToolbarRight,
  renderComposerHeader,
  renderComposerFooter,
  renderChatHeader,
  renderFooter,
  bottomStatusItems,
  chatMaxWidth,
  sidebar,
  header,
  rightPanel,
  environmentPanel,
  splitSessionIds: externalSplitSessionIds,
  onSplitSessionIdsChange,
  renderPaneHeaderActions,
  onRightPanelOpen,
  messageTurnOutputs,
  shellRef,
  composerToolbarActions,
  composerPlaceholders,
  compactThinking = false,
  collapseCompletedTurns = true,
  markdownTableMode = 'basic',
  virtualScrollThreshold,
  markdown,
  loadingPhrases,
  onTranscriptChange,
  onToast,
  composerRef,
  onComposerReady,
  composerInput,
  composerInputVersion,
  onSessionChange,
  onSubmitBefore,
  restartSseOnPrompt,
  historyPageSize,
  initialSelectedWorkspaceCwd,
  lockedWorkspaceCwd,
  lockedWorkspaceCapability,
} = {}) {
  const [chatWidthMode, setChatWidthMode] = useState(readChatWidthMode);
  const [selectedLanguage, setSelectedLanguage] = useState(() =>
    providedLanguage === undefined
      ? getInitialLanguage()
      : normalizeLanguage(providedLanguage),
  );
  const t = useMemo(() => getTranslator(selectedLanguage), [selectedLanguage]);
  const shadowDomOptions = useMemo(
    () => resolveWebShellShadowDom(shadowDom),
    [shadowDom],
  );
  const sidebarOptions = useMemo(
    () => resolveSidebarOptions(sidebar),
    [sidebar],
  );
  const chatHeaderItems = header?.items ?? DEFAULT_CHAT_HEADER_ITEMS;
  const chatHeaderEnabled =
    chatHeaderItems.length > 0 && Boolean(header || renderChatHeader);
  const titleHeaderItemVisible = chatHeaderItems.includes('title');
  const environmentHeaderItemVisible = chatHeaderItems.includes('environment');
  const rightPanelHeaderItemVisible = chatHeaderItems.includes('rightPanel');
  const rightPanelItems = rightPanel?.items ?? DEFAULT_RIGHT_PANEL_ITEMS;
  const environmentPanelItems =
    environmentPanel?.items ?? DEFAULT_ENVIRONMENT_PANEL_ITEMS;
  // The environment panel is only reachable through the chat header toggle,
  // so its sections replace the composer git entry / footer task pills only
  // when that header is actually enabled. Embeddings that omit the header keep
  // the legacy entries.
  const environmentPanelReachable =
    chatHeaderEnabled &&
    environmentHeaderItemVisible &&
    (!renderChatHeader || Boolean(header));
  const environmentGitReplacementEnabled =
    environmentPanelReachable && environmentPanelItems.includes('environment');
  const environmentTasksReplacementEnabled =
    environmentPanelReachable &&
    environmentPanelItems.includes('backgroundTasks');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    readSidebarCollapsed(sidebarOptions.defaultCollapsed),
  );
  const [sidebarSwitchingSessionId, setSidebarSwitchingSessionId] =
    useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [forceMobileDrawer, setForceMobileDrawer] = useState(false);
  const closeMobileDrawer = useCallback(() => {
    setMobileDrawerOpen(false);
    setForceMobileDrawer(false);
  }, []);
  // The Session Overview panel (mission control for managing many sessions at
  // once) is only offered on large screens; below that there is no room for it
  // to be useful.
  const isLargeScreen = useIsLargeScreen();
  const canDockArtifactPanel = useIsLargeScreen('(min-width: 1001px)');
  const prefersReducedMotion = usePrefersReducedMotion();
  // In split view the session sidebar competes with the panes for width. Below
  // this width it auto-collapses to its icon rail so the panes get the room, and
  // expands again once the window grows back. A wide split keeps the full
  // sidebar (and the user's own collapse preference).
  const splitSidebarHasRoom = useIsLargeScreen('(min-width: 1200px)');
  useEffect(() => {
    if (!sidebarOptions.enabled) closeMobileDrawer();
  }, [closeMobileDrawer, sidebarOptions.enabled]);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 760px)');
    const handler = (e) => {
      if (!e.matches) closeMobileDrawer();
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [closeMobileDrawer]);
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // A pending tool/permission approval owns Escape (it rejects the call),
      // so don't let the drawer swallow it while a prompt is visible.
      if (pendingApprovalRef.current) return;
      // The fullscreen artifact surface owns Escape too (it shrinks back);
      // a force-hidden drawer must not swallow the key first.
      if (artifactPanelFullscreenRef.current) return;
      const target = e.target;
      // Only let an editable element keep Escape for itself when it lives
      // outside the drawer; the drawer's own search input should still close
      // the drawer on the first Escape.
      if (
        isEditableTarget(target) &&
        !target?.closest('[data-sidebar-shell]')
      ) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      closeMobileDrawer();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const preventScroll = (e) => {
      // Allow native scrolling inside the drawer panel (e.g. the session list).
      // The dim backdrop also lives under [data-sidebar-shell], so exclude it:
      // a touchmove starting on the backdrop must still be blocked, otherwise
      // iOS Safari scrolls the page behind the open drawer.
      const el = e.target;
      if (
        el?.closest('[data-sidebar-shell]') &&
        !el.closest(`.${styles.mobileBackdrop}`)
      ) {
        return;
      }
      e.preventDefault();
    };
    document.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [mobileDrawerOpen, closeMobileDrawer]);
  const handleSidebarCollapsedChange = useCallback((collapsed) => {
    setSidebarCollapsed(collapsed);
    writeSidebarCollapsed(collapsed);
  }, []);
  // #5074: Cmd+B / Ctrl+B toggles the session sidebar, matching the editor
  // convention (VS Code et al.). It works while any element is focused —
  // the composer has no bold formatting, so nothing competes for the
  // binding. Phone-width layouts render the sidebar as a drawer, so the
  // shortcut toggles that instead of the collapsed rail.
  useEffect(() => {
    if (!sidebarOptions.enabled) return undefined;
    const onKey = (e) => {
      if (!isSidebarToggleShortcut(e)) return;
      // The composer keeps the editor-convention behavior (VS Code toggles
      // the sidebar while the editor is focused), but other editable targets
      // — sidebar search, session rename, settings inputs — must not have
      // the sidebar yanked around while the user is typing, matching the
      // codebase's isEditableTarget convention.
      const target = e.target;
      if (
        isEditableTarget(target) &&
        !target?.closest('[data-web-shell-composer-editor]')
      ) {
        return;
      }
      e.preventDefault();
      // All state updates are dispatched sequentially outside the updater
      // functions (React purity contract — mirrors the hamburger handler),
      // which is why this effect re-binds on state changes: the listener
      // closure must stay fresh.
      if (
        forceMobileDrawer ||
        window.matchMedia('(max-width: 760px)').matches
      ) {
        // A forced drawer on a wide viewport still belongs to the drawer
        // path: collapsing the rail underneath the overlay would look like
        // a no-op to the user.
        if (mobileDrawerOpen) {
          setMobileDrawerOpen(false);
          setForceMobileDrawer(false);
        } else {
          setMobileDrawerOpen(true);
        }
        return;
      }
      const next = !sidebarCollapsed;
      setSidebarCollapsed(next);
      writeSidebarCollapsed(next);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    sidebarOptions.enabled,
    mobileDrawerOpen,
    forceMobileDrawer,
    sidebarCollapsed,
  ]);
  const customization = useMemo(
    () => ({
      composerTagIcons,
      renderToolHeaderExtra,
      renderWelcomeHeader,
      renderWelcomeFooter,
      parseUserMessageContent,
      renderUserMessageContent,
      renderComposerTag,
      renderComposerTagTooltip,
      onComposerTagClick,
      renderAssistantTurnFooter,
      renderComposerToolbarStart,
      renderComposerToolbarEnd,
      renderComposerToolbarRight,
      renderComposerHeader,
      renderComposerFooter,
      renderFooter,
      compactThinking,
      collapseCompletedTurns,
      markdownTableMode,
      markdown,
      loadingPhrases,
      fileUploadEnabled,
    }),
    [
      composerTagIcons,
      renderToolHeaderExtra,
      renderWelcomeHeader,
      renderWelcomeFooter,
      parseUserMessageContent,
      renderUserMessageContent,
      renderComposerTag,
      renderComposerTagTooltip,
      onComposerTagClick,
      renderAssistantTurnFooter,
      renderComposerToolbarStart,
      renderComposerToolbarEnd,
      renderComposerToolbarRight,
      renderComposerHeader,
      renderComposerFooter,
      renderFooter,
      compactThinking,
      collapseCompletedTurns,
      markdownTableMode,
      markdown,
      loadingPhrases,
      fileUploadEnabled,
    ],
  );
  const CustomFooter = renderFooter;
  const CustomComposerHeader = renderComposerHeader;
  const CustomComposerFooter = renderComposerFooter;
  const store = useTranscriptStore();
  const blocks = useAnimationFrameTranscriptBlocks();
  const connection = useConnection();
  const logicalSessionKey = getLogicalSessionKey(
    connection.sessionId,
    connection.workspaceCwd,
  );
  const sessionWriteBlocked =
    desiredSessionTargetPending ||
    connection.sessionTransition?.phase === 'queued' ||
    connection.sessionTransition?.phase === 'preparing';
  const sessionWriteBlockedRef = useRef(sessionWriteBlocked);
  const sessionWriteBlockGenerationRef = useRef(0);
  if (sessionWriteBlocked && !sessionWriteBlockedRef.current) {
    sessionWriteBlockGenerationRef.current += 1;
  }
  sessionWriteBlockedRef.current = sessionWriteBlocked;
  const appMountedRef = useRef(true);
  useLayoutEffect(() => {
    appMountedRef.current = true;
    return () => {
      appMountedRef.current = false;
    };
  }, []);
  const sessionOwnerGuard = useDaemonSessionOwnerGuard();
  const transcriptHistory = useTranscriptHistory();
  const workspace = useWorkspace();
  const sessionCatalogController = useSessionCatalogController(
    workspace.client,
  );
  const refreshWorkspaceCapabilities = workspace.refreshCapabilities;
  const workspaces = useMemo(() => {
    const capabilityWorkspaces = workspace.capabilities?.workspaces ?? [];
    if (
      lockedWorkspaceCapability &&
      !capabilityWorkspaces.some(
        (entry) => entry.cwd === lockedWorkspaceCapability.cwd,
      )
    ) {
      return [...capabilityWorkspaces, lockedWorkspaceCapability];
    }
    return capabilityWorkspaces;
  }, [lockedWorkspaceCapability, workspace.capabilities?.workspaces]);
  const composerWorkspacesRef = useRef(undefined);
  const nextComposerWorkspaces = !lockedWorkspaceCwd
    ? workspaces.map((entry) => ({
        id: entry.id,
        cwd: entry.cwd,
        label:
          entry.kind === 'live' ? t('sidebar.live') : workspaceLabel(entry),
        primary: entry.primary,
        trusted: entry.trusted,
      }))
    : undefined;
  const currentComposerWorkspaces = composerWorkspacesRef.current;
  if (
    currentComposerWorkspaces?.length !== nextComposerWorkspaces?.length ||
    currentComposerWorkspaces?.some((current, index) => {
      const next = nextComposerWorkspaces?.[index];
      return (
        !next ||
        current.id !== next.id ||
        current.cwd !== next.cwd ||
        current.label !== next.label ||
        current.primary !== next.primary ||
        current.trusted !== next.trusted
      );
    })
  ) {
    composerWorkspacesRef.current = nextComposerWorkspaces;
  }
  const composerWorkspaces = composerWorkspacesRef.current;
  const workspacesRef = useRef(workspaces);
  workspacesRef.current = workspaces;
  const visibleWorkspaces = useMemo(
    () =>
      lockedWorkspaceCwd
        ? workspaces.filter((entry) => entry.cwd === lockedWorkspaceCwd)
        : workspaces,
    [lockedWorkspaceCwd, workspaces],
  );
  const sessionActions = useActions();
  const reloadTranscript = useCallback(
    async (signal) => {
      if (!connection.sessionId) return;
      await sessionActions.reloadSession(signal);
    },
    [connection.sessionId, sessionActions],
  );
  const transcriptReloadSupported =
    connection.capabilities?.features.includes(
      SESSION_TRANSCRIPT_PAGINATION_FEATURE,
    ) === true;
  const monitorDetailsSupported =
    connection.capabilities?.features.includes(
      SESSION_MONITOR_TOOL_CORRELATION_FEATURE,
    ) === true;
  const { notices, dismissNotice } = useSessionNotices();
  const workspaceActions = useWorkspaceActions();
  const artifactWorkspaceTarget = useArtifactWorkspaceTarget(
    connection.workspaceCwd,
  );
  const dynamicWorkspaceRegistrationSupported =
    workspace.capabilities?.features?.includes(
      'dynamic_workspace_registration',
    ) === true;
  const persistentWorkspaceRegistrationSupported =
    workspace.capabilities?.features?.includes(
      'persistent_workspace_registration',
    ) === true;
  const scratchWorkspaceRegistrationSupported =
    workspace.capabilities?.features?.includes(
      'scratch_workspace_registration',
    ) === true;
  const workspaceDisplayNameSupported =
    workspace.capabilities?.features?.includes('workspace_display_name') ===
    true;
  const gitHubPrsSupported =
    workspace.capabilities?.features?.includes('workspace_github_prs') === true;
  const [showAddWorkspaceDialog, setShowAddWorkspaceDialog] = useState(false);
  const [workspaceMutationBusy, setWorkspaceMutationBusy] = useState(false);
  const workspaceMutationTokenRef = useRef(null);
  const workspaceSwitchTokenRef = useRef(null);
  // Changes before async session clearing updates connection state.
  const composerSourceVersionRef = useRef(0);
  const scratchOutcomeUnknownRef = useRef('clear');
  const committedScratchCwdRef = useRef(undefined);
  const [scratchOutcomeUnknown, setScratchOutcomeUnknown] = useState('clear');
  // The ref is the synchronous authority: a second click can arrive before
  // React commits the disabled state rendered from its state mirror.
  const setScratchOutcome = useCallback((state) => {
    scratchOutcomeUnknownRef.current = state;
    setScratchOutcomeUnknown(state);
  }, []);
  // Phase 4: the workspace picked for the *next* new session on multi-workspace
  // daemons. Kept in a ref too because session creation is lazy (first prompt),
  // so the ensureSessionForPrompt callback must read the latest value.
  const [selectedWorkspaceCwd, setSelectedWorkspaceCwd] = useState(
    initialSelectedWorkspaceCwd,
  );
  const selectedWorkspaceCwdRef = useRef(selectedWorkspaceCwd);
  selectedWorkspaceCwdRef.current = selectedWorkspaceCwd;
  const [selectedWorkspaceGitStatus, setSelectedWorkspaceGitStatus] =
    useState(undefined);
  useEffect(() => {
    if (!workspace.capabilities || !selectedWorkspaceCwd) return;
    const selected = workspaces.find(
      (entry) => entry.cwd === selectedWorkspaceCwd,
    );
    if (selected?.trusted) return;
    composerSourceVersionRef.current += 1;
    selectedWorkspaceCwdRef.current = undefined;
    setSelectedWorkspaceCwd(undefined);
  }, [selectedWorkspaceCwd, workspace.capabilities, workspaces]);
  // The workspace the chip's status was last fetched for. On a workspace switch
  // we clear the status immediately so the chip never shows the previous repo's
  // branch/dirty counts while the new fetch is in flight; same-workspace
  // re-runs (branch change, focus, poll) keep the live value to avoid flicker.
  const gitStatusWorkspaceCwdRef = useRef(undefined);
  /** Worktree metadata for the current session (set after creation). */
  const [sessionWorktree, setSessionWorktree] = useState(undefined);
  /** Branch metadata for the current session (set after creation with branch mode). */
  const [sessionBranch, setSessionBranch] = useState(undefined);
  const [sessionStatusDisplayName, setSessionStatusDisplayName] =
    useState(undefined);
  // Tracks the logical session from the latest effect run. In-flight fetches
  // compare their captured key against this ref on resolve: a match means
  // the response is still relevant and may set OR clear the worktree state;
  // a mismatch means connection.sessionId moved on (reconnect cycling or a
  // user-initiated switch) and the stale response is dropped.
  const worktreeSessionKeyRef = useRef(undefined);
  useLayoutEffect(() => {
    setSessionWorktree(undefined);
    setSessionBranch(undefined);
    setSessionStatusDisplayName(undefined);
  }, [logicalSessionKey]);
  // Restore worktree info from the server when switching to an existing
  // session. The effect intentionally does NOT cancel in-flight fetches on
  // cleanup: connection.sessionId can cycle through several sessions during
  // the DaemonSessionProvider reconnection loop, and cancelling would
  // discard the one response we actually need.
  useEffect(() => {
    const sid = connection.sessionId;
    const sessionKey = logicalSessionKey;
    const owner = sessionOwnerGuard.capture();
    worktreeSessionKeyRef.current = sessionKey;
    if (!sid) {
      setSessionWorktree(undefined);
      setSessionBranch(undefined);
      setSessionStatusDisplayName(undefined);
      return;
    }
    if (
      connection.status !== 'connected' ||
      connection.loadingTranscript ||
      connection.catchingUp
    ) {
      return;
    }
    workspace.client
      .sessionStatus(sid)
      .then((summary) => {
        if (worktreeSessionKeyRef.current === sessionKey && owner.isCurrent()) {
          setSessionWorktree(summary.worktree);
          setSessionBranch(summary.branch);
          setSessionStatusDisplayName(summary.displayName);
        }
        return loadSessionCatalogOnce(
          workspace.client,
          {
            routeKind: 'legacy',
            workspaceCwd: summary.workspaceCwd,
            options: { pageSize: 200 },
          },
          { fresh: true },
        )
          .then((page) => {
            if (
              worktreeSessionKeyRef.current !== sessionKey ||
              !owner.isCurrent()
            ) {
              return;
            }
            const listedSession = page.sessions.find(
              (session) => session.sessionId === sid,
            );
            setSessionStatusDisplayName(
              listedSession?.displayName ?? summary.displayName,
            );
          })
          .catch(() => undefined);
      })
      .catch(() => {
        if (worktreeSessionKeyRef.current === sessionKey && owner.isCurrent()) {
          setSessionWorktree(undefined);
          setSessionBranch(undefined);
          setSessionStatusDisplayName(undefined);
        }
      });
  }, [
    connection.catchingUp,
    connection.clientId,
    connection.loadingTranscript,
    connection.sessionId,
    connection.status,
    connection.workspaceCwd,
    logicalSessionKey,
    sessionOwnerGuard,
    workspace.client,
  ]);
  // Active workspace: the connected session's workspace, else the workspace
  // picked for the next session (locked / selected / primary). Computed once
  // and shared by the git-status effect and the Changes-dialog entry point so
  // the chip and the dialog always target the same repo.
  const activeWorkspaceCwd = useMemo(
    () =>
      connection.sessionId
        ? connection.workspaceCwd
        : (lockedWorkspaceCwd ??
          selectedWorkspaceCwd ??
          workspaces.find((entry) => entry.primary)?.cwd),
    [
      connection.sessionId,
      connection.workspaceCwd,
      lockedWorkspaceCwd,
      selectedWorkspaceCwd,
      workspaces,
    ],
  );
  // Worktree sessions query git status with the worktree path (?cwd=
  // parameter); the chip prefers the live branch from that status, falling
  // back to the creation-time sessionWorktree.branch.
  useEffect(() => {
    if (!activeWorkspaceCwd) {
      gitStatusWorkspaceCwdRef.current = undefined;
      setSelectedWorkspaceGitStatus(undefined);
      return;
    }
    const statusTarget = sessionWorktree?.path ?? activeWorkspaceCwd;
    if (gitStatusWorkspaceCwdRef.current !== statusTarget) {
      gitStatusWorkspaceCwdRef.current = statusTarget;
      setSelectedWorkspaceGitStatus(undefined);
    }
    let cancelled = false;
    const fetchStatus = () => {
      const git = workspace.client.workspaceByCwd(activeWorkspaceCwd);
      // Fast path: last-known cache (branch-only on a cold start) paints the
      // chip immediately.
      void git
        .workspaceGit({ cwd: sessionWorktree?.path })
        .then((status) => {
          if (!cancelled) {
            setSelectedWorkspaceGitStatus((current) =>
              isSameGitStatus(current, status) ? current : status,
            );
          }
        })
        .catch(() => {
          if (!cancelled) setSelectedWorkspaceGitStatus(undefined);
        });
      // Fresh path: resolves when the daemon's recomputation lands, so the
      // enriched counters fill in without depending on SSE — the
      // `git_status_changed` push only flows on a per-session event stream,
      // which doesn't exist before the first prompt (deferred connect).
      // Daemon-side in-flight dedup shares one `git status` computation
      // across both requests. Worktree `?cwd=` reads always compute
      // directly, so a second request would be a duplicate there.
      if (!sessionWorktree) {
        void git
          .workspaceGit({ wait: true })
          .then((status) => {
            if (!cancelled) {
              setSelectedWorkspaceGitStatus((current) =>
                isSameGitStatus(current, status) ? current : status,
              );
            }
          })
          .catch((err) => {
            console.warn('[web-shell] git status fresh path failed:', err);
          });
      }
    };
    fetchStatus();
    // Refresh triggers stay on focus and on a slow poll for the active
    // workspace only. A live branch change re-runs this effect via the
    // connection.gitBranch dependency. With an active session the daemon's
    // `git_status_changed` push (mirrored by the effect below) additionally
    // covers realtime updates between polls.
    const onFocus = () => fetchStatus();
    window.addEventListener('focus', onFocus);
    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchStatus();
    }, 30_000);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(poll);
    };
  }, [
    activeWorkspaceCwd,
    connection.gitBranch,
    workspace.client,
    sessionWorktree,
  ]);
  // Mirror the daemon's `git_status_changed` push (surfaced as
  // connection.gitStatus by the session provider) into the chip state so the
  // enriched counters fill in right after the branch-only first paint.
  // Worktree sessions bypass the daemon cache/SSE path — their status comes
  // from the ?cwd= fetch above.
  useEffect(() => {
    const status = connection.gitStatus;
    if (!status || sessionWorktree) return;
    if (status.workspaceCwd !== activeWorkspaceCwd) return;
    setSelectedWorkspaceGitStatus(status);
  }, [connection.gitStatus, activeWorkspaceCwd, sessionWorktree]);
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  const toastIdRef = useRef(0);
  const [toasts, setToasts] = useState([]);
  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const pushToast = useCallback((tone, message) => {
    if (onToastRef.current) {
      onToastRef.current(tone, message);
      return;
    }
    const toast = {
      id: `web-shell-toast-${Date.now()}-${++toastIdRef.current}`,
      tone,
      message,
      // Deadline instead of duration: the host remounts its items when the
      // elevated portal moves, and a fresh timer per remount would keep a
      // toast on screen indefinitely across repeated fullscreen toggles.
      dismissAt: Date.now() + TOAST_AUTO_DISMISS_MS,
    };
    setToasts((current) => {
      const withoutDuplicate = current.filter(
        (item) => item.tone !== tone || item.message !== message,
      );
      return [...withoutDuplicate, toast].slice(-MAX_TOASTS);
    });
  }, []);
  const messages = useMessagesFromBlocks(t, blocks);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [failedPrompt, setFailedPrompt] = useState(null);
  const failedPromptRef = useRef(failedPrompt);
  const [failedPromptRetry, setFailedPromptRetry] = useState(null);
  const cancelledRetryStatesRef = useRef(new Map());
  const cancelledRetryAttemptRef = useRef(0);
  const [cancelledRetryRevision, setCancelledRetryRevision] = useState(0);
  const [unknownPromptAdmission, setUnknownPromptAdmission] = useState(null);
  const unknownPromptAdmissionRef = useRef(null);
  const updateUnknownPromptAdmission = useCallback((next) => {
    unknownPromptAdmissionRef.current = next;
    setUnknownPromptAdmission(next);
  }, []);
  const updateFailedPrompt = useCallback((next) => {
    failedPromptRef.current = next;
    setFailedPrompt(next);
  }, []);
  const failedPromptOwnerRef = useRef({
    sessionId: connection.sessionId,
    workspaceCwd: connection.workspaceCwd,
    snapshot: sessionOwnerGuard.capture(),
  });
  useLayoutEffect(() => {
    const previousOwner = failedPromptOwnerRef.current;
    failedPromptOwnerRef.current = {
      sessionId: connection.sessionId,
      workspaceCwd: connection.workspaceCwd,
      snapshot: sessionOwnerGuard.capture(),
    };
    if (
      previousOwner.sessionId === connection.sessionId &&
      previousOwner.workspaceCwd === undefined &&
      connection.workspaceCwd !== undefined &&
      previousOwner.snapshot.isCurrent()
    ) {
      return;
    }
    updateFailedPrompt(null);
    setFailedPromptRetry(null);
    updateUnknownPromptAdmission(null);
  }, [
    connection.sessionId,
    connection.workspaceCwd,
    sessionOwnerGuard,
    updateFailedPrompt,
    updateUnknownPromptAdmission,
  ]);
  const [recapMessage, setRecapMessage] = useState(null);
  const [btwMessage, setBtwMessage] = useState(null);
  const nextRecapMessageIdRef = useRef(1);
  const nextBtwMessageIdRef = useRef(1);
  const btwAbortControllerRef = useRef(null);
  const chatPaneRef = useRef(null);
  const contextBodyRef = useRef(null);
  const [contextBodyWidth, setContextBodyWidth] = useState(null);
  const currentSessionIdRef = useRef(connection.sessionId);
  const lastNotifiedSessionIdRef = useRef(undefined);
  const lastNotifiedWorkspaceIdRef = useRef(undefined);
  const lastNotifiedWorkspaceCwdRef = useRef(undefined);
  const displayMessages = useMemo(() => {
    const localMessages = [recapMessage].filter((message) => message !== null);
    if (localMessages.length === 0) {
      return filterModelSwitchMessages(messages);
    }
    const result = [...messages];
    for (const localMessage of localMessages.sort(
      (a, b) => a.anchorIndex - b.anchorIndex,
    )) {
      const anchorIndex = localMessage.anchorAfterId
        ? result.findIndex(
            (message) => message.id === localMessage.anchorAfterId,
          )
        : -1;
      const index =
        anchorIndex >= 0
          ? anchorIndex + 1
          : Math.min(localMessage.anchorIndex, result.length);
      result.splice(index, 0, localMessage.message);
    }
    return filterModelSwitchMessages(result);
  }, [messages, recapMessage]);
  useEffect(() => {
    const failed = failedPromptRef.current;
    if (!failed) return;
    const currentFailedBlock = findUserMessageByIdentity(
      store.getSnapshot().blocks,
      failed.identity,
      failed.owner.snapshot.isCurrent(),
    );
    const failedBlock = findUserMessageByIdentity(
      blocks,
      failed.identity,
      failed.owner.snapshot.isCurrent(),
    );
    if (failed.sessionId !== connection.sessionId || !currentFailedBlock) {
      updateFailedPrompt(null);
      return;
    }
    if (!failedBlock) return;
    const failedIndex = displayMessages.findIndex(
      (message) => message.id === failedBlock.id,
    );
    if (failedIndex < 0) return;
    if (
      displayMessages
        .slice(failedIndex + 1)
        .some((message) => message.role === 'user')
    ) {
      updateFailedPrompt(null);
      return;
    }
    if (
      failed.messageId !== failedBlock.id ||
      failed.identity.block !== failedBlock
    ) {
      updateFailedPrompt({
        ...failed,
        messageId: failedBlock.id,
        identity: { block: failedBlock },
      });
    }
  }, [
    blocks,
    connection.sessionId,
    displayMessages,
    failedPrompt,
    store,
    updateFailedPrompt,
  ]);
  useEffect(() => {
    const unknown = unknownPromptAdmissionRef.current;
    if (unknown && unknown.sessionId !== connection.sessionId) {
      updateUnknownPromptAdmission(null);
    }
  }, [connection.sessionId, updateUnknownPromptAdmission]);
  const {
    artifacts,
    loading: artifactsLoading,
    error: artifactsError,
  } = useSessionArtifacts();
  const [artifactPanelExtraArtifacts, setArtifactPanelExtraArtifacts] =
    useState([]);
  const [paneArtifactSnapshots, setPaneArtifactSnapshots] = useState(
    () => new Map(),
  );
  const [artifactPanelTabs, setArtifactPanelTabs] = useState([]);
  const artifactPanelTabsRef = useRef(artifactPanelTabs);
  artifactPanelTabsRef.current = artifactPanelTabs;
  useEffect(() => {
    if (artifactPanelExtraArtifacts.length === 0 || artifacts.length === 0) {
      return;
    }
    const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
    // Extras referenced by open artifact tabs must survive the reconcile:
    // they keep those tabs renderable through transient gaps in the live
    // list, and stay inert while the live list (merged first) covers them.
    const openArtifactIds = new Set(
      artifactPanelTabs
        .filter((tab) => tab.kind === 'artifact')
        .map((tab) => (tab.kind === 'artifact' ? tab.artifactId : '')),
    );
    setArtifactPanelExtraArtifacts((previous) => {
      const next = previous.filter(
        (artifact) =>
          !artifactIds.has(artifact.id) || openArtifactIds.has(artifact.id),
      );
      return next.length === previous.length ? previous : next;
    });
  }, [artifacts, artifactPanelExtraArtifacts.length, artifactPanelTabs]);
  const paneArtifactExtras = useMemo(
    () =>
      Array.from(paneArtifactSnapshots.values()).flatMap((snapshot) => [
        ...snapshot.artifacts,
      ]),
    [paneArtifactSnapshots],
  );
  const artifactPanelArtifacts = useMemo(() => {
    if (
      artifactPanelExtraArtifacts.length === 0 &&
      paneArtifactExtras.length === 0
    ) {
      return artifacts;
    }
    const merged = [...artifacts];
    // Pane snapshots outrank open-time extras so a retained extra never
    // shadows a fresher pane report for the same artifact id.
    for (const artifact of [
      ...paneArtifactExtras,
      ...artifactPanelExtraArtifacts,
    ]) {
      const index = merged.findIndex((item) => item.id === artifact.id);
      if (index < 0) {
        merged.push(artifact);
      }
    }
    return merged;
  }, [artifacts, artifactPanelExtraArtifacts, paneArtifactExtras]);
  const handlePaneArtifactsChange = useCallback(
    (paneSessionId, paneArtifacts) => {
      if (paneArtifacts.length > 0) {
        const paneArtifactIds = new Set(
          paneArtifacts.map((artifact) => artifact.id),
        );
        // Keep extras whose artifact tab is still open: once the pane closes
        // and its snapshot is dropped, the extra is the tab's only copy.
        const openArtifactIds = new Set(
          artifactPanelTabsRef.current
            .filter((tab) => tab.kind === 'artifact')
            .map((tab) => (tab.kind === 'artifact' ? tab.artifactId : '')),
        );
        setArtifactPanelExtraArtifacts((current) => {
          const next = current.filter(
            (artifact) =>
              !paneArtifactIds.has(artifact.id) ||
              openArtifactIds.has(artifact.id),
          );
          return next.length === current.length ? current : next;
        });
      }
      setPaneArtifactSnapshots((current) => {
        const previous = current.get(paneSessionId);
        const unchanged =
          previous?.artifacts.length === paneArtifacts.length &&
          previous.artifacts.every((artifact, index) => {
            const nextArtifact = paneArtifacts[index];
            // `metadata` is deliberately not compared: artifact events carry
            // freshly parsed objects, so an identity check here would defeat
            // the guard without catching a realistic change.
            return (
              nextArtifact?.id === artifact.id &&
              nextArtifact.status === artifact.status &&
              nextArtifact.updatedAt === artifact.updatedAt &&
              nextArtifact.sizeBytes === artifact.sizeBytes &&
              nextArtifact.title === artifact.title &&
              nextArtifact.workspacePath === artifact.workspacePath
            );
          });
        if (unchanged) return current;
        const next = new Map(current);
        if (paneArtifacts.length === 0) {
          next.delete(paneSessionId);
        } else {
          next.set(paneSessionId, {
            artifacts: [...paneArtifacts],
          });
        }
        return next;
      });
    },
    [],
  );
  const artifactsByTurn = useMemo(
    () =>
      getArtifactsByTurn(
        displayMessages,
        artifacts,
        connection.workspaceCwd || '',
      ),
    [displayMessages, artifacts, connection.workspaceCwd],
  );
  const fileChangesByTurn = useMemo(
    () =>
      getFileChangesByTurn(
        displayMessages,
        artifactsByTurn,
        connection.workspaceCwd || '',
      ),
    [displayMessages, artifactsByTurn, connection.workspaceCwd],
  );
  const latestReviewChanges = useMemo(() => {
    let latest = [];
    for (const changes of fileChangesByTurn.values()) {
      if (changes.length > 0) latest = changes;
    }
    return latest;
  }, [fileChangesByTurn]);
  const scheduledTasksByTurn = useMemo(
    () => getScheduledTasksByTurn(displayMessages),
    [displayMessages],
  );
  const visibleTurnOutputKinds = useMemo(
    () => new Set(messageTurnOutputs ?? TURN_OUTPUT_KINDS),
    [messageTurnOutputs],
  );
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
  const [environmentPanelOpen, setEnvironmentPanelOpen] = useState(false);
  const preserveEnvironmentPanelOnArtifactOpenRef = useRef(false);
  useLayoutEffect(() => {
    preserveEnvironmentPanelOnArtifactOpenRef.current = false;
    setEnvironmentPanelOpen(false);
  }, [logicalSessionKey]);
  const artifactPanelOpenRef = useRef(artifactPanelOpen);
  artifactPanelOpenRef.current = artifactPanelOpen;
  const [activeArtifactPanelTabId, setActiveArtifactPanelTabId] =
    useState(null);
  const activeArtifactPanelTabIdRef = useRef(activeArtifactPanelTabId);
  activeArtifactPanelTabIdRef.current = activeArtifactPanelTabId;
  const [reviewChanges, setReviewChanges] = useState([]);
  const [selectedReviewPath, setSelectedReviewPath] = useState(null);
  const [artifactPanelWidth, setArtifactPanelWidth] = useState(
    DEFAULT_REVIEW_PANEL_WIDTH,
  );
  const [artifactPanelFullscreen, setArtifactPanelFullscreen] = useState(false);
  const artifactPanelFullscreenRef = useRef(false);
  artifactPanelFullscreenRef.current = artifactPanelFullscreen;
  // Exiting fullscreen swaps the same DOM node back to .artifactPanelDock,
  // whose open animation would re-play on the already-open panel; suppress it
  // until the dock remounts for a genuine open (panel close, or the floating
  // drawer handing back).
  const [
    suppressArtifactDockOpenAnimation,
    setSuppressArtifactDockOpenAnimation,
  ] = useState(false);
  const [waitForSubagentPanelAnimation, setWaitForSubagentPanelAnimation] =
    useState(false);
  // In-tree portal target for the docked panel (display:contents keeps the
  // portaled wrapper a direct flex item of .appShell). Held in state so the
  // portal container exists before the wrapper renders.
  const [artifactPanelSlotEl, setArtifactPanelSlotEl] = useState(null);
  const artifactPanelFullscreenSurfaceRef = useRef(null);
  const artifactPanelResizeCleanupRef = useRef(null);
  const artifactPanelSessionStateRef = useRef(null);
  const artifactPanelStateBySessionRef = useRef(new Map());
  const artifactPanelSessionIdRef = useRef(logicalSessionKey);
  artifactPanelSessionStateRef.current = {
    open: artifactPanelOpen,
    tabs: artifactPanelTabs,
    activeTabId: activeArtifactPanelTabId,
    reviewChanges,
    selectedReviewPath,
    extraArtifacts: artifactPanelExtraArtifacts,
    width: artifactPanelWidth,
  };
  useEffect(() => {
    const previousSessionId = artifactPanelSessionIdRef.current;
    if (previousSessionId) {
      const currentState = artifactPanelSessionStateRef.current;
      if (currentState) {
        artifactPanelStateBySessionRef.current.set(
          previousSessionId,
          currentState,
        );
        if (
          artifactPanelStateBySessionRef.current.size >
          MAX_ARTIFACT_PANEL_SESSION_STATES
        ) {
          const oldestSessionId = artifactPanelStateBySessionRef.current
            .keys()
            .next().value;
          if (oldestSessionId) {
            artifactPanelStateBySessionRef.current.delete(oldestSessionId);
          }
        }
      }
    }
    const nextSessionId = logicalSessionKey;
    artifactPanelSessionIdRef.current = nextSessionId;
    const savedState = nextSessionId
      ? artifactPanelStateBySessionRef.current.get(nextSessionId)
      : undefined;
    if (!savedState) {
      setArtifactPanelOpen(false);
      setArtifactPanelTabs([]);
      setActiveArtifactPanelTabId(null);
      setReviewChanges([]);
      setSelectedReviewPath(null);
      setArtifactPanelExtraArtifacts([]);
      setPaneArtifactSnapshots(new Map());
      setArtifactPanelWidth(DEFAULT_REVIEW_PANEL_WIDTH);
      setArtifactPanelFullscreen(false);
      return;
    }
    setArtifactPanelOpen(savedState.open);
    setArtifactPanelTabs(savedState.tabs);
    setActiveArtifactPanelTabId(savedState.activeTabId);
    setReviewChanges(savedState.reviewChanges);
    setSelectedReviewPath(savedState.selectedReviewPath);
    setArtifactPanelExtraArtifacts(savedState.extraArtifacts);
    setPaneArtifactSnapshots(new Map());
    setArtifactPanelWidth(savedState.width);
    setArtifactPanelFullscreen(false);
  }, [logicalSessionKey]);
  const sideTasksAvailable =
    Boolean(connection.sessionId && connection.workspaceCwd) &&
    connection.capabilities?.features.includes(SESSION_SIDE_TASK_FEATURE) ===
      true;
  const [sideTaskCatalog, setSideTaskCatalog] = useState({
    items: [],
    loaded: false,
  });
  useLayoutEffect(() => {
    setSideTaskCatalog({ items: [], loaded: false });
  }, [logicalSessionKey]);
  const optimisticSideTaskIdsRef = useRef(new Set());
  const visibleSideTasks =
    sideTaskCatalog.parentSessionId === connection.sessionId
      ? sideTaskCatalog.items
      : [];
  const sideTasksLoading =
    visibleSideTasks.length === 0 &&
    (sideTaskCatalog.parentSessionId !== connection.sessionId ||
      !sideTaskCatalog.loaded);
  const nextSideTaskTabIdRef = useRef(0);
  const createSideTask = useCallback(
    (initialPrompt) => {
      const parentSessionId = connection.sessionId;
      if (!parentSessionId || !sideTasksAvailable) return false;
      const tab = {
        id: `side-task:draft:${Date.now()}:${++nextSideTaskTabIdRef.current}`,
        kind: 'side_task',
        title: t('sideTask.title'),
        parentSessionId,
        workspaceCwd: connection.workspaceCwd,
        nameFromFirstPrompt: true,
        ...(initialPrompt?.trim()
          ? { initialPrompt: initialPrompt.trim() }
          : {}),
      };
      setArtifactPanelTabs((tabs) => [...tabs, tab]);
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelOpen(true);
      return true;
    },
    [connection.sessionId, connection.workspaceCwd, sideTasksAvailable, t],
  );
  const createEmptySideTask = useCallback(() => {
    if (createSideTask()) return;
    pushToast('error', t('sideTask.createFailed'));
  }, [createSideTask, pushToast, t]);
  const createSideTaskSession = useCallback(
    async (_tabId, parentSessionId, title) => {
      const ownerCwd = connection.workspaceCwd;
      const parentClientId =
        connection.sessionId === parentSessionId
          ? connection.clientId
          : undefined;
      const session = await workspace.client.createSideTaskSession(
        parentSessionId,
        {
          name: title,
        },
        parentClientId,
      );
      if (ownerCwd) {
        sessionCatalogController.sessionCreated(ownerCwd, session.sessionId);
      }
      await workspace.client
        .detachSession(session.sessionId, session.clientId)
        .catch(() => undefined);
      return {
        sessionId: session.sessionId,
        displayName: session.displayName,
      };
    },
    [
      connection.clientId,
      connection.sessionId,
      connection.workspaceCwd,
      sessionCatalogController,
      workspace.client,
    ],
  );
  const handleSideTaskCreated = useCallback((tabId, sessionId) => {
    let createdTab = artifactPanelTabsRef.current.find(
      (candidate) => candidate.id === tabId,
    );
    setArtifactPanelTabs((tabs) =>
      tabs.map((tab) =>
        tab.id === tabId && tab.kind === 'side_task'
          ? { ...tab, sessionId }
          : tab,
      ),
    );
    if (!createdTab) {
      // Creation can resolve after we navigate away from the parent session;
      // the draft tab then lives in a saved per-session bucket rather than the
      // live tabs, so write the sessionId there too or reopening the parent
      // creates a duplicate side task.
      for (const state of artifactPanelStateBySessionRef.current.values()) {
        const candidate = state.tabs.find(
          (bucketTab) => bucketTab.id === tabId,
        );
        if (!candidate) continue;
        createdTab = candidate;
        state.tabs = state.tabs.map((bucketTab) =>
          bucketTab.id === tabId && bucketTab.kind === 'side_task'
            ? { ...bucketTab, sessionId }
            : bucketTab,
        );
        break;
      }
    }
    const sideTaskTab =
      createdTab?.kind === 'side_task' ? createdTab : undefined;
    if (!sideTaskTab) return;
    optimisticSideTaskIdsRef.current.add(sessionId);
    setSideTaskCatalog((catalog) => {
      if (catalog.parentSessionId !== sideTaskTab.parentSessionId) {
        return catalog;
      }
      if (catalog.items.some((item) => item.sessionId === sessionId)) {
        return catalog;
      }
      return {
        ...catalog,
        items: [
          ...catalog.items,
          {
            sessionId,
            title: sideTaskTab.title,
            workspaceCwd: sideTaskTab.workspaceCwd,
            updatedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }, []);
  const handleSideTaskTitleChange = useCallback(
    (tabId, title, fromFirstPrompt = false) => {
      const sideTaskTab = artifactPanelTabsRef.current.find(
        (tab) => tab.id === tabId && tab.kind === 'side_task',
      );
      const sessionId =
        sideTaskTab?.kind === 'side_task' ? sideTaskTab.sessionId : undefined;
      setArtifactPanelTabs((tabs) =>
        tabs.map((tab) => {
          if (tab.id !== tabId || tab.kind !== 'side_task') return tab;
          if (!fromFirstPrompt && tab.title === title) return tab;
          return {
            ...tab,
            title,
            ...(fromFirstPrompt
              ? {
                  nameFromFirstPrompt: false,
                  initialPrompt: undefined,
                }
              : {}),
          };
        }),
      );
      if (sessionId) {
        setSideTaskCatalog((catalog) => ({
          ...catalog,
          items: catalog.items.map((item) =>
            item.sessionId === sessionId ? { ...item, title } : item,
          ),
        }));
      }
    },
    [],
  );
  const openSideTask = useCallback(
    (sideTask) => {
      const parentSessionId = connection.sessionId;
      if (!parentSessionId) return;
      const tab = {
        id: `side-task:${sideTask.sessionId}`,
        kind: 'side_task',
        title: sideTask.title,
        sessionId: sideTask.sessionId,
        parentSessionId,
        workspaceCwd: sideTask.workspaceCwd ?? connection.workspaceCwd,
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some(
          (item) =>
            item.kind === 'side_task' && item.sessionId === sideTask.sessionId,
        )
          ? tabs
          : [...tabs, tab],
      );
      const existingTab = artifactPanelTabsRef.current.find(
        (item) =>
          item.kind === 'side_task' && item.sessionId === sideTask.sessionId,
      );
      setActiveArtifactPanelTabId(existingTab?.id ?? tab.id);
      setArtifactPanelOpen(true);
    },
    [connection.sessionId, connection.workspaceCwd],
  );
  useEffect(() => {
    const parentSessionId = connection.sessionId;
    const workspaceCwd = connection.workspaceCwd;
    if (!sideTasksAvailable || !parentSessionId || !workspaceCwd) {
      setSideTaskCatalog({ items: [], loaded: false });
      return;
    }
    if (!artifactPanelOpen) return;
    setSideTaskCatalog((catalog) =>
      catalog.parentSessionId === parentSessionId
        ? { ...catalog, loaded: false }
        : { parentSessionId, items: [], loaded: false },
    );
    let cancelled = false;
    void loadSessionCatalogOnce(
      workspace.client,
      {
        routeKind: 'legacy',
        workspaceCwd,
        options: {
          pageSize: SESSION_LIST_PAGE_SIZE,
          archiveState: 'active',
          sourceType: WEB_SHELL_SIDE_TASK_SOURCE_TYPE,
          sourceId: parentSessionId,
        },
      },
      { fresh: true },
    )
      .then((page) => {
        if (cancelled) return;
        const listedItems = page.sessions.map((session) => ({
          sessionId: session.sessionId,
          title:
            session.displayName?.trim() ||
            `${t('sideTask.title')} ${session.sessionId.slice(0, 8)}`,
          workspaceCwd: session.workspaceCwd || workspaceCwd,
          updatedAt: session.updatedAt || session.createdAt,
        }));
        for (const item of listedItems) {
          optimisticSideTaskIdsRef.current.delete(item.sessionId);
        }
        setSideTaskCatalog((catalog) =>
          mergeSideTaskCatalog(
            catalog,
            parentSessionId,
            listedItems,
            optimisticSideTaskIdsRef.current,
          ),
        );
      })
      .catch(() => {
        if (cancelled) return;
        setSideTaskCatalog((catalog) =>
          catalog.parentSessionId === parentSessionId
            ? { ...catalog, loaded: true }
            : catalog,
        );
      });
    return () => {
      cancelled = true;
    };
  }, [
    connection.sessionId,
    connection.workspaceCwd,
    artifactPanelOpen,
    sideTasksAvailable,
    t,
    workspace.client,
  ]);
  const getMaxArtifactPanelWidth = useCallback(() => {
    const chatPaneWidth = chatPaneRef.current?.getBoundingClientRect().width;
    if (!chatPaneWidth) {
      return Math.max(
        MIN_ARTIFACT_PANEL_WIDTH,
        window.innerWidth - MIN_CHAT_PANE_WIDTH_WITH_ARTIFACT_PANEL,
      );
    }
    return Math.max(
      MIN_ARTIFACT_PANEL_WIDTH,
      artifactPanelWidth +
        chatPaneWidth -
        MIN_CHAT_PANE_WIDTH_WITH_ARTIFACT_PANEL,
    );
  }, [artifactPanelWidth]);
  const getDefaultReviewPanelWidth = useCallback(() => {
    const chatPaneWidth =
      chatPaneRef.current?.getBoundingClientRect().width ?? window.innerWidth;
    const maxWidth = Math.max(
      MIN_ARTIFACT_PANEL_WIDTH,
      chatPaneWidth - MIN_CHAT_PANE_WIDTH_WITH_ARTIFACT_PANEL,
    );
    return Math.min(
      maxWidth,
      Math.max(DEFAULT_REVIEW_PANEL_WIDTH, Math.round(chatPaneWidth * 0.56)),
    );
  }, []);
  const openArtifactPanel = useCallback(
    (artifactId, previewContent) => {
      if (!artifactId) return;
      const artifact = artifactPanelArtifacts.find(
        (item) => item.id === artifactId,
      );
      const tab = {
        id: `artifact:${artifactId}`,
        kind: 'artifact',
        artifactId,
        title: artifact?.title ?? 'Artifact',
        ...(connection.workspaceCwd
          ? { workspaceCwd: connection.workspaceCwd }
          : {}),
        ...(artifactWorkspaceTarget?.workspaceId
          ? { workspaceId: artifactWorkspaceTarget.workspaceId }
          : {}),
        ...(previewContent !== undefined ? { previewContent } : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) =>
              item.id === tab.id ? { ...item, ...tab } : item,
            )
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [
      artifactPanelArtifacts,
      artifactWorkspaceTarget?.workspaceId,
      connection.workspaceCwd,
      getDefaultReviewPanelWidth,
    ],
  );
  const openReviewPanel = useCallback(
    (
      changes,
      selectedPath,
      reviewWorkspaceCwd,
      reviewWorkspaceId,
      tabId = 'review',
    ) => {
      const reviewTab = {
        id: tabId,
        kind: 'review',
        title: t('turnOutputs.review'),
        changes,
        ...(selectedPath ? { selectedPath } : {}),
        ...(reviewWorkspaceCwd ? { workspaceCwd: reviewWorkspaceCwd } : {}),
        ...(reviewWorkspaceId ? { workspaceId: reviewWorkspaceId } : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === reviewTab.id)
          ? tabs.map((item) => (item.id === reviewTab.id ? reviewTab : item))
          : [reviewTab, ...tabs],
      );
      setActiveArtifactPanelTabId(reviewTab.id);
      setReviewChanges(changes);
      setSelectedReviewPath(selectedPath ?? null);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [getDefaultReviewPanelWidth, t],
  );
  const openLatestReviewPanel = useCallback(() => {
    if (latestReviewChanges.length === 0) return;
    openReviewPanel(
      latestReviewChanges,
      undefined,
      connection.workspaceCwd,
      artifactWorkspaceTarget?.workspaceId,
    );
  }, [
    artifactWorkspaceTarget?.workspaceId,
    connection.workspaceCwd,
    latestReviewChanges,
    openReviewPanel,
  ]);
  const openScheduledTaskPanel = useCallback(
    (task, tabWorkspaceCwd, tabWorkspaceId, sourceSessionId) => {
      const tab = {
        id: sourceSessionId
          ? `scheduled-task:${sourceSessionId}:${task.toolCallId}`
          : `scheduled-task:${task.toolCallId}`,
        kind: 'scheduled_task',
        title: t('scheduledTasks.title'),
        task: tabWorkspaceId ? { ...task, workspaceId: tabWorkspaceId } : task,
        ...(tabWorkspaceCwd ? { workspaceCwd: tabWorkspaceCwd } : {}),
        ...(tabWorkspaceId ? { workspaceId: tabWorkspaceId } : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) => (item.id === tab.id ? tab : item))
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [getDefaultReviewPanelWidth, t],
  );
  const openMonitorPanel = useCallback(
    (task, sourceSessionId, sourceSessionActions) => {
      const tab = {
        id: sourceSessionId
          ? `monitor:${sourceSessionId}:${task.id}`
          : `monitor:${task.id}`,
        kind: 'monitor',
        title: task.description,
        task,
        ...(sourceSessionId ? { sessionId: sourceSessionId } : {}),
        ...(sourceSessionActions
          ? { sessionActions: sourceSessionActions }
          : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) => {
              if (item.id !== tab.id || item.kind !== 'monitor') return item;
              const mergedTask = mergeMonitorTaskSnapshot(item.task, task);
              return {
                ...tab,
                title: mergedTask.description,
                task: mergedTask,
              };
            })
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [getDefaultReviewPanelWidth],
  );
  const openImagePanel = useCallback(
    (src, alt) => {
      const tab = {
        id: imageTabId(src),
        kind: 'image',
        title: t('turnOutputs.imagePreview'),
        src,
        ...(alt ? { alt } : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) => (item.id === tab.id ? tab : item))
          : [tab, ...tabs],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [getDefaultReviewPanelWidth, t],
  );
  const openShellPanel = useCallback(
    (task, sourceSessionId, sourceSessionActions) => {
      const tab = {
        id: sourceSessionId
          ? `shell:${sourceSessionId}:${task.id}`
          : `shell:${task.id}`,
        kind: 'shell',
        title: task.command,
        task,
        ...(sourceSessionId ? { sessionId: sourceSessionId } : {}),
        ...(sourceSessionActions
          ? { sessionActions: sourceSessionActions }
          : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) => {
              if (item.id !== tab.id || item.kind !== 'shell') return item;
              const mergedTask = mergeShellTaskSnapshot(item.task, task);
              return {
                ...tab,
                title: mergedTask.command,
                task: mergedTask,
              };
            })
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [getDefaultReviewPanelWidth],
  );
  const openSubagentPanelForSession = useCallback(
    (tool, sessionId, workspaceCwd) => {
      if (!artifactPanelOpenRef.current) {
        setWaitForSubagentPanelAnimation(true);
      }
      const rawOutput =
        tool.rawOutput && typeof tool.rawOutput === 'object'
          ? tool.rawOutput
          : undefined;
      const subagentType =
        (typeof tool.args?.subagent_type === 'string'
          ? tool.args.subagent_type
          : undefined) ??
        (typeof rawOutput?.['subagentName'] === 'string'
          ? rawOutput['subagentName']
          : undefined);
      const tab = {
        id: `subagent:${sessionId}:${tool.callId}`,
        kind: 'subagent',
        title: tool.title || subagentType || t('agent.label'),
        sessionId,
        rootToolCallId: tool.callId,
        rootTool: tool,
        ...(workspaceCwd ? { workspaceCwd } : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) => (item.id === tab.id ? tab : item))
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [getDefaultReviewPanelWidth, t],
  );
  const openSubagentPanel = useCallback(
    (tool) => {
      if (!connection.sessionId) return;
      openSubagentPanelForSession(
        tool,
        connection.sessionId,
        connection.workspaceCwd,
      );
    },
    [
      connection.sessionId,
      connection.workspaceCwd,
      openSubagentPanelForSession,
    ],
  );
  const openEnvironmentAgent = useCallback(
    (task) => {
      if (!connection.sessionId) return;
      if (!artifactPanelOpenRef.current) {
        preserveEnvironmentPanelOnArtifactOpenRef.current = true;
      }
      const tool = task.toolUseId
        ? findToolCall(messages, task.toolUseId)
        : undefined;
      openSubagentPanelForSession(
        tool ?? agentTaskAsToolCall(task),
        connection.sessionId,
        connection.workspaceCwd,
      );
    },
    [
      connection.sessionId,
      connection.workspaceCwd,
      messages,
      openSubagentPanelForSession,
    ],
  );
  const handleTurnOutputOpen = useCallback(
    (request) => {
      if (onRightPanelOpen) {
        onRightPanelOpen(request);
        return;
      }
      if (request.kind === 'review') {
        openReviewPanel(
          request.changes,
          request.selectedPath,
          request.workspaceCwd,
          request.workspaceId,
          request.sourceSessionId
            ? `review:${request.sourceSessionId}:${request.turnId}`
            : undefined,
        );
        return;
      }
      if (request.kind === 'scheduled_task') {
        openScheduledTaskPanel(
          request.task,
          request.workspaceCwd,
          request.workspaceId,
          request.sourceSessionId,
        );
        return;
      }
      if (request.kind === 'image') {
        openImagePanel(request.src, request.alt);
        return;
      }
      if (request.kind === 'subagent') {
        openSubagentPanelForSession(
          request.tool,
          request.sessionId,
          request.workspaceCwd,
        );
        return;
      }
      // Cache the opened row so the tab keeps rendering through transient
      // gaps in the live artifact lists (an SSE reconnect, or the source
      // pane closing); the snapshot/live-list reconciles drop the copy once
      // a fresher source covers the artifact again.
      setArtifactPanelExtraArtifacts((current) => {
        const index = current.findIndex(
          (artifact) => artifact.id === request.artifact.id,
        );
        if (index < 0) return [...current, request.artifact];
        const next = [...current];
        next[index] = request.artifact;
        return next;
      });
      const tab = {
        id: request.sourceSessionId
          ? `${request.sourceSessionId}:${request.id}`
          : request.id,
        kind: 'artifact',
        title: request.title,
        artifactId: request.artifactId,
        ...(request.workspaceCwd ? { workspaceCwd: request.workspaceCwd } : {}),
        ...(request.workspaceId ? { workspaceId: request.workspaceId } : {}),
        ...(request.sourceSessionId
          ? { sourceSessionId: request.sourceSessionId }
          : {}),
        ...(request.previewContent !== undefined
          ? { previewContent: request.previewContent }
          : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) =>
              item.id === tab.id ? { ...item, ...tab } : item,
            )
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
      setArtifactPanelWidth((width) =>
        artifactPanelOpenRef.current ? width : getDefaultReviewPanelWidth(),
      );
      setArtifactPanelOpen(true);
    },
    [
      getDefaultReviewPanelWidth,
      onRightPanelOpen,
      openReviewPanel,
      openScheduledTaskPanel,
      openImagePanel,
      openSubagentPanelForSession,
    ],
  );
  const openFilePreview = useCallback(
    (change, previewWorkspaceCwd, previewWorkspaceId) => {
      const previewContent = getFileChangePreviewContent(change);
      const tab = {
        id: `file:${previewWorkspaceCwd ?? ''}:${change.path}`,
        kind: 'file',
        title: displayPath(change.path, previewWorkspaceCwd),
        workspacePath: change.path,
        ...(previewWorkspaceCwd ? { workspaceCwd: previewWorkspaceCwd } : {}),
        ...(previewWorkspaceId ? { workspaceId: previewWorkspaceId } : {}),
        ...(previewContent !== undefined ? { previewContent } : {}),
      };
      setArtifactPanelTabs((tabs) =>
        tabs.some((item) => item.id === tab.id)
          ? tabs.map((item) => (item.id === tab.id ? tab : item))
          : [...tabs, tab],
      );
      setActiveArtifactPanelTabId(tab.id);
    },
    [],
  );
  const closeArtifactPanel = useCallback(() => {
    setArtifactPanelOpen(false);
    // Reset fullscreen in the same commit: while it stays true the covered
    // shells keep display:none, and deferring the reset to the management
    // effect would paint one frame of an empty shell after the close.
    setArtifactPanelFullscreen(false);
    setSuppressArtifactDockOpenAnimation(false);
    setSideTaskCatalog((catalog) =>
      catalog.items.length === 0 ? { ...catalog, loaded: false } : catalog,
    );
  }, []);
  useLayoutEffect(() => {
    // Fullscreen hides the chat pane (display:none); measuring it there
    // reports 0 and would clamp the panel down to its minimum width.
    if (!artifactPanelOpen || artifactPanelFullscreen) return;
    const clampWidth = () => {
      setArtifactPanelWidth((width) => {
        const chatPaneWidth =
          chatPaneRef.current?.getBoundingClientRect().width ??
          window.innerWidth - width;
        const maxWidth = Math.max(
          MIN_ARTIFACT_PANEL_WIDTH,
          width + chatPaneWidth - MIN_CHAT_PANE_WIDTH_WITH_ARTIFACT_PANEL,
        );
        return Math.min(width, maxWidth);
      });
    };
    clampWidth();
    window.addEventListener('resize', clampWidth);
    const chatPane = chatPaneRef.current;
    const observer = new ResizeObserver(clampWidth);
    if (chatPane) observer.observe(chatPane);
    return () => {
      window.removeEventListener('resize', clampWidth);
      observer.disconnect();
    };
  }, [artifactPanelOpen, artifactPanelFullscreen]);
  const closeArtifactPanelTab = useCallback((tabId) => {
    setArtifactPanelTabs((tabs) => {
      const nextTabs = tabs.filter((tab) => tab.id !== tabId);
      if (nextTabs.length === 0) {
        setArtifactPanelOpen(false);
        setArtifactPanelFullscreen(false);
        setSuppressArtifactDockOpenAnimation(false);
        setActiveArtifactPanelTabId(null);
        setReviewChanges([]);
        setSelectedReviewPath(null);
        setArtifactPanelExtraArtifacts([]);
        setPaneArtifactSnapshots(new Map());
        return nextTabs;
      }
      if (activeArtifactPanelTabIdRef.current === tabId) {
        const closedIndex = tabs.findIndex((tab) => tab.id === tabId);
        const nextActive =
          nextTabs[Math.min(closedIndex, nextTabs.length - 1)] ?? nextTabs[0];
        setActiveArtifactPanelTabId(nextActive.id);
      }
      return nextTabs;
    });
  }, []);
  const handleArtifactPanelResizeStart = useCallback(
    (event) => {
      event.preventDefault();
      const resizeHandle = event.currentTarget;
      resizeHandle.setPointerCapture(event.pointerId);
      const startX = event.clientX;
      const startWidth = artifactPanelWidth;
      const maxWidth = getMaxArtifactPanelWidth();
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      let pendingWidth = startWidth;
      let animationFrame = null;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const flushWidth = () => {
        animationFrame = null;
        setArtifactPanelWidth(pendingWidth);
      };
      const handlePointerMove = (moveEvent) => {
        pendingWidth = Math.min(
          maxWidth,
          Math.max(
            MIN_ARTIFACT_PANEL_WIDTH,
            startWidth - (moveEvent.clientX - startX),
          ),
        );
        if (animationFrame === null) {
          animationFrame = window.requestAnimationFrame(flushWidth);
        }
      };
      let handlePointerUp = () => {};
      const cleanupResize = (commitWidth) => {
        artifactPanelResizeCleanupRef.current = null;
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        if (commitWidth) setArtifactPanelWidth(pendingWidth);
        if (resizeHandle.hasPointerCapture(event.pointerId)) {
          resizeHandle.releasePointerCapture(event.pointerId);
        }
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };
      handlePointerUp = () => cleanupResize(true);
      artifactPanelResizeCleanupRef.current = () => cleanupResize(false);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    },
    [artifactPanelWidth, getMaxArtifactPanelWidth],
  );
  useEffect(() => () => artifactPanelResizeCleanupRef.current?.(), []);
  const rawPendingApproval = useMemo(
    () => extractPendingPermission(blocks),
    [blocks],
  );
  const pendingApproval = useShallowMemo(rawPendingApproval);
  const canActOnPendingApproval = !(
    connection.catchingUp && sidebarSwitchingSessionId !== null
  );
  const pendingAskUserApproval = isAskUserPermission(pendingApproval)
    ? canActOnPendingApproval
      ? pendingApproval
      : null
    : null;
  const pendingToolApproval =
    pendingApproval && !isAskUserPermission(pendingApproval)
      ? canActOnPendingApproval
        ? pendingApproval
        : null
      : null;
  const pendingApprovalRef = useRef(pendingApproval);
  pendingApprovalRef.current = canActOnPendingApproval ? pendingApproval : null;
  // True exactly when an actionable approval overlay (ToolApproval or
  // AskUserQuestion) is on screen. Single source of truth for the three places
  // that must treat the composer as dormant while an approval owns the keyboard:
  // the panel auto-close, the panel focus-restore guard, and the ChatEditor
  // dialogOpen prop.
  const approvalOverlayActive =
    pendingToolApproval !== null || pendingAskUserApproval !== null;
  const approvalOverlayActiveRef = useRef(approvalOverlayActive);
  approvalOverlayActiveRef.current =
    approvalOverlayActive ||
    (canActOnPendingApproval && extractPendingPermission(blocks) !== null);
  const floatingTodosState = useMemo(
    () => getFloatingTodos(messages),
    [messages],
  );
  const approvalPlanTodos = useMemo(
    () =>
      isExitPlanApprovalRequest(pendingToolApproval)
        ? getActiveTodosForPlanRevision(messages, pendingToolApproval?.todoPlan)
        : [],
    [messages, pendingToolApproval],
  );
  // Keep the timeline Map referentially stable across streaming ticks that
  // don't touch any todo snapshot. The Map is a context value, so a fresh
  // reference would re-render every todo/plan row regardless of memoization;
  // only rebuild when the todo snapshots themselves change.
  const todoTimelineRef = useRef(null);
  const todoTimeline = useMemo(() => {
    const signature = todoTimelineSignature(messages);
    const cached = todoTimelineRef.current;
    if (cached && cached.signature === signature) return cached.timeline;
    const timeline = computeTodoTimeline(messages);
    todoTimelineRef.current = { signature, timeline };
    return timeline;
  }, [messages]);
  // Per-todo detail (start/end + token/API/tool spend) is derived entirely from
  // the transcript: the agent stamps a cumulative-usage snapshot on each todo
  // update and the web-shell diffs consecutive snapshots, so this works live and
  // on resume with no polling. Kept referentially stable like the timeline
  // above (rebuilt only when a relevant snapshot, timestamp, stat, or tool span
  // changes) so an unrelated streaming tick doesn't re-render every expanded
  // todo row that consumes TodoDetailContext.
  const todoDetailRef = useRef(null);
  const todoDetails = useMemo(() => {
    const signature = todoDetailSignature(messages);
    const cached = todoDetailRef.current;
    if (cached && cached.signature === signature) return cached.details;
    const details = computeTodoDetails(messages);
    todoDetailRef.current = { signature, details };
    return details;
  }, [messages]);
  const floatingTodos = useStableArray(floatingTodosState.todos, (todo) =>
    JSON.stringify([todo.id, todo.status, todo.content, todo.blockedBy ?? []]),
  );
  const floatingTodosAllCompleted = floatingTodosState.allCompleted;
  const [todoPanelMode, setTodoPanelMode] = useState('hidden');
  const nextTodoPanelMode =
    connection.catchingUp ||
    floatingTodos.length === 0 ||
    floatingTodosAllCompleted
      ? 'hidden'
      : 'active';
  if (nextTodoPanelMode !== todoPanelMode) {
    setTodoPanelMode(nextTodoPanelMode);
  }
  const showFloatingTodos = nextTodoPanelMode !== 'hidden';
  const floatingBottomStatusItems =
    bottomStatusItems ?? EMPTY_BOTTOM_STATUS_ITEMS;
  const showBottomPanels =
    showFloatingTodos || floatingBottomStatusItems.length > 0;
  const footerRef = useRef(null);
  const appRootRef = useRef(null);
  const [portalRoot, setPortalRoot] = useState(null);
  const portalRootVariableNamesRef = useRef(new Set());
  const bottomPanelsRef = useRef(null);
  const [bottomPanelInset, setBottomPanelInset] = useState(0);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(0);
  useLayoutEffect(() => {
    if (!showBottomPanels) {
      setBottomPanelInset(0);
      setBottomPanelHeight(0);
      return;
    }
    const node = bottomPanelsRef.current;
    if (!node) {
      setBottomPanelInset(BOTTOM_PANEL_FALLBACK_INSET_PX);
      setBottomPanelHeight(0);
      return;
    }
    const updateInset = () => {
      const footer = footerRef.current;
      const panelRect = node.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();
      const panelHeight = Math.ceil(panelRect.height);
      const overlapAboveFooter = footerRect
        ? Math.max(0, footerRect.top - panelRect.top)
        : panelHeight + BOTTOM_PANEL_GAP_PX;
      setBottomPanelHeight(panelHeight);
      setBottomPanelInset(
        Math.max(BOTTOM_PANEL_FALLBACK_INSET_PX, Math.ceil(overlapAboveFooter)),
      );
    };
    updateInset();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateInset);
    observer.observe(node);
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, [showBottomPanels]);
  const contentStyle = useMemo(
    () => ({
      '--web-shell-bottom-panel-inset': `${bottomPanelInset}px`,
      '--web-shell-bottom-panel-height': `${bottomPanelHeight}px`,
      '--web-shell-bottom-panel-gap': `${BOTTOM_PANEL_GAP_PX}px`,
    }),
    [bottomPanelHeight, bottomPanelInset],
  );
  const taskActivityKey = useMemo(
    () => getTaskActivityKey(messages),
    [messages],
  );
  const [backgroundTasksRefreshTrigger, setBackgroundTasksRefreshTrigger] =
    useState(0);
  const sessionTasks = useBackgroundTasks(
    connection.sessionId,
    taskActivityKey,
    connection.status === 'connected',
    backgroundTasksRefreshTrigger,
  );
  const environmentAgentTasks = useMemo(
    () => getEnvironmentAgentTasks(messages, sessionTasks),
    [messages, sessionTasks],
  );
  const backgroundTasks = useMemo(
    () => sessionTasks.filter((task) => task.kind !== 'agent'),
    [sessionTasks],
  );
  const monitorDetailsSessionIdRef = useRef(connection.sessionId);
  monitorDetailsSessionIdRef.current = connection.sessionId;
  const openMonitorPanelFromTool = useCallback(
    async (tool) => {
      const sessionId = monitorDetailsSessionIdRef.current;
      if (!sessionId) return false;
      const owner = sessionOwnerGuard.capture();
      try {
        const snapshot = await sessionActions.getTasks();
        if (
          !owner.isCurrent() ||
          monitorDetailsSessionIdRef.current !== sessionId ||
          snapshot.sessionId !== sessionId
        ) {
          return false;
        }
        const task = findMonitorTaskForTool(snapshot.tasks, tool);
        if (!task) return false;
        setBackgroundTasksRefreshTrigger((value) => value + 1);
        openMonitorPanel(task);
        return true;
      } catch {
        return false;
      }
    },
    [openMonitorPanel, sessionActions, sessionOwnerGuard],
  );
  useEffect(() => {
    const monitors = new Map(
      backgroundTasks
        .filter((task) => task.kind === 'monitor')
        .map((task) => [task.id, task]),
    );
    if (monitors.size === 0) return;
    setArtifactPanelTabs((tabs) => {
      let changed = false;
      const next = tabs.map((tab) => {
        if (
          tab.kind !== 'monitor' ||
          (tab.sessionId && tab.sessionId !== connection.sessionId)
        ) {
          return tab;
        }
        const task = monitors.get(tab.task.id);
        if (!task || task === tab.task) return tab;
        const mergedTask = mergeMonitorTaskSnapshot(tab.task, task);
        if (mergedTask === tab.task) return tab;
        changed = true;
        return {
          ...tab,
          title: mergedTask.description,
          task: mergedTask,
        };
      });
      return changed ? next : tabs;
    });
  }, [backgroundTasks, connection.sessionId]);
  useEffect(() => {
    const shellTasks = new Map(
      backgroundTasks
        .filter((task) => task.kind === 'shell')
        .map((task) => [task.id, task]),
    );
    if (shellTasks.size === 0) return;
    setArtifactPanelTabs((tabs) => {
      let changed = false;
      const next = tabs.map((tab) => {
        if (
          tab.kind !== 'shell' ||
          (tab.sessionId && tab.sessionId !== connection.sessionId)
        ) {
          return tab;
        }
        const task = shellTasks.get(tab.task.id);
        if (!task || task === tab.task) return tab;
        const mergedTask = mergeShellTaskSnapshot(tab.task, task);
        if (mergedTask === tab.task) return tab;
        changed = true;
        return {
          ...tab,
          title: mergedTask.command,
          task: mergedTask,
        };
      });
      return changed ? next : tabs;
    });
  }, [backgroundTasks, connection.sessionId]);
  const footerTasks = useMemo(
    () => (renderFooter ? backgroundTasks.map(mapToWebShellTaskInfo) : []),
    [backgroundTasks, renderFooter],
  );
  const statusBarRef = useRef(null);
  const messageListRef = useRef(null);
  const editorRef = useRef(null);
  const notifiedComposerReadyRef = useRef(null);
  const [canScrollMessageListToBottom, setCanScrollMessageListToBottom] =
    useState(false);
  const previousFooterRectRef = useRef(null);
  const previousEmptyStateRef = useRef(false);
  const resumeChatBottomFollow = useCallback((behavior = 'smooth') => {
    requestAnimationFrame(() => {
      messageListRef.current?.scrollToBottom(behavior);
      requestAnimationFrame(() => {
        messageListRef.current?.scrollToBottom(behavior);
      });
    });
  }, []);
  const setEditorHandle = useCallback(
    (handle) => {
      editorRef.current = handle;
      assignComposerRef(composerRef, handle ?? emptyComposerApi);
      if (handle && notifiedComposerReadyRef.current !== handle) {
        notifiedComposerReadyRef.current = handle;
        onComposerReady?.(handle);
      }
    },
    [composerRef, onComposerReady],
  );
  useEffect(() => {
    assignComposerRef(composerRef, editorRef.current ?? emptyComposerApi);
  }, [composerRef]);
  const [activeGoal, setActiveGoal] = useState(null);
  useLayoutEffect(() => setActiveGoal(null), [logicalSessionKey]);
  const [isCreatingMissingSession, setIsCreatingMissingSession] =
    useState(false);
  const creatingMissingSessionRef = useRef(false);
  const activeGoalRef = useRef(null);
  activeGoalRef.current = activeGoal;
  const {
    followupState,
    onAcceptFollowup,
    onDismissFollowup,
    clear: clearFollowup,
  } = useDaemonFollowupSuggestion({
    onAccept: (suggestion) => {
      editorRef.current?.insertText(suggestion);
    },
  });
  const composerTextRef = useRef('');
  const [hasComposerAttachments, setHasComposerAttachments] = useState(null);
  const [isStartingNewSessionSuggestion, setIsStartingNewSessionSuggestion] =
    useState(false);
  const streamingState = useStreamingState();
  const failedPromptRetryIsCurrent = Boolean(
    failedPromptRetry &&
      retryOwnerMatchesCurrent(
        failedPromptRetry.owner,
        connection.sessionId,
        connection.workspaceCwd,
        composerSourceVersionRef.current,
      ) &&
      retryTranscriptIdentityMatches(
        blocks,
        failedPromptRetry.transcriptIdentity,
      ),
  );
  useEffect(() => {
    if (
      failedPromptRetry &&
      (!failedPromptRetryIsCurrent ||
        (streamingState === 'idle' && failedPromptRetry.settled))
    ) {
      setFailedPromptRetry(null);
    }
  }, [failedPromptRetry, failedPromptRetryIsCurrent, streamingState]);
  const suppressFailedPromptRetryStreaming = Boolean(
    failedPromptRetry &&
      failedPromptRetryIsCurrent &&
      (!failedPromptRetry.admitted || failedPromptRetry.settled),
  );
  const streamingStateRef = useRef(streamingState);
  // Cleared in three places: the session-switch effect, the drain loop, and
  // handleCancel. Bumping drainGenerationRef at each clear site also cancels
  // any in-flight inline ! command whose ensureSessionForPrompt is resolving.
  // The session-switch effect exempts the lazy-creation transition (into
  // preparingSessionIdRef.current) so a submit's own session creation does
  // not cancel the command.
  const queuedShellCommandsRef = useRef([]);
  const drainGenerationRef = useRef(0);
  const shellSubmitInFlightRef = useRef(false);
  const isDrainingRef = useRef(false);
  const localStreamingStartedAtRef = useRef(Date.now());
  const previousStreamingStateRef = useRef(streamingState);
  if (
    previousStreamingStateRef.current === 'idle' &&
    streamingState !== 'idle'
  ) {
    localStreamingStartedAtRef.current = Date.now();
  }
  previousStreamingStateRef.current = streamingState;
  const activeTurnStartedAt = useMemo(() => {
    if (streamingState === 'idle') return undefined;
    for (let i = displayMessages.length - 1; i >= 0; i--) {
      const message = displayMessages[i];
      if (message?.role === 'user') {
        return message.timestamp ?? localStreamingStartedAtRef.current;
      }
    }
    return localStreamingStartedAtRef.current;
  }, [displayMessages, streamingState]);
  const lastSubmittedPromptRef = useRef('');
  const lastSubmittedImagesRef = useRef(undefined);
  const lastSubmittedInputAnnotationsRef = useRef(undefined);
  const lastSubmittedSourceVersionRef = useRef(
    composerSourceVersionRef.current,
  );
  const retryableTurnErrorIdRef = useRef(null);
  const retryableTurnErrorIdentityRef = useRef(undefined);
  const retriedTurnErrorIdRef = useRef(null);
  const failedTurnErrorRetryRef = useRef(null);
  const [showRetryHint, setShowRetryHint] = useState(false);
  const showRetryHintRef = useRef(showRetryHint);
  showRetryHintRef.current = showRetryHint;
  const rearmFailedTurnErrorRetry = useCallback(
    (retryableTurnError, currentBlocks) => {
      const failedRetry = failedTurnErrorRetryRef.current;
      if (!failedRetry || retryableTurnError.id === failedRetry.errorId) {
        return;
      }
      if (
        !retryOwnerMatchesCurrent(
          failedRetry.owner,
          connectionRef.current.sessionId,
          connectionRef.current.workspaceCwd,
          composerSourceVersionRef.current,
        )
      ) {
        failedTurnErrorRetryRef.current = null;
        return;
      }
      if (
        !currentBlocks.some(
          (block) =>
            block.kind === 'error' &&
            block.source === 'turn_error' &&
            block.id === failedRetry.errorId,
        )
      ) {
        failedTurnErrorRetryRef.current = null;
        return;
      }
      lastSubmittedPromptRef.current = failedRetry.text;
      lastSubmittedImagesRef.current = failedRetry.images;
      lastSubmittedInputAnnotationsRef.current = failedRetry.inputAnnotations;
      lastSubmittedSourceVersionRef.current = composerSourceVersionRef.current;
      retryableTurnErrorIdRef.current = retryableTurnError.id;
      retryableTurnErrorIdentityRef.current = { block: retryableTurnError };
      retriedTurnErrorIdRef.current = null;
      failedTurnErrorRetryRef.current = null;
      setShowRetryHint(true);
    },
    [],
  );
  const retryOwnerRef = useRef({
    sessionId: connection.sessionId,
    workspaceCwd: connection.workspaceCwd,
    sessionKey: logicalSessionKey,
    sourceVersion: composerSourceVersionRef.current,
    snapshot: sessionOwnerGuard.capture(),
  });
  useLayoutEffect(() => {
    const previousOwner = retryOwnerRef.current;
    const currentSnapshot = sessionOwnerGuard.capture();
    const workspaceBecameKnown =
      previousOwner.sessionId !== undefined &&
      previousOwner.sessionId === connection.sessionId &&
      previousOwner.workspaceCwd === undefined &&
      connection.workspaceCwd !== undefined &&
      previousOwner.snapshot.isCurrent();
    if (workspaceBecameKnown && logicalSessionKey) {
      const previousSessionKey = previousOwner.sessionKey;
      previousOwner.workspaceCwd = connection.workspaceCwd;
      previousOwner.sessionKey = logicalSessionKey;
      previousOwner.snapshot = currentSnapshot;
      const previousStates =
        previousSessionKey !== undefined
          ? cancelledRetryStatesRef.current.get(previousSessionKey)
          : undefined;
      if (
        previousSessionKey &&
        previousStates &&
        previousSessionKey !== logicalSessionKey
      ) {
        const currentStates =
          cancelledRetryStatesRef.current.get(logicalSessionKey) ?? [];
        cancelledRetryStatesRef.current.set(
          logicalSessionKey,
          mergeCancelledRetryEntries(
            currentStates,
            previousStates.map((previous) => ({ state: previous.state })),
          ),
        );
        cancelledRetryStatesRef.current.delete(previousSessionKey);
      }
      return;
    }
    if (
      retryOwnerMatchesCurrent(
        previousOwner,
        connection.sessionId,
        connection.workspaceCwd,
        composerSourceVersionRef.current,
      )
    ) {
      return;
    }
    if (previousOwner.workspaceCwd === undefined && previousOwner.sessionKey) {
      cancelledRetryStatesRef.current.delete(previousOwner.sessionKey);
    }
    retryOwnerRef.current = {
      sessionId: connection.sessionId,
      workspaceCwd: connection.workspaceCwd,
      sessionKey: logicalSessionKey,
      sourceVersion: composerSourceVersionRef.current,
      snapshot: currentSnapshot,
    };
    lastSubmittedPromptRef.current = '';
    lastSubmittedImagesRef.current = undefined;
    lastSubmittedInputAnnotationsRef.current = undefined;
    lastSubmittedSourceVersionRef.current = -1;
    retryableTurnErrorIdRef.current = null;
    retryableTurnErrorIdentityRef.current = undefined;
    retriedTurnErrorIdRef.current = null;
    failedTurnErrorRetryRef.current = null;
    setShowRetryHint(false);
  }, [
    connection.sessionId,
    connection.workspaceCwd,
    logicalSessionKey,
    sessionOwnerGuard,
  ]);
  const applyCancelledRetryState = useCallback(
    (state) => {
      const currentBlocks = store.getSnapshot().blocks;
      if (state.kind === 'failed-prompt') {
        let failed = state.failed;
        const latestUserMessage = getLatestUserBlock(currentBlocks);
        if (!matchesUserMessageIdentity(latestUserMessage, failed.identity)) {
          if (
            !matchesUserMessageIdentity(
              latestUserMessage,
              failed.previousIdentity,
            )
          ) {
            return 'invalid';
          }
          store.appendLocalUserMessage(
            failed.text,
            failed.images?.map((image) => ({
              data: image.data,
              mimeType: image.media_type,
            })),
            failed.inputAnnotations?.length
              ? { inputAnnotations: failed.inputAnnotations }
              : undefined,
          );
          const rehydratedMessage = getLatestUserBlock(
            store.getSnapshot().blocks,
          );
          if (!rehydratedMessage || rehydratedMessage === latestUserMessage) {
            return 'invalid';
          }
          failed = {
            ...failed,
            messageId: rehydratedMessage.id,
            identity: { block: rehydratedMessage },
          };
          state.failed = failed;
        } else if (
          latestUserMessage &&
          (latestUserMessage.id !== failed.messageId ||
            latestUserMessage !== failed.identity.block)
        ) {
          failed = {
            ...failed,
            messageId: latestUserMessage.id,
            identity: { block: latestUserMessage },
          };
          state.failed = failed;
        }
        if (
          !displayMessages.some((message) => message.id === failed.messageId)
        ) {
          return 'pending';
        }
        failed = {
          ...failed,
          owner: retryOwnerRef.current,
        };
        state.failed = failed;
        updateFailedPrompt(failed);
        setFailedPromptRetry(null);
        return 'restored';
      }
      const currentTurnError = getRetryableTurnError(currentBlocks);
      if (!matchesTurnErrorIdentity(currentTurnError, state.identity)) {
        return 'invalid';
      }
      const renderedTurnError = getRetryableTurnError(blocks);
      if (
        !renderedTurnError ||
        !matchesTurnErrorIdentity(renderedTurnError, state.identity)
      ) {
        return 'pending';
      }
      lastSubmittedPromptRef.current = state.text;
      lastSubmittedImagesRef.current = state.images;
      lastSubmittedInputAnnotationsRef.current = state.inputAnnotations;
      lastSubmittedSourceVersionRef.current = composerSourceVersionRef.current;
      retryableTurnErrorIdRef.current = renderedTurnError.id;
      retryableTurnErrorIdentityRef.current = { block: renderedTurnError };
      retriedTurnErrorIdRef.current = state.previousRetriedTurnErrorId;
      setShowRetryHint(state.previousShowRetryHint);
      setFailedPromptRetry(null);
      return 'restored';
    },
    [blocks, displayMessages, store, updateFailedPrompt],
  );
  const restoreOrDeferCancelledRetry = useCallback((owner, state) => {
    const resolvedSessionKey = owner.sessionKey;
    if (
      !resolvedSessionKey ||
      (owner.workspaceCwd === undefined && !owner.snapshot.isCurrent())
    ) {
      return;
    }
    const states = mergeCancelledRetryEntries(
      cancelledRetryStatesRef.current.get(resolvedSessionKey) ?? [],
      [
        {
          ...(owner.workspaceCwd === undefined ? { owner } : {}),
          state,
        },
      ],
    );
    cancelledRetryStatesRef.current.set(resolvedSessionKey, states);
    if (appMountedRef.current) {
      setCancelledRetryRevision((current) => current + 1);
    }
  }, []);
  useLayoutEffect(() => {
    if (
      !logicalSessionKey ||
      sessionWriteBlocked ||
      connection.loadingTranscript ||
      connection.catchingUp
    ) {
      return;
    }
    const exactStates =
      cancelledRetryStatesRef.current.get(logicalSessionKey) ?? [];
    const pendingExactStates = [];
    for (const entry of exactStates) {
      if (entry.owner && !entry.owner.snapshot.isCurrent()) {
        continue;
      }
      if (applyCancelledRetryState(entry.state) === 'pending') {
        pendingExactStates.push(entry);
      }
    }
    if (pendingExactStates.length > 0) {
      cancelledRetryStatesRef.current.set(
        logicalSessionKey,
        pendingExactStates,
      );
    } else {
      cancelledRetryStatesRef.current.delete(logicalSessionKey);
    }
  }, [
    applyCancelledRetryState,
    cancelledRetryRevision,
    connection.catchingUp,
    connection.loadingTranscript,
    logicalSessionKey,
    sessionWriteBlocked,
  ]);
  const connected = connection.status === 'connected';
  const workspaceEventSignals = useWorkspaceEventSignals();
  const [loadedSkills, setLoadedSkills] = useState([]);
  const [loadedSkillsReady, setLoadedSkillsReady] = useState(false);
  const loadedSkillsRequestRef = useRef(0);
  const reloadLoadedSkills = useCallback(
    async (workspaceCwd) => {
      const request = ++loadedSkillsRequestRef.current;
      try {
        const status =
          workspaceCwd && workspace.client
            ? await workspace.client
                .workspaceByCwd(workspaceCwd)
                .workspaceSkills()
            : await workspaceActions.loadSkillsStatus();
        if (request !== loadedSkillsRequestRef.current) return;
        setLoadedSkills(availableSkillInfos(status));
        setLoadedSkillsReady(true);
      } catch {
        return;
      }
    },
    [workspace.client, workspaceActions],
  );
  useEffect(() => {
    if (!connected) return;
    void reloadLoadedSkills(connection.workspaceCwd);
  }, [connected, connection.workspaceCwd, reloadLoadedSkills]);
  const [modelDialogMode, setModelDialogMode] = useState(null);
  // Mirror of modelDialogMode (and the fallbacks/auth dialog flags below) for
  // reading the latest values inside the async voice loadProviders callback, so
  // it doesn't open the voice picker on top of a surface opened while loading
  // (see the voiceModel branch in onSubDialog).
  const modelDialogModeRef = useRef(modelDialogMode);
  // Scope a model sub-dialog opened from the Settings panel persists to. Set
  // when opening from the User/Workspace settings tab; reset to 'workspace'
  // whenever the model dialog closes (any path) so command-launched pickers
  // (/model --vision, etc.) always write workspace.
  const [modelSettingScope, setModelSettingScope] = useState('workspace');
  const [showFallbacksDialog, setShowFallbacksDialog] = useState(false);
  const showFallbacksDialogRef = useRef(showFallbacksDialog);
  const [voiceModels, setVoiceModels] = useState([]);
  const [showApprovalModeDialog, setShowApprovalModeDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [showRewindDialog, setShowRewindDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);
  const [showToolsDialog, setShowToolsDialog] = useState(false);
  // The workspace the Git dialog reads. Set by whichever entry point opened
  // it — the composer git chip / `/diff` (current workspace) or a sidebar
  // folder's git chip (that workspace) — so each can target its own repo.
  const [gitDialog, setGitDialog] = useState(undefined);
  // Main content view. The scheduled-tasks page replaces the chat pane inline
  // (not a modal overlay), mirroring the reference design; creating or opening
  // a chat returns to 'chat'. (Daemon Status is no longer a boolean dialog — it
  // is one of the activePanel values below.)
  const [mainView, setMainView] = useState('chat');
  const mainViewRef = useRef(mainView);
  const useFloatingArtifactPanel =
    !canDockArtifactPanel || mainView === 'split';
  const deferSubagentMount =
    waitForSubagentPanelAnimation &&
    artifactPanelOpen &&
    !artifactPanelFullscreen &&
    (useFloatingArtifactPanel ||
      (!prefersReducedMotion && !suppressArtifactDockOpenAnimation));
  useLayoutEffect(() => {
    if (waitForSubagentPanelAnimation && !deferSubagentMount) {
      setWaitForSubagentPanelAnimation(false);
    }
  }, [deferSubagentMount, waitForSubagentPanelAnimation]);
  useEffect(() => {
    if (!deferSubagentMount) return;
    const timeout = window.setTimeout(
      () => setWaitForSubagentPanelAnimation(false),
      SUBAGENT_PANEL_ANIMATION_FALLBACK_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [deferSubagentMount]);
  const toggleArtifactPanelFullscreen = useCallback(() => {
    setArtifactPanelFullscreen((value) => !value);
    // Only the docked node replays its open animation on the fullscreen ->
    // docked class swap; the floating drawer has no such replay.
    if (!useFloatingArtifactPanel) setSuppressArtifactDockOpenAnimation(true);
  }, [useFloatingArtifactPanel]);
  useEffect(() => {
    if (!artifactPanelOpen) {
      setArtifactPanelFullscreen(false);
      setSuppressArtifactDockOpenAnimation(false);
    } else if (useFloatingArtifactPanel) {
      // The dock node unmounts while the drawer takes over; a stale flag would
      // suppress the slide-in of the next genuine dock mount. Keep it while
      // fullscreen persists: the next dock mount enters the fullscreen class,
      // and shrinking it back still replays the slide-in without the flag.
      if (!artifactPanelFullscreen) {
        setSuppressArtifactDockOpenAnimation(false);
      }
    } else if (artifactPanelFullscreen) {
      // Floating -> docked hand-over mid-fullscreen: the toggle never set the
      // flag (the panel was floating when it fired), but shrinking the dock
      // back to its docked class would replay the slide-in.
      setSuppressArtifactDockOpenAnimation(true);
    }
  }, [artifactPanelOpen, useFloatingArtifactPanel, artifactPanelFullscreen]);
  const dockedFullscreenActive =
    artifactPanelOpen && !useFloatingArtifactPanel && artifactPanelFullscreen;
  // Fullscreen moves the docked panel's portal slot into the top-level portal
  // root so a transformed/paint-contained/lower-stacking host ancestor can
  // neither bound the fixed surface nor paint over it; shrinking moves it
  // back. The wrapper itself is portaled INTO the slot, so it stays mounted
  // (and React's delegated listeners stay attached to the slot) across the
  // move — a remount would discard panel-local state.
  useLayoutEffect(() => {
    const slot = artifactPanelSlotEl;
    if (!slot || !dockedFullscreenActive) return;
    const host = slot.parentElement;
    if (!host) return;
    const next = slot.nextSibling;
    (portalRoot ?? document.body).appendChild(slot);
    return () => {
      host.insertBefore(slot, next);
    };
  }, [dockedFullscreenActive, portalRoot, artifactPanelSlotEl]);
  // Document-level modal semantics for the fullscreen surface,
  // matching what the floating variant gets from vaul's Radix dialog: hide
  // every outside tree from AT (Tab containment is the surface's own keydown
  // handler) and move stray focus into the surface — the covered chat subtree
  // drops focus to body when it goes display:none.
  useLayoutEffect(() => {
    const surface = artifactPanelFullscreenSurfaceRef.current;
    if (!dockedFullscreenActive || !surface) return;
    const hidden = [];
    let node = surface;
    while (node && node !== document.body) {
      const root = node.getRootNode();
      const parent =
        node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling === node) continue;
        // The elevated toast host shares this portal root and must stay
        // announced (and dismissible) while the surface is up.
        if (sibling.matches('[data-web-shell-toast-host]')) continue;
        hidden.push({
          element: sibling,
          // A live hideOthers lock (e.g. the floating drawer unmounting in
          // the same commit that mounts the surface) owns this value; its
          // unlock restores the true original itself.
          previous: sibling.hasAttribute('data-aria-hidden')
            ? null
            : sibling.getAttribute('aria-hidden'),
        });
        sibling.setAttribute('aria-hidden', 'true');
      }
      node = parent;
    }
    // document.activeElement retargets to the shadow host in shadow-DOM
    // portal mode; read the focused node from the surface's own root.
    const surfaceActive = getShadowAwareActiveElement(surface);
    if (!surface.contains(surfaceActive)) surface.focus();
    // Keydowns inside the sandboxed HTML preview iframe never reach the
    // surface's Tab-wrap handler or the window Escape handler, and a Tab
    // past the preview's last focusable lands focus natively outside the
    // surface. Pull stray focus back like the floating variant's Radix
    // focus trap, so the keyboard stays the surface's escape route.
    const pullStrayFocusIntoSurface = (event) => {
      // focusin is composed: at this document-level listener the browser
      // retargets it to the shadow host, so resolve the real node.
      const target = event.composedPath()[0] ?? event.target;
      if (!target || surface.contains(target) || target.contains(surface)) {
        return;
      }
      // The elevated toast host and any Radix layer opened from the panel
      // share this portal root and stay actionable beside the surface.
      if (portalRoot?.contains(target)) return;
      surface.focus();
    };
    document.addEventListener('focusin', pullStrayFocusIntoSurface);
    return () => {
      document.removeEventListener('focusin', pullStrayFocusIntoSurface);
      for (const { element, previous } of hidden) {
        const restore = () => {
          if (previous === null) element.removeAttribute('aria-hidden');
          else element.setAttribute('aria-hidden', previous);
        };
        if (!element.hasAttribute('data-aria-hidden')) {
          restore();
          continue;
        }
        // A Radix hideOthers lock (a DialogShell opened over the surface)
        // owns this node now: it recorded the node as already hidden, so its
        // own unlock will not restore it, and restoring now would expose the
        // app behind the open modal. Wait for the lock's marker to drop.
        const observer = new MutationObserver(() => {
          if (element.hasAttribute('data-aria-hidden')) return;
          observer.disconnect();
          restore();
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['data-aria-hidden'],
        });
      }
    };
  }, [dockedFullscreenActive, portalRoot]);
  const handleArtifactPanelSurfaceKeyDown = useCallback(
    (event) => {
      if (!artifactPanelFullscreen) return;
      if (
        event.key !== 'Tab' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      const [first, last] = getFullscreenSurfaceTabEdges(event.currentTarget);
      const focused = getShadowAwareActiveElement(event.currentTarget);
      if (!first || !last) {
        if (focused === event.currentTarget) event.preventDefault();
        return;
      }
      if (!event.shiftKey && focused === last) {
        event.preventDefault();
        first.focus();
      } else if (
        event.shiftKey &&
        (focused === first || focused === event.currentTarget)
      ) {
        event.preventDefault();
        last.focus();
      }
    },
    [artifactPanelFullscreen],
  );
  // The drawer's Radix dismiss layer only checks `event.key === 'Escape'`
  // (no isComposing guard), so while composing in a panel input an Escape
  // that cancels the composition would close the drawer — and its
  // preventDefault would swallow the native cancel. Mask the key for the
  // capture-phase dismiss listener and restore it before the event reaches
  // the focused input, mirroring DialogShell.preserveImeEscape. The docked
  // fullscreen branch is covered by the window handler's IME guard.
  useEffect(() => {
    if (!artifactPanelOpen || !useFloatingArtifactPanel) return;
    const preserveImeEscape = (event) => {
      if (
        event.key !== 'Escape' ||
        (!event.isComposing && event.keyCode !== 229)
      ) {
        return;
      }
      Object.defineProperty(event, 'key', {
        configurable: true,
        value: 'Process',
      });
      document.addEventListener(
        'keydown',
        (currentEvent) => {
          if (currentEvent === event) Reflect.deleteProperty(event, 'key');
        },
        { capture: true, once: true },
      );
    };
    window.addEventListener('keydown', preserveImeEscape, { capture: true });
    return () => {
      window.removeEventListener('keydown', preserveImeEscape, {
        capture: true,
      });
    };
  }, [artifactPanelOpen, useFloatingArtifactPanel]);
  // Sessions to seed the split view with (e.g. the selection from the overview).
  const [splitSessionIds, setSplitSessionIds] = useState([]);
  // Latest pane list, readable from the shrink-close effect without making it a
  // dependency (it changes on every pane add/remove).
  const splitSessionIdsRef = useRef(splitSessionIds);
  splitSessionIdsRef.current = splitSessionIds;
  const [mcpDialogMessage, setMcpDialogMessage] = useState(null);
  // Settings and Daemon Status are shown as an in-place panel that replaces the
  // chat view (message list + composer), not as a modal overlay. Only one may be
  // active at a time; null means the normal chat view is shown.
  const [activePanel, setActivePanel] = useState(null);
  const activePanelRef = useRef(activePanel);
  const closePanel = useCallback(() => setActivePanel(null), []);
  const handleUseSkill = useCallback(
    (name) => {
      closePanel();
      window.setTimeout(() => {
        editorRef.current?.setText(`/${name} `);
        editorRef.current?.focus();
      }, 0);
    },
    [closePanel],
  );
  // The Settings/Status panel (activePanel) and the Scheduled Tasks page
  // (mainView) are mutually-exclusive full-pane views — the latter is a
  // position:absolute overlay that would otherwise cover the former — so opening
  // one closes the other. Without this, opening Scheduled Tasks then Daemon
  // Status left the panel rendered behind the Scheduled Tasks overlay, looking
  // like the button did nothing.
  const openPanel = useCallback((panel) => {
    setMainView('chat');
    setActivePanel(panel);
  }, []);
  const loadMcpManagerMessage = useCallback(async () => {
    const status = await workspaceActions.loadMcpStatus();
    setMcpDialogMessage({
      status,
      toolsByServer: {},
      resourcesByServer: {},
      showDescriptions: false,
      showSchema: false,
      showTips: false,
    });
  }, [workspaceActions]);
  const openScheduledTasks = useCallback(() => {
    setActivePanel(null);
    setMainView('scheduledTasks');
  }, []);
  const openGoals = useCallback(() => {
    setActivePanel(null);
    setMainView('goals');
  }, []);
  const openSessionDrawer = useCallback(() => {
    if (!sidebarOptions.enabled) return;
    setActivePanel(null);
    setMainView('chat');
    setForceMobileDrawer(true);
    setMobileDrawerOpen(true);
  }, [sidebarOptions.enabled]);
  // Open the in-window split view showing 2+ sessions side by side. `splitSessionIds`
  // is the live pane set — SplitView mirrors add/remove back into it via
  // onPanesChange — so it must be preserved across entries, not blindly reset.
  const openSplitView = useCallback(
    (sessionIds) => {
      setActivePanel(null);
      setSplitSessionIds((prev) => {
        // An explicit selection (the overview, or a `?split=` URL) replaces the
        // split with exactly those sessions.
        const requested = Array.from(
          new Set((sessionIds ?? []).filter(Boolean)),
        ).slice(0, MAX_SPLIT_PANES);
        if (requested.length > 0) return requested;
        // No selection (the toolbar "Open Split View" button): restore the split
        // the user already had so switching away and back doesn't clear it; fall
        // back to the current session when there is nothing to restore.
        if (prev.length > 0) return prev;
        return connection.sessionId ? [connection.sessionId] : [];
      });
      setMainView('split');
    },
    [connection.sessionId],
  );
  const externalSplitSignature = useMemo(() => {
    const requested = Array.from(
      new Set((externalSplitSessionIds ?? []).filter(Boolean)),
    ).slice(0, MAX_SPLIT_PANES);
    return requested.join('\0');
  }, [externalSplitSessionIds]);
  const externalSplitControlled = externalSplitSessionIds !== undefined;
  const onSplitSessionIdsChangeRef = useRef(onSplitSessionIdsChange);
  onSplitSessionIdsChangeRef.current = onSplitSessionIdsChange;
  const requestOpenSplitView = useCallback(() => {
    if (!externalSplitControlled) {
      openSplitView();
      return;
    }
    const requested =
      splitSessionIds.length > 0
        ? splitSessionIds
        : connection.sessionId
          ? [connection.sessionId]
          : [];
    onSplitSessionIdsChangeRef.current?.(requested);
  }, [
    connection.sessionId,
    externalSplitControlled,
    openSplitView,
    splitSessionIds,
  ]);
  useEffect(() => {
    if (!externalSplitControlled) return;
    const requested = externalSplitSignature
      ? externalSplitSignature.split('\0')
      : [];
    setSplitSessionIds((prev) =>
      areSessionIdsEqual(prev, requested) ? prev : requested,
    );
    if (requested.length > 0) {
      setActivePanel((prev) => (prev === null ? prev : null));
      setMainView((prev) => (prev === 'split' ? prev : 'split'));
    } else {
      setMainView((prev) => (prev === 'split' ? 'chat' : prev));
    }
  }, [externalSplitControlled, externalSplitSignature]);
  const handleSplitPanesChange = useCallback(
    (sessionIds) => {
      if (!externalSplitControlled) {
        setSplitSessionIds(sessionIds);
      }
      onSplitSessionIdsChangeRef.current?.(sessionIds);
    },
    [externalSplitControlled],
  );
  const notifyControlledSplitClose = useCallback(() => {
    if (externalSplitControlled) {
      onSplitSessionIdsChangeRef.current?.([]);
    }
  }, [externalSplitControlled]);
  // Stable so SplitView's onExit-dependent effect (auto-exit on last pane
  // close) doesn't re-fire on every App re-render. Back from the split returns
  // to the Session Overview — the hub the split is launched from.
  const handleSplitExit = useCallback(() => {
    notifyControlledSplitClose();
    // The user left the split of their own accord, so a refresh must not bring
    // it back. (A shrink-fold is transient and deliberately doesn't clear it.)
    clearSplitSessions();
    openPanel('sessions');
  }, [notifyControlledSplitClose, openPanel]);
  // A `?split=a,b` URL (opened in a new tab from the overview) enters the split
  // view with those sessions on load. Consume the param once so a later reload
  // or exit doesn't force the split back on.
  useEffect(() => {
    const ids = parseSplitSessionIds(window.location.search);
    if (ids.length > 0) {
      const url = new URL(window.location.href);
      url.searchParams.delete('split');
      window.history.replaceState(null, '', url);
      if (!externalSplitControlled) {
        openSplitView(ids);
      }
      return;
    }
    // No `?split=` deep link: restore the in-window split the user had before a
    // refresh, when one was persisted for this tab. sessionStorage is per-tab,
    // so a fresh tab (or a controlled host, which owns its own lifecycle)
    // restores nothing.
    if (externalSplitControlled) return;
    const saved = loadSplitSessions();
    if (saved.length > 0) openSplitView(saved);
  }, [externalSplitControlled, openSplitView]);
  // Mirror the live split session set to per-tab storage while the split is the
  // active view, so a refresh restores exactly these panes. Not written when the
  // split is merely folded by a shrink (mainView flips to 'chat' transiently) —
  // the saved set is kept so growing back, or refreshing mid-fold, still restores.
  useEffect(() => {
    if (externalSplitControlled) return;
    if (mainView === 'split' && splitSessionIds.length > 0) {
      saveSplitSessions(splitSessionIds);
    }
  }, [mainView, splitSessionIds, externalSplitControlled]);
  // If the viewport shrinks below the large-screen breakpoint, fold away the
  // Session Overview panel and the split view — both are large-screen-only
  // surfaces whose entry points are hidden on small screens. The split is only
  // folded, not discarded: growing back past the breakpoint restores it, so a
  // transient resize is lossless. When a shrink folds the split, its panes
  // unmount and take keyboard focus with them; flag the composer to be refocused
  // once the chat is shown again.
  const focusComposerAfterSplitCloseRef = useRef(false);
  // True while the split view is only *temporarily* folded away because the
  // window is narrower than the large-screen breakpoint. Growing back past the
  // breakpoint restores it, so a transient resize doesn't drop the user's panes.
  const splitFoldedByShrinkRef = useRef(false);
  useEffect(() => {
    if (isLargeScreen) {
      // Grew back above the breakpoint: restore a split that a shrink folded
      // away. Standalone/uncontrolled only — a controlled host owns its split
      // lifecycle and re-opens it itself.
      if (splitFoldedByShrinkRef.current) {
        splitFoldedByShrinkRef.current = false;
        if (!externalSplitControlled && splitSessionIdsRef.current.length > 0) {
          setMainView((prev) => (prev === 'chat' ? 'split' : prev));
        }
      }
      return;
    }
    if (activePanel === 'sessions') {
      setActivePanel(null);
    }
    if (mainView === 'split') {
      notifyControlledSplitClose();
      setMainView('chat');
      focusComposerAfterSplitCloseRef.current = true;
      // Fold, don't discard: remember to restore the same split once the screen
      // grows back, so a transient shrink is lossless. The chat's own connection
      // (its session, git branch, URL, …) is left untouched — restoring the
      // split, or dropping back to that chat, is exactly what it was before.
      if (!externalSplitControlled) {
        splitFoldedByShrinkRef.current = true;
        // …except when the chat has no session of its own — the common case
        // when the split was entered from the Session Overview or a `?split=a,b`
        // link. A bare fold would then strand the user on an empty "new chat",
        // so land on the split's first (leftmost) pane instead. Guarded on the
        // *empty* chat so it never re-points a chat that already has a session
        // (which would wipe its git branch / change the session+URL it drops
        // back to). Best-effort: a load failure (e.g. a non-primary-workspace
        // pane the single connection can't own) just leaves the empty chat.
        const firstPane = splitSessionIdsRef.current[0];
        if (firstPane && !currentSessionIdRef.current) {
          void sessionActions.loadSession(firstPane).catch(() => undefined);
        }
      }
    }
  }, [
    isLargeScreen,
    activePanel,
    mainView,
    notifyControlledSplitClose,
    externalSplitControlled,
    sessionActions,
  ]);
  // Land focus on the composer after a shrink-driven split close so keyboard
  // users aren't dropped onto <body> — but not when the chat now shows an
  // approval overlay (it owns the keyboard) or a panel (it manages focus).
  useEffect(() => {
    if (mainView !== 'chat' || !focusComposerAfterSplitCloseRef.current) return;
    focusComposerAfterSplitCloseRef.current = false;
    if (!activePanel && !approvalOverlayActive) editorRef.current?.focus();
  }, [mainView, activePanel, approvalOverlayActive]);
  // The Settings / Daemon Status panel is a view, not a modal, so it lacks
  // DialogShell's focus trap/restore. Move focus into a panel when it opens (or
  // when switching directly between panels) and back to the composer when it
  // closes, so keyboard users aren't stranded on an element that is hidden.
  const panelBackRef = useRef(null);
  const panelHeadingRef = useRef(null);
  const pluginTabRef = useRef(null);
  const prevActivePanelRef = useRef(activePanel);
  const prevApprovalOverlayRef = useRef(approvalOverlayActive);
  useEffect(() => {
    const prev = prevActivePanelRef.current;
    const wasApprovalActive = prevApprovalOverlayRef.current;
    prevActivePanelRef.current = activePanel;
    prevApprovalOverlayRef.current = approvalOverlayActive;
    if (activePanel) {
      if (activePanel === 'extensions' || activePanel === 'channels') {
        panelHeadingRef.current?.focus();
        return;
      }
      if (activePanel === 'plugins') {
        pluginTabRef.current?.focus();
        return;
      }
      // Covers null→panel and panel→panel: the Back button lives outside the
      // keyed panel body so it survives a switch, but refocus explicitly rather
      // than depending on that DOM coincidence.
      panelBackRef.current?.focus();
    } else if (prev) {
      // Panel just closed. Return focus to the composer — unless an approval
      // overlay is what forced it closed (see the effect below): that overlay
      // drives its own keyboard handling and ToolApproval ignores keys from
      // editable targets, so focusing the composer here would swallow its
      // shortcuts and leave the user unable to respond by keyboard.
      if (!approvalOverlayActive) {
        editorRef.current?.focus();
      }
    } else if (wasApprovalActive && !approvalOverlayActive) {
      // The panel was auto-closed for an approval (prev was consumed to null on
      // that render, editor focus skipped). Now the approval has resolved with
      // no panel to return to, so restore the composer here. (useComposerCore's
      // dialogOpen effect also refocuses on this transition; this keeps the
      // panel focus effect self-contained instead of relying on that.)
      editorRef.current?.focus();
    }
  }, [activePanel, approvalOverlayActive]);
  // A pending approval (a gated tool call or an AskUserQuestion) renders its
  // overlay in the chat footer, which is hidden (display:none) while a panel is
  // shown. Left alone, the turn would hang behind Settings/Status with no
  // visible prompt. Close the panel so the approval surfaces. Only actionable
  // approvals count — pendingToolApproval/pendingAskUserApproval already gate on
  // canActOnPendingApproval, so a non-owner in a shared session isn't yanked out
  // of Settings by someone else's prompt.
  useEffect(() => {
    if (!approvalOverlayActive) return;
    // The approval overlay renders in the chat footer; dismiss anything layered
    // over it so it's visible and actionable instead of trapped behind a
    // backdrop — the panel itself and any DialogShell sub-dialog opened from it
    // (model picker, approval-mode picker). Leaving the approval-mode picker up
    // is also a security hole: the user could pick "yolo" and silently
    // auto-approve a tool call they never saw (handleSetMode auto-approves
    // pendingApprovalRef.current).
    if (activePanel) setActivePanel(null);
    if (modelDialogMode) setModelDialogMode(null);
    if (showApprovalModeDialog) setShowApprovalModeDialog(false);
    // The fullscreen artifact panel hides the chat (display:none +
    // aria-hidden), and the approval overlay renders inside the chat footer —
    // shrink the panel back to its dock/drawer so the approval surfaces.
    // Split-view pane approvals deliberately do not shrink the panel: each
    // pane renders its own approval banner, and surfacing them here would
    // need a pending-approval signal plumbed up through SplitView. Escape or
    // the toolbar exits fullscreen and reveals them.
    if (artifactPanelFullscreen) setArtifactPanelFullscreen(false);
    // The Scheduled Tasks and Goals pages are full-pane overlays
    // (position:absolute) that cover the chat footer too, so dismiss them for
    // the same reason. The split view is deliberately NOT dismissed: each pane
    // owns and renders its own session's approval, so an approval on the (outer)
    // main session must not yank the user out of the panes they are working in.
    if (mainView === 'scheduledTasks' || mainView === 'goals') {
      setMainView('chat');
    }
  }, [
    approvalOverlayActive,
    activePanel,
    modelDialogMode,
    showApprovalModeDialog,
    mainView,
    artifactPanelFullscreen,
  ]);
  // Whether each approval overlay is the topmost (visible, uncovered) one. The
  // overlay components consume this as `keyboardActive`: when it flips true — on
  // appearance, or once a panel/dialog that was covering it closes — they pull
  // keyboard focus to their own safe-default option. Focus handling now lives in
  // ToolApproval/AskUserQuestion (their keyboard handling is focus-scoped), so
  // the app no longer focuses the wrapper element directly.
  const toolApprovalOverlayVisible =
    pendingToolApproval !== null &&
    !activePanel &&
    modelDialogMode === null &&
    !showApprovalModeDialog &&
    mainView === 'chat' &&
    !artifactPanelFullscreen;
  const askUserOverlayVisible =
    pendingAskUserApproval !== null &&
    !activePanel &&
    modelDialogMode === null &&
    !showApprovalModeDialog &&
    mainView === 'chat' &&
    !artifactPanelFullscreen;
  const [showMemoryDialog, setShowMemoryDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const showAuthDialogRef = useRef(showAuthDialog);
  const [memoryRefreshSignal, setMemoryRefreshSignal] = useState(0);
  const [memoryAddSignal, setMemoryAddSignal] = useState(0);
  const [externalInteractionBlockCount, setExternalInteractionBlockCount] =
    useState(0);
  const registerInteractionBlocker = useCallback(() => {
    let released = false;
    setExternalInteractionBlockCount((count) => count + 1);
    return () => {
      if (released) return;
      released = true;
      setExternalInteractionBlockCount((count) => Math.max(0, count - 1));
    };
  }, []);
  // Refresh commands when extensions change (install/uninstall/update).
  const extensionsVersionRef = useRef(
    workspaceEventSignals?.extensionsVersion ?? 0,
  );
  useEffect(() => {
    const current = workspaceEventSignals?.extensionsVersion ?? 0;
    if (current !== extensionsVersionRef.current) {
      extensionsVersionRef.current = current;
      const change = workspaceEventSignals?.lastExtensionChange;
      if (change?.status === 'failed') {
        store.dispatch([
          {
            type: 'error',
            text: t('extensions.action.failed', {
              name: change.name ?? '',
              source: change.source ?? '',
              error: change.error ?? t('error.unknown'),
            }),
          },
        ]);
        return;
      }
      if (change?.status === 'installed') {
        const name = change.name ?? change.source ?? t('extensions.label');
        store.dispatch([
          {
            type: 'status',
            text: change.version
              ? t('extensions.install.installedWithVersion', {
                  name,
                  version: change.version,
                })
              : t('extensions.install.installed', { name }),
          },
        ]);
      } else if (change?.status) {
        const name = change.name ?? change.source ?? t('extensions.label');
        const key =
          change.status === 'updated' && change.version
            ? 'extensions.manage.updatedWithVersion'
            : `extensions.manage.${change.status}`;
        store.dispatch([
          {
            type: 'status',
            text: t(key, { name, version: change.version ?? '' }),
          },
        ]);
      }
      sessionActions.refreshCommands().catch(() => {
        store.dispatch([
          {
            type: 'error',
            text: t('extensions.commands.refreshFailed'),
          },
        ]);
      });
    }
  }, [
    workspaceEventSignals?.extensionsVersion,
    workspaceEventSignals?.lastExtensionChange,
    sessionActions,
    store,
    t,
  ]);
  const [memoryAddScope, setMemoryAddScope] = useState('workspace');
  const [agentsCreateScope, setAgentsCreateScope] = useState(null);
  const [escapeHintVisible, setEscapeHintVisible] = useState(false);
  // Whether the first Esc has armed a stream cancellation; the composer's send
  // button shows an "Esc again to stop" affordance while true.
  const [cancelArmed, setCancelArmed] = useState(false);
  // Which action the pending second Esc would perform, or null when idle.
  const escArmedActionRef = useRef(null);
  const escapeTimerRef = useRef(null);
  const [tasksDialogMessage, setTasksDialogMessage] = useState(null);
  const planAgentTools = useMemo(
    () =>
      tasksDialogMessage
        ? getAgentToolsForPlan(messages, floatingTodosState)
        : [],
    [floatingTodosState, messages, tasksDialogMessage],
  );
  const handleOpenMonitorDetails = useCallback(
    (task) => {
      setTasksDialogMessage(null);
      setBackgroundTasksRefreshTrigger((value) => value + 1);
      openMonitorPanel(task);
    },
    [openMonitorPanel],
  );
  const handleOpenShellDetails = useCallback(
    (task) => {
      setTasksDialogMessage(null);
      setBackgroundTasksRefreshTrigger((value) => value + 1);
      openShellPanel(task);
    },
    [openShellPanel],
  );
  const [selectedTheme, setSelectedTheme] = useState(
    providedTheme ?? WebShellThemeId.Dark,
  );
  const [currentModel, setCurrentModel] = useState('');
  const currentModelRef = useRef(currentModel);
  currentModelRef.current = currentModel;
  const setPendingModel = useCallback((modelId) => {
    currentModelRef.current = modelId;
    setCurrentModel(modelId);
  }, []);
  const connectionRef = useRef(connection);
  connectionRef.current = connection;
  const refreshActiveSessionDisplayName = useCallback(async () => {
    const activeConnection = connectionRef.current;
    if (!activeConnection.sessionId || !activeConnection.workspaceCwd) return;
    const owner = sessionOwnerGuard.capture();
    try {
      const page = await loadSessionCatalogOnce(
        workspace.client,
        {
          routeKind: 'legacy',
          workspaceCwd: activeConnection.workspaceCwd,
          options: { pageSize: 200 },
        },
        { fresh: true },
      );
      if (
        !owner.isCurrent() ||
        connectionRef.current.sessionId !== activeConnection.sessionId ||
        connectionRef.current.workspaceCwd !== activeConnection.workspaceCwd ||
        connectionRef.current.displayName
      ) {
        return;
      }
      const displayName = page.sessions.find(
        (session) => session.sessionId === activeConnection.sessionId,
      )?.displayName;
      if (displayName?.trim()) setSessionStatusDisplayName(displayName);
    } catch {
      // The live session_metadata_updated event remains the primary path.
    }
  }, [sessionOwnerGuard, workspace.client]);
  const refreshActiveSessionDisplayNameRef = useRef(
    refreshActiveSessionDisplayName,
  );
  refreshActiveSessionDisplayNameRef.current = refreshActiveSessionDisplayName;
  const delayedDisplayNameRefreshTimerRef = useRef(null);
  const pendingDisplayNameRefreshRef = useRef(undefined);
  const refreshDisplayNameIfCurrent = useCallback((sessionId, workspaceCwd) => {
    const activeConnection = connectionRef.current;
    if (
      activeConnection.sessionId !== sessionId ||
      activeConnection.workspaceCwd !== workspaceCwd ||
      activeConnection.displayName
    ) {
      return;
    }
    void refreshActiveSessionDisplayNameRef.current();
  }, []);
  const scheduleDelayedActiveSessionDisplayNameRefresh = useCallback(
    (sessionId, workspaceCwd) => {
      pendingDisplayNameRefreshRef.current = undefined;
      if (delayedDisplayNameRefreshTimerRef.current !== null) {
        clearTimeout(delayedDisplayNameRefreshTimerRef.current);
      }
      delayedDisplayNameRefreshTimerRef.current = setTimeout(() => {
        delayedDisplayNameRefreshTimerRef.current = null;
        if (typeof document !== 'undefined' && document.hidden) {
          pendingDisplayNameRefreshRef.current = { sessionId, workspaceCwd };
          return;
        }
        refreshDisplayNameIfCurrent(sessionId, workspaceCwd);
      }, SESSION_CATALOG_TRAILING_REFRESH_MS);
    },
    [refreshDisplayNameIfCurrent],
  );
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) return;
      const pending = pendingDisplayNameRefreshRef.current;
      if (!pending) return;
      pendingDisplayNameRefreshRef.current = undefined;
      refreshDisplayNameIfCurrent(pending.sessionId, pending.workspaceCwd);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (delayedDisplayNameRefreshTimerRef.current !== null) {
        clearTimeout(delayedDisplayNameRefreshTimerRef.current);
      }
    };
  }, [refreshDisplayNameIfCurrent]);
  const requireActiveSessionForLocalCommand = useCallback(() => {
    if (connectionRef.current.sessionId) return true;
    pushToast('info', t('localCommand.noSession'));
    return false;
  }, [pushToast, t]);
  const sessionDisplayName = connection.displayName ?? sessionStatusDisplayName;
  const [currentMode, setCurrentMode] = useState('default');
  const currentModeRef = useRef(currentMode);
  currentModeRef.current = currentMode;
  const setPendingMode = useCallback((modeId) => {
    currentModeRef.current = modeId;
    setCurrentMode(modeId);
  }, []);
  const [isPreparingPrompt, setIsPreparingPrompt] = useState(false);
  const promptPreparationOwnerRef = useRef(null);
  const beginPromptPreparation = useCallback(() => {
    const owner = Symbol('prompt-preparation');
    promptPreparationOwnerRef.current = owner;
    setIsPreparingPrompt(true);
    return owner;
  }, []);
  const finishPromptPreparation = useCallback((owner) => {
    if (!owner || promptPreparationOwnerRef.current !== owner) return;
    promptPreparationOwnerRef.current = null;
    setIsPreparingPrompt(false);
  }, []);
  const planPreparationTokenRef = useRef(0);
  useLayoutEffect(() => {
    planPreparationTokenRef.current += 1;
    promptPreparationOwnerRef.current = null;
    setIsPreparingPrompt(false);
  }, [logicalSessionKey]);
  const createSessionPromiseRef = useRef(null);
  const preparingSessionIdRef = useRef(null);
  const allocatedSessionCatalogOwnerRef = useRef(undefined);
  /** Git mode intent for the next lazily-created session (branch or worktree). */
  const [gitModeIntent, setGitModeIntent] = useState({
    mode: 'current',
  });
  const gitModeIntentRef = useRef(gitModeIntent);
  useEffect(() => {
    gitModeIntentRef.current = gitModeIntent;
  }, [gitModeIntent]);
  const newSessionSuggestionSubmitTokenRef = useRef(0);
  const pendingNewSessionSuggestionSubmitRef = useRef(null);
  const onSessionCreatedRef = useRef(onSessionCreated);
  onSessionCreatedRef.current = onSessionCreated;
  /**
   * The session a failed `/goal` submit left behind.
   *
   * Setting a goal starts a fresh session and then sends `/goal <condition>`
   * into it, but the daemon session is not created by the "new session" step —
   * `ensureSessionForPrompt` creates it lazily *inside* `sendPrompt`. So a
   * prompt that fails leaves a session that exists but never got its goal.
   *
   * The Goals form keeps the condition and lets the user retry. Without this
   * ref every retry would abandon that session and create another, piling up
   * blank chats in the sidebar. Remembering it lets the retry reuse it — no
   * session is ever deleted.
   *
   * Only valid while the Goals page stays mounted. The moment the user leaves,
   * that session is reachable from the composer and may stop being a scratch
   * session, so the effect below forgets it: a later goal then starts a fresh
   * session rather than landing on top of a conversation.
   */
  const strandedGoalSessionRef = useRef(undefined);
  useEffect(() => {
    if (mainView !== 'goals') {
      strandedGoalSessionRef.current = undefined;
    }
  }, [mainView]);
  const ensureSessionForPrompt = useCallback(() => {
    const currentSessionId = connectionRef.current.sessionId;
    if (createSessionPromiseRef.current) {
      if (
        !currentSessionId ||
        currentSessionId === preparingSessionIdRef.current
      ) {
        return createSessionPromiseRef.current;
      }
      return Promise.resolve(undefined);
    }
    if (currentSessionId) return Promise.resolve(undefined);
    const promise = (async () => {
      let allocatedSessionId;
      const modelId =
        currentModelRef.current || connectionRef.current.currentModel;
      const modeId =
        currentModeRef.current || connectionRef.current.currentMode;
      const primaryWorkspaceCwd = workspaces.find(
        (entry) => entry.primary,
      )?.cwd;
      const requestedWorkspaceCwd = selectedWorkspaceCwdRef.current;
      const acceptedWorkspaceCwd = requestedWorkspaceCwd
        ? workspaces.find(
            (entry) =>
              entry.cwd === requestedWorkspaceCwd && entry.trusted === true,
          )?.cwd
        : undefined;
      const targetWorkspaceCwd =
        lockedWorkspaceCwd ?? acceptedWorkspaceCwd ?? primaryWorkspaceCwd;
      const catalogWorkspaceCwd =
        targetWorkspaceCwd ??
        workspace.workspaceCwd ??
        connectionRef.current.workspaceCwd;
      try {
        await createAndAttachSessionForPrompt({
          sessionActions: sessionActions,
          modelId,
          modeId,
          workspaceCwd: targetWorkspaceCwd,
          worktree:
            gitModeIntentRef.current.mode === 'worktree'
              ? { slug: gitModeIntentRef.current.slug }
              : undefined,
          branch:
            gitModeIntentRef.current.mode === 'branch'
              ? { name: gitModeIntentRef.current.name }
              : undefined,
          onSessionCreated: onSessionCreatedRef.current,
          onSessionAllocated: (sessionId) => {
            preparingSessionIdRef.current = sessionId;
            allocatedSessionId = sessionId;
            if (catalogWorkspaceCwd) {
              allocatedSessionCatalogOwnerRef.current = {
                sessionId,
                workspaceCwd: catalogWorkspaceCwd,
              };
              sessionCatalogController.sessionCreated(
                catalogWorkspaceCwd,
                sessionId,
              );
            }
          },
          getCurrentSessionId: () => connectionRef.current.sessionId,
        }).then((result) => {
          if (result.worktree) {
            setSessionWorktree(result.worktree);
          }
          if (result.branch) {
            setSessionBranch(result.branch);
          }
          // Clear the pending intent only on success. On failure the
          // composer chip stays in the selected mode so the user knows
          // the intent was not fulfilled and can retry.
          setGitModeIntent({ mode: 'current' });
        });
      } catch (error) {
        if (allocatedSessionId && catalogWorkspaceCwd) {
          sessionCatalogController.invalidateWorkspace(catalogWorkspaceCwd);
        }
        throw error;
      }
      // One-shot: the picker targets only the *next* new session, so clear
      // it after creation. The next new chat defaults back to the primary
      // workspace unless the user picks one again.
      setSelectedWorkspaceCwd(undefined);
      return allocatedSessionId;
    })();
    createSessionPromiseRef.current = promise;
    const clearPreparation = () => {
      if (createSessionPromiseRef.current === promise) {
        createSessionPromiseRef.current = null;
        preparingSessionIdRef.current = null;
      }
    };
    void promise.then(clearPreparation, clearPreparation);
    return promise;
  }, [
    lockedWorkspaceCwd,
    sessionActions,
    sessionCatalogController,
    workspace.workspaceCwd,
    workspaces,
  ]);
  const onSubmitBeforeRef = useRef(onSubmitBefore);
  onSubmitBeforeRef.current = onSubmitBefore;
  const onSlashCommandRef = useRef(onSlashCommand);
  onSlashCommandRef.current = onSlashCommand;
  const getComposerWorkspaceCwd = useCallback(() => {
    if (connectionRef.current.sessionId) {
      return connectionRef.current.workspaceCwd;
    }
    return (
      lockedWorkspaceCwd ??
      selectedWorkspaceCwdRef.current ??
      workspacesRef.current.find((entry) => entry.primary)?.cwd
    );
  }, [lockedWorkspaceCwd]);
  const retryOwnerIsCurrent = useCallback(
    (owner) =>
      retryOwnerMatchesCurrent(
        owner,
        connectionRef.current.sessionId,
        getComposerWorkspaceCwd(),
        composerSourceVersionRef.current,
      ),
    [getComposerWorkspaceCwd],
  );
  const dispatchSessionChange = useCallback(
    (event) => {
      onSessionChange?.(event);
    },
    [onSessionChange],
  );
  // Ref-stable handle so that useCallback hooks (sendPrompt, enqueuePrompt,
  // turn_complete effect) don't need dispatchSessionChange in their dep arrays.
  // Without this, an unstable onSessionChange prop would cause those callbacks
  // to be recreated on every render, cascading into downstream effect chains.
  const dispatchSessionChangeRef = useRef(dispatchSessionChange);
  dispatchSessionChangeRef.current = dispatchSessionChange;
  const sendPrompt = useCallback(
    async (text, images, opts) => {
      if (sessionWriteBlockedRef.current) {
        throw new DOMException(
          'Session switch is still preparing',
          'InvalidStateError',
        );
      }
      const isUserPrompt = !text.trimStart().startsWith('/');
      let promptPreparationOwner;
      const startPreparing = () => {
        promptPreparationOwner ??= beginPromptPreparation();
      };
      const finishPreparing = () => {
        finishPromptPreparation(promptPreparationOwner);
      };
      const restoreCancelledSubmitState = () => {
        finishPreparing();
        opts?.onCancelledBeforeAdmission?.();
      };
      const shouldShowPreparing = !connectionRef.current.sessionId;
      const submitBefore = onSubmitBeforeRef.current;
      const admissionSource = {
        owner: sessionOwnerGuard.capture(),
        sessionId: connectionRef.current.sessionId,
        workspaceCwd: getComposerWorkspaceCwd(),
        sourceVersion: composerSourceVersionRef.current,
        writeBlockGeneration: sessionWriteBlockGenerationRef.current,
      };
      const admissionOwnerIsCurrent = (allocatedSessionId) => {
        if (!appMountedRef.current) return false;
        const currentSessionId = connectionRef.current.sessionId;
        const sessionMatches =
          currentSessionId === admissionSource.sessionId ||
          (admissionSource.sessionId === undefined &&
            (currentSessionId === undefined ||
              (allocatedSessionId !== undefined &&
                currentSessionId === allocatedSessionId)));
        const ownAllocationSucceeded =
          admissionSource.sessionId === undefined &&
          allocatedSessionId !== undefined &&
          (currentSessionId === undefined ||
            currentSessionId === allocatedSessionId);
        return (
          (admissionSource.owner.isCurrent() || ownAllocationSucceeded) &&
          sessionMatches &&
          (ownAllocationSucceeded ||
            getComposerWorkspaceCwd() === admissionSource.workspaceCwd) &&
          composerSourceVersionRef.current === admissionSource.sourceVersion
        );
      };
      const admissionSourceIsCurrent = (allocatedSessionId) =>
        admissionOwnerIsCurrent(allocatedSessionId) &&
        !sessionWriteBlockedRef.current &&
        sessionWriteBlockGenerationRef.current ===
          admissionSource.writeBlockGeneration;
      if (submitBefore) {
        startPreparing();
        try {
          await submitBefore({
            sessionId: admissionSource.sessionId,
            prompt: text,
          });
        } catch (err) {
          if (!appMountedRef.current) return;
          console.warn(
            '[web-shell] onSubmitBefore rejected, prompt cancelled',
            err,
          );
          // Restore retry-critical refs so Ctrl+Y doesn't resend the
          // cancelled prompt.
          restoreCancelledSubmitState();
          return;
        }
        if (!appMountedRef.current) return;
        if (!admissionSourceIsCurrent()) {
          restoreCancelledSubmitState();
          return;
        }
      }
      if (!submitBefore && shouldShowPreparing) {
        startPreparing();
      }
      const existingSessionWorkspaceCwd = getComposerWorkspaceCwd();
      let allocatedSessionId;
      try {
        allocatedSessionId = await ensureSessionForPrompt();
      } finally {
        if (appMountedRef.current && shouldShowPreparing) {
          finishPreparing();
        }
      }
      if (!appMountedRef.current) return;
      if (!admissionSourceIsCurrent(allocatedSessionId)) {
        restoreCancelledSubmitState();
        return;
      }
      const sessionIdAfterEnsure =
        connectionRef.current.sessionId ?? allocatedSessionId;
      const allocatedOwner = allocatedSessionCatalogOwnerRef.current;
      const promptWorkspaceCwd = allocatedSessionId
        ? allocatedOwner?.sessionId === allocatedSessionId
          ? allocatedOwner.workspaceCwd
          : undefined
        : existingSessionWorkspaceCwd;
      if (
        !opts?.retry &&
        opts?.optimisticUserMessage !== false &&
        isUserPrompt
      ) {
        lastSubmittedPromptRef.current = text;
        lastSubmittedImagesRef.current = images;
        lastSubmittedInputAnnotationsRef.current = opts?.inputAnnotations;
        lastSubmittedSourceVersionRef.current =
          composerSourceVersionRef.current;
        retryableTurnErrorIdRef.current = null;
        retryableTurnErrorIdentityRef.current = undefined;
        retriedTurnErrorIdRef.current = null;
        failedTurnErrorRetryRef.current = null;
        retryOwnerRef.current = {
          sessionId: sessionIdAfterEnsure,
          workspaceCwd: promptWorkspaceCwd,
          sessionKey: getLogicalSessionKey(
            sessionIdAfterEnsure,
            promptWorkspaceCwd,
          ),
          sourceVersion: composerSourceVersionRef.current,
          snapshot: sessionOwnerGuard.capture(),
        };
      }
      setShowRetryHint(false);
      finishPreparing();
      if (opts?.ownerRef) opts.ownerRef.current = sessionOwnerGuard.capture();
      clearFollowup();
      if (opts?.commitComposerAccepted) {
        opts.commitComposerAccepted();
      } else if (opts?.clearComposerOnPromptStart) {
        editorRef.current?.clear();
      }
      let admissionStarted = false;
      let admitted = false;
      const promptOptions = {
        images,
        inputAnnotations: opts?.inputAnnotations,
        optimisticUserMessage: opts?.optimisticUserMessage,
        retry: opts?.retry,
        onAdmissionStarted: () => {
          admissionStarted = true;
          opts?.onAdmissionStarted?.(
            connectionRef.current.sessionId ?? allocatedSessionId,
          );
        },
        onAdmitted: () => {
          admitted = true;
          if (sessionIdAfterEnsure && promptWorkspaceCwd) {
            sessionCatalogController.promptAdmitted(
              promptWorkspaceCwd,
              sessionIdAfterEnsure,
            );
          }
          opts?.onAdmitted?.();
        },
      };
      if (sessionIdAfterEnsure && (text.trim() || (images?.length ?? 0) > 0)) {
        dispatchSessionChangeRef.current?.({
          type: 'submit',
          sessionId: sessionIdAfterEnsure,
          prompt: text,
          queued: false,
        });
      }
      const previousUserMessage = opts?.onOptimisticUserMessage
        ? getLatestUserBlock(store.getSnapshot().blocks)
        : undefined;
      const resultPromise = sessionActions.sendPrompt(text, promptOptions);
      if (
        sessionIdAfterEnsure &&
        opts?.optimisticUserMessage !== false &&
        opts?.onOptimisticUserMessage
      ) {
        const message = getLatestUserBlock(store.getSnapshot().blocks);
        if (message && message !== previousUserMessage) {
          opts.onOptimisticUserMessage({
            sessionId: sessionIdAfterEnsure,
            messageId: message.id,
            identity: { block: message },
            owner: retryOwnerRef.current,
            ...(previousUserMessage
              ? { previousIdentity: { block: previousUserMessage } }
              : {}),
          });
        }
      }
      try {
        return await resultPromise;
      } catch (error) {
        if (
          admissionStarted &&
          !admitted &&
          !isDefinitelyRejectedPromptAdmission(error) &&
          promptWorkspaceCwd
        ) {
          sessionCatalogController.promptAdmissionUncertain(promptWorkspaceCwd);
        }
        throw error;
      }
    },
    [
      beginPromptPreparation,
      clearFollowup,
      ensureSessionForPrompt,
      finishPromptPreparation,
      getComposerWorkspaceCwd,
      sessionCatalogController,
      sessionActions,
      sessionOwnerGuard,
      store,
    ],
  );
  const resolveSessionForWorkspace = useCallback(
    async (cwd, forceCreate) => {
      try {
        if (!forceCreate) {
          // Reuse the connected session only when it owns the target checkout.
          // For a linked-worktree session the owned checkout is the worktree
          // path, not the base workspace (activeWorkspaceCwd), so a Commit
          // opened on the base workspace must not borrow the worktree session.
          const sessionOwnerCwd = sessionWorktree?.path ?? activeWorkspaceCwd;
          if (connection.sessionId && sessionOwnerCwd === cwd) {
            return connection.sessionId;
          }
          // Fetch the most recent session for this workspace.
          const page = await loadSessionCatalogOnce(
            workspace.client,
            {
              routeKind: 'qualified',
              workspaceCwd: cwd,
              options: { pageSize: 1, archiveState: 'active' },
            },
            { fresh: true },
          );
          if (page.sessions.length > 0) return page.sessions[0].sessionId;
        }
        // No session exists or forced: create one.
        const result = await sessionActions.createSession({
          workspaceCwd: cwd,
        });
        sessionCatalogController.sessionCreated(cwd, result.sessionId);
        return result.sessionId;
      } catch {
        return undefined;
      }
    },
    [
      connection.sessionId,
      activeWorkspaceCwd,
      sessionCatalogController,
      workspace.client,
      sessionActions,
      sessionWorktree,
    ],
  );
  const availableModels = useMemo(
    () =>
      (connection.models ?? []).filter(isVisibleComposerModel).map((m) => ({
        id: m.id,
        label: getModelDisplayName(m.label || m.id),
      })),
    [connection.models],
  );
  // The workspace the Changes dialog reads — the same active workspace the
  // git-status effect targets (computed once above), so the chip and the
  // dialog always target the same repo.
  const gitDiffWorkspaceCwd = activeWorkspaceCwd;
  const gitModeEligible = Boolean(
    !connection.sessionId &&
      workspaces.find((entry) => entry.cwd === activeWorkspaceCwd)?.trusted &&
      selectedWorkspaceGitStatus?.branch,
  );
  useEffect(() => {
    if (!gitModeEligible) {
      setGitModeIntent({ mode: 'current' });
    }
  }, [gitModeEligible]);
  const handleOpenGitDiff = useCallback(() => {
    if (!gitDiffWorkspaceCwd) return;
    setGitDialog({
      workspaceCwd: gitDiffWorkspaceCwd,
      gitCwd: sessionWorktree?.path,
      view: 'diff',
    });
  }, [gitDiffWorkspaceCwd, sessionWorktree?.path]);
  const handleOpenCommit = useCallback(() => {
    if (!gitDiffWorkspaceCwd) return;
    setGitDialog({
      workspaceCwd: gitDiffWorkspaceCwd,
      gitCwd: sessionWorktree?.path,
      view: 'commit',
    });
  }, [gitDiffWorkspaceCwd, sessionWorktree?.path]);
  const dialogOpen =
    showResumeDialog ||
    showDeleteDialog ||
    showReleaseDialog ||
    showRewindDialog ||
    showHelpDialog ||
    showThemeDialog ||
    showToolsDialog ||
    gitDialog !== undefined ||
    modelDialogMode !== null ||
    showApprovalModeDialog ||
    tasksDialogMessage !== null ||
    mcpDialogMessage !== null ||
    showMemoryDialog ||
    showAuthDialog ||
    showAddWorkspaceDialog ||
    scratchOutcomeUnknown !== 'clear' ||
    externalInteractionBlockCount > 0 ||
    // The Settings / Daemon Status panel replaces the chat surface, so — like a
    // modal — it must suppress chat-only global shortcuts (Ctrl+L/O/Y, the
    // Shift+Tab mode cycle, the btw hotkey). Escape is intercepted earlier and
    // returns to the chat instead of falling through to those handlers.
    activePanel !== null;
  // Block chat interaction (composer, chat keyboard shortcuts) both when a modal
  // is open (dialogOpen, which already includes the Settings/Status panel) and
  // while a covering surface hides the chat — a full-pane view (the Scheduled
  // Tasks page) or the fullscreen artifact panel — so keystrokes/Escape can't
  // reach the hidden composer underneath. The fullscreen gate also keeps the
  // btw capture-phase Escape handler from dismissing hidden content and
  // swallowing the Escape that shrinks the panel.
  const interactionBlocked =
    dialogOpen || mainView !== 'chat' || artifactPanelFullscreen;
  const mainVoiceTarget = useMemo(
    () =>
      resolveVoiceWorkspaceTarget({
        capabilities: workspace.capabilities,
        intendedCwd: activeWorkspaceCwd,
        sessionId: connection.sessionId,
        workspaces:
          workspace.capabilities?.workspaces || lockedWorkspaceCapability
            ? workspaces
            : undefined,
      }),
    [
      activeWorkspaceCwd,
      connection.sessionId,
      lockedWorkspaceCapability,
      workspace.capabilities,
      workspaces,
    ],
  );
  const [voiceUserRevision, setVoiceUserRevision] = useState(0);
  const [voiceWorkspaceRevisions, setVoiceWorkspaceRevisions] = useState({});
  const mainVoiceStatusRevision = useMemo(
    () => ({
      user: voiceUserRevision,
      workspace: mainVoiceTarget
        ? (voiceWorkspaceRevisions[mainVoiceTarget.workspaceKey] ?? 0)
        : 0,
    }),
    [mainVoiceTarget, voiceUserRevision, voiceWorkspaceRevisions],
  );
  const voiceModelSettingsSupported = supportsVoiceModelSettings(
    mainVoiceTarget,
    workspace.capabilities?.features ?? [],
  );
  const matchingVoiceSettingsVersion =
    mainVoiceTarget?.sessionId === connection.sessionId &&
    (!mainVoiceTarget?.cwd || mainVoiceTarget.cwd === connection.workspaceCwd)
      ? workspaceEventSignals?.settingsVersion
      : undefined;
  const {
    descriptor: qualifiedVoiceSetting,
    reload: reloadQualifiedVoiceSettings,
  } = useVoiceWorkspaceSettings(
    workspace.client,
    mainVoiceTarget,
    voiceModelSettingsSupported && mainView !== 'split',
    JSON.stringify([
      voiceUserRevision,
      mainVoiceStatusRevision.workspace,
      matchingVoiceSettingsVersion ?? null,
    ]),
  );
  const reportError = useCallback(
    (error, fallback) => {
      if (isAbortError(error)) return;
      if (isDaemonTurnError(error)) {
        return;
      }
      if (isAlreadyDispatched(error)) {
        return;
      }
      const message = formatError(error, fallback);
      console.error('[web-shell]', message, error);
      pushToast('error', message);
    },
    [pushToast],
  );
  const handleFailedPromptRetry = useCallback(() => {
    if (sessionWriteBlockedRef.current || promptPreparationOwnerRef.current) {
      return;
    }
    let failed = failedPromptRef.current;
    if (!failed || failed.sessionId !== connectionRef.current.sessionId) {
      updateFailedPrompt(null);
      return;
    }
    const retryOwner = failed.owner;
    if (!retryOwnerIsCurrent(retryOwner)) {
      updateFailedPrompt(null);
      return;
    }
    const currentFailedBlock = getLatestUserBlock(store.getSnapshot().blocks);
    if (
      !currentFailedBlock ||
      !matchesUserMessageIdentity(
        currentFailedBlock,
        failed.identity,
        retryOwner.snapshot.isCurrent(),
      )
    ) {
      updateFailedPrompt(null);
      return;
    }
    if (
      currentFailedBlock !== failed.identity.block ||
      currentFailedBlock.id !== failed.messageId
    ) {
      failed = {
        ...failed,
        messageId: currentFailedBlock.id,
        identity: { block: currentFailedBlock },
      };
    }
    updateFailedPrompt(null);
    const retryStartedAt = Date.now();
    const retryAttemptId = ++cancelledRetryAttemptRef.current;
    const retryTranscriptIdentity = {
      kind: 'failed-prompt',
      identity: failed.identity,
    };
    const retryTranscriptIsCurrent = () =>
      retryTranscriptIdentityMatches(
        store.getSnapshot().blocks,
        retryTranscriptIdentity,
        retryOwner.snapshot.isCurrent(),
      );
    setFailedPromptRetry({
      sessionId: failed.sessionId,
      messageId: failed.messageId,
      startedAt: retryStartedAt,
      admitted: false,
      settled: false,
      owner: retryOwner,
      transcriptIdentity: retryTranscriptIdentity,
    });
    let admitted = false;
    let admissionStarted = false;
    sendPrompt(failed.text, failed.images, {
      optimisticUserMessage: false,
      inputAnnotations: failed.inputAnnotations,
      onAdmissionStarted: () => {
        admissionStarted = true;
      },
      onAdmitted: () => {
        admitted = true;
        if (!retryOwnerIsCurrent(retryOwner)) return;
        setFailedPromptRetry((current) =>
          current?.transcriptIdentity === retryTranscriptIdentity
            ? retryTranscriptIsCurrent()
              ? { ...current, admitted: true }
              : null
            : current,
        );
      },
      onCancelledBeforeAdmission: () => {
        restoreOrDeferCancelledRetry(retryOwner, {
          kind: 'failed-prompt',
          attemptId: retryAttemptId,
          failed,
        });
      },
    })
      .catch((error) => {
        if (!retryOwnerIsCurrent(retryOwner)) return;
        const definitelyRejected = isDefinitelyRejectedPromptAdmission(error);
        if (admissionStarted && !admitted && !definitelyRejected) {
          if (!retryTranscriptIsCurrent()) return;
          updateUnknownPromptAdmission({
            sessionId: failed.sessionId,
            messageId: failed.messageId,
            text: failed.text,
            images: failed.images ? [...failed.images] : undefined,
            inputAnnotations: failed.inputAnnotations,
            payloadAvailable: true,
          });
          pushToast('warning', t('queue.admissionUnknown'));
          console.warn(
            '[WebShell] prompt retry admission outcome is unknown',
            error,
          );
          return;
        }
        if (!admitted) {
          restoreOrDeferCancelledRetry(retryOwner, {
            kind: 'failed-prompt',
            attemptId: retryAttemptId,
            failed,
          });
        }
        if (retryTranscriptIsCurrent()) {
          reportError(error, 'Failed to resend message');
        }
      })
      .finally(() => {
        if (!retryOwnerIsCurrent(retryOwner)) return;
        setFailedPromptRetry((current) =>
          current?.transcriptIdentity === retryTranscriptIdentity
            ? retryTranscriptIsCurrent()
              ? { ...current, settled: true }
              : null
            : current,
        );
      });
  }, [
    pushToast,
    reportError,
    restoreOrDeferCancelledRetry,
    retryOwnerIsCurrent,
    sendPrompt,
    store,
    t,
    updateFailedPrompt,
    updateUnknownPromptAdmission,
  ]);
  const canMutateMidTurn =
    connection.capabilities?.features.includes(
      'session_mid_turn_message_mutation',
    ) === true;
  const canQueryMidTurn =
    connection.capabilities?.features.includes(
      'session_mid_turn_message_query',
    ) === true;
  const {
    queuedPrompts,
    queuedTexts,
    enqueuePrompt: rawEnqueuePrompt,
    removeQueuedPrompt,
    editQueuedPrompt,
    editLastQueuedPrompt,
    clearQueuedPrompts,
    restoreUnknownQueuedPrompt,
    discardUnknownQueuedPrompt,
  } = useQueuedPrompts({
    connected,
    writeBlocked: sessionWriteBlocked,
    sessionId: connection.sessionId,
    workspaceCwd: connection.workspaceCwd,
    clientId: connection.clientId,
    canMutateMidTurn,
    canQueryMidTurn,
    streamingState,
    sessionActions,
    store,
    editorRef,
    reportError,
    t,
  });
  const enqueuePrompt = useCallback(
    (text, images, onComplete, commitComposerAccepted, inputAnnotations) => {
      if (onSubmitBeforeRef.current) {
        const sourceOwner = sessionOwnerGuard.capture();
        const sourceSessionId = connectionRef.current.sessionId;
        const sourceWorkspaceCwd = getComposerWorkspaceCwd();
        const sourceVersion = composerSourceVersionRef.current;
        const writeBlockGeneration = sessionWriteBlockGenerationRef.current;
        onSubmitBeforeRef
          .current({
            sessionId: sourceSessionId,
            prompt: text,
          })
          .then(() => {
            if (
              !appMountedRef.current ||
              !sourceOwner.isCurrent() ||
              sessionWriteBlockedRef.current ||
              sessionWriteBlockGenerationRef.current !== writeBlockGeneration ||
              connectionRef.current.sessionId !== sourceSessionId ||
              getComposerWorkspaceCwd() !== sourceWorkspaceCwd ||
              composerSourceVersionRef.current !== sourceVersion
            ) {
              return;
            }
            const result = rawEnqueuePrompt(
              text,
              images,
              onComplete,
              inputAnnotations,
            );
            if (result !== false) {
              if (commitComposerAccepted) {
                commitComposerAccepted();
              } else {
                editorRef.current?.clear();
              }
            }
            if (sourceSessionId && (text.trim() || (images?.length ?? 0) > 0)) {
              dispatchSessionChangeRef.current?.({
                type: 'submit',
                sessionId: sourceSessionId,
                prompt: text,
                queued: true,
              });
              if (sourceWorkspaceCwd) {
                sessionCatalogController.invalidateWorkspace(
                  sourceWorkspaceCwd,
                );
              }
            }
          })
          .catch((err) => {
            console.warn(
              '[web-shell] onSubmitBefore rejected queued prompt, cancelled',
              err,
            );
          });
        return false;
      }
      const result = rawEnqueuePrompt(
        text,
        images,
        onComplete,
        inputAnnotations,
      );
      const sessionId = connectionRef.current.sessionId;
      if (sessionId && (text.trim() || (images?.length ?? 0) > 0)) {
        dispatchSessionChangeRef.current?.({
          type: 'submit',
          sessionId,
          prompt: text,
          queued: true,
        });
        const workspaceCwd = getComposerWorkspaceCwd();
        if (workspaceCwd) {
          sessionCatalogController.invalidateWorkspace(workspaceCwd);
        }
      }
      return result;
    },
    [
      getComposerWorkspaceCwd,
      rawEnqueuePrompt,
      sessionCatalogController,
      sessionOwnerGuard,
    ],
  );
  useEffect(() => {
    for (const notice of notices) {
      if (shouldToastNotice(notice)) {
        pushToast(toastToneFromNotice(notice), notice.message);
      } else if (notice.category !== 'lifecycle') {
        console.warn('[web-shell] daemon notice', notice);
      }
      dismissNotice(notice.id);
    }
  }, [dismissNotice, notices, pushToast]);
  const onBugReportRef = useRef(onBugReport);
  onBugReportRef.current = onBugReport;
  useEffect(() => {
    currentSessionIdRef.current = connection.sessionId;
    btwAbortControllerRef.current?.abort();
    btwAbortControllerRef.current = null;
    setRecapMessage(null);
    setBtwMessage(null);
    setTasksDialogMessage(null);
    lastRecapBlockCountRef.current = 0;
  }, [connection.sessionId, connection.workspaceCwd]);
  const runVisibleRecap = useCallback(() => {
    if (sessionWriteBlocked) return;
    if (!requireActiveSessionForLocalCommand()) return;
    const messageId = `local-recap-${nextRecapMessageIdRef.current++}`;
    const anchorIndex = messages.length;
    const anchorAfterId = messages.at(-1)?.id;
    const sessionId = connection.sessionId;
    const workspaceCwd = connection.workspaceCwd;
    setRecapMessage({
      anchorAfterId,
      anchorIndex,
      message: {
        id: messageId,
        role: 'system',
        content: `※ ${t('recap.label')}: ${t('recap.loading')}`,
        variant: 'info',
        source: 'recap',
      },
    });
    sessionActions.recapSession().then(
      (result) => {
        if (
          currentSessionIdRef.current !== sessionId ||
          connectionRef.current.workspaceCwd !== workspaceCwd
        )
          return;
        setRecapMessage({
          anchorAfterId,
          anchorIndex,
          message: {
            id: messageId,
            role: 'system',
            content: result.recap
              ? `※ ${t('recap.label')}: ${result.recap}`
              : t('recap.empty'),
            variant: 'info',
            source: 'recap',
          },
        });
      },
      (error) => {
        if (
          currentSessionIdRef.current !== sessionId ||
          connectionRef.current.workspaceCwd !== workspaceCwd
        )
          return;
        setRecapMessage(null);
        if (!isAbortError(error) && !isAlreadyDispatched(error)) {
          console.warn('[web-shell] unhandled recap failure', error);
        }
      },
    );
  }, [
    connection.sessionId,
    connection.workspaceCwd,
    messages,
    requireActiveSessionForLocalCommand,
    sessionWriteBlocked,
    sessionActions,
    t,
  ]);
  const runVisibleBtw = useCallback(
    (rawQuestion) => {
      if (sessionWriteBlocked) return;
      const question = rawQuestion.trim();
      if (!question) {
        pushToast('error', t('btw.empty'));
        return;
      }
      if (!requireActiveSessionForLocalCommand()) return;
      const messageId = `local-btw-${nextBtwMessageIdRef.current++}`;
      const sessionId = connection.sessionId;
      const workspaceCwd = connection.workspaceCwd;
      btwAbortControllerRef.current?.abort();
      const abortController = new AbortController();
      btwAbortControllerRef.current = abortController;
      setBtwMessage({
        id: messageId,
        role: 'btw',
        question,
        answer: '',
        isPending: true,
      });
      sessionActions
        .btwSession(question, { signal: abortController.signal })
        .then(
          (result) => {
            if (
              currentSessionIdRef.current !== sessionId ||
              connectionRef.current.workspaceCwd !== workspaceCwd
            )
              return;
            if (btwAbortControllerRef.current !== abortController) return;
            btwAbortControllerRef.current = null;
            setBtwMessage({
              id: messageId,
              role: 'btw',
              question,
              answer: result.answer || t('btw.emptyAnswer'),
              isPending: false,
            });
          },
          (error) => {
            if (
              currentSessionIdRef.current !== sessionId ||
              connectionRef.current.workspaceCwd !== workspaceCwd
            )
              return;
            if (btwAbortControllerRef.current !== abortController) return;
            btwAbortControllerRef.current = null;
            setBtwMessage(null);
            if (!isAbortError(error) && !isAlreadyDispatched(error)) {
              console.warn('[web-shell] unhandled btw failure', error);
            }
          },
        );
    },
    [
      connection.sessionId,
      connection.workspaceCwd,
      pushToast,
      requireActiveSessionForLocalCommand,
      sessionWriteBlocked,
      sessionActions,
      t,
    ],
  );
  const dismissBtwMessage = useCallback(() => {
    btwAbortControllerRef.current?.abort();
    btwAbortControllerRef.current = null;
    setBtwMessage(null);
  }, []);
  useEffect(() => {
    const onBtwShortcut = (e) => {
      if (interactionBlocked || pendingApproval) return;
      const message = btwMessage;
      if (!message || message.role !== 'btw') return;
      const key = e.key.toLowerCase();
      const isPlainEscape =
        e.key === 'Escape' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey;
      const isCtrlCancel =
        e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.shiftKey &&
        (key === 'c' || key === 'd');
      if (message.isPending) {
        if (!isPlainEscape && !isCtrlCancel) return;
      } else {
        const editorHasText = editorRef.current?.hasInput() ?? false;
        const isPlainDismiss =
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey &&
          !e.shiftKey &&
          (e.key === 'Escape' ||
            (!editorHasText && (e.key === 'Enter' || e.key === ' ')));
        if (!isPlainDismiss) return;
      }
      e.preventDefault();
      e.stopPropagation();
      dismissBtwMessage();
    };
    window.addEventListener('keydown', onBtwShortcut, true);
    return () => window.removeEventListener('keydown', onBtwShortcut, true);
  }, [interactionBlocked, btwMessage, dismissBtwMessage, pendingApproval]);
  // Echo a local command into the transcript, or suppress it while a turn is
  // streaming so the injected user row can't split the active turn (see
  // appendOrDeferLocalUserMessage). Returns true when suppressed — callers must
  // then stop and not run the command's inline side effects. Exception:
  // read-only display commands wrap this in echoLocalCommandIfIdle and
  // intentionally ignore the suppression signal — their status-block output
  // does not split the active turn.
  const echoOrDeferLocalCommand = useCallback(
    (text, images) =>
      appendOrDeferLocalUserMessage(
        streamingStateRef.current !== 'idle',
        text,
        images,
        {
          append: (value) => store.appendLocalUserMessage(value),
        },
      ),
    [store],
  );
  // Echo a local command when idle, but never block it. Read-only display
  // commands (/stats, /about, /context) render their result as a status
  // block, which does not split the active turn, so they run immediately
  // mid-turn with only the echo skipped.
  const echoLocalCommandIfIdle = useCallback(
    (text) => {
      void echoOrDeferLocalCommand(text);
    },
    [echoOrDeferLocalCommand],
  );
  // Shared result dispatch for those read-only commands: `clearActiveText:
  // false` keeps the status block from finalizing the in-flight assistant
  // block mid-stream, which would split the streaming answer and orphan its
  // usage frames.
  const dispatchReadOnlyStatus = useCallback(
    (text) => {
      store.dispatch([{ type: 'status', text, clearActiveText: false }]);
      resumeChatBottomFollow('smooth');
    },
    [store, resumeChatBottomFollow],
  );
  const blockLocalCommandDuringTurn = useCallback(() => {
    pushToast('error', t('queue.commandBlocked'));
    return false;
  }, [pushToast, t]);
  const handleThemeChange = useCallback(
    (nextTheme) => {
      setSelectedTheme(nextTheme);
      onThemeChange?.(nextTheme);
    },
    [onThemeChange],
  );
  const handleLanguageChange = useCallback(
    (nextLanguage) => {
      setSelectedLanguage(nextLanguage);
      onLanguageChange?.(nextLanguage);
    },
    [onLanguageChange],
  );
  const handleToggleShortcuts = useCallback(() => {
    setShowHelpDialog(true);
  }, []);
  const workspaceSettingsState = useSettings({
    autoLoad: true,
  });
  const providersState = useProviders({ autoLoad: true });
  // useProviders returns a fresh object each render, but its `reload` identity is
  // stable — pull it out so callbacks can depend on the function alone without
  // re-creating on every render (and without an exhaustive-deps warning).
  const reloadProviders = providersState.reload;
  const [modelActionBusy, setModelActionBusy] = useState(false);
  const modelActionTokenRef = useRef(0);
  useLayoutEffect(() => {
    modelActionTokenRef.current += 1;
    setModelActionBusy(false);
  }, [logicalSessionKey]);
  const {
    settings: workspaceSettings,
    setValue: setWorkspaceSetting,
    reload: reloadWorkspaceSettings,
  } = workspaceSettingsState;
  const liveSetup = useLiveVoiceSetup(
    workspaceSettings.some(
      (setting) => setting.key === 'experimental.liveVoice.enabled',
    ),
  );
  const sessionWorkflowEnabled =
    workspaceSettings.find(
      (setting) => setting.key === 'experimental.sessionWorkflow',
    )?.values.effective === true;
  const reloadTargetedWorkspaceSettings = useCallback(async () => {
    const status = await reloadWorkspaceSettings();
    if (mainVoiceTarget?.route === 'workspace-qualified') {
      await reloadQualifiedVoiceSettings();
    }
    return status;
  }, [
    mainVoiceTarget?.route,
    reloadQualifiedVoiceSettings,
    reloadWorkspaceSettings,
  ]);
  const targetedWorkspaceSettings = useMemo(() => {
    const withoutVoice = workspaceSettings.filter(
      (setting) => setting.key !== 'voiceModel',
    );
    if (mainView === 'split') return withoutVoice;
    if (mainVoiceTarget?.route === 'legacy-primary') return workspaceSettings;
    if (!voiceModelSettingsSupported || !qualifiedVoiceSetting) {
      return withoutVoice;
    }
    const voiceIndex = workspaceSettings.findIndex(
      (setting) => setting.key === 'voiceModel',
    );
    if (voiceIndex < 0) {
      return [...withoutVoice, qualifiedVoiceSetting];
    }
    return workspaceSettings.map((setting) =>
      setting.key === 'voiceModel' ? qualifiedVoiceSetting : setting,
    );
  }, [
    mainView,
    mainVoiceTarget?.route,
    qualifiedVoiceSetting,
    voiceModelSettingsSupported,
    workspaceSettings,
  ]);
  const targetedWorkspaceSettingsState = {
    ...workspaceSettingsState,
    settings: targetedWorkspaceSettings,
    reload: reloadTargetedWorkspaceSettings,
    liveSetup,
  };
  const themeSetting = workspaceSettings.find(
    (setting) => setting.key === THEME_SETTING_KEY,
  );
  const hideTipsSetting = workspaceSettings.find(
    (setting) => setting.key === HIDE_TIPS_SETTING_KEY,
  );
  const languageSetting = workspaceSettings.find(
    (setting) => setting.key === LANGUAGE_SETTING_KEY,
  );
  const compactModeSetting = workspaceSettings.find(
    (setting) => setting.key === COMPACT_MODE_SETTING_KEY,
  );
  const currentVoiceModel = (() => {
    const value = readScopedModelSetting(
      targetedWorkspaceSettings,
      modelSettingScope,
      'voiceModel',
    );
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  })();
  const currentVisionModel = (() => {
    const value = readScopedModelSetting(
      workspaceSettings,
      modelSettingScope,
      'visionModel',
    );
    if (typeof value !== 'string' || !value.trim()) return undefined;
    return decodeVisionModelForPicker(value.trim());
  })();
  const currentFastModel = (() => {
    const value = readScopedModelSetting(
      workspaceSettings,
      modelSettingScope,
      'fastModel',
    );
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  })();
  const currentModelFallbacks = useMemo(() => {
    const value = readScopedModelSetting(
      workspaceSettings,
      modelSettingScope,
      'modelFallbacks',
    );
    return typeof value === 'string'
      ? value
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];
  }, [workspaceSettings, modelSettingScope]);
  const bumpVoiceRevision = useCallback((target, scope) => {
    if (!target) return;
    if (scope === 'user') {
      setVoiceUserRevision((revision) => revision + 1);
      return;
    }
    setVoiceWorkspaceRevisions((revisions) => ({
      ...revisions,
      [target.workspaceKey]: (revisions[target.workspaceKey] ?? 0) + 1,
    }));
  }, []);
  const writeVoiceModelForTarget = useCallback(
    async (value, scope, target = mainVoiceTarget) => {
      if (
        !target ||
        !supportsVoiceModelSettings(
          target,
          workspace.capabilities?.features ?? [],
        )
      ) {
        throw new Error(
          'Voice model settings are unavailable for this workspace.',
        );
      }
      try {
        if (target.route === 'legacy-primary' || scope === 'user') {
          await setWorkspaceSetting(scope, 'voiceModel', value);
        } else {
          await setVoiceModelSetting(workspace.client, target, scope, value);
        }
      } catch (error) {
        bumpVoiceRevision(target, scope);
        if (target.route === 'legacy-primary') {
          await reloadWorkspaceSettings().catch(() => undefined);
        } else {
          await reloadQualifiedVoiceSettings().catch(() => undefined);
        }
        throw error;
      }
      bumpVoiceRevision(target, scope);
      if (target.route === 'legacy-primary') {
        await reloadWorkspaceSettings().catch(() => undefined);
      } else {
        await reloadQualifiedVoiceSettings().catch(() => undefined);
      }
    },
    [
      bumpVoiceRevision,
      mainVoiceTarget,
      reloadQualifiedVoiceSettings,
      reloadWorkspaceSettings,
      setWorkspaceSetting,
      workspace.capabilities?.features,
      workspace.client,
    ],
  );
  const mainVoiceTargetRef = useRef(mainVoiceTarget);
  const voiceFeaturesRef = useRef(workspace.capabilities?.features ?? []);
  useLayoutEffect(() => {
    modelDialogModeRef.current = modelDialogMode;
    showFallbacksDialogRef.current = showFallbacksDialog;
    mainViewRef.current = mainView;
    activePanelRef.current = activePanel;
    showAuthDialogRef.current = showAuthDialog;
    mainVoiceTargetRef.current = mainVoiceTarget;
    voiceFeaturesRef.current = workspace.capabilities?.features ?? [];
  }, [
    activePanel,
    mainView,
    mainVoiceTarget,
    modelDialogMode,
    showAuthDialog,
    showFallbacksDialog,
    workspace.capabilities?.features,
  ]);
  const voicePickerRequestRef = useRef(0);
  const pendingVoicePickerSourceRef = useRef(undefined);
  const pendingVoicePickerOwnerRef = useRef(undefined);
  const voicePickerTargetRef = useRef(mainVoiceTarget);
  useEffect(
    () => () => {
      voicePickerRequestRef.current++;
      pendingVoicePickerSourceRef.current = undefined;
    },
    [],
  );
  const openVoiceModelPicker = useCallback(
    async (scope, source) => {
      const target = mainVoiceTargetRef.current;
      if (
        !target ||
        !supportsVoiceModelSettings(
          target,
          workspace.capabilities?.features ?? [],
        )
      ) {
        reportError(
          new Error('Voice model settings are unavailable for this workspace.'),
          t('model.setVoice'),
        );
        return;
      }
      const request = ++voicePickerRequestRef.current;
      pendingVoicePickerSourceRef.current = source;
      pendingVoicePickerOwnerRef.current = target.ownerKey;
      const intentIsCurrent = () =>
        request === voicePickerRequestRef.current &&
        mainVoiceTargetRef.current?.ownerKey === target.ownerKey &&
        supportsVoiceModelSettings(
          mainVoiceTargetRef.current,
          voiceFeaturesRef.current,
        ) &&
        (source === 'settings'
          ? activePanelRef.current === 'settings'
          : activePanelRef.current === null) &&
        mainViewRef.current === 'chat' &&
        modelDialogModeRef.current === null &&
        !showFallbacksDialogRef.current &&
        !showAuthDialogRef.current;
      try {
        const status = await loadVoiceProviders(workspace.client, target);
        if (!intentIsCurrent()) {
          if (request === voicePickerRequestRef.current) {
            pendingVoicePickerSourceRef.current = undefined;
          }
          return;
        }
        pendingVoicePickerSourceRef.current = undefined;
        voicePickerTargetRef.current = target;
        setVoiceModels(extractVoiceModels(status));
        setModelSettingScope(scope);
        setModelDialogMode('voice');
      } catch (error) {
        if (!intentIsCurrent()) {
          if (request === voicePickerRequestRef.current) {
            pendingVoicePickerSourceRef.current = undefined;
          }
          return;
        }
        pendingVoicePickerSourceRef.current = undefined;
        reportError(error, t('model.setVoice'));
      }
    },
    [reportError, t, workspace.capabilities?.features, workspace.client],
  );
  useEffect(() => {
    if (
      pendingVoicePickerSourceRef.current &&
      (pendingVoicePickerOwnerRef.current !== mainVoiceTarget?.ownerKey ||
        !voiceModelSettingsSupported)
    ) {
      voicePickerRequestRef.current++;
      pendingVoicePickerSourceRef.current = undefined;
    }
  }, [mainVoiceTarget?.ownerKey, voiceModelSettingsSupported]);
  useEffect(() => {
    const source = pendingVoicePickerSourceRef.current;
    const sourceSurfaceIsCurrent =
      source === 'settings' ? activePanel === 'settings' : activePanel === null;
    if (source && !sourceSurfaceIsCurrent) {
      voicePickerRequestRef.current++;
      pendingVoicePickerSourceRef.current = undefined;
    }
  }, [activePanel]);
  useEffect(() => {
    if (
      pendingVoicePickerSourceRef.current &&
      (mainView !== 'chat' ||
        modelDialogMode !== null ||
        showFallbacksDialog ||
        showAuthDialog)
    ) {
      voicePickerRequestRef.current++;
      pendingVoicePickerSourceRef.current = undefined;
    }
  }, [mainView, modelDialogMode, showAuthDialog, showFallbacksDialog]);
  useEffect(() => {
    const pickerTarget = voicePickerTargetRef.current;
    if (
      modelDialogMode === 'voice' &&
      (pickerTarget?.ownerKey !== mainVoiceTarget?.ownerKey ||
        !voiceModelSettingsSupported ||
        mainView !== 'chat')
    ) {
      setModelDialogMode(null);
    }
  }, [
    mainView,
    mainVoiceTarget?.ownerKey,
    modelDialogMode,
    voiceModelSettingsSupported,
  ]);
  // Fallback candidates are the selectable (non-runtime) models, keyed by their
  // base id — the same value shape the modelFallbacks setting stores.
  const fallbackModelOptions = useMemo(() => {
    // modelFallbacks stores bare ids and the dialog keys rows by baseId, so
    // dedupe here — multiple endpoints can expose the same base model id.
    const seen = new Set();
    const options = [];
    for (const m of (connection.models ?? [])
      .filter(isVisibleComposerModel)
      .filter((m) => !m.isRuntime)) {
      const baseId = m.baseModelId ?? extractBareModelId(m.id);
      if (seen.has(baseId)) continue;
      seen.add(baseId);
      options.push({
        baseId,
        label: getModelDisplayName(m.label || m.baseModelId || m.id),
      });
    }
    return options;
  }, [connection.models]);
  const [compactMode, setCompactMode] = useState(false);
  const compactModeRef = useRef(compactMode);
  compactModeRef.current = compactMode;
  useEffect(() => {
    const value = compactModeSetting?.values.effective;
    if (typeof value === 'boolean') setCompactMode(value);
  }, [compactModeSetting?.values.effective]);
  useEffect(() => {
    if (providedTheme) {
      setSelectedTheme(providedTheme);
      return;
    }
    const settingTheme = themeSettingToWebShellTheme(
      themeSetting?.values.effective,
    );
    if (settingTheme) {
      setSelectedTheme(settingTheme);
    }
  }, [providedTheme, themeSetting?.values.effective]);
  useEffect(() => {
    if (providedLanguage !== undefined) {
      setSelectedLanguage(normalizeLanguage(providedLanguage));
      return;
    }
    const settingLanguage = languageSettingToWebShellLanguage(
      languageSetting?.values.effective,
    );
    if (settingLanguage) {
      setSelectedLanguage(settingLanguage);
    }
  }, [providedLanguage, languageSetting?.values.effective]);
  const handleSettingsLanguageChange = useCallback(
    (nextLanguage, scope = 'user') => {
      if (sessionWriteBlocked) return;
      const owner = { current: sessionOwnerGuard.capture() };
      const previousLanguage = selectedLanguage;
      // Forward the settings tab's scope to the command so a Workspace-tab edit
      // persists to workspace settings instead of always writing user scope
      // (the /language command otherwise defaults to user). The command still
      // switches the daemon's live locale so command descriptions re-localize —
      // which a plain scoped settings write wouldn't do.
      const scopeFlag = scope === 'workspace' ? ' --project' : ' --global';
      const command = `/language ui ${nextLanguage}${scopeFlag}`;
      handleLanguageChange(nextLanguage);
      const refreshSettings = async () => {
        if (!owner.current.isCurrent()) return;
        await Promise.all([
          sessionActions.refreshCommands(),
          reloadWorkspaceSettings(),
        ]);
      };
      if (streamingStateRef.current !== 'idle') {
        handleLanguageChange(previousLanguage);
        blockLocalCommandDuringTurn();
        return;
      }
      sendPrompt(command, undefined, { ownerRef: owner })
        .then(refreshSettings)
        .catch((error) => {
          if (!owner.current.isCurrent()) return;
          handleLanguageChange(previousLanguage);
          reportError(error, 'Failed to sync /language command');
        });
    },
    [
      blockLocalCommandDuringTurn,
      handleLanguageChange,
      reloadWorkspaceSettings,
      reportError,
      sessionWriteBlocked,
      sendPrompt,
      selectedLanguage,
      sessionActions,
      sessionOwnerGuard,
    ],
  );
  const handleClearScreen = useCallback(() => {
    if (streamingStateRef.current !== 'idle') {
      store.dispatch([{ type: 'status', text: t('clear.blocked') }]);
      return;
    }
    autoRecapVersionRef.current += 1;
    lastRecapBlockCountRef.current = 0;
    store.reset();
  }, [store, t]);
  const handleToggleCompact = useCallback(() => {
    const previous = compactModeRef.current;
    const next = !compactModeRef.current;
    setCompactMode(next);
    setWorkspaceSetting('workspace', COMPACT_MODE_SETTING_KEY, next).catch(
      (error) => {
        setCompactMode(previous);
        reportError(error, t('compact.saveFailed'));
      },
    );
  }, [reportError, setWorkspaceSetting, t]);
  const handleSetMode = useCallback(
    (modeId) => {
      if (sessionWriteBlocked) return;
      if (!isDaemonApprovalMode(modeId)) {
        reportError(
          new Error(`Unsupported approval mode: ${modeId}`),
          t('local.approvalMode'),
        );
        return;
      }
      if (!connectionRef.current.sessionId) {
        setPendingMode(modeId);
        return;
      }
      const owner = sessionOwnerGuard.capture();
      sessionActions
        .setApprovalMode(modeId)
        .then((result) => {
          if (!owner.isCurrent()) return;
          const effectiveMode = result.mode || modeId;
          setCurrentMode(effectiveMode);
          const approval = pendingApprovalRef.current;
          if (!approval) return;
          const shouldAutoApprove =
            modeId === 'yolo' ||
            (modeId === 'auto-edit' && isEditToolPermission(approval));
          if (shouldAutoApprove) {
            const allowOnce = approval.options.find(
              (o) => o.kind === 'allow_once',
            );
            if (allowOnce) {
              const toolDesc = approval.title || '';
              store.dispatch([
                {
                  type: 'status',
                  text: t('mode.autoApproved', { tool: toolDesc }),
                },
              ]);
              sessionActions
                .submitPermission(approval.id, allowOnce.id)
                .catch((error) => {
                  reportError(error, 'Failed to auto-approve tool call');
                });
            }
          }
        })
        .catch((error) => {
          if (!owner.isCurrent()) return;
          reportError(error, t('local.approvalMode'));
        });
    },
    [
      sessionWriteBlocked,
      reportError,
      sessionActions,
      sessionOwnerGuard,
      setPendingMode,
      store,
      t,
    ],
  );
  useEffect(() => {
    streamingStateRef.current = streamingState;
  }, [streamingState]);
  // Drop queued commands on a session switch so the drain never runs a
  // command against a different workspace's daemon (mirrors useQueuedPrompts).
  const prevQueueSessionIdRef = useRef(logicalSessionKey);
  useEffect(() => {
    if (prevQueueSessionIdRef.current === logicalSessionKey) return;
    prevQueueSessionIdRef.current = logicalSessionKey;
    const dropped = queuedShellCommandsRef.current.length;
    queuedShellCommandsRef.current = [];
    // Skip the bump when the transition is into the session that
    // ensureSessionForPrompt is preparing — that is the submit's own lazy
    // creation, not a user-initiated switch.
    if (connection.sessionId !== preparingSessionIdRef.current) {
      drainGenerationRef.current++;
      isDrainingRef.current = false;
    }
    if (dropped > 0) {
      pushToast('warning', t('queue.shellDropped', { count: dropped }));
    }
  }, [connection.sessionId, logicalSessionKey, pushToast, t]);
  // Declared after the session-switch wipe effect above: React runs effects in
  // declaration order, so the queue is already cleared before this drain sees it.
  const prevShellDrainStreamingStateRef = useRef(streamingState);
  useEffect(() => {
    const prev = prevShellDrainStreamingStateRef.current;
    prevShellDrainStreamingStateRef.current = streamingState;
    // Only start a drain on the transition into idle. sendShellCommand drives
    // streamingState non-idle while each command runs, so cancelling the drain
    // on every streamingState change would drop every command after the first.
    if (prev === 'idle' || streamingState !== 'idle') return;
    // A running drain re-reads the queue after each batch, so commands queued
    // mid-drain are picked up by it. Starting a second drain here would bump the
    // generation and cancel the in-flight batch, silently dropping commands.
    if (isDrainingRef.current) return;
    const cmds = queuedShellCommandsRef.current;
    if (cmds.length === 0) return;
    queuedShellCommandsRef.current = [];
    isDrainingRef.current = true;
    const generation = ++drainGenerationRef.current;
    const drainSessionId = connectionRef.current.sessionId;
    const drainWorkspaceCwd = getComposerWorkspaceCwd();
    const drainOwner = sessionOwnerGuard.capture();
    void (async () => {
      try {
        let batch = cmds;
        while (batch.length > 0) {
          for (let i = 0; i < batch.length; i++) {
            const generationChanged = drainGenerationRef.current !== generation;
            if (
              generationChanged ||
              !drainOwner.isCurrent() ||
              connectionRef.current.sessionId !== drainSessionId ||
              connectionRef.current.status !== 'connected'
            ) {
              let dropped = batch.length - i;
              if (!generationChanged) {
                // The two generation-bump sites (session switch, cancel) wipe
                // the queue themselves, so anything parked here was queued
                // after the drop and is fresh user intent. A disconnect has no
                // such wipe — clear it so a reconnect cannot resurrect a newer
                // command behind an already-dropped older one.
                dropped += queuedShellCommandsRef.current.length;
                queuedShellCommandsRef.current = [];
              }
              console.warn(
                '[web-shell] dropping %d queued shell command(s)',
                dropped,
              );
              pushToast('warning', t('queue.shellDropped', { count: dropped }));
              return;
            }
            try {
              await sessionActions.sendShellCommand(batch[i]);
            } catch (error) {
              reportError(
                error,
                `Failed to execute shell command: !${batch[i]}`,
              );
            } finally {
              if (drainWorkspaceCwd) {
                sessionCatalogController.invalidateWorkspace(drainWorkspaceCwd);
              }
            }
          }
          batch = queuedShellCommandsRef.current;
          queuedShellCommandsRef.current = [];
        }
      } finally {
        // Release the lock only if this IIFE is still the active drainer; a
        // cancel or session switch may have bumped the generation and handed
        // the lock to a newer drain that must not be unblocked prematurely.
        if (drainGenerationRef.current === generation) {
          isDrainingRef.current = false;
        }
      }
    })();
  }, [
    getComposerWorkspaceCwd,
    pushToast,
    reportError,
    sessionActions,
    sessionCatalogController,
    sessionOwnerGuard,
    streamingState,
    t,
  ]);
  useEffect(() => {
    const retryableTurnError = getRetryableTurnError(blocks);
    if (retryableTurnError) {
      rearmFailedTurnErrorRetry(retryableTurnError, blocks);
    }
    const previousIdentity = retryableTurnErrorIdentityRef.current;
    const identityMatches =
      previousIdentity === undefined ||
      (retryableTurnError !== undefined &&
        matchesTurnErrorIdentity(retryableTurnError, previousIdentity));
    if (
      retryableTurnError &&
      previousIdentity &&
      identityMatches &&
      retriedTurnErrorIdRef.current !== null
    ) {
      retriedTurnErrorIdRef.current = retryableTurnError.id;
    }
    const canRetry =
      connected &&
      retryableTurnError !== undefined &&
      identityMatches &&
      retryableTurnError.id !== retriedTurnErrorIdRef.current &&
      failedPromptRetry === null &&
      lastSubmittedSourceVersionRef.current ===
        composerSourceVersionRef.current &&
      (lastSubmittedPromptRef.current.length > 0 ||
        (lastSubmittedImagesRef.current?.length ?? 0) > 0);
    if (retryableTurnError && previousIdentity && !identityMatches) {
      lastSubmittedPromptRef.current = '';
      lastSubmittedImagesRef.current = undefined;
      lastSubmittedInputAnnotationsRef.current = undefined;
      lastSubmittedSourceVersionRef.current = -1;
      retryableTurnErrorIdentityRef.current = undefined;
      retriedTurnErrorIdRef.current = null;
      failedTurnErrorRetryRef.current = null;
    } else if (canRetry) {
      retryableTurnErrorIdentityRef.current = { block: retryableTurnError };
    }
    retryableTurnErrorIdRef.current = canRetry ? retryableTurnError.id : null;
    setShowRetryHint(canRetry);
  }, [blocks, connected, failedPromptRetry, rearmFailedTurnErrorRetry]);
  useEffect(() => {
    onStreamingStateChange?.(streamingState);
  }, [streamingState, onStreamingStateChange]);
  // Reads retryableTurnErrorIdRef which is set by the blocks effect above.
  // Declaration order matters: this effect must run after the blocks effect
  // so that within the same render, the ref is already updated before we read it.
  const prevStreamingForTurnCompleteRef = useRef(streamingState);
  const streamingSessionIdRef = useRef(undefined);
  const streamingWorkspaceCwdRef = useRef(undefined);
  useEffect(() => {
    const prev = prevStreamingForTurnCompleteRef.current;
    prevStreamingForTurnCompleteRef.current = streamingState;
    if (streamingState !== 'idle') {
      if (prev === 'idle' || streamingSessionIdRef.current === undefined) {
        streamingSessionIdRef.current = connection.sessionId;
        streamingWorkspaceCwdRef.current = connection.workspaceCwd;
      } else if (
        connection.sessionId === streamingSessionIdRef.current &&
        streamingWorkspaceCwdRef.current === undefined
      ) {
        streamingWorkspaceCwdRef.current = connection.workspaceCwd;
      }
    }
    if (prev !== 'idle' && streamingState === 'idle') {
      const sessionId = connectionRef.current.sessionId;
      const workspaceCwd = connectionRef.current.workspaceCwd;
      // Only fire if the session that was streaming is still the active one.
      // Session switches reset streamingState to idle, which must not produce
      // a spurious turn_complete for the new session.
      if (
        !sessionId ||
        sessionId !== streamingSessionIdRef.current ||
        workspaceCwd !== streamingWorkspaceCwdRef.current
      ) {
        return;
      }
      const turnError =
        retryableTurnErrorIdRef.current != null
          ? new Error(`Turn error (block ${retryableTurnErrorIdRef.current})`)
          : undefined;
      if (workspaceCwd) {
        sessionCatalogController.turnCompleted(workspaceCwd);
        if (!connectionRef.current.displayName) {
          scheduleDelayedActiveSessionDisplayNameRefresh(
            sessionId,
            workspaceCwd,
          );
          if (typeof document !== 'undefined' && document.hidden) {
            pendingDisplayNameRefreshRef.current = {
              sessionId,
              workspaceCwd,
            };
          } else {
            void refreshActiveSessionDisplayNameRef.current();
          }
        }
      }
      dispatchSessionChangeRef.current?.({
        type: 'turn_complete',
        sessionId,
        error: turnError,
      });
    }
  }, [
    connection.sessionId,
    connection.workspaceCwd,
    scheduleDelayedActiveSessionDisplayNameRefresh,
    sessionCatalogController,
    streamingState,
  ]);
  useEffect(() => {
    onConnectionChange?.(connection.status);
  }, [connection.status, onConnectionChange]);
  useEffect(() => {
    onTranscriptChange?.(blocks);
  }, [blocks, onTranscriptChange]);
  useEffect(() => {
    if (connection.error) {
      const error = new Error(connection.error);
      onError?.(error);
    }
  }, [connection.error, onError]);
  useLayoutEffect(() => {
    setCurrentModel(connection.currentModel ?? '');
  }, [connection.currentModel, logicalSessionKey]);
  useLayoutEffect(() => {
    setCurrentMode(connection.currentMode ?? 'default');
  }, [connection.currentMode, logicalSessionKey]);
  useEffect(() => {
    if (!connection.sessionId && connection.missingSession) {
      // Keep the dead-session route visible until the user explicitly starts a
      // new chat; clearing it here would immediately hide the recovery state.
      lastNotifiedSessionIdRef.current = connection.sessionId;
      lastNotifiedWorkspaceIdRef.current = undefined;
      lastNotifiedWorkspaceCwdRef.current = undefined;
      return;
    }
    const reportedWorkspaceCwd = connection.sessionId
      ? connection.workspaceCwd
      : activeWorkspaceCwd;
    const activeWorkspace = workspaces.find(
      (entry) => entry.cwd === reportedWorkspaceCwd,
    );
    if (connection.sessionId && !workspace.capabilities) return;
    const workspaceId =
      activeWorkspace && !activeWorkspace.primary
        ? activeWorkspace.id
        : undefined;
    if (
      lastNotifiedSessionIdRef.current === connection.sessionId &&
      lastNotifiedWorkspaceIdRef.current === workspaceId &&
      lastNotifiedWorkspaceCwdRef.current === reportedWorkspaceCwd
    ) {
      return;
    }
    lastNotifiedSessionIdRef.current = connection.sessionId;
    lastNotifiedWorkspaceIdRef.current = workspaceId;
    lastNotifiedWorkspaceCwdRef.current = reportedWorkspaceCwd;
    onSessionIdChange?.(
      connection.sessionId,
      workspaceId,
      reportedWorkspaceCwd,
    );
  }, [
    connection.missingSession,
    connection.sessionId,
    connection.workspaceCwd,
    onSessionIdChange,
    activeWorkspaceCwd,
    workspace.capabilities,
    workspaces,
  ]);
  const lastRenameSessionRef = useRef(undefined);
  const lastRenameNameRef = useRef(undefined);
  const lastReconciledRenameRef = useRef(undefined);
  const reconcileCatalogRename = useCallback(
    (workspaceCwd, sessionId, displayName) => {
      lastReconciledRenameRef.current = {
        workspaceCwd,
        sessionId,
        displayName,
      };
      if (workspaceCwd) {
        sessionCatalogController.renamed(workspaceCwd, sessionId, displayName);
      }
    },
    [sessionCatalogController],
  );
  useEffect(() => {
    const sessionId = connection.sessionId;
    const displayName = connection.displayName;
    if (!sessionId || !displayName) return;
    if (logicalSessionKey !== lastRenameSessionRef.current) {
      lastRenameSessionRef.current = logicalSessionKey;
      lastRenameNameRef.current = displayName;
      lastReconciledRenameRef.current = undefined;
      return;
    }
    if (displayName === lastRenameNameRef.current) return;
    lastRenameNameRef.current = displayName;
    const reconciled = lastReconciledRenameRef.current;
    lastReconciledRenameRef.current = undefined;
    const alreadyReconciled =
      reconciled !== undefined &&
      reconciled.workspaceCwd === connection.workspaceCwd &&
      reconciled.sessionId === sessionId &&
      reconciled.displayName === displayName;
    if (!alreadyReconciled) {
      if (connection.workspaceCwd) {
        sessionCatalogController.renamed(
          connection.workspaceCwd,
          sessionId,
          displayName,
        );
      }
    }
    dispatchSessionChangeRef.current?.({
      type: 'rename',
      sessionId,
      newName: displayName,
    });
  }, [
    connection.displayName,
    connection.sessionId,
    connection.workspaceCwd,
    logicalSessionKey,
    sessionCatalogController,
  ]);
  useEffect(() => {
    const nextGoal = getLatestActiveGoalFromBlocks(blocks);
    setActiveGoal((current) => {
      if (!nextGoal) return current ? null : current;
      if (
        current?.condition === nextGoal.condition &&
        current.setAt === nextGoal.setAt
      ) {
        return current;
      }
      return nextGoal;
    });
  }, [blocks]);
  useEffect(() => {
    const onGoalStatusActive = (event) => {
      const detail = event.detail;
      if (!detail?.active) {
        setActiveGoal(null);
        return;
      }
      if (!detail.condition) return;
      setActiveGoal({
        condition: detail.condition,
        setAt: detail.setAt ?? Date.now(),
      });
    };
    window.addEventListener(GOAL_STATUS_ACTIVE_EVENT, onGoalStatusActive);
    return () =>
      window.removeEventListener(GOAL_STATUS_ACTIVE_EVENT, onGoalStatusActive);
  }, []);
  // Auto-recap: fire when the user returns after being away ≥ 3 minutes
  const hiddenAtRef = useRef(null);
  const lastRecapBlockCountRef = useRef(0);
  const autoRecapVersionRef = useRef(0);
  useEffect(() => {
    lastRecapBlockCountRef.current = 0;
    autoRecapVersionRef.current += 1;
  }, [logicalSessionKey]);
  useEffect(() => {
    const AWAY_THRESHOLD_MS = 3 * 60 * 1000;
    const MIN_NEW_BLOCKS = 4;
    function onVisibilityChange() {
      if (document.hidden) {
        if (hiddenAtRef.current === null) hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt === null) return;
      if (Date.now() - hiddenAt < AWAY_THRESHOLD_MS) return;
      if (sessionWriteBlocked) return;
      if (streamingStateRef.current !== 'idle') return;
      if (!connection.sessionId) return;
      const currentCount = store.getSnapshot().blocks.length;
      if (currentCount - lastRecapBlockCountRef.current < MIN_NEW_BLOCKS)
        return;
      lastRecapBlockCountRef.current = currentCount;
      const sessionId = connection.sessionId;
      const version = autoRecapVersionRef.current;
      const owner = sessionOwnerGuard.capture();
      // Local-only commands also append user blocks. Treat any new visible user
      // activity as invalidating the recap rather than risk placing it too late.
      const userBlockId = getLatestUserBlockId(store.getSnapshot().blocks);
      sessionActions.recapSession().then(
        (result) => {
          const currentUserBlockId = getLatestUserBlockId(
            store.getSnapshot().blocks,
          );
          // result.sessionId only pins the daemon wire contract (the daemon
          // echoes the id back), not a real race; the epoch/connection checks
          // catch those. Kept so it is not simplified away as redundant.
          if (
            autoRecapVersionRef.current !== version ||
            !owner.isCurrent() ||
            connectionRef.current.sessionId !== sessionId ||
            result.sessionId !== sessionId ||
            currentUserBlockId !== userBlockId ||
            streamingStateRef.current !== 'idle'
          ) {
            console.warn('[auto-recap] discarding stale recap', {
              captured: { sessionId, version, userBlockId },
              current: {
                sessionId: connectionRef.current.sessionId,
                version: autoRecapVersionRef.current,
                userBlockId: currentUserBlockId,
                streamingState: streamingStateRef.current,
              },
              result: result.sessionId,
            });
            return;
          }
          if (result.recap) {
            store.dispatch([
              {
                type: 'status',
                text: `※ ${t('recap.label')}: ${result.recap}`,
                source: 'recap',
              },
            ]);
          }
        },
        (error) => {
          console.error('[auto-recap] failed:', error);
        },
      );
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [
    connection.sessionId,
    sessionActions,
    sessionOwnerGuard,
    sessionWriteBlocked,
    store,
    t,
  ]);
  const handleCycleMode = useCallback(() => {
    const idx = isDaemonApprovalMode(currentMode)
      ? MODES_CYCLE.indexOf(currentMode)
      : -1;
    const next = MODES_CYCLE[(idx + 1) % MODES_CYCLE.length];
    handleSetMode(next);
  }, [currentMode, handleSetMode]);
  // Shared by the /context slash command and the status-bar context
  // indicator. Echoes the command when idle — that also makes the transcript
  // follow the tail (MessageList Rule 4). Mid-turn the echo is skipped and
  // dispatchReadOnlyStatus's resumeChatBottomFollow resumes bottom-follow,
  // so the panel is revealed even when the click comes while scrolled up.
  const showContextUsage = useCallback(
    (commandText, detail) => {
      // Read-only: every entry point (keyboard, status-bar button, in-chat
      // "context detail" click) runs immediately, even mid-turn — only the
      // echo is skipped while streaming so the active turn is not split.
      if (!requireActiveSessionForLocalCommand()) return;
      const owner = sessionOwnerGuard.capture();
      echoLocalCommandIfIdle(commandText);
      sessionActions
        .getContextUsage({ detail })
        .then((result) => {
          if (!owner.isCurrent()) return;
          dispatchReadOnlyStatus(serializeContextUsageMessage(result));
        })
        .catch((error) => {
          if (!owner.isCurrent()) return;
          reportError(error, 'Failed to load context usage');
        });
    },
    [
      echoLocalCommandIfIdle,
      dispatchReadOnlyStatus,
      requireActiveSessionForLocalCommand,
      sessionActions,
      sessionOwnerGuard,
      reportError,
    ],
  );
  // Stable identity: ChatEditor is memoized and an inline closure would
  // re-render it on every app render.
  const handleShowContextUsage = useCallback(
    () => showContextUsage('/context', false),
    [showContextUsage],
  );
  // Stable reference: this travels through the memoized MessageList →
  // MessageItem chain, so an inline closure would defeat their memo.
  const handleShowContextDetail = useCallback(() => {
    showContextUsage('/context detail', true);
  }, [showContextUsage]);
  const branchCurrentSession = useCallback(
    (name) => {
      if (sessionWriteBlocked) return;
      if (!requireActiveSessionForLocalCommand()) return;
      sessionActions
        .branchSession(name || undefined)
        .then((result) => {
          store.dispatch([
            {
              type: 'status',
              text: t('branch.success', {
                name: result.displayName,
              }),
            },
          ]);
        })
        .catch((error) => {
          reportError(error, t('branch.failed'));
        });
    },
    [
      reportError,
      requireActiveSessionForLocalCommand,
      sessionWriteBlocked,
      sessionActions,
      store,
      t,
    ],
  );
  const handleBranchCurrentSession = useCallback(() => {
    branchCurrentSession();
  }, [branchCurrentSession]);
  const composerFocusRequestRef = useRef(0);
  const scheduleComposerFocus = useCallback((sessionId) => {
    const request = ++composerFocusRequestRef.current;
    window.setTimeout(() => {
      if (
        request !== composerFocusRequestRef.current ||
        approvalOverlayActiveRef.current ||
        (sessionId !== undefined &&
          connectionRef.current.sessionId !== sessionId)
      ) {
        return;
      }
      editorRef.current?.focus();
    }, 0);
    return request;
  }, []);
  const createNewSession = useCallback(
    async (
      workspaceCwd,
      /**
       * Leave `mainView` alone. The default is to switch to the chat, because a
       * user who asks for a new chat wants to see it — but the Goals form has to
       * stay mounted until its prompt is admitted, or a rejection has nowhere to
       * render. Only that caller passes this.
       */
      opts,
    ) => {
      const targetWorkspaceCwd = lockedWorkspaceCwd ?? workspaceCwd;
      composerSourceVersionRef.current += 1;
      selectedWorkspaceCwdRef.current = targetWorkspaceCwd;
      setSelectedWorkspaceCwd(targetWorkspaceCwd);
      // Starting a fresh chat drops any pending git mode intent so it never
      // leaks into the next created session.
      setGitModeIntent({ mode: 'current' });
      // Close the drawer before awaiting so a failed createSession() doesn't leave
      // it stuck open with the page scroll still locked, matching loadSidebarSession.
      closeMobileDrawer();
      // Starting a new chat means the user wants to see it — leave any open
      // Settings/Status panel so the fresh chat is visible (no-op when closed).
      closePanel();
      if (!opts?.keepView) setMainView('chat');
      let focusRequest;
      try {
        autoRecapVersionRef.current += 1;
        const clearPromise = sessionActions.clearSession();
        focusRequest = scheduleComposerFocus();
        await Promise.all([
          clearPromise,
          reloadLoadedSkills(targetWorkspaceCwd),
        ]);
        // Clear after successful clearSession — if it rejects, the old
        // session's worktree/branch state is preserved.
        setSessionWorktree(undefined);
        setSessionBranch(undefined);
        return true;
      } catch (error) {
        if (composerFocusRequestRef.current === focusRequest) {
          composerFocusRequestRef.current += 1;
        }
        reportError(error, 'Failed to start a new chat');
        return false;
      }
    },
    [
      closeMobileDrawer,
      closePanel,
      lockedWorkspaceCwd,
      reportError,
      reloadLoadedSkills,
      scheduleComposerFocus,
      sessionActions,
    ],
  );
  /**
   * Serializes workspace intent. An active session keeps its owner and is
   * replaced by a fresh chat; a draft only changes its next-session target.
   */
  const switchWorkspace = useCallback(
    async (workspaceCwd, acceptedWorkspaces = workspacesRef.current) => {
      if (workspaceSwitchTokenRef.current) return;
      const token = Symbol('workspace-switch');
      workspaceSwitchTokenRef.current = token;
      try {
        const primaryCwd = acceptedWorkspaces.find(
          (entry) => entry.primary,
        )?.cwd;
        const targetCwd = workspaceCwd ?? primaryCwd;
        if (workspaceCwd) {
          const target = acceptedWorkspaces.find(
            (entry) => entry.cwd === workspaceCwd,
          );
          if (!target?.trusted) return;
        }
        if (connectionRef.current.sessionId) {
          if (connectionRef.current.workspaceCwd === targetCwd) return;
          await createNewSession(workspaceCwd);
          return;
        }
        composerSourceVersionRef.current += 1;
        selectedWorkspaceCwdRef.current = workspaceCwd;
        setSelectedWorkspaceCwd(workspaceCwd);
      } finally {
        if (workspaceSwitchTokenRef.current === token) {
          workspaceSwitchTokenRef.current = null;
        }
      }
    },
    [createNewSession],
  );
  /** Refreshes once and switches only from the accepted capability snapshot. */
  const reconcileAddedWorkspace = useCallback(
    async (canonicalCwd) => {
      try {
        const capabilities = await refreshWorkspaceCapabilities?.();
        const acceptedWorkspaces = capabilities?.workspaces ?? [];
        const added = acceptedWorkspaces.find(
          (entry) => entry.cwd === canonicalCwd,
        );
        if (added?.trusted) {
          await switchWorkspace(
            added.primary ? undefined : added.cwd,
            acceptedWorkspaces,
          );
        }
        return capabilities !== undefined;
      } catch (error) {
        reportError(error, 'Failed to refresh the workspace list');
        return false;
      }
    },
    [refreshWorkspaceCapabilities, reportError, switchWorkspace],
  );
  /** Registers an existing directory through the shared mutation lane. */
  const handleAddWorkspace = useCallback(
    async (cwd, persist, displayName) => {
      if (workspaceMutationTokenRef.current) {
        throw new Error(t('sidebar.addWorkspaceBusyError'));
      }
      const token = Symbol('workspace-mutation');
      workspaceMutationTokenRef.current = token;
      setWorkspaceMutationBusy(true);
      try {
        const effectivePersist =
          persistentWorkspaceRegistrationSupported === true && persist;
        const effectiveDisplayName = workspaceDisplayNameSupported
          ? displayName
          : undefined;
        const result = await workspaceActions.addWorkspace(cwd, {
          persist: effectivePersist,
          ...(effectiveDisplayName
            ? { displayName: effectiveDisplayName }
            : {}),
        });
        if (effectivePersist && result.persisted !== true) {
          throw new Error(t('sidebar.addWorkspacePersistenceError'));
        }
        const reconciled = await reconcileAddedWorkspace(result.cwd);
        if (!reconciled) {
          throw new Error(t('sidebar.addWorkspaceRefreshError'));
        }
      } finally {
        if (workspaceMutationTokenRef.current === token) {
          workspaceMutationTokenRef.current = null;
          setWorkspaceMutationBusy(false);
        }
      }
    },
    [
      persistentWorkspaceRegistrationSupported,
      reconcileAddedWorkspace,
      t,
      workspaceDisplayNameSupported,
      workspaceActions,
    ],
  );
  /**
   * Reconciles either a known committed cwd or an unknown POST outcome. Known
   * commits may switch; unknown outcomes require explicit user acknowledgement.
   */
  const refreshScratchOutcome = useCallback(async () => {
    setScratchOutcome('refreshing');
    try {
      const capabilities = await refreshWorkspaceCapabilities?.();
      if (!capabilities) return;
      const acceptedWorkspaces = capabilities.workspaces ?? [];
      const committedCwd = committedScratchCwdRef.current;
      if (committedCwd) {
        const added = acceptedWorkspaces.find(
          (entry) => entry.cwd === committedCwd,
        );
        if (added?.trusted) {
          await switchWorkspace(
            added.primary ? undefined : added.cwd,
            acceptedWorkspaces,
          );
        }
        committedScratchCwdRef.current = undefined;
        setScratchOutcome('clear');
      } else {
        setScratchOutcome('awaiting-ack');
      }
    } catch (error) {
      reportError(error, 'Failed to refresh the workspace list');
    }
  }, [
    reportError,
    setScratchOutcome,
    switchWorkspace,
    refreshWorkspaceCapabilities,
  ]);
  /**
   * Creates at most one scratch directory per intent and locks further POSTs
   * whenever timeout, transport failure, or refresh leaves the result unclear.
   */
  const handleCreateScratchWorkspace = useCallback(async () => {
    if (
      scratchOutcomeUnknownRef.current !== 'clear' ||
      workspaceMutationTokenRef.current
    ) {
      return;
    }
    const token = Symbol('workspace-mutation');
    workspaceMutationTokenRef.current = token;
    setWorkspaceMutationBusy(true);
    try {
      const result = await workspaceActions.addScratchWorkspace();
      const reconciled = await reconcileAddedWorkspace(result.cwd);
      if (!reconciled) {
        committedScratchCwdRef.current = result.cwd;
        setScratchOutcome('refreshing');
      }
    } catch (error) {
      const definitelyRejected =
        error instanceof DaemonHttpError &&
        (error.status < 500 || error.status === 501);
      if (definitelyRejected) {
        reportError(error, t('sidebar.addWorkspaceError'));
      } else {
        committedScratchCwdRef.current = undefined;
        setScratchOutcome('refreshing');
        await refreshScratchOutcome();
      }
    } finally {
      if (workspaceMutationTokenRef.current === token) {
        workspaceMutationTokenRef.current = null;
        setWorkspaceMutationBusy(false);
      }
    }
  }, [
    reconcileAddedWorkspace,
    refreshScratchOutcome,
    reportError,
    setScratchOutcome,
    t,
    workspaceActions,
  ]);
  const handleSelectComposerWorkspace = useCallback(
    (cwd) => {
      void switchWorkspace(cwd);
    },
    [switchWorkspace],
  );
  const handleCreateComposerScratchWorkspace = useCallback(() => {
    void handleCreateScratchWorkspace();
  }, [handleCreateScratchWorkspace]);
  const handleOpenExistingWorkspace = useCallback(() => {
    setShowAddWorkspaceDialog(true);
  }, []);
  const handleComposerAttachmentsChange = useCallback((hasAttachments) => {
    setHasComposerAttachments(hasAttachments);
  }, []);
  const generateSuggestionContent = useCallback(
    (prompt, options) => {
      void logicalSessionKey;
      return sessionActions.generateSessionContent(prompt, options);
    },
    [logicalSessionKey, sessionActions],
  );
  const {
    suggestion: newSessionSuggestion,
    updateInput: updateNewSessionSuggestionInput,
    dismiss: dismissNewSessionSuggestion,
    suppress: suppressNewSessionSuggestion,
  } = useNewSessionSuggestion({
    enabled:
      connection.capabilities?.features.includes('session_generation') === true,
    messages,
    sessionId: connection.sessionId,
    contextUsageRatio:
      (connection.contextWindow ?? 0) > 0
        ? (connection.tokenCount ?? 0) / (connection.contextWindow ?? 0)
        : 0,
    isRunning: streamingState !== 'idle',
    dialogOpen: interactionBlocked || approvalOverlayActive,
    hasAttachments: hasComposerAttachments,
    generateContent: generateSuggestionContent,
  });
  const handleComposerTextChange = useCallback(
    (text) => {
      composerTextRef.current = text;
      updateNewSessionSuggestionInput(text);
    },
    [updateNewSessionSuggestionInput],
  );
  const flushPendingNewSessionSuggestionSubmit = useCallback(
    (expectedToken) => {
      const pending = pendingNewSessionSuggestionSubmitRef.current;
      if (!pending) return;
      if (expectedToken !== undefined && pending.token !== expectedToken)
        return;
      const activeSessionId = connectionRef.current.sessionId;
      if (
        pending.sourceSessionId !== undefined &&
        activeSessionId !== undefined &&
        activeSessionId !== pending.sourceSessionId
      ) {
        pendingNewSessionSuggestionSubmitRef.current = null;
        setIsStartingNewSessionSuggestion(false);
        return;
      }
      if (!pending.sessionClearCompleted) {
        return;
      }
      if (activeSessionId !== undefined) {
        return;
      }
      if (pending.submitScheduled) {
        return;
      }
      pendingNewSessionSuggestionSubmitRef.current = {
        ...pending,
        submitScheduled: true,
      };
      window.setTimeout(() => {
        const latestPending = pendingNewSessionSuggestionSubmitRef.current;
        if (!latestPending || latestPending.token !== pending.token) {
          return;
        }
        if (connectionRef.current.sessionId !== undefined) {
          pendingNewSessionSuggestionSubmitRef.current = null;
          setIsStartingNewSessionSuggestion(false);
          return;
        }
        pendingNewSessionSuggestionSubmitRef.current = null;
        editorRef.current?.submit();
        editorRef.current?.focus();
        setIsStartingNewSessionSuggestion(false);
      }, 0);
    },
    [],
  );
  useEffect(() => {
    flushPendingNewSessionSuggestionSubmit();
  }, [connection.sessionId, flushPendingNewSessionSuggestionSubmit]);
  const handleAcceptNewSessionSuggestion = useCallback(() => {
    const draft = composerTextRef.current.trim();
    if (!draft || isStartingNewSessionSuggestion) return;
    if (
      newSessionSuggestion?.suggestion !== 'new_session' ||
      newSessionSuggestion.classifiedInput !== draft ||
      newSessionSuggestion.sourceSessionId !== connectionRef.current.sessionId
    ) {
      dismissNewSessionSuggestion();
      return;
    }
    suppressNewSessionSuggestion();
    setIsStartingNewSessionSuggestion(true);
    const token = newSessionSuggestionSubmitTokenRef.current + 1;
    newSessionSuggestionSubmitTokenRef.current = token;
    pendingNewSessionSuggestionSubmitRef.current = {
      token,
      sourceSessionId: connectionRef.current.sessionId,
      sessionClearCompleted: false,
      submitScheduled: false,
    };
    void createNewSession().then((created) => {
      const pending = pendingNewSessionSuggestionSubmitRef.current;
      if (!created || pending?.token !== token) {
        if (pending?.token === token) {
          pendingNewSessionSuggestionSubmitRef.current = null;
        }
        setIsStartingNewSessionSuggestion(false);
        return;
      }
      pendingNewSessionSuggestionSubmitRef.current = {
        ...pending,
        sessionClearCompleted: true,
      };
      onSessionIdChange?.(undefined);
      flushPendingNewSessionSuggestionSubmit(token);
    });
  }, [
    createNewSession,
    dismissNewSessionSuggestion,
    flushPendingNewSessionSuggestionSubmit,
    isStartingNewSessionSuggestion,
    newSessionSuggestion,
    onSessionIdChange,
    suppressNewSessionSuggestion,
  ]);
  const handleAcceptBtwSuggestion = useCallback(() => {
    const draft = composerTextRef.current.trim();
    if (
      !draft ||
      newSessionSuggestion?.suggestion !== 'btw' ||
      newSessionSuggestion.classifiedInput !== draft ||
      newSessionSuggestion.sourceSessionId !==
        connectionRef.current.sessionId ||
      editorRef.current?.hasAttachments() !== false
    ) {
      dismissNewSessionSuggestion();
      return;
    }
    dismissNewSessionSuggestion();
    editorRef.current?.submit({ text: `/btw ${draft}` });
    editorRef.current?.focus();
  }, [dismissNewSessionSuggestion, newSessionSuggestion]);
  const shellApi = useMemo(
    () => ({
      openSplitView: () => {
        closeMobileDrawer();
        requestOpenSplitView();
      },
      openSessionOverview: () => {
        closeMobileDrawer();
        openPanel('sessions');
      },
      openSessionDrawer,
      createNewSession: () => createNewSession(),
      createSideTask,
    }),
    [
      closeMobileDrawer,
      createNewSession,
      createSideTask,
      openPanel,
      openSessionDrawer,
      requestOpenSplitView,
    ],
  );
  useEffect(() => {
    assignShellRef(shellRef, shellApi);
  }, [shellApi, shellRef]);
  useEffect(
    () => () => {
      assignShellRef(shellRef, null);
    },
    [shellRef],
  );
  const handleMissingSessionNewSession = useCallback(async () => {
    if (creatingMissingSessionRef.current) return;
    creatingMissingSessionRef.current = true;
    setIsCreatingMissingSession(true);
    try {
      const success = await createNewSession();
      if (success) {
        onSessionIdChange?.(undefined);
      }
    } finally {
      creatingMissingSessionRef.current = false;
      setIsCreatingMissingSession(false);
    }
  }, [createNewSession, onSessionIdChange]);
  const sessionOpenInvocationRef = useRef(0);
  const loadSidebarSession = useCallback(
    async (sessionId, workspaceCwd) => {
      const invocation = ++sessionOpenInvocationRef.current;
      composerFocusRequestRef.current += 1;
      setSidebarSwitchingSessionId(sessionId);
      closeMobileDrawer();
      // Loading another session should reveal its chat, not stay on the
      // Settings/Status panel (no-op when the panel is closed).
      closePanel();
      try {
        await sessionActions.loadSession(sessionId, { workspaceCwd });
        if (sessionOpenInvocationRef.current === invocation) {
          composerSourceVersionRef.current += 1;
        }
      } catch (error) {
        if (sessionOpenInvocationRef.current === invocation) {
          setSidebarSwitchingSessionId(null);
        }
        throw error;
      }
    },
    [closeMobileDrawer, closePanel, sessionActions],
  );
  // Clicking a card in the Session Overview panel switches the current window
  // to that session. loadSidebarSession already closes the panel, so this just
  // returns to the chat view and reports load failures.
  const handleOpenSessionFromOverview = useCallback(
    (sessionId, workspaceCwd) => {
      setMainView('chat');
      void loadSidebarSession(sessionId, workspaceCwd).catch((error) => {
        reportError(error, 'Failed to open session');
      });
    },
    [loadSidebarSession, reportError],
  );
  // Listen for `qwen:open-session` events dispatched by the markdown renderer
  // when a `qwen-session://<id>` link is clicked. Navigate to the session.
  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail;
      const sessionId = typeof detail === 'string' ? detail : detail?.sessionId;
      const workspaceCwd =
        typeof detail === 'object' &&
        detail !== null &&
        typeof detail.workspaceCwd === 'string'
          ? detail.workspaceCwd
          : undefined;
      if (typeof sessionId === 'string' && sessionId) {
        handleOpenSessionFromOverview(sessionId, workspaceCwd);
      }
    };
    window.addEventListener('qwen:open-session', handler);
    return () => window.removeEventListener('qwen:open-session', handler);
  }, [handleOpenSessionFromOverview]);
  useEffect(() => {
    if (
      sidebarSwitchingSessionId !== null &&
      connection.sessionId === sidebarSwitchingSessionId &&
      !connection.loadingTranscript &&
      !connection.catchingUp &&
      !sessionWriteBlocked
    ) {
      setSidebarSwitchingSessionId(null);
      scheduleComposerFocus(sidebarSwitchingSessionId);
    }
  }, [
    connection.catchingUp,
    connection.loadingTranscript,
    connection.sessionId,
    scheduleComposerFocus,
    sessionWriteBlocked,
    sidebarSwitchingSessionId,
  ]);
  // Manual "run now" from the scheduled-tasks page. A bound task runs in its
  // own session (so manual and scheduled runs share one transcript); an unbound
  // task runs in the current session. Switching sessions is async, so a latch
  // holds the prompt until the target session is fully active before sending.
  //
  // Returns a promise that resolves once the prompt is actually ENQUEUED and
  // rejects if the bound session can't be opened (archived/deleted), supersedes,
  // or times out — so the caller only records the run after it truly happened,
  // never on a failed session switch. Only one bound run waits at a time.
  const pendingBoundRunRef = useRef(null);
  const clearPendingBoundRun = useCallback((sessionId) => {
    const cur = pendingBoundRunRef.current;
    if (cur && cur.sessionId === sessionId) {
      if (cur.timer !== undefined) clearTimeout(cur.timer);
      pendingBoundRunRef.current = null;
    }
  }, []);
  // Enqueue a manual-run prompt in the CURRENT session, resolving as soon as the
  // daemon ADMITS it — not when the whole turn finishes. sendPrompt resolves via
  // waitForAcceptedPromptCompletion (turn end), which is too late: a long or
  // permission-blocked run, or a closed tab, would execute in the session but
  // never get recorded. `onAdmitted` fires at submitPrompt acceptance.
  //
  // Deliberately NO pre-admission timeout here. `sendPrompt` isn't abortable, so
  // a timer that rejected while the send was still in flight could let a LATE
  // admission execute the prompt in the session AFTER the caller had already
  // handled the rejection and skipped recording — an unrecorded run the user
  // could retry into a duplicate. Staying tied to admission guarantees any
  // accepted prompt is recorded, and the run controls stay busy (not free to
  // re-fire) until the send admits or settles. The earlier "session never becomes
  // active" phase is still bounded by the switch timeout in runTaskManually. If
  // the send settles WITHOUT admitting (onSubmitBefore cancel) or throws before
  // admission, reject so the caller skips recording a run that never reached the
  // session.
  const enqueueManualRun = useCallback(
    (prompt) =>
      new Promise((resolve, reject) => {
        let admitted = false;
        const admit = () => {
          if (admitted) return;
          admitted = true;
          resolve();
        };
        sendPrompt(prompt, undefined, { onAdmitted: admit }).then(
          () => {
            if (!admitted) {
              reject(new Error('Run was cancelled before it started'));
            }
          },
          (error) => {
            if (!admitted) reject(error);
          },
        );
      }),
    [sendPrompt],
  );
  // Enqueue the pending bound run once its session is the current, fully-loaded
  // one — driven both by the effect below (when the session switch changes a
  // dep) AND directly after loadSidebarSession resolves (when the session was
  // ALREADY active, so no dep changes and the effect never re-runs — otherwise
  // the run would hang until the switch timeout and falsely report a failure).
  // Whoever fires first nulls the latch, so it runs exactly once.
  const tryFireBoundRun = useCallback(() => {
    const pending = pendingBoundRunRef.current;
    const conn = connectionRef.current;
    if (
      !pending ||
      conn.sessionId !== pending.sessionId ||
      conn.loadingTranscript
    ) {
      return;
    }
    if (conn.catchingUp) {
      if (pending.timer === undefined) {
        pending.timer = setTimeout(() => {
          clearPendingBoundRun(pending.sessionId);
          pending.reject(new Error('Timed out waiting for session replay'));
        }, BOUND_RUN_SWITCH_TIMEOUT_MS);
      }
      return;
    }
    if (pending.owner && !pending.owner.isCurrent()) {
      clearPendingBoundRun(pending.sessionId);
      pending.reject(
        new DOMException('Bound run session was replaced', 'AbortError'),
      );
      return;
    }
    if (pending.timer !== undefined) clearTimeout(pending.timer);
    pendingBoundRunRef.current = null;
    // Resolves at prompt admission (see enqueueManualRun); the switch-timeout was
    // cleared above, so a long turn can't trip it. Recording happens in the
    // dialog once this resolves.
    enqueueManualRun(pending.prompt).then(
      () => pending.resolve(),
      (error) => pending.reject(error),
    );
  }, [clearPendingBoundRun, enqueueManualRun]);
  const runTaskManually = useCallback(
    (prompt, sessionId) => {
      setMainView('chat');
      if (!sessionId) {
        // Unbound: runs in the current session — resolves at admission.
        return enqueueManualRun(prompt);
      }
      // A newer bound run supersedes an older one still waiting on the latch;
      // reject the old promise so its caller doesn't record a dropped run.
      const prev = pendingBoundRunRef.current;
      if (prev) {
        if (prev.timer !== undefined) clearTimeout(prev.timer);
        pendingBoundRunRef.current = null;
        prev.reject(new Error('superseded by another run'));
      }
      return new Promise((resolve, reject) => {
        const pending = {
          sessionId,
          prompt,
          resolve,
          reject,
        };
        pendingBoundRunRef.current = pending;
        loadSidebarSession(sessionId)
          // Fire immediately when the session was already active (no dep change
          // to trigger the effect); a no-op if the load is still settling, in
          // which case the effect picks it up.
          .then(() => {
            if (pendingBoundRunRef.current !== pending) return;
            pending.owner = sessionOwnerGuard.capture();
            tryFireBoundRun();
          })
          .catch((error) => {
            if (pendingBoundRunRef.current !== pending) return;
            clearPendingBoundRun(sessionId);
            reject(error);
          });
      });
    },
    [
      enqueueManualRun,
      loadSidebarSession,
      clearPendingBoundRun,
      sessionOwnerGuard,
      tryFireBoundRun,
    ],
  );
  useEffect(() => {
    tryFireBoundRun();
  }, [
    connection.sessionId,
    connection.loadingTranscript,
    connection.catchingUp,
    tryFireBoundRun,
  ]);
  const openTasksPanel = useCallback(() => {
    if (!requireActiveSessionForLocalCommand()) return;
    const owner = sessionOwnerGuard.capture();
    sessionActions
      .getTasks()
      .then((snapshot) => {
        if (!owner.isCurrent()) return;
        setTasksDialogMessage({ snapshot });
      })
      .catch((error) => {
        if (!owner.isCurrent()) return;
        if (isSessionDisconnectedError(error)) return;
        reportError(error, 'Failed to load tasks');
      });
  }, [
    reportError,
    requireActiveSessionForLocalCommand,
    sessionActions,
    sessionOwnerGuard,
  ]);
  const openEnvironmentTasksPanel = useCallback(() => {
    if (!requireActiveSessionForLocalCommand()) return;
    setEnvironmentPanelOpen(true);
    setBackgroundTasksRefreshTrigger((value) => value + 1);
  }, [requireActiveSessionForLocalCommand]);
  const openEnvironmentTask = useCallback(
    (task) => {
      if (task.kind === 'monitor' || task.kind === 'shell') {
        if (!artifactPanelOpenRef.current) {
          preserveEnvironmentPanelOnArtifactOpenRef.current = true;
        }
        if (task.kind === 'monitor') {
          handleOpenMonitorDetails(task);
        } else {
          handleOpenShellDetails(task);
        }
        return;
      }
      openTasksPanel();
    },
    [handleOpenMonitorDetails, handleOpenShellDetails, openTasksPanel],
  );
  const dispatchGoalSet = useCallback(
    (condition, setAt) => {
      setActiveGoal({ condition, setAt });
      store.dispatch([
        {
          type: 'status',
          text: serializeGoalStatusMessage({
            kind: 'set',
            condition,
            setAt,
          }),
        },
      ]);
    },
    [store],
  );
  const dispatchGoalCleared = useCallback(
    (goal) => {
      if (!goal) return;
      store.dispatch([
        {
          type: 'status',
          text: serializeGoalStatusMessage({
            kind: 'cleared',
            condition: goal.condition,
            durationMs: Date.now() - goal.setAt,
          }),
        },
      ]);
      setActiveGoal(null);
    },
    [store],
  );
  const handleBusyGoalClear = useCallback(
    (text) => {
      if (sessionWriteBlocked) return false;
      if (!requireActiveSessionForLocalCommand()) return false;
      const owner = sessionOwnerGuard.capture();
      store.appendLocalUserMessage(text);
      sessionActions.clearGoal().catch((error) => {
        if (!owner.isCurrent()) return;
        reportError(error, 'Failed to clear /goal');
      });
      return true;
    },
    [
      reportError,
      requireActiveSessionForLocalCommand,
      sessionWriteBlocked,
      sessionActions,
      sessionOwnerGuard,
      store,
    ],
  );
  const loadRewindSnapshots = useCallback(
    () => sessionActions.getRewindSnapshots(),
    [sessionActions],
  );
  const rewindConversationOnly = useCallback(
    (promptId) =>
      sessionActions
        .rewindSession(promptId, { rewindFiles: false })
        .then(() => undefined),
    [sessionActions],
  );
  const handleRewindError = useCallback(
    (error) => {
      if (isAlreadyDispatched(error)) return;
      const reason = error instanceof Error ? error.message : String(error);
      pushToast('error', t('rewind.failed', { reason }));
    },
    [pushToast, t],
  );
  const handleGoalSlashCommand = useCallback(
    (text, images, opts) => {
      const goalArg = goalArgOf(text);
      const sendToDaemon = opts?.sendToDaemon ?? true;
      const sendGoalPrompt = () => {
        const owner = { current: sessionOwnerGuard.capture() };
        const deferComposerCommit =
          Boolean(onSubmitBeforeRef.current) ||
          createSessionPromiseRef.current !== null;
        const clearComposerOnPromptStart =
          !connectionRef.current.sessionId || deferComposerCommit;
        sendPrompt(text, images, {
          ownerRef: owner,
          clearComposerOnPromptStart,
          commitComposerAccepted: clearComposerOnPromptStart
            ? opts?.commitComposerAccepted
            : undefined,
        }).catch((error) => {
          if (!owner.current.isCurrent()) return;
          reportError(error, 'Failed to send /goal command');
        });
        return clearComposerOnPromptStart ? false : true;
      };
      if (goalArg && isGoalClearKeyword(goalArg)) {
        if (!sendToDaemon) {
          store.appendLocalUserMessage(text);
          dispatchGoalCleared(activeGoalRef.current);
          return true;
        }
        return handleBusyGoalClear(text);
      } else if (goalArg) {
        if (!sendToDaemon) {
          store.appendLocalUserMessage(text);
          dispatchGoalSet(goalArg, Date.now());
          return true;
        }
        return sendGoalPrompt();
      }
      // Bare `/goal` opens the Goals page instead of asking the daemon to print
      // its status as text — the same move `/schedule` makes. Nothing is sent,
      // so the composer is cleared by returning true.
      openGoals();
      return true;
    },
    [
      dispatchGoalCleared,
      dispatchGoalSet,
      handleBusyGoalClear,
      openGoals,
      reportError,
      sendPrompt,
      sessionOwnerGuard,
      store,
      connectionRef,
    ],
  );
  const hiddenCommands = useMemo(
    () =>
      new Set(
        (hiddenSlashCommands ?? []).map(normalizeHiddenCommand).filter(Boolean),
      ),
    [hiddenSlashCommands],
  );
  const hideSettings = hiddenCommands.has('settings');
  const handleSubmit = useCallback(
    (text, images, commitComposerAccepted, metadata) => {
      if (sessionWriteBlockedRef.current) return false;
      if (
        unknownPromptAdmissionRef.current?.payloadAvailable &&
        unknownPromptAdmissionRef.current.sessionId ===
          connectionRef.current.sessionId
      ) {
        return false;
      }
      if (
        invokeSlashCommandHandler(text, onSlashCommandRef.current, reportError)
      ) {
        return true;
      }
      if (connectionRef.current.loadingTranscript) {
        pushToast('warning', t('editor.sessionLoading'));
        return false;
      }
      if (
        shouldBlockComposerSubmit({
          connectionStatus: connectionRef.current.status,
          hasSession: Boolean(connectionRef.current.sessionId),
          restartSseOnPrompt: Boolean(restartSseOnPrompt),
        })
      ) {
        pushToast('warning', t('editor.connectionDisconnected'));
        return false;
      }
      const promptBlocked = streamingStateRef.current !== 'idle';
      const submitPromptFromEditor = (
        promptText,
        promptImages,
        errorMessage,
        opts,
      ) => {
        const admissionAttachment = {
          current: sessionOwnerGuard.capture(),
        };
        const admissionOwner = {
          sourceVersion: composerSourceVersionRef.current,
          sessionId: connectionRef.current.sessionId,
          workspaceCwd: getComposerWorkspaceCwd(),
        };
        const admissionOwnerIsCurrent = () =>
          admissionAttachment.current.isCurrent() &&
          composerSourceVersionRef.current === admissionOwner.sourceVersion &&
          (admissionOwner.sessionId === undefined ||
            (connectionRef.current.sessionId === admissionOwner.sessionId &&
              getComposerWorkspaceCwd() === admissionOwner.workspaceCwd));
        const { trackSendFailure = false, ...sendOptions } = opts ?? {};
        const deferComposerCommit =
          Boolean(onSubmitBeforeRef.current) ||
          createSessionPromiseRef.current !== null;
        const clearComposerOnPromptStart =
          !connectionRef.current.sessionId || deferComposerCommit;
        let optimisticUserMessage;
        let admitted = false;
        let admissionStarted = false;
        let admissionSessionId;
        sendPrompt(promptText, promptImages, {
          ownerRef: admissionAttachment,
          ...sendOptions,
          clearComposerOnPromptStart,
          commitComposerAccepted: clearComposerOnPromptStart
            ? commitComposerAccepted
            : undefined,
          onAdmissionStarted: (sessionId) => {
            admissionStarted = true;
            admissionSessionId = sessionId;
          },
          onAdmitted: () => {
            admitted = true;
          },
          ...(trackSendFailure
            ? {
                onOptimisticUserMessage: (message) => {
                  optimisticUserMessage = message;
                },
              }
            : {}),
        }).catch((error) => {
          if (!admissionOwnerIsCurrent()) return;
          const failedMessage = optimisticUserMessage;
          const definitelyRejected = isDefinitelyRejectedPromptAdmission(error);
          if (admissionStarted && !admitted && !definitelyRejected) {
            updateFailedPrompt(null);
            const uncertainSessionId =
              failedMessage?.sessionId ??
              admissionSessionId ??
              connectionRef.current.sessionId;
            if (uncertainSessionId) {
              updateUnknownPromptAdmission({
                sessionId: uncertainSessionId,
                messageId: failedMessage?.messageId,
                text: promptText,
                images: promptImages ? [...promptImages] : undefined,
                inputAnnotations: sendOptions.inputAnnotations,
                payloadAvailable: true,
              });
            }
            pushToast('warning', t('queue.admissionUnknown'));
            console.warn(
              '[WebShell] prompt admission outcome is unknown',
              error,
            );
            return;
          }
          if (
            trackSendFailure &&
            !admitted &&
            failedMessage &&
            failedMessage.sessionId === connectionRef.current.sessionId &&
            matchesUserMessageIdentity(
              store
                .getSnapshot()
                .blocks.find(
                  (block) =>
                    block.kind === 'user' &&
                    block.id === failedMessage.messageId,
                ),
              failedMessage.identity,
              failedMessage.owner.snapshot.isCurrent(),
            )
          ) {
            updateFailedPrompt({
              ...failedMessage,
              text: promptText,
              images: promptImages,
              inputAnnotations: sendOptions.inputAnnotations,
            });
          }
          reportError(error, errorMessage);
        });
        return clearComposerOnPromptStart ? false : true;
      };
      if (text.startsWith('/')) {
        const match = text.match(SLASH_COMMAND_PATTERN);
        if (match) {
          const cmd = match[1];
          if (hiddenCommands.has(normalizeHiddenCommand(cmd))) {
            if (promptBlocked) {
              return enqueuePrompt(
                text,
                images,
                undefined,
                commitComposerAccepted,
                metadata?.inputAnnotations,
              );
            }
            return submitPromptFromEditor(
              text,
              images,
              'Failed to send hidden slash command',
              { inputAnnotations: metadata?.inputAnnotations },
            );
          }
          if (cmd === 'help') {
            setShowHelpDialog(true);
            return true;
          }
          if (cmd === 'diff') {
            if (!gitDiffWorkspaceCwd) {
              pushToast('info', t('localCommand.diffNoWorkspace'));
              return true;
            }
            setGitDialog({
              workspaceCwd: gitDiffWorkspaceCwd,
              gitCwd: sessionWorktree?.path,
              view: 'diff',
            });
            return true;
          }
          if (cmd === 'log') {
            if (!gitDiffWorkspaceCwd) {
              pushToast('info', t('localCommand.logNoWorkspace'));
              return true;
            }
            setGitDialog({
              workspaceCwd: gitDiffWorkspaceCwd,
              gitCwd: sessionWorktree?.path,
              view: 'log',
            });
            return true;
          }
          if (cmd === 'prs') {
            if (!gitDiffWorkspaceCwd) {
              pushToast('info', t('localCommand.prsNoWorkspace'));
              return true;
            }
            if (!gitHubPrsSupported) {
              pushToast('info', t('localCommand.prsUnsupported'));
              return true;
            }
            setGitDialog({ workspaceCwd: gitDiffWorkspaceCwd, view: 'prs' });
            return true;
          }
          if (cmd === 'tasks') {
            openEnvironmentTasksPanel();
            return true;
          }
          if (cmd === 'goal') {
            // A bare `/goal` just opens the Goals page; it neither sends a
            // prompt nor touches the session, so it works mid-turn too.
            if (!goalArgOf(text)) {
              openGoals();
              return true;
            }
            if (promptBlocked) {
              if (isGoalClearCommand(text)) {
                return handleBusyGoalClear(text);
              }
              return blockLocalCommandDuringTurn();
            }
            return handleGoalSlashCommand(text, images, {
              commitComposerAccepted,
            });
          }
          if (cmd === 'theme') {
            const themeArg = text.slice(match[0].length).trim().toLowerCase();
            if (themeArg === 'dark' || themeArg === 'light') {
              handleThemeChange(themeArg);
            } else if (!themeArg) {
              setShowThemeDialog(true);
            } else {
              pushToast('error', t('error.unsupportedTheme'));
            }
            return true;
          }
          if (cmd === 'language') {
            const args = text.slice(match[0].length).trim();
            const [subCommand, languageArg] = args.split(/\s+/);
            if (!args) {
              store.dispatch([
                {
                  type: 'status',
                  text: [
                    t('language.current', {
                      language: languageLabel(selectedLanguage),
                    }),
                    t('language.usage'),
                    t('language.options'),
                    '  - en: English',
                    '  - zh-CN: 中文',
                  ].join('\n'),
                },
              ]);
              return true;
            }
            if (subCommand?.toLowerCase() === 'ui') {
              if (!languageArg) {
                store.dispatch([
                  {
                    type: 'status',
                    text: [
                      t('language.set'),
                      '',
                      t('language.usage'),
                      '',
                      t('language.options'),
                      '  - en: English',
                      '  - zh-CN: 中文',
                    ].join('\n'),
                  },
                ]);
                return true;
              }
              const normalizedArg = languageArg.toLowerCase();
              const valid = ['en', 'zh', 'zh-cn', 'zh_cn'].includes(
                normalizedArg,
              );
              if (!valid) {
                pushToast('error', t('language.invalid'));
                return true;
              }
              const nextLanguage = normalizeLanguage(languageArg);
              const owner = { current: sessionOwnerGuard.capture() };
              handleLanguageChange(nextLanguage);
              if (!promptBlocked) {
                const deferComposerCommit =
                  Boolean(onSubmitBeforeRef.current) ||
                  createSessionPromiseRef.current !== null;
                const clearComposerOnPromptStart =
                  !connectionRef.current.sessionId || deferComposerCommit;
                sendPrompt(`/language ui ${nextLanguage}`, undefined, {
                  ownerRef: owner,
                  clearComposerOnPromptStart,
                  commitComposerAccepted: clearComposerOnPromptStart
                    ? commitComposerAccepted
                    : undefined,
                })
                  .then(() => {
                    if (!owner.current.isCurrent()) return;
                    return sessionActions.refreshCommands();
                  })
                  .catch((error) => {
                    if (!owner.current.isCurrent()) return;
                    reportError(error, 'Failed to sync /language command');
                  });
                return clearComposerOnPromptStart ? false : true;
              }
              return true;
            }
          }
          if (cmd === 'copy') {
            const copyArg = text.slice(match[0].length).trim();
            copyFromLastAssistantMessage(messagesRef.current, copyArg)
              .then((result) => {
                store.dispatch([
                  {
                    type: result.status === 'error' ? 'error' : 'status',
                    text: translateCopyMessage(result.message, t),
                  },
                ]);
              })
              .catch((error) => {
                reportError(error, t('copy.failedFallback'));
              });
            return true;
          }
          if (cmd === 'delete') {
            setShowDeleteDialog(true);
            return true;
          }
          if (cmd === 'release') {
            setShowReleaseDialog(true);
            return true;
          }
          if (cmd === 'rewind') {
            if (!requireActiveSessionForLocalCommand()) return false;
            setShowRewindDialog(true);
            return true;
          }
          if (cmd === 'branch') {
            if (promptBlocked) return blockLocalCommandDuringTurn();
            const branchName = text.slice(match[0].length).trim();
            branchCurrentSession(branchName || undefined);
            return true;
          }
          if (cmd === 'fork') {
            if (promptBlocked) return blockLocalCommandDuringTurn();
            if (!requireActiveSessionForLocalCommand()) return false;
            const directive = text.slice(match[0].length).trim();
            if (!directive) {
              pushToast('error', t('fork.empty'));
              return true;
            }
            const owner = sessionOwnerGuard.capture();
            sessionActions
              .forkSession(directive)
              .then((result) => {
                if (!owner.isCurrent()) return;
                if (!result.launched) {
                  pushToast('warning', t('fork.notStarted'));
                  return;
                }
                setBackgroundTasksRefreshTrigger((value) => value + 1);
                pushToast(
                  'success',
                  t('fork.started', { name: result.description }),
                );
              })
              .catch((error) => {
                if (!owner.isCurrent()) return;
                const reason =
                  error instanceof Error ? error.message : String(error);
                reportError(error, t('fork.failed', { reason }));
              });
            return true;
          }
          if (cmd === 'auth') {
            setShowAuthDialog(true);
            return true;
          }
          if (cmd === 'model') {
            const modelArg = text.slice(match[0].length).trim();
            if (modelArg === '--fast') {
              setModelDialogMode('fast');
              return true;
            }
            if (modelArg.startsWith('--fast ')) {
              if (promptBlocked) {
                return enqueuePrompt(
                  text,
                  images,
                  undefined,
                  commitComposerAccepted,
                  metadata?.inputAnnotations,
                );
              }
              return submitPromptFromEditor(
                text,
                images,
                'Failed to send /model --fast',
                { inputAnnotations: metadata?.inputAnnotations },
              );
            }
            if (modelArg === '--voice') {
              if (echoOrDeferLocalCommand(text, images)) return true;
              void openVoiceModelPicker('workspace', 'command');
              return true;
            }
            if (modelArg.startsWith('--voice ')) {
              const voiceModelId = modelArg.replace(/^--voice\s+/, '');
              void writeVoiceModelForTarget(voiceModelId, 'workspace').catch(
                (error) => reportError(error, t('model.setVoice')),
              );
              return true;
            }
            if (modelArg === '--vision') {
              setModelDialogMode('vision');
              return true;
            }
            if (modelArg.startsWith('--vision ')) {
              const visionModelId = modelArg.replace(/^--vision\s+/, '');
              setWorkspaceSetting(
                'workspace',
                'visionModel',
                visionModelId,
              ).catch((error) => reportError(error, t('model.setVision')));
              return true;
            }
            if (modelArg) {
              if (!connectionRef.current.sessionId) {
                setPendingModel(modelArg);
                return true;
              }
              const owner = sessionOwnerGuard.capture();
              sessionActions
                .setModel(modelArg)
                .then(() => {
                  if (!owner.isCurrent()) return;
                  setPendingModel(modelArg);
                })
                .catch((error) => {
                  if (!owner.isCurrent()) return;
                  reportError(error, t('model.switch'));
                });
            } else {
              setModelDialogMode('main');
            }
            return true;
          }
          if (cmd === 'plan') {
            if (promptBlocked) return blockLocalCommandDuringTurn();
            const prompt = text.slice(match[0].length).trim();
            if (!connectionRef.current.sessionId) {
              setPendingMode('plan');
              if (prompt) {
                return submitPromptFromEditor(
                  prompt,
                  images,
                  'Failed to send plan prompt',
                  { inputAnnotations: metadata?.inputAnnotations },
                );
              }
              return true;
            }
            const planPreparationToken = prompt
              ? ++planPreparationTokenRef.current
              : undefined;
            const planPromptPreparationOwner = prompt
              ? beginPromptPreparation()
              : undefined;
            const owner = sessionOwnerGuard.capture();
            const writeBlockGeneration = sessionWriteBlockGenerationRef.current;
            sessionActions
              .setApprovalMode('plan')
              .then(() => {
                if (!owner.isCurrent()) return;
                setPendingMode('plan');
                if (
                  prompt &&
                  !sessionWriteBlockedRef.current &&
                  sessionWriteBlockGenerationRef.current ===
                    writeBlockGeneration
                ) {
                  return sendPrompt(prompt, images, {
                    clearComposerOnPromptStart: true,
                    inputAnnotations: metadata?.inputAnnotations,
                  }).catch((error) =>
                    reportError(error, 'Failed to send plan prompt'),
                  );
                }
              })
              .catch((error) => {
                if (!owner.isCurrent()) return;
                reportError(error, t('mode.plan'));
              })
              .finally(() => {
                if (
                  prompt &&
                  planPreparationTokenRef.current === planPreparationToken
                ) {
                  finishPromptPreparation(planPromptPreparationOwner);
                }
              });
            return prompt ? false : true;
          }
          if (cmd === 'approval-mode') {
            const modeArg = text.slice(match[0].length).trim();
            if (modeArg) {
              handleSetMode(modeArg);
            } else {
              setShowApprovalModeDialog(true);
            }
            return true;
          }
          if (cmd === 'mcp') {
            const mcpArg = text.slice(match[0].length).trim().toLowerCase();
            workspaceActions
              .loadMcpStatus()
              .then((status) => {
                setMcpDialogMessage({
                  status,
                  toolsByServer: {},
                  resourcesByServer: {},
                  showDescriptions: mcpArg === 'desc',
                  showSchema: mcpArg === 'schema',
                  showTips: !mcpArg,
                });
                openPanel('mcp');
              })
              .catch((error) => {
                reportError(error, 'Failed to load MCP status');
              });
            return true;
          }
          if (cmd === 'skills') {
            const skillArg = text.slice(match[0].length).trim();
            if (!skillArg || skillArg === 'detail' || skillArg === 'details') {
              openPanel('skills');
            } else {
              const skillPrompt = `/${skillArg}`;
              if (promptBlocked) {
                return enqueuePrompt(
                  skillPrompt,
                  images,
                  undefined,
                  commitComposerAccepted,
                  metadata?.inputAnnotations,
                );
              }
              return submitPromptFromEditor(
                skillPrompt,
                images,
                'Failed to send /skills command',
                { inputAnnotations: metadata?.inputAnnotations },
              );
            }
            return true;
          }
          if (cmd === 'tools') {
            const toolsArg = text.slice(match[0].length).trim().toLowerCase();
            if (toolsArg === 'desc' || toolsArg === 'descriptions') {
              setShowToolsDialog(true);
            } else {
              if (echoOrDeferLocalCommand(text, images)) return true;
              workspaceActions
                .loadToolsStatus()
                .then((status) => {
                  const tools = status?.tools ?? [];
                  if (tools.length === 0) {
                    store.dispatch([{ type: 'status', text: t('tools.none') }]);
                  } else {
                    const list = tools
                      .map((tool) => `- ${tool.displayName || tool.name}`)
                      .join('\n');
                    store.dispatch([
                      {
                        type: 'status',
                        text: `${t('tools.available')}\n\n${list}`,
                      },
                    ]);
                  }
                  resumeChatBottomFollow('smooth');
                })
                .catch((error) => {
                  reportError(error, 'Failed to load tools');
                });
            }
            return true;
          }
          if (cmd === 'settings') {
            openPanel('settings');
            return true;
          }
          if (cmd === 'schedule') {
            openScheduledTasks();
            return true;
          }
          if (cmd === 'context') {
            const contextArg = text.slice(match[0].length).trim().toLowerCase();
            if (
              contextArg === '' ||
              contextArg === 'detail' ||
              contextArg === '-d'
            ) {
              showContextUsage(
                text,
                contextArg === 'detail' || contextArg === '-d',
              );
              return true;
            }
          }
          if (cmd === 'memory') {
            const memoryArg = text.slice(match[0].length).trim().toLowerCase();
            if (memoryArg === 'refresh') {
              setMemoryRefreshSignal((signal) => signal + 1);
            } else if (memoryArg === 'add' || memoryArg.startsWith('add ')) {
              const addTarget = memoryArg.slice('add'.length).trim();
              setMemoryAddScope(
                addTarget === 'user' || addTarget === 'global'
                  ? 'global'
                  : 'workspace',
              );
              setMemoryAddSignal((signal) => signal + 1);
            }
            setShowMemoryDialog(true);
            return true;
          }
          if (cmd === 'agents') {
            const subCommand = text.slice(match[0].length).trim().toLowerCase();
            if (subCommand === 'create') {
              setAgentsCreateScope('global');
            } else if (
              subCommand === 'create user' ||
              subCommand === 'create global'
            ) {
              setAgentsCreateScope('global');
            } else if (
              subCommand === 'create project' ||
              subCommand === 'create workspace'
            ) {
              setAgentsCreateScope('workspace');
            } else {
              setAgentsCreateScope(null);
            }
            openPanel('agents');
            return true;
          }
          if (cmd === 'extensions') {
            const args = text.slice(match[0].length).trim();
            const subCommand = args.split(/\s+/)[0]?.toLowerCase();
            if (!subCommand || subCommand === 'manage') {
              openPanel('extensions');
              return true;
            }
            if (subCommand === 'install') {
              // Install echoes into the transcript (and its error/usage replies
              // do too); block it mid-turn so it can't split the active turn.
              if (promptBlocked) return blockLocalCommandDuringTurn();
              const tokens = args.slice('install'.length).trim().split(/\s+/);
              let source = '';
              let ref;
              let registry;
              let autoUpdate;
              let allowPreRelease;
              let parseError = null;
              for (let index = 0; index < tokens.length; index++) {
                const token = tokens[index];
                if (!token) continue;
                if (token === '--auto-update') {
                  autoUpdate = true;
                } else if (
                  token === '--pre-release' ||
                  token === '--allow-pre-release'
                ) {
                  allowPreRelease = true;
                } else if (token === '--ref' || token === '--registry') {
                  const value = tokens[index + 1];
                  if (!value || value.startsWith('--')) {
                    parseError = t('extensions.install.missingOptionValue', {
                      option: token,
                    });
                    break;
                  }
                  if (token === '--ref') {
                    ref = value;
                  } else {
                    registry = value;
                  }
                  index += 1;
                } else if (token.startsWith('--')) {
                  parseError = t('extensions.install.unknownOption', {
                    option: token,
                  });
                  break;
                } else if (!source) {
                  source = token;
                } else {
                  parseError = t('extensions.install.usage');
                  break;
                }
              }
              if (parseError) {
                store.appendLocalUserMessage(text);
                store.dispatch([{ type: 'error', text: parseError }]);
                return true;
              }
              if (!source) {
                store.appendLocalUserMessage(text);
                store.dispatch([
                  {
                    type: 'error',
                    text: t('extensions.install.usage'),
                  },
                ]);
                return true;
              }
              const clientId = connectionRef.current.clientId;
              if (!clientId) {
                pushToast('warning', t('extensions.install.waitForSession'));
                return true;
              }
              store.appendLocalUserMessage(text);
              store.dispatch([
                {
                  type: 'status',
                  text: t('extensions.install.started', { source }),
                },
              ]);
              workspaceActions
                .installExtension(
                  {
                    source,
                    ...(ref ? { ref } : {}),
                    ...(registry ? { registry } : {}),
                    ...(autoUpdate !== undefined ? { autoUpdate } : {}),
                    ...(allowPreRelease !== undefined
                      ? { allowPreRelease }
                      : {}),
                    consent: true,
                  },
                  clientId,
                )
                .then(() => undefined)
                .catch((error) => {
                  reportError(error, t('extensions.install.requestFailed'));
                });
              return true;
            }
            if (echoOrDeferLocalCommand(text, images)) return true;
            store.dispatch([
              {
                type: 'error',
                text: t('extensions.install.usage'),
              },
            ]);
            return true;
          }
          if (cmd === 'clear') {
            createNewSession();
            return true;
          }
          if (cmd === 'new' || cmd === 'reset') {
            createNewSession();
            return true;
          }
          if (cmd === 'rename') {
            const renameArg = parseRenameArgument(text.slice(match[0].length));
            if (renameArg.type === 'auto' || renameArg.type === 'delegate') {
              if (promptBlocked) {
                return enqueuePrompt(
                  text,
                  images,
                  undefined,
                  commitComposerAccepted,
                  metadata?.inputAnnotations,
                );
              }
              return submitPromptFromEditor(
                text,
                images,
                'Failed to send /rename command',
                { inputAnnotations: metadata?.inputAnnotations },
              );
            }
            const displayName = renameArg.displayName;
            if (!displayName) {
              pushToast('error', t('rename.empty'));
              return true;
            }
            if (!requireActiveSessionForLocalCommand()) return false;
            const renamedSessionId = connectionRef.current.sessionId;
            const renamedWorkspaceCwd = connectionRef.current.workspaceCwd;
            const owner = sessionOwnerGuard.capture();
            sessionActions
              .renameSession(displayName)
              .then(() => {
                if (renamedSessionId) {
                  reconcileCatalogRename(
                    renamedWorkspaceCwd,
                    renamedSessionId,
                    displayName,
                  );
                }
                if (!owner.isCurrent()) return;
                store.dispatch([
                  {
                    type: 'status',
                    text: t('rename.success', { name: displayName }),
                  },
                ]);
              })
              .catch((error) => {
                if (renamedWorkspaceCwd) {
                  sessionCatalogController.invalidateWorkspace(
                    renamedWorkspaceCwd,
                  );
                }
                if (!owner.isCurrent()) return;
                reportError(error, 'Failed to rename session');
              });
            return true;
          }
          if (cmd === 'resume') {
            const sessionId = text.slice(match[0].length).trim();
            if (sessionId) {
              loadSidebarSession(sessionId).catch((error) => {
                reportError(error, 'Failed to load session');
              });
            } else {
              closeMobileDrawer();
              setShowResumeDialog(true);
            }
            return true;
          }
          if (cmd === 'recap') {
            runVisibleRecap();
            return true;
          }
          if (cmd === 'btw') {
            const rawQuestion = text.slice(match[0].length).trim();
            const sideTaskMatch = /^side(?:\s+|$)/i.exec(rawQuestion);
            if (sideTasksAvailable && sideTaskMatch) {
              const question = rawQuestion
                .slice(sideTaskMatch[0].length)
                .trim();
              if (!question) {
                pushToast('error', t('btw.side.empty'));
                return true;
              }
              createSideTask(question);
              return true;
            }
            runVisibleBtw(rawQuestion);
            return true;
          }
          if (cmd === 'stats') {
            const statsArg = text.slice(match[0].length).trim().toLowerCase();
            let statsView = 'overview';
            if (statsArg === 'model') statsView = 'model';
            else if (statsArg === 'tools') statsView = 'tools';
            if (!requireActiveSessionForLocalCommand()) return false;
            const owner = sessionOwnerGuard.capture();
            echoLocalCommandIfIdle(text);
            sessionActions
              .getStats()
              .then((result) => {
                if (!owner.isCurrent()) return;
                dispatchReadOnlyStatus(
                  serializeStatsMessage(result, statsView),
                );
              })
              .catch((error) => {
                if (!owner.isCurrent()) return;
                reportError(error, 'Failed to load stats');
              });
            return true;
          }
          if (cmd === 'status' || cmd === 'about') {
            echoLocalCommandIfIdle(text);
            Promise.all([
              workspaceActions.loadPreflight().catch(() => null),
              workspaceActions.loadProviders().catch(() => null),
              workspaceActions.loadEnv().catch(() => null),
            ])
              .then(([preflight, providers, env]) => {
                const sys = collectSystemInfo(preflight, env);
                let authSource = sys.authSource;
                if (!authSource && providers?.current?.authType) {
                  authSource = providers.current.authType;
                }
                const runtimeParts = [];
                if (sys.nodeVersion)
                  runtimeParts.push(`Node.js v${sys.nodeVersion}`);
                if (sys.npmVersion) runtimeParts.push(`npm ${sys.npmVersion}`);
                let formattedAuth = '';
                if (authSource) {
                  if (
                    authSource.startsWith('oauth') ||
                    authSource === 'qwen-oauth'
                  ) {
                    formattedAuth = 'Qwen OAuth';
                  } else {
                    formattedAuth = `API Key - ${authSource}`;
                  }
                }
                const platformStr = `${sys.platform} ${sys.arch}`.trim();
                const curModel = currentModelRef.current;
                const conn = connectionRef.current;
                const qwenCodeVersion =
                  conn.capabilities?.qwenCodeVersion || '';
                const info = {
                  cliVersion: qwenCodeVersion,
                  runtime: runtimeParts.join(' / '),
                  platform: platformStr,
                  auth: formattedAuth,
                  baseUrl: providers?.current?.baseUrl || '',
                  model:
                    curModel ||
                    conn.currentModel ||
                    providers?.current?.modelId ||
                    '',
                  fastModel:
                    providers?.current?.fastModelId ||
                    curModel ||
                    conn.currentModel ||
                    providers?.current?.modelId ||
                    '',
                  sessionId: conn.sessionId || '',
                  sandbox: sys.sandbox,
                  proxy: sys.proxy,
                  memoryUsage: sys.memoryUsage,
                };
                dispatchReadOnlyStatus(serializeStatusMessage(info));
              })
              .catch((error) => {
                reportError(error, 'Failed to load status info');
              });
            return true;
          }
          if (cmd === 'bug') {
            const bugTitle = text.slice(match[0].length).trim();
            if (echoOrDeferLocalCommand(text, images)) return true;
            Promise.all([
              workspaceActions.loadPreflight().catch(() => null),
              workspaceActions.loadEnv().catch(() => null),
            ])
              .then(([preflight, env]) => {
                const sys = collectSystemInfo(preflight, env);
                const qwenCodeVersion =
                  connectionRef.current.capabilities?.qwenCodeVersion || '';
                const sysInfo = {};
                if (qwenCodeVersion) sysInfo.cliVersion = qwenCodeVersion;
                if (sys.nodeVersion) sysInfo.nodeVersion = sys.nodeVersion;
                if (sys.npmVersion) sysInfo.npmVersion = sys.npmVersion;
                if (sys.platform) sysInfo.platform = sys.platform;
                if (sys.arch) sysInfo.arch = sys.arch;
                if (sys.sandbox) sysInfo.sandbox = sys.sandbox;
                if (sys.memoryUsage) sysInfo.memoryUsage = sys.memoryUsage;
                if (onBugReportRef.current) {
                  onBugReportRef.current({
                    title: bugTitle,
                    systemInfo: sysInfo,
                  });
                  store.dispatch([
                    { type: 'status', text: t('bug.submitted') },
                  ]);
                } else {
                  const fields = Object.entries(sysInfo)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n');
                  const url =
                    `https://github.com/QwenLM/qwen-code/issues/new?template=bug_report.yml` +
                    `&title=${encodeURIComponent(bugTitle)}` +
                    `&info=${encodeURIComponent('\n' + fields + '\n')}`;
                  const win = window.open(url, '_blank');
                  if (win) {
                    win.opener = null;
                    store.dispatch([
                      { type: 'status', text: t('bug.submitted') },
                    ]);
                  } else {
                    pushToast('error', t('bug.popupBlocked'));
                  }
                }
              })
              .catch((error) => {
                reportError(error, t('bug.failed'));
              });
            return true;
          }
        }
        // Forward slash commands as prompts
        if (promptBlocked) {
          return enqueuePrompt(
            text,
            images,
            undefined,
            commitComposerAccepted,
            metadata?.inputAnnotations,
          );
        }
        return submitPromptFromEditor(text, images, 'Failed to send command', {
          inputAnnotations: metadata?.inputAnnotations,
        });
      } else if (text.startsWith('!')) {
        const cmd = text.slice(1).trim();
        if (!cmd) return false;
        if (promptBlocked) {
          queuedShellCommandsRef.current.push(cmd);
          pushToast('info', t('queue.shellQueued'));
          return true;
        }
        const needsSession = !connectionRef.current.sessionId;
        let shellPromptPreparationOwner;
        if (needsSession) {
          if (shellSubmitInFlightRef.current) return false;
          shellSubmitInFlightRef.current = true;
          shellPromptPreparationOwner = beginPromptPreparation();
        }
        let sessionCreated = false;
        const generationAtSubmit = drainGenerationRef.current;
        void ensureSessionForPrompt()
          .finally(() => {
            if (needsSession) {
              finishPromptPreparation(shellPromptPreparationOwner);
              shellSubmitInFlightRef.current = false;
            }
          })
          .then((createdSessionId) => {
            if (drainGenerationRef.current !== generationAtSubmit) return;
            if (needsSession && createdSessionId) {
              sessionCreated = true;
              if (commitComposerAccepted) {
                commitComposerAccepted();
              } else {
                editorRef.current?.clear();
              }
              dispatchSessionChangeRef.current?.({
                type: 'submit',
                sessionId: createdSessionId,
                prompt: `!${cmd}`,
                queued: false,
              });
            }
            const allocatedOwner = allocatedSessionCatalogOwnerRef.current;
            const workspaceCwd = createdSessionId
              ? allocatedOwner?.sessionId === createdSessionId
                ? allocatedOwner.workspaceCwd
                : undefined
              : getComposerWorkspaceCwd();
            return sessionActions.sendShellCommand(cmd).finally(() => {
              if (workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
              }
            });
          })
          .catch((error) => {
            reportError(
              error,
              needsSession && !sessionCreated
                ? 'Failed to create session for shell command'
                : 'Failed to execute shell command',
            );
          });
        return !needsSession;
      } else {
        if (promptBlocked) {
          return enqueuePrompt(
            text,
            images,
            undefined,
            commitComposerAccepted,
            metadata?.inputAnnotations,
          );
        }
        return submitPromptFromEditor(text, images, 'Failed to send message', {
          inputAnnotations: metadata?.inputAnnotations,
          trackSendFailure: true,
        });
      }
    },
    [
      beginPromptPreparation,
      sendPrompt,
      sessionActions,
      sessionOwnerGuard,
      store,
      enqueuePrompt,
      echoOrDeferLocalCommand,
      echoLocalCommandIfIdle,
      dispatchReadOnlyStatus,
      branchCurrentSession,
      closeMobileDrawer,
      openPanel,
      openScheduledTasks,
      openGoals,
      createNewSession,
      ensureSessionForPrompt,
      finishPromptPreparation,
      getComposerWorkspaceCwd,
      sessionCatalogController,
      gitDiffWorkspaceCwd,
      sessionWorktree,
      gitHubPrsSupported,
      handleBusyGoalClear,
      handleGoalSlashCommand,
      handleThemeChange,
      handleSetMode,
      handleLanguageChange,
      blockLocalCommandDuringTurn,
      createSideTask,
      sideTasksAvailable,
      openEnvironmentTasksPanel,
      hiddenCommands,
      loadSidebarSession,
      pushToast,
      reportError,
      runVisibleRecap,
      runVisibleBtw,
      reconcileCatalogRename,
      requireActiveSessionForLocalCommand,
      restartSseOnPrompt,
      resumeChatBottomFollow,
      selectedLanguage,
      setPendingModel,
      setPendingMode,
      setWorkspaceSetting,
      openVoiceModelPicker,
      writeVoiceModelForTarget,
      showContextUsage,
      t,
      workspaceActions,
      updateFailedPrompt,
      updateUnknownPromptAdmission,
    ],
  );
  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  const handleEditorSubmit = useCallback(
    (text, images, commitComposerAccepted, metadata) => {
      const accepted = handleSubmitRef.current(
        text,
        images,
        commitComposerAccepted,
        metadata,
      );
      if (accepted !== false) {
        resumeChatBottomFollow('smooth');
      }
      return accepted;
    },
    [resumeChatBottomFollow],
  );
  const handleConfirm = useCallback(
    (id, selectedOption, answers) => {
      const owner = sessionOwnerGuard.capture();
      sessionActions
        .submitPermission(id, selectedOption, answers)
        .catch((error) => {
          if (!owner.isCurrent()) return;
          reportError(error, 'Failed to submit permission choice');
        });
    },
    [sessionActions, reportError, sessionOwnerGuard],
  );
  const handleAskUserConfirm = useCallback(
    (id, selectedOption, answers) =>
      sessionActions.submitPermission(id, selectedOption, answers),
    [sessionActions],
  );
  const handleCancel = useCallback(() => {
    const owner = sessionOwnerGuard.capture();
    const dropped = queuedShellCommandsRef.current.length;
    queuedShellCommandsRef.current = [];
    drainGenerationRef.current++;
    isDrainingRef.current = false;
    shellSubmitInFlightRef.current = false;
    if (dropped > 0) {
      pushToast('warning', t('queue.shellDropped', { count: dropped }));
    }
    sessionActions.cancel().catch((error) => {
      if (!owner.isCurrent()) return;
      reportError(error, 'Failed to cancel request');
    });
  }, [sessionActions, reportError, pushToast, sessionOwnerGuard, t]);
  const handleFocusTaskPill = useCallback(() => {
    if (interactionBlocked) return false;
    return statusBarRef.current?.focusTaskPill() ?? false;
  }, [interactionBlocked]);
  const handleReturnToEditor = useCallback((text) => {
    if (text) {
      editorRef.current?.insertText(text);
      return;
    }
    editorRef.current?.focus();
  }, []);
  const discardUnknownPromptPayload = useCallback(() => {
    const current = unknownPromptAdmissionRef.current;
    if (
      !current?.payloadAvailable ||
      current.sessionId !== connectionRef.current.sessionId
    ) {
      return;
    }
    updateUnknownPromptAdmission({
      sessionId: current.sessionId,
      messageId: current.messageId,
      payloadAvailable: false,
    });
  }, [updateUnknownPromptAdmission]);
  const restoreUnknownPromptPayload = useCallback(() => {
    const current = unknownPromptAdmissionRef.current;
    const editor = editorRef.current;
    if (
      !current?.payloadAvailable ||
      current.sessionId !== connectionRef.current.sessionId ||
      !editor
    ) {
      return;
    }
    if (!window.confirm(t('queue.continueEditingConfirm'))) return;
    const draft = editor.getText();
    const restoredText = current.text?.trim()
      ? draft.trim()
        ? `${current.text}\n${draft}`
        : current.text
      : draft;
    if (restoredText !== draft) editor.setText(restoredText);
    if (current.images?.length) editor.restoreImages(current.images);
    if (current.inputAnnotations?.length) {
      editor.restoreInputAnnotations?.(current.inputAnnotations);
    }
    editor.focus();
    updateUnknownPromptAdmission({
      sessionId: current.sessionId,
      messageId: current.messageId,
      payloadAvailable: false,
    });
  }, [t, updateUnknownPromptAdmission]);
  const handleCanScrollToBottomChange = useCallback((canScrollToBottom) => {
    setCanScrollMessageListToBottom(canScrollToBottom);
  }, []);
  const handleRetry = useCallback(() => {
    if (sessionWriteBlockedRef.current || promptPreparationOwnerRef.current) {
      return;
    }
    if (
      showRetryHintRef.current &&
      connected &&
      streamingStateRef.current === 'idle' &&
      retryableTurnErrorIdRef.current &&
      retryableTurnErrorIdentityRef.current &&
      connectionRef.current.sessionId &&
      (lastSubmittedPromptRef.current ||
        (lastSubmittedImagesRef.current?.length ?? 0) > 0)
    ) {
      const savedRetryErrorIdentity = retryableTurnErrorIdentityRef.current;
      const currentRetryError = getRetryableTurnError(
        store.getSnapshot().blocks,
      );
      if (
        !savedRetryErrorIdentity ||
        !currentRetryError ||
        !matchesTurnErrorIdentity(currentRetryError, savedRetryErrorIdentity)
      ) {
        lastSubmittedPromptRef.current = '';
        lastSubmittedImagesRef.current = undefined;
        lastSubmittedInputAnnotationsRef.current = undefined;
        lastSubmittedSourceVersionRef.current = -1;
        retryableTurnErrorIdRef.current = null;
        retryableTurnErrorIdentityRef.current = undefined;
        retriedTurnErrorIdRef.current = null;
        setShowRetryHint(false);
        return;
      }
      const retryErrorId = currentRetryError.id;
      const retryErrorIdentity = { block: currentRetryError };
      const retrySessionId = connectionRef.current.sessionId;
      const retryText = lastSubmittedPromptRef.current;
      const retryImages = lastSubmittedImagesRef.current;
      const retryInputAnnotations = lastSubmittedInputAnnotationsRef.current;
      const previousRetriedTurnErrorId = retriedTurnErrorIdRef.current;
      const previousShowRetryHint = showRetryHintRef.current;
      const retryAttemptId = ++cancelledRetryAttemptRef.current;
      const retryOwner = retryOwnerRef.current;
      if (!retryOwnerIsCurrent(retryOwner)) {
        setShowRetryHint(false);
        return;
      }
      retriedTurnErrorIdRef.current = retryErrorId;
      setShowRetryHint(false);
      const retryTranscriptIdentity = {
        kind: 'turn-error',
        identity: retryErrorIdentity,
      };
      const retryTranscriptIsCurrent = () =>
        retryTranscriptIdentityMatches(
          store.getSnapshot().blocks,
          retryTranscriptIdentity,
        );
      setFailedPromptRetry({
        sessionId: retrySessionId,
        messageId: retryErrorId,
        startedAt: Date.now(),
        admitted: false,
        settled: false,
        owner: retryOwner,
        transcriptIdentity: retryTranscriptIdentity,
      });
      let admissionStarted = false;
      let admitted = false;
      sendPrompt(retryText, retryImages, {
        optimisticUserMessage: false,
        retry: true,
        inputAnnotations: retryInputAnnotations,
        onAdmissionStarted: () => {
          admissionStarted = true;
        },
        onAdmitted: () => {
          admitted = true;
          if (!retryOwnerIsCurrent(retryOwner)) return;
          setFailedPromptRetry((current) =>
            current?.transcriptIdentity === retryTranscriptIdentity
              ? retryTranscriptIsCurrent()
                ? { ...current, admitted: true }
                : null
              : current,
          );
        },
        onCancelledBeforeAdmission: () => {
          restoreOrDeferCancelledRetry(retryOwner, {
            kind: 'turn-error',
            attemptId: retryAttemptId,
            errorId: retryErrorId,
            identity: retryErrorIdentity,
            text: retryText,
            images: retryImages,
            inputAnnotations: retryInputAnnotations,
            previousRetriedTurnErrorId,
            previousShowRetryHint,
          });
        },
      })
        .catch((error) => {
          if (!retryOwnerIsCurrent(retryOwner)) return;
          const definitelyRejected = isDefinitelyRejectedPromptAdmission(error);
          if (admissionStarted && !admitted && !definitelyRejected) {
            if (!retryTranscriptIsCurrent()) return;
            updateUnknownPromptAdmission({
              sessionId: retrySessionId,
              messageId: retryErrorId,
              text: retryText,
              images: retryImages ? [...retryImages] : undefined,
              inputAnnotations: retryInputAnnotations,
              payloadAvailable: true,
            });
            pushToast('warning', t('queue.admissionUnknown'));
            console.warn(
              '[WebShell] post-turn retry admission outcome is unknown',
              error,
            );
            return;
          }
          if (!admitted) {
            restoreOrDeferCancelledRetry(retryOwner, {
              kind: 'turn-error',
              attemptId: retryAttemptId,
              errorId: retryErrorId,
              identity: retryErrorIdentity,
              text: retryText,
              images: retryImages,
              inputAnnotations: retryInputAnnotations,
              previousRetriedTurnErrorId,
              previousShowRetryHint,
            });
          }
          if (isDaemonTurnError(error)) {
            failedTurnErrorRetryRef.current = {
              errorId: retryErrorId,
              text: retryText,
              images: retryImages,
              inputAnnotations: retryInputAnnotations,
              owner: retryOwner,
            };
            const nextTurnError = getRetryableTurnError(
              store.getSnapshot().blocks,
            );
            if (nextTurnError) {
              rearmFailedTurnErrorRetry(
                nextTurnError,
                store.getSnapshot().blocks,
              );
            }
          }
          if (retryTranscriptIsCurrent()) {
            reportError(error, 'Failed to retry prompt');
          }
        })
        .finally(() => {
          if (!retryOwnerIsCurrent(retryOwner)) return;
          setFailedPromptRetry((current) =>
            current?.transcriptIdentity === retryTranscriptIdentity
              ? retryTranscriptIsCurrent()
                ? { ...current, settled: true }
                : null
              : current,
          );
        });
    } else {
      store.dispatch([{ type: 'status', text: t('retry.none') }]);
    }
  }, [
    connected,
    pushToast,
    reportError,
    rearmFailedTurnErrorRetry,
    restoreOrDeferCancelledRetry,
    retryOwnerIsCurrent,
    sendPrompt,
    store,
    t,
    updateUnknownPromptAdmission,
  ]);
  useEffect(() => {
    const onGlobalShortcut = (e) => {
      if (interactionBlocked) return;
      if (e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (e.key === 'l') {
          e.preventDefault();
          handleClearScreen();
          return;
        }
        if (e.key === 'o') {
          e.preventDefault();
          handleToggleCompact();
          return;
        }
        if (e.key === 'y') {
          e.preventDefault();
          handleRetry();
          return;
        }
      }
    };
    window.addEventListener('keydown', onGlobalShortcut, true);
    return () => window.removeEventListener('keydown', onGlobalShortcut, true);
  }, [
    interactionBlocked,
    handleClearScreen,
    handleToggleCompact,
    handleRetry,
    store,
    t,
  ]);
  const resetEscapeState = useCallback(() => {
    escArmedActionRef.current = null;
    setEscapeHintVisible(false);
    setCancelArmed(false);
    if (escapeTimerRef.current) {
      clearTimeout(escapeTimerRef.current);
      escapeTimerRef.current = null;
    }
  }, []);
  // The Esc handler reads live state, but its global keydown listener must mount
  // ONCE: streamingState flips among 'waiting'/'responding'/'thinking' mid-turn,
  // and if it were an effect dep each flip would tear the listener down and run
  // resetEscapeState(), wiping a half-armed two-press cancel. Read live values
  // through a ref so the listener stays put across re-renders.
  const escLiveRef = useRef({
    streamingState,
    pendingApproval,
    interactionBlocked,
    activePanel,
    closePanel,
    handleCancel,
    handleCycleMode,
    artifactPanelFullscreen,
  });
  escLiveRef.current = {
    streamingState,
    pendingApproval,
    interactionBlocked,
    activePanel,
    closePanel,
    handleCancel,
    handleCycleMode,
    artifactPanelFullscreen,
  };
  // Clear a half-armed two-press whenever the streaming/idle boundary flips — the
  // relevant action (cancel vs clear) changes with it, so a leftover arm is now
  // stale. Keyed on the boolean, so intra-turn sub-state flips don't reset it.
  const escStreamingBoundary = streamingState !== 'idle';
  useEffect(() => {
    resetEscapeState();
  }, [escStreamingBoundary, resetEscapeState]);
  useEffect(() => {
    // Arm a two-press action: the first Esc shows the affordance and starts a
    // confirm window; a second Esc within it confirms, any other key resets it.
    const ESC_CANCEL_CONFIRM_WINDOW_MS = 2000;
    const ESC_CLEAR_CONFIRM_WINDOW_MS = 500;
    const armEscape = (action, windowMs) => {
      escArmedActionRef.current = action;
      if (action === 'cancel') setCancelArmed(true);
      else setEscapeHintVisible(true);
      if (escapeTimerRef.current) clearTimeout(escapeTimerRef.current);
      escapeTimerRef.current = setTimeout(resetEscapeState, windowMs);
    };
    const onKeyDown = (e) => {
      // keyCode 229: WebKit marks IME-owned keys this way while isComposing
      // is still false; the IME owns them exactly like composing keys.
      if (e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
      const live = escLiveRef.current;
      // The fullscreen right panel (artifacts/subagents) is the topmost
      // surface; Escape shrinks it back to its dock/drawer. Modals opened on
      // top are DialogShells, whose own handler stops Escape before this
      // listener, so this only fires when the panel itself is topmost.
      if (e.key === 'Escape' && live.artifactPanelFullscreen) {
        // Mirror the activePanel branch below: the sidebar search input
        // clears on Escape without stopping the event, so don't also shrink
        // the panel when Escape is being handled inside the sidebar.
        const target = e.target;
        if (!target?.closest('[data-sidebar-shell]')) {
          e.preventDefault();
          setArtifactPanelFullscreen(false);
        }
        return;
      }
      // A full-view panel (Settings / Daemon Status) replaces the chat rather
      // than overlaying it; Escape returns to the chat. Any modal opened on top
      // of the panel is a DialogShell, whose own handler stops Escape from
      // reaching this window listener, so this only fires when the panel itself
      // is the topmost surface.
      if (e.key === 'Escape' && live.activePanel) {
        // The sidebar stays usable beside the panel and its search input clears
        // on Escape without stopping the event; don't also close the panel when
        // Escape is being handled inside the sidebar. Scope the panel close to
        // Escape originating outside the sidebar drawer.
        const target = e.target;
        if (!target?.closest('[data-sidebar-shell]')) {
          e.preventDefault();
          live.closePanel();
        }
        return;
      }
      if (e.key !== 'Escape') {
        if (escArmedActionRef.current !== null) {
          resetEscapeState();
        }
        if (e.key === 'Tab' && e.shiftKey && !live.interactionBlocked) {
          e.preventDefault();
          live.handleCycleMode();
        }
        return;
      }
      // Streaming takes priority over clearing text (queued prompts stay intact
      // and drain after the turn settles); see decideEscapeIntent for the rules.
      const intent = decideEscapeIntent({
        blocked: !!live.pendingApproval || live.interactionBlocked,
        streaming: live.streamingState !== 'idle',
        hasInput: !!editorRef.current?.hasInput(),
        armed: escArmedActionRef.current,
      });
      if (intent.kind === 'ignore') return;
      e.preventDefault();
      switch (intent.kind) {
        case 'cancel':
          live.handleCancel();
          resetEscapeState();
          break;
        case 'clear':
          editorRef.current?.clear();
          resetEscapeState();
          break;
        case 'arm':
          armEscape(
            intent.action,
            intent.action === 'cancel'
              ? ESC_CANCEL_CONFIRM_WINDOW_MS
              : ESC_CLEAR_CONFIRM_WINDOW_MS,
          );
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      resetEscapeState();
    };
  }, [resetEscapeState]);
  const isDisabled =
    sessionWriteBlocked ||
    shouldDisableComposerInput({
      catchingUp: Boolean(connection.catchingUp),
      pendingApproval: pendingApproval !== null,
      isPreparingPrompt,
    });
  const retryableTurnErrorIdentity = retryableTurnErrorIdentityRef.current;
  const showCurrentRetryHint = Boolean(
    showRetryHint &&
      !isPreparingPrompt &&
      retryableTurnErrorIdentity &&
      matchesTurnErrorIdentity(
        getRetryableTurnError(blocks),
        retryableTurnErrorIdentity,
      ) &&
      retryOwnerIsCurrent(retryOwnerRef.current),
  );
  const latestUserBlock = getLatestUserBlock(blocks);
  const visibleFailedPromptBlock =
    failedPrompt &&
    latestUserBlock &&
    matchesUserMessageIdentity(
      latestUserBlock,
      failedPrompt.identity,
      failedPrompt.owner.snapshot.isCurrent(),
    ) &&
    retryOwnerIsCurrent(failedPrompt.owner)
      ? latestUserBlock
      : undefined;
  const composerPlaceholderInputState = {
    catchingUp: Boolean(connection.catchingUp),
    isPreparingPrompt,
    isStreaming: streamingState !== 'idle',
  };
  const composerPlaceholderState = getComposerPlaceholderState(
    composerPlaceholderInputState,
  );
  const customComposerPlaceholder =
    composerPlaceholders?.[composerPlaceholderState];
  const composerPlaceholderText = customComposerPlaceholder?.trim()
    ? customComposerPlaceholder
    : t(getComposerPlaceholderKey(composerPlaceholderInputState));
  const handleModelSelect = useCallback(
    (modelId) => {
      if (sessionWriteBlocked) return;
      if (!connectionRef.current.sessionId) {
        setPendingModel(modelId);
        return;
      }
      // Drive the shared busy flag so the model-management rows disable while a
      // selection is in flight — rapid Set current clicks would otherwise launch
      // concurrent setModel calls that can resolve out of order and leave a
      // model other than the user's last click active.
      const owner = sessionOwnerGuard.capture();
      const modelActionToken = ++modelActionTokenRef.current;
      setModelActionBusy(true);
      sessionActions
        .setModel(modelId)
        .then((result) => {
          if (!owner.isCurrent()) return;
          const summary = getModelSwitchSummary(result);
          setPendingModel(summary?.modelId ?? modelId);
          if (summary) {
            store.dispatch({
              type: 'debug',
              text: serializeModelSwitchSummary(summary, t),
              source: 'model_switch_summary',
              data: summary,
            });
          }
        })
        .catch((error) => {
          if (!owner.isCurrent()) return;
          reportError(error, t('model.switch'));
        })
        .finally(() => {
          if (modelActionTokenRef.current === modelActionToken) {
            setModelActionBusy(false);
          }
        });
    },
    [
      sessionWriteBlocked,
      reportError,
      sessionActions,
      sessionOwnerGuard,
      setPendingModel,
      store,
      t,
    ],
  );
  const handleReasoningEffort = useCallback(
    (value) => {
      if (sessionWriteBlocked || !connectionRef.current.sessionId) {
        return Promise.resolve();
      }
      return sessionActions
        .setReasoningEffort(value)
        .catch((error) => reportError(error, t('reasoning.updateFailed')));
    },
    [reportError, sessionActions, sessionWriteBlocked, t],
  );
  const handleDeleteModel = useCallback(
    (target) => {
      const modelActionToken = ++modelActionTokenRef.current;
      setModelActionBusy(true);
      workspaceActions
        .deleteModel(target)
        .then((result) => {
          // A scrubbed fallback requires a restart — surface it like the
          // settings panel does.
          if (result?.requiresRestart) {
            store.dispatch([
              { type: 'status', text: t('settings.requiresRestart') },
            ]);
          }
          // A transient reload failure shouldn't surface as "delete failed" —
          // the model was already removed. Just log it. Reload settings too so a
          // cleared active model / scrubbed fallback isn't shown stale.
          reloadProviders().catch((err) => {
            console.warn(
              '[web-shell] failed to reload providers after delete',
              err,
            );
          });
          reloadWorkspaceSettings().catch((err) => {
            console.warn(
              '[web-shell] failed to reload settings after delete',
              err,
            );
          });
        })
        .catch((error) => {
          reportError(error, t('settings.models.deleteFailed'));
        })
        .finally(() => {
          if (modelActionTokenRef.current === modelActionToken) {
            setModelActionBusy(false);
          }
        });
    },
    // Depend on the stable `reload` fn, not the whole providersState object,
    // which useProviders returns fresh each render (would defeat the memo).
    [
      workspaceActions,
      reloadProviders,
      reloadWorkspaceSettings,
      reportError,
      store,
      t,
    ],
  );
  const handleCloseAuthDialog = useCallback(() => {
    setShowAuthDialog(false);
    // The provider install flow doesn't broadcast a settings change, so refresh
    // the model list on close to surface any newly added models. Log a failed
    // reload (leaves stale model data) rather than swallowing it.
    reloadProviders().catch((err) => {
      console.warn(
        '[web-shell] failed to reload providers after auth dialog close',
        err,
      );
    });
  }, [reloadProviders]);
  const handleFallbacksConfirm = useCallback(
    (baseIds) => {
      setShowFallbacksDialog(false);
      setWorkspaceSetting(
        modelSettingScope,
        'modelFallbacks',
        baseIds.join(','),
      )
        .then((result) => {
          // modelFallbacks requiresRestart — tell the user, like the settings
          // panel does for restart-required edits.
          if (result?.requiresRestart) {
            store.dispatch([
              { type: 'status', text: t('settings.requiresRestart') },
            ]);
          }
          // A reload failure shouldn't surface as "save failed" — the value
          // was already persisted. Just log it.
          reloadWorkspaceSettings().catch((err) => {
            console.warn(
              '[web-shell] failed to reload settings after fallbacks save',
              err,
            );
          });
        })
        .catch((error) =>
          reportError(error, t('settings.models.fallbacks.saveFailed')),
        );
    },
    [
      modelSettingScope,
      setWorkspaceSetting,
      reloadWorkspaceSettings,
      reportError,
      store,
      t,
    ],
  );
  const handleFastModelSelect = useCallback(
    (modelId) => {
      if (streamingState !== 'idle') {
        blockLocalCommandDuringTurn();
        return;
      }
      // Model IDs from the picker arrive as bare model IDs (baseModelId), not
      // ACP format. The model picker strips the (authType) suffix before
      // calling this handler.
      //
      // Close the panel before sending: unlike the vision/voice pickers (silent
      // setWorkspaceSetting), `/model --fast` runs a real turn whose response
      // lands in the message list. With the panel open the chat is hidden, so
      // that response would pile up behind it and surprise the user on close.
      // Closing first returns them to the chat to see it in context (matching
      // the pre-panel modal behavior).
      closePanel();
      // Persist to the scope the picker was opened for (matching the silent
      // vision/voice pickers). `/model` parses --global/--project as the persist
      // scope; without a flag the command would default to its own scope logic
      // and ignore the user's User-vs-Workspace choice.
      const scopeFlag =
        modelSettingScope === 'user' ? ' --global' : ' --project';
      const owner = { current: sessionOwnerGuard.capture() };
      sendPrompt(`/model --fast ${modelId}${scopeFlag}`, undefined, {
        ownerRef: owner,
      })
        .then(() => {
          if (!owner.current.isCurrent()) return;
          // sendPrompt resolves only after the `/model --fast` turn *completes*
          // (actions.ts → waitForAcceptedPromptCompletion), so the change is
          // already applied here — this reload reads the new value, not a stale
          // one. It keeps the workspace-settings state fresh for the next time
          // Settings is opened (the command path, unlike setWorkspaceSetting,
          // doesn't bump the settingsVersion signal). Guard its own rejection —
          // the .catch below only covers sendPrompt — and log it so a failed
          // reload (leaving stale settings on next open) leaves a trace.
          reloadWorkspaceSettings().catch((err) => {
            console.warn(
              '[web-shell] failed to reload workspace settings after fast-model switch',
              err,
            );
          });
        })
        .catch((error) => {
          if (!owner.current.isCurrent()) return;
          reportError(error, 'Failed to switch fast model');
        });
    },
    [
      blockLocalCommandDuringTurn,
      closePanel,
      sendPrompt,
      streamingState,
      reportError,
      reloadWorkspaceSettings,
      modelSettingScope,
      sessionOwnerGuard,
    ],
  );
  const handleVoiceModelSelect = useCallback(
    (modelId) => {
      // Model IDs from the voice picker arrive as bare model IDs (baseModelId),
      // not ACP format. extractVoiceModels() sets id to the baseModelId.
      const bareModelId = extractBareModelId(modelId);
      const target = voicePickerTargetRef.current;
      if (!target || target.ownerKey !== mainVoiceTargetRef.current?.ownerKey) {
        reportError(
          new Error(
            'The Voice workspace changed before the selection applied.',
          ),
          t('model.setVoice'),
        );
        return;
      }
      void writeVoiceModelForTarget(
        bareModelId,
        modelSettingScope,
        target,
      ).catch((error) => reportError(error, t('model.setVoice')));
    },
    [modelSettingScope, reportError, t, writeVoiceModelForTarget],
  );
  const handleVisionModelSelect = useCallback(
    (modelId) => {
      // Model IDs from the picker arrive in ACP format: `modelId(authType)`.
      // Core's resolveVisionModelSelection() expects `authType:modelId`.
      const encoded = encodeVisionModelForSetting(modelId);
      setWorkspaceSetting(modelSettingScope, 'visionModel', encoded).catch(
        (error) => reportError(error, t('model.setVision')),
      );
    },
    [modelSettingScope, reportError, setWorkspaceSetting, t],
  );
  const modelHandlers = {
    main: handleModelSelect,
    fast: handleFastModelSelect,
    voice: handleVoiceModelSelect,
    vision: handleVisionModelSelect,
  };
  // Once every settings-launched model surface is closed (the model picker via
  // modelDialogMode, the fallbacks dialog, or the Add Model / auth dialog),
  // reset the persist scope so a later command-launched picker defaults back
  // to workspace.
  useEffect(() => {
    if (!modelDialogMode && !showFallbacksDialog && !showAuthDialog) {
      setModelSettingScope('workspace');
    }
  }, [modelDialogMode, showFallbacksDialog, showAuthDialog]);
  const commands = useMemo(() => {
    const previousSkillNames = new Set(
      (connection.skills ?? []).map((skill) => skill.toLowerCase()),
    );
    const retainedCommands = loadedSkillsReady
      ? (connection.commands ?? []).filter(
          (command) =>
            command.source !== 'skill' &&
            !previousSkillNames.has(command.name.toLowerCase()),
        )
      : (connection.commands ?? []);
    const refreshedSkillCommands = loadedSkillsReady
      ? loadedSkills.map((skill) => ({
          name: skill.name,
          description: skill.description,
          ...(skill.argumentHint ? { argumentHint: skill.argumentHint } : {}),
          source: 'skill',
          displayCategory: 'skill',
        }))
      : [];
    return localizeBuiltinDescriptions(
      mergeCommands(
        retainedCommands,
        refreshedSkillCommands,
        getLocalCommands(t, { sideTaskAvailable: sideTasksAvailable }),
      ),
      t,
    )
      .filter(
        (command) => !hiddenCommands.has(normalizeHiddenCommand(command.name)),
      )
      .map((command) => {
        const skillKey = skillDescriptionKey(command.name);
        if (!skillKey) return command;
        return {
          ...command,
          displayCategory: 'skill',
          description: t(skillKey),
        };
      });
  }, [
    connection.commands,
    connection.skills,
    hiddenCommands,
    loadedSkills,
    loadedSkillsReady,
    sideTasksAvailable,
    t,
  ]);
  const welcomeHeaderProps = useMemo(
    () => ({
      version: connection.capabilities?.qwenCodeVersion || '',
      cwd: connection.workspaceCwd || '',
      currentModel,
      currentMode,
      hideTips: hideTipsSetting?.values.effective === true,
    }),
    [
      connection.capabilities?.qwenCodeVersion,
      connection.workspaceCwd,
      currentModel,
      currentMode,
      hideTipsSetting?.values.effective,
    ],
  );
  const welcomeHeader = useMemo(
    () =>
      _jsx(_Fragment, {
        children: renderWelcomeHeader
          ? renderWelcomeHeader(welcomeHeaderProps)
          : _jsx(WelcomeHeader, { ...welcomeHeaderProps }),
      }),
    [renderWelcomeHeader, welcomeHeaderProps],
  );
  const welcomeFooter = useMemo(
    () => renderWelcomeFooter?.(welcomeHeaderProps),
    [renderWelcomeFooter, welcomeHeaderProps],
  );
  const isChatEmptyState =
    !connection.sessionId &&
    displayMessages.length === 0 &&
    !showFloatingTodos &&
    !pendingApproval &&
    !btwMessage;
  const useMobileWelcomeMiddleLayout =
    isChatEmptyState && mobileWelcomeFooterMiddle;
  const showMobileWelcomeFooterMiddle =
    useMobileWelcomeMiddleLayout && Boolean(welcomeFooter);
  const hasWelcomeMiddle = isChatEmptyState && showMobileWelcomeFooterMiddle;
  const hasMobileComposerBottom =
    isChatEmptyState && useMobileWelcomeMiddleLayout;
  const missingSession =
    connection.status !== 'connecting' &&
    !connection.sessionId &&
    connection.missingSession === true;
  const showMissingSessionState =
    missingSession && !activePanel && mainView === 'chat';
  const effectiveChatWidthMode = isChatEmptyState
    ? getDefaultChatWidthMode()
    : chatWidthMode;
  const activeGitBranch = sessionWorktree
    ? (selectedWorkspaceGitStatus?.branch ?? sessionWorktree.branch)
    : sessionBranch
      ? (selectedWorkspaceGitStatus?.branch ?? sessionBranch.name)
      : connection.sessionId
        ? connection.gitBranch
        : (selectedWorkspaceGitStatus?.branch ?? undefined);
  const environmentPanelCanDock =
    contextBodyWidth === null ||
    contextBodyWidth >=
      MIN_DOCKED_MESSAGE_AREA_WIDTH + DOCKED_ENVIRONMENT_PANEL_WIDTH;
  const environmentPanelFits =
    chatWidthMode !== 'wide' && environmentPanelCanDock;
  const environmentPanelVisible =
    environmentPanelOpen &&
    !isChatEmptyState &&
    !activePanel &&
    mainView === 'chat';
  const handleEnvironmentPanelOpenChange = useCallback((open) => {
    if (!open) {
      preserveEnvironmentPanelOnArtifactOpenRef.current = false;
      setEnvironmentPanelOpen(false);
      return;
    }
    setEnvironmentPanelOpen(true);
  }, []);
  const dismissEnvironmentPanel = useCallback(() => {
    preserveEnvironmentPanelOnArtifactOpenRef.current = false;
    setEnvironmentPanelOpen(false);
  }, []);
  const handleRightPanelOpenChange = useCallback(
    (open) => {
      if (open) {
        setArtifactPanelOpen(true);
      } else {
        closeArtifactPanel();
      }
    },
    [closeArtifactPanel],
  );
  useLayoutEffect(() => {
    const body = contextBodyRef.current;
    if (!body) return;
    const updateWidth = () => {
      const availableWidth = body.getBoundingClientRect().width;
      if (availableWidth <= 0) return;
      setContextBodyWidth((current) =>
        current === availableWidth ? current : availableWidth,
      );
    };
    const handleWindowResize = () => {
      preserveEnvironmentPanelOnArtifactOpenRef.current = false;
      updateWidth();
    };
    updateWidth();
    window.addEventListener('resize', handleWindowResize);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(body);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      observer.disconnect();
    };
  }, []);
  const previousEnvironmentCanDockRef = useRef(environmentPanelCanDock);
  useLayoutEffect(() => {
    const crossedDockBreakpoint =
      previousEnvironmentCanDockRef.current && !environmentPanelCanDock;
    previousEnvironmentCanDockRef.current = environmentPanelCanDock;
    if (
      crossedDockBreakpoint &&
      !preserveEnvironmentPanelOnArtifactOpenRef.current
    ) {
      setEnvironmentPanelOpen(false);
    }
  }, [environmentPanelCanDock]);
  const previousArtifactPanelOpenForEnvironmentRef = useRef(artifactPanelOpen);
  useLayoutEffect(() => {
    const artifactPanelJustOpened =
      !previousArtifactPanelOpenForEnvironmentRef.current && artifactPanelOpen;
    previousArtifactPanelOpenForEnvironmentRef.current = artifactPanelOpen;
    if (!artifactPanelOpen) {
      preserveEnvironmentPanelOnArtifactOpenRef.current = false;
      return;
    }
    if (!artifactPanelJustOpened) return;
    const preserveEnvironmentPanel =
      preserveEnvironmentPanelOnArtifactOpenRef.current;
    if (!preserveEnvironmentPanel && !environmentPanelFits) {
      setEnvironmentPanelOpen(false);
    }
  }, [artifactPanelOpen, environmentPanelFits]);
  const environmentPanelMounted =
    !isChatEmptyState && !activePanel && mainView === 'chat';
  const chatWidthToggleMin = getChatMaxWidth(chatMaxWidth);
  const appClassName = [
    styles.app,
    styles.appChat,
    isChatEmptyState ? styles.appChatEmpty : undefined,
    sidebarOptions.enabled ? styles.appWithSidebar : undefined,
    selectedTheme === WebShellThemeId.Light
      ? styles.themeLight
      : styles.themeDark,
    selectedTheme === WebShellThemeId.Dark ? 'dark' : undefined,
    externalClassName,
  ]
    .filter(Boolean)
    .join(' ');
  const appStyle = useMemo(
    () => ({
      ...externalStyle,
      ...getChatWidthStyle(effectiveChatWidthMode, chatMaxWidth),
    }),
    [chatMaxWidth, effectiveChatWidthMode, externalStyle],
  );
  const handleChatWidthModeChange = useCallback((mode) => {
    setChatWidthMode(mode);
    writeChatWidthMode(mode);
  }, []);
  useLayoutEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const previousRect = previousFooterRectRef.current;
    const wasEmpty = previousEmptyStateRef.current;
    const nextRect = footer.getBoundingClientRect();
    if (wasEmpty && !isChatEmptyState && previousRect) {
      const offsetY = previousRect.top - nextRect.top;
      if (Math.abs(offsetY) > 1) {
        footer.style.transition = 'width 320ms ease';
        footer.style.transform = `translateY(${offsetY}px)`;
        requestAnimationFrame(() => {
          footer.style.transition = 'width 320ms ease, transform 280ms ease';
          footer.style.transform = '';
        });
        window.setTimeout(() => {
          footer.style.transition = '';
        }, 320);
      }
    }
    previousFooterRectRef.current = nextRect;
    previousEmptyStateRef.current = isChatEmptyState;
  }, [isChatEmptyState]);
  useLayoutEffect(() => {
    const host = shadowDomOptions.portals
      ? document.createElement('div')
      : null;
    const shadowRoot = host?.attachShadow({ mode: 'open' }) ?? null;
    const root = document.createElement('div');
    root.dataset.webShellPortalRoot = '';
    root.dataset.webShellShadcn = '';
    if (host && shadowRoot) {
      host.dataset.webShellShadowHost = 'portals';
      host.style.setProperty('all', 'initial', 'important');
      host.style.setProperty('position', 'fixed', 'important');
      host.style.setProperty('inset', '0', 'important');
      host.style.setProperty('width', '0', 'important');
      host.style.setProperty('height', '0', 'important');
      host.style.setProperty(
        'z-index',
        'var(--web-shell-portal-root-z-index, 1000)',
        'important',
      );
      const removeStyles = installWebShellShadowStyles(
        shadowRoot,
        shadowDomOptions.styles,
      );
      shadowRoot.appendChild(root);
      document.body.appendChild(host);
      setPortalRoot(root);
      return () => {
        host.remove();
        removeStyles();
        setPortalRoot(null);
      };
    } else {
      document.body.appendChild(root);
      setPortalRoot(root);
      return () => {
        root.remove();
        setPortalRoot(null);
      };
    }
  }, [shadowDomOptions.portals, shadowDomOptions.styles]);
  useLayoutEffect(() => {
    const root = appRootRef.current;
    if (!root || !portalRoot) return;
    const portalRootNode = portalRoot.getRootNode();
    const portalHost =
      portalRootNode instanceof ShadowRoot ? portalRootNode.host : null;
    let frameId = null;
    const syncVariables = () => {
      frameId = null;
      const computedStyle = getComputedStyle(root);
      const nextNames = new Set();
      portalRoot.dataset.webShellShadcn = '';
      portalRoot.classList.toggle(
        'dark',
        selectedTheme === WebShellThemeId.Dark,
      );
      portalRoot.lang = selectedLanguage;
      for (let index = 0; index < computedStyle.length; index += 1) {
        const name = computedStyle[index];
        if (!name.startsWith('--')) continue;
        nextNames.add(name);
        const value = computedStyle.getPropertyValue(name);
        portalRoot.style.setProperty(name, value);
        portalHost?.style.setProperty(name, value);
      }
      for (const name of portalRootVariableNamesRef.current) {
        if (!nextNames.has(name)) {
          portalRoot.style.removeProperty(name);
          portalHost?.style.removeProperty(name);
        }
      }
      portalRootVariableNamesRef.current = nextNames;
    };
    const scheduleSync = () => {
      if (frameId === null) frameId = requestAnimationFrame(syncVariables);
    };
    syncVariables();
    const observer = new MutationObserver(scheduleSync);
    let element = root;
    while (element) {
      observer.observe(element, {
        attributes: true,
        attributeFilter: ['class', 'style', 'data-theme', 'lang'],
      });
      element = element.parentElement;
    }
    window.addEventListener('resize', scheduleSync);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleSync);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [appClassName, appStyle, portalRoot, selectedLanguage, selectedTheme]);
  // Shared by the drawer and docked render sites below; only the genuine
  // per-variant props (variant / panelWidth) stay at each site.
  const artifactPanelSharedProps = {
    artifacts: artifactPanelArtifacts,
    tabs: artifactPanelTabs,
    activeTabId: activeArtifactPanelTabId,
    reviewChanges,
    selectedReviewPath,
    workspaceCwd: connection.workspaceCwd || '',
    loading: artifactsLoading,
    error: artifactsError,
    onSelectTab: setActiveArtifactPanelTabId,
    onCloseTab: closeArtifactPanelTab,
    onOpenFilePreview: openFilePreview,
    latestReviewAvailable: latestReviewChanges.length > 0,
    onOpenLatestReview: openLatestReviewPanel,
    items: rightPanelItems,
    sideTaskAvailable: sideTasksAvailable,
    sideTasks: visibleSideTasks,
    sideTasksLoading,
    onCreateSideTask: createEmptySideTask,
    onOpenSideTask: openSideTask,
    onCreateSideTaskSession: createSideTaskSession,
    onSideTaskCreated: handleSideTaskCreated,
    onSideTaskTitleChange: handleSideTaskTitleChange,
    onNestedRightPanelOpen: handleTurnOutputOpen,
    onNestedArtifactsChange: handlePaneArtifactsChange,
    onError: reportError,
    sessionWorkflowEnabled,
    onImageIngestionNotice: pushToast,
    deferSubagentMount,
    onClose: closeArtifactPanel,
    fullscreen: artifactPanelFullscreen,
    onToggleFullscreen: toggleArtifactPanelFullscreen,
  };
  return _jsx(ThemeProvider, {
    value: selectedTheme,
    children: _jsx(I18nProvider, {
      language: selectedLanguage,
      children: _jsx(WebShellPortalRootContext.Provider, {
        value: portalRoot,
        children: _jsxs('div', {
          ref: appRootRef,
          className: appClassName,
          style: appStyle,
          'data-web-shell-root': true,
          'data-web-shell-shadcn': true,
          lang: selectedLanguage,
          children: [
            !onToast &&
              _jsx(ToastHost, {
                toasts: toasts,
                onDismiss: dismissToast,
                elevated: artifactPanelFullscreen,
              }),
            showResumeDialog &&
              _jsx(DialogShell, {
                title: t('resume.title'),
                size: 'lg',
                onClose: () => setShowResumeDialog(false),
                children: _jsx(ResumeDialog, {
                  workspaceCwd: lockedWorkspaceCwd,
                  onSelect: (sessionId) => {
                    loadSidebarSession(sessionId).catch((error) => {
                      reportError(error, 'Failed to load session');
                    });
                  },
                  onClose: () => setShowResumeDialog(false),
                }),
              }),
            modelDialogMode &&
              _jsx(DialogShell, {
                title: t(MODE_TITLE_KEY[modelDialogMode]),
                size: 'lg',
                onClose: () => setModelDialogMode(null),
                children: _jsx(ModelDialog, {
                  mode: modelDialogMode,
                  models: modelDialogMode === 'voice' ? voiceModels : undefined,
                  currentModelId:
                    modelDialogMode === 'voice'
                      ? currentVoiceModel
                      : modelDialogMode === 'vision'
                        ? currentVisionModel
                        : modelDialogMode === 'fast'
                          ? currentFastModel
                          : undefined,
                  onSelect: (modelId) => {
                    if (modelDialogMode) {
                      modelHandlers[modelDialogMode](modelId);
                    }
                    setModelDialogMode(null);
                  },
                }),
              }),
            showApprovalModeDialog &&
              _jsx(DialogShell, {
                title: t('mode.select'),
                size: 'sm',
                onClose: () => setShowApprovalModeDialog(false),
                children: _jsx(ApprovalModeDialog, {
                  currentMode: currentMode,
                  sessionWorkflowEnabled: sessionWorkflowEnabled,
                  onSelect: (modeId) => {
                    handleSetMode(modeId);
                    setShowApprovalModeDialog(false);
                  },
                }),
              }),
            showToolsDialog &&
              _jsx(DialogShell, {
                title: t('tools.title'),
                size: 'lg',
                onClose: () => setShowToolsDialog(false),
                children: _jsx(ToolsDialog, {}),
              }),
            gitDialog &&
              _jsx(
                GitDialog,
                {
                  workspaceCwd: gitDialog.workspaceCwd,
                  gitCwd: gitDialog.gitCwd,
                  initialView: gitDialog.view,
                  sessionId: connection.sessionId,
                  resolveSessionForWorkspace: resolveSessionForWorkspace,
                  onClose: () => setGitDialog(undefined),
                },
                `${gitDialog.workspaceCwd}:${gitDialog.gitCwd ?? ''}:${gitDialog.view}`,
              ),
            tasksDialogMessage &&
              _jsx(DialogShell, {
                title:
                  sessionWorkflowEnabled && floatingTodos.length > 0
                    ? t('planExecution.dialogTitle')
                    : t('tasks.title'),
                size: 'lg',
                onClose: () => setTasksDialogMessage(null),
                children: _jsx(TasksStatusMessage, {
                  message: tasksDialogMessage,
                  embedded: true,
                  manageActiveEvent: false,
                  onClose: () => setTasksDialogMessage(null),
                  planTodos: sessionWorkflowEnabled ? floatingTodos : [],
                  agentTools: sessionWorkflowEnabled ? planAgentTools : [],
                  onOpenSubagent: (tool) => {
                    setTasksDialogMessage(null);
                    openSubagentPanel(tool);
                  },
                  onOpenMonitor: handleOpenMonitorDetails,
                }),
              }),
            showMemoryDialog &&
              _jsx(DialogShell, {
                title: t('memory.menu'),
                size: 'lg',
                onClose: () => setShowMemoryDialog(false),
                children: _jsx(MemoryMessage, {
                  refreshSignal: memoryRefreshSignal,
                  addSignal: memoryAddSignal,
                  addScope: memoryAddScope,
                  onMessage: (text, type = 'status') => {
                    store.dispatch([{ type, text }]);
                  },
                }),
              }),
            showHelpDialog &&
              _jsx(DialogShell, {
                title: t('help.title'),
                size: 'md',
                onClose: () => setShowHelpDialog(false),
                children: _jsx(HelpDialog, { commands: commands }),
              }),
            showThemeDialog &&
              _jsx(DialogShell, {
                title: t('theme.title'),
                size: 'sm',
                onClose: () => setShowThemeDialog(false),
                children: _jsx(ThemeDialog, {
                  currentTheme: selectedTheme,
                  onSelect: handleThemeChange,
                  onClose: () => setShowThemeDialog(false),
                }),
              }),
            showAuthDialog &&
              _jsx(DialogShell, {
                title: t('auth.title'),
                size: 'lg',
                onClose: handleCloseAuthDialog,
                children: _jsx(AuthMessage, {
                  onMessage: (text, type = 'status') => {
                    store.dispatch([
                      type === 'error'
                        ? { type: 'error', text }
                        : { type: 'status', text },
                    ]);
                  },
                  onClose: handleCloseAuthDialog,
                }),
              }),
            showFallbacksDialog &&
              _jsx(DialogShell, {
                title: t('settings.models.fallbacks.title'),
                size: 'md',
                onClose: () => setShowFallbacksDialog(false),
                children: _jsx(ModelFallbacksDialog, {
                  models: fallbackModelOptions,
                  current: currentModelFallbacks,
                  max: 3,
                  onConfirm: handleFallbacksConfirm,
                  onClose: () => setShowFallbacksDialog(false),
                }),
              }),
            showDeleteDialog &&
              _jsx(DialogShell, {
                title: t('delete.title'),
                size: 'lg',
                onClose: () => setShowDeleteDialog(false),
                children: _jsx(DeleteSessionDialog, {
                  workspaceCwd: lockedWorkspaceCwd,
                  onDeleted: (sessionIds) => {
                    store.dispatch([
                      {
                        type: 'status',
                        text:
                          sessionIds.length === 1
                            ? `${t('delete.deleted')} (${sessionIds[0].slice(0, 8)})`
                            : t('delete.deletedCount', {
                                count: sessionIds.length,
                              }),
                      },
                    ]);
                  },
                  onError: (error) => {
                    if (isAlreadyDispatched(error)) return;
                    const reason =
                      error instanceof Error ? error.message : String(error);
                    pushToast('error', t('delete.failed', { reason }));
                  },
                  onClose: () => setShowDeleteDialog(false),
                }),
              }),
            showReleaseDialog &&
              _jsx(DialogShell, {
                title: t('release.title'),
                size: 'lg',
                onClose: () => setShowReleaseDialog(false),
                children: _jsx(ReleaseSessionDialog, {
                  workspaceCwd: lockedWorkspaceCwd,
                  onReleased: (sessionId) => {
                    store.dispatch([
                      {
                        type: 'status',
                        text: `${t('release.released')} (${sessionId.slice(0, 8)})`,
                      },
                    ]);
                  },
                  onError: (error) => {
                    if (isAlreadyDispatched(error)) return;
                    const reason =
                      error instanceof Error ? error.message : String(error);
                    pushToast('error', t('release.failed', { reason }));
                  },
                  onClose: () => setShowReleaseDialog(false),
                }),
              }),
            showRewindDialog &&
              _jsx(DialogShell, {
                title: t('rewind.title'),
                subtitle: t('rewind.subtitle'),
                size: 'lg',
                onClose: () => setShowRewindDialog(false),
                children: _jsx(RewindDialog, {
                  blocks: blocks,
                  loadSnapshots: loadRewindSnapshots,
                  rewind: rewindConversationOnly,
                  onError: handleRewindError,
                  onClose: () => setShowRewindDialog(false),
                }),
              }),
            !lockedWorkspaceCwd &&
              showAddWorkspaceDialog &&
              _jsx(AddWorkspaceDialog, {
                onClose: () => setShowAddWorkspaceDialog(false),
                onAdd: handleAddWorkspace,
                onSuggest: workspaceActions.suggestWorkspacePaths,
                onPick: async () => {
                  const result =
                    await workspaceActions.pickWorkspaceDirectory();
                  return result.selected ? result.path : undefined;
                },
                persistenceSupported: persistentWorkspaceRegistrationSupported,
                displayNameEnabled: workspaceDisplayNameSupported,
              }),
            scratchOutcomeUnknown !== 'clear' &&
              _jsx(DialogShell, {
                title: t('sidebar.scratchOutcomeUnknownTitle'),
                size: 'md',
                dismissible: false,
                onClose: () => undefined,
                children: _jsxs('div', {
                  className: 'flex flex-col gap-4',
                  children: [
                    _jsx('p', { children: t('sidebar.scratchOutcomeUnknown') }),
                    _jsx('ul', {
                      className:
                        'max-h-48 overflow-y-auto text-sm text-muted-foreground',
                      children: workspaces.map((entry) =>
                        _jsx('li', { children: entry.cwd }, entry.id),
                      ),
                    }),
                    _jsx('div', {
                      className: 'flex justify-end',
                      children:
                        scratchOutcomeUnknown === 'refreshing'
                          ? _jsx(Button, {
                              type: 'button',
                              onClick: () => void refreshScratchOutcome(),
                              children: t('sidebar.scratchOutcomeRefresh'),
                            })
                          : _jsx(Button, {
                              type: 'button',
                              onClick: () => setScratchOutcome('clear'),
                              children: t('sidebar.scratchOutcomeAcknowledge'),
                            }),
                    }),
                  ],
                }),
              }),
            _jsxs('div', {
              className: styles.appShell,
              children: [
                sidebarOptions.enabled &&
                  _jsxs('div', {
                    'data-sidebar-shell': '',
                    ...(mobileDrawerOpen
                      ? { role: 'dialog', 'aria-modal': 'true' }
                      : {}),
                    'aria-label': t('sidebar.label'),
                    'aria-hidden': artifactPanelFullscreen || undefined,
                    className: [
                      styles.mobileDrawer,
                      mobileDrawerOpen ? styles.mobileDrawerOpen : undefined,
                      forceMobileDrawer ? styles.mobileDrawerForced : undefined,
                      artifactPanelFullscreen
                        ? styles.chatViewHidden
                        : undefined,
                    ]
                      .filter(Boolean)
                      .join(' '),
                    children: [
                      _jsx('div', {
                        className: styles.mobileBackdrop,
                        onClick: closeMobileDrawer,
                        'aria-hidden': 'true',
                      }),
                      _jsx(WebShellSidebar, {
                        collapsed:
                          (sidebarCollapsed ||
                            (mainView === 'split' && !splitSidebarHasRoom)) &&
                          !mobileDrawerOpen,
                        onCollapsedChange: handleSidebarCollapsedChange,
                        onOpenSettings: () => {
                          closeMobileDrawer();
                          openPanel('settings');
                        },
                        onOpenPlugins: () => {
                          closeMobileDrawer();
                          openPanel('plugins');
                        },
                        onOpenChannels: () => {
                          closeMobileDrawer();
                          openPanel('channels');
                        },
                        onOpenDaemonStatus: () => {
                          closeMobileDrawer();
                          openPanel('status');
                        },
                        onOpenScheduledTasks: () => {
                          closeMobileDrawer();
                          openScheduledTasks();
                        },
                        onOpenGoals: () => {
                          closeMobileDrawer();
                          openGoals();
                        },
                        onOpenSessions: () => {
                          closeMobileDrawer();
                          openPanel('sessions');
                        },
                        canOpenSessionsOverview: isLargeScreen,
                        onOpenSplitView: () => {
                          closeMobileDrawer();
                          openSplitView();
                        },
                        canOpenSplitView: isLargeScreen,
                        theme: selectedTheme,
                        onThemeChange: (theme) => {
                          handleThemeChange(theme);
                          void setWorkspaceSetting(
                            'workspace',
                            THEME_SETTING_KEY,
                            webShellThemeToSettingValue(theme),
                          );
                        },
                        onNewSession: (workspaceCwd) =>
                          createNewSession(workspaceCwd),
                        onLoadSession: (sessionId, workspaceCwd) => {
                          setMainView('chat');
                          return loadSidebarSession(sessionId, workspaceCwd);
                        },
                        onSelectCurrentSession: () => {
                          closeMobileDrawer();
                          setMainView('chat');
                          closePanel();
                        },
                        onSessionRenameConfirmed: reconcileCatalogRename,
                        onError: reportError,
                        mobileOpen: mobileDrawerOpen,
                        selectedWorkspaceCwd: selectedWorkspaceCwd,
                        onSelectWorkspace: setSelectedWorkspaceCwd,
                        onOpenGitDiff: (workspaceCwd) =>
                          setGitDialog({
                            workspaceCwd,
                            gitCwd:
                              workspaceCwd === activeWorkspaceCwd
                                ? sessionWorktree?.path
                                : undefined,
                            view: 'diff',
                          }),
                        onOpenCommit: (workspaceCwd) =>
                          setGitDialog({
                            workspaceCwd,
                            // A worktree session commits in the worktree checkout,
                            // not the base workspace cwd — but only for the active
                            // session's own workspace chip; another workspace's chip
                            // has no association with this session's worktree.
                            gitCwd:
                              workspaceCwd === activeWorkspaceCwd
                                ? sessionWorktree?.path
                                : undefined,
                            view: 'commit',
                          }),
                        onOpenAddWorkspace:
                          dynamicWorkspaceRegistrationSupported
                            ? () => setShowAddWorkspaceDialog(true)
                            : undefined,
                        workspaces: workspaces,
                        lockedWorkspaceCwd: lockedWorkspaceCwd,
                        lockedWorkspace: sidebarOptions.lockedWorkspace,
                        branding: sidebarOptions.branding,
                        primaryNav: sidebarOptions.primaryNav,
                        hideProjectHeader: sidebarOptions.hideProjectHeader,
                        sessionActions: sidebarOptions.sessionActions,
                        footer: sidebarOptions.footer,
                      }),
                    ],
                  }),
                _jsxs('div', {
                  className: [
                    styles.contextShell,
                    artifactPanelFullscreen ? styles.chatViewHidden : undefined,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  'aria-hidden': artifactPanelFullscreen || undefined,
                  children: [
                    chatHeaderEnabled &&
                      !isChatEmptyState &&
                      !activePanel &&
                      mainView === 'chat' &&
                      _jsxs('div', {
                        className: styles.chatHeaderRow,
                        children: [
                          sidebarOptions.enabled &&
                            sidebarOptions.showCompactToggle &&
                            _jsx('button', {
                              type: 'button',
                              className: styles.hamburgerButton,
                              onClick: () => {
                                setForceMobileDrawer(false);
                                setMobileDrawerOpen((open) => !open);
                              },
                              'aria-label': t('sidebar.toggleMenu'),
                              'aria-expanded': mobileDrawerOpen,
                              children: _jsxs('svg', {
                                viewBox: '0 0 24 24',
                                fill: 'none',
                                stroke: 'currentColor',
                                strokeWidth: '2',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                                'aria-hidden': 'true',
                                children: [
                                  _jsx('line', {
                                    x1: '3',
                                    y1: '6',
                                    x2: '21',
                                    y2: '6',
                                  }),
                                  _jsx('line', {
                                    x1: '3',
                                    y1: '12',
                                    x2: '21',
                                    y2: '12',
                                  }),
                                  _jsx('line', {
                                    x1: '3',
                                    y1: '18',
                                    x2: '21',
                                    y2: '18',
                                  }),
                                ],
                              }),
                            }),
                          renderChatHeader
                            ? _jsx('div', {
                                className: styles.customChatHeader,
                                children: renderChatHeader({
                                  sessionId: connection.sessionId,
                                  sessionName: sessionDisplayName,
                                  workspaceCwd: connection.workspaceCwd,
                                  items: chatHeaderItems,
                                  environmentPanelOpen: environmentPanelVisible,
                                  rightPanelOpen: artifactPanelOpen,
                                  onEnvironmentPanelOpenChange:
                                    handleEnvironmentPanelOpenChange,
                                  onRightPanelOpenChange:
                                    handleRightPanelOpenChange,
                                }),
                              })
                            : _jsx(ChatContextHeader, {
                                content: titleHeaderItemVisible
                                  ? (sessionDisplayName ?? t('session.new'))
                                  : null,
                                environmentOpen: environmentPanelVisible,
                                environmentAvailable:
                                  environmentHeaderItemVisible,
                                rightPanelOpen: artifactPanelOpen,
                                rightPanelAvailable:
                                  rightPanelHeaderItemVisible &&
                                  !artifactPanelOpen,
                                onToggleEnvironment: () =>
                                  handleEnvironmentPanelOpenChange(
                                    !environmentPanelVisible,
                                  ),
                                onToggleRightPanel: () =>
                                  handleRightPanelOpenChange(
                                    !artifactPanelOpen,
                                  ),
                              }),
                        ],
                      }),
                    _jsxs('div', {
                      ref: contextBodyRef,
                      'data-testid': 'context-body',
                      className: [
                        styles.contextBody,
                        environmentPanelVisible && environmentPanelFits
                          ? styles.contextBodyWithEnvironmentPanel
                          : undefined,
                      ]
                        .filter(Boolean)
                        .join(' '),
                      children: [
                        _jsxs('div', {
                          ref: chatPaneRef,
                          'data-testid': 'chat-pane-container',
                          className: [
                            styles.chatPane,
                            mainView !== 'chat'
                              ? styles.chatPaneShowingPage
                              : undefined,
                            hasMobileComposerBottom
                              ? styles.chatPaneWithMobileComposerBottom
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(' '),
                          children: [
                            isChatEmptyState &&
                              !showMissingSessionState &&
                              !activePanel &&
                              mainView === 'chat' &&
                              _jsx(NewSessionDotField, {}),
                            sidebarOptions.enabled &&
                              sidebarOptions.showCompactToggle &&
                              (!chatHeaderEnabled || isChatEmptyState) &&
                              !activePanel &&
                              mainView === 'chat' &&
                              _jsx('button', {
                                type: 'button',
                                className: [
                                  styles.hamburgerButton,
                                  !chatHeaderEnabled || isChatEmptyState
                                    ? styles.hamburgerButtonFloating
                                    : undefined,
                                ]
                                  .filter(Boolean)
                                  .join(' '),
                                onClick: () => {
                                  setForceMobileDrawer(false);
                                  setMobileDrawerOpen((open) => !open);
                                },
                                'aria-label': t('sidebar.toggleMenu'),
                                'aria-expanded': mobileDrawerOpen,
                                children: _jsxs('svg', {
                                  viewBox: '0 0 24 24',
                                  fill: 'none',
                                  stroke: 'currentColor',
                                  strokeWidth: '2',
                                  strokeLinecap: 'round',
                                  strokeLinejoin: 'round',
                                  'aria-hidden': 'true',
                                  children: [
                                    _jsx('line', {
                                      x1: '3',
                                      y1: '6',
                                      x2: '21',
                                      y2: '6',
                                    }),
                                    _jsx('line', {
                                      x1: '3',
                                      y1: '12',
                                      x2: '21',
                                      y2: '12',
                                    }),
                                    _jsx('line', {
                                      x1: '3',
                                      y1: '18',
                                      x2: '21',
                                      y2: '18',
                                    }),
                                  ],
                                }),
                              }),
                            activePanel &&
                              _jsxs('section', {
                                className: styles.panelHost,
                                role: 'region',
                                'data-testid': 'inline-panel',
                                'aria-label':
                                  activePanel === 'settings'
                                    ? t('settings.title')
                                    : activePanel === 'status'
                                      ? t('daemon.title')
                                      : activePanel === 'extensions'
                                        ? t('extensions.manage.title')
                                        : activePanel === 'mcp'
                                          ? t('mcp.title')
                                          : activePanel === 'skills'
                                            ? t('skills.title')
                                            : activePanel === 'agents'
                                              ? t('agents.title')
                                              : activePanel === 'plugins'
                                                ? t('plugins.title')
                                                : activePanel === 'channels'
                                                  ? t('channels.title')
                                                  : t('sessionsOverview.title'),
                                children: [
                                  activePanel !== 'extensions' &&
                                    activePanel !== 'mcp' &&
                                    activePanel !== 'skills' &&
                                    activePanel !== 'agents' &&
                                    activePanel !== 'plugins' &&
                                    activePanel !== 'channels' &&
                                    _jsxs('div', {
                                      className: styles.panelHeader,
                                      children: [
                                        _jsx('button', {
                                          ref: panelBackRef,
                                          type: 'button',
                                          className: styles.panelBack,
                                          'data-testid': 'panel-back',
                                          onClick: closePanel,
                                          'aria-label': t('common.back'),
                                          title: t('common.back'),
                                          children: _jsx('svg', {
                                            viewBox: '0 0 24 24',
                                            'aria-hidden': 'true',
                                            children: _jsx('path', {
                                              d: 'M15 5l-7 7 7 7',
                                              fill: 'none',
                                              stroke: 'currentColor',
                                              strokeWidth: '2',
                                              strokeLinecap: 'round',
                                              strokeLinejoin: 'round',
                                            }),
                                          }),
                                        }),
                                        _jsx('div', {
                                          className: styles.panelTitle,
                                          children:
                                            activePanel === 'settings'
                                              ? t('settings.title')
                                              : activePanel === 'status'
                                                ? t('daemon.title')
                                                : t('sessionsOverview.title'),
                                        }),
                                      ],
                                    }),
                                  _jsx(
                                    'div',
                                    {
                                      className: styles.panelBody,
                                      children: _jsx(ShadowDomBoundary, {
                                        enabled:
                                          shadowDomOptions.plugins &&
                                          isPluginShadowPanel(activePanel),
                                        language: selectedLanguage,
                                        themeClassName: [
                                          selectedTheme ===
                                          WebShellThemeId.Light
                                            ? styles.themeLight
                                            : styles.themeDark,
                                          selectedTheme === WebShellThemeId.Dark
                                            ? 'dark'
                                            : undefined,
                                        ]
                                          .filter(Boolean)
                                          .join(' '),
                                        styles: shadowDomOptions.styles,
                                        initialFocusRef:
                                          activePanel === 'plugins'
                                            ? pluginTabRef
                                            : activePanel === 'extensions' ||
                                                activePanel === 'channels'
                                              ? panelHeadingRef
                                              : undefined,
                                        children:
                                          activePanel === 'settings'
                                            ? _jsx(SettingsMessage, {
                                                settingsState:
                                                  targetedWorkspaceSettingsState,
                                                embedded: true,
                                                onLanguageChange:
                                                  handleSettingsLanguageChange,
                                                onThemeChange:
                                                  handleThemeChange,
                                                chatWidthMode: chatWidthMode,
                                                onChatWidthModeChange:
                                                  handleChatWidthModeChange,
                                                modelManagement: {
                                                  providers:
                                                    providersState.providers,
                                                  currentModelId:
                                                    connection.currentModel ??
                                                    undefined,
                                                  loading:
                                                    providersState.loading,
                                                  error: providersState.error,
                                                  busy: modelActionBusy,
                                                  onSelectModel:
                                                    handleModelSelect,
                                                  onDeleteModel:
                                                    handleDeleteModel,
                                                  onAddModel: () =>
                                                    setShowAuthDialog(true),
                                                },
                                                onSubDialog: (key, scope) => {
                                                  // Record the persist scope only for model settings —
                                                  // the reset effect is gated on the dialog/fallback/auth
                                                  // flags, so it never runs for the approvalMode dialog
                                                  // and would leave a stale scope behind.
                                                  if (key === 'fastModel') {
                                                    setModelSettingScope(scope);
                                                    setModelDialogMode('fast');
                                                  } else if (
                                                    key === 'visionModel'
                                                  ) {
                                                    setModelSettingScope(scope);
                                                    setModelDialogMode(
                                                      'vision',
                                                    );
                                                  } else if (
                                                    key === 'voiceModel'
                                                  ) {
                                                    void openVoiceModelPicker(
                                                      scope,
                                                      'settings',
                                                    );
                                                  } else if (
                                                    key === 'modelFallbacks'
                                                  ) {
                                                    setModelSettingScope(scope);
                                                    setShowFallbacksDialog(
                                                      true,
                                                    );
                                                  } else if (
                                                    key === 'tools.approvalMode'
                                                  ) {
                                                    // Not a model setting — leave modelSettingScope alone.
                                                    setShowApprovalModeDialog(
                                                      true,
                                                    );
                                                  }
                                                },
                                              })
                                            : activePanel === 'status'
                                              ? _jsx(DaemonStatusDialog, {})
                                              : activePanel === 'extensions'
                                                ? _jsx(ExtensionsManagerPage, {
                                                    onClose: closePanel,
                                                    initialFocusRef:
                                                      panelHeadingRef,
                                                  })
                                                : activePanel === 'mcp' &&
                                                    mcpDialogMessage
                                                  ? _jsx(McpManagerPage, {
                                                      message: mcpDialogMessage,
                                                      onClose: () => {
                                                        setMcpDialogMessage(
                                                          null,
                                                        );
                                                        closePanel();
                                                      },
                                                    })
                                                  : activePanel === 'skills'
                                                    ? _jsx(SkillsManagerPage, {
                                                        onClose: closePanel,
                                                        onUseSkill:
                                                          handleUseSkill,
                                                      })
                                                    : activePanel === 'agents'
                                                      ? _jsx(
                                                          AgentsManagerPage,
                                                          {
                                                            onClose: () => {
                                                              setAgentsCreateScope(
                                                                null,
                                                              );
                                                              closePanel();
                                                            },
                                                            initialCreateScope:
                                                              agentsCreateScope,
                                                          },
                                                        )
                                                      : activePanel ===
                                                          'plugins'
                                                        ? _jsx(
                                                            PluginManagerPage,
                                                            {
                                                              mcpMessage:
                                                                mcpDialogMessage,
                                                              loadMcpMessage:
                                                                async () => {
                                                                  try {
                                                                    await loadMcpManagerMessage();
                                                                  } catch (error) {
                                                                    reportError(
                                                                      error,
                                                                      'Failed to load MCP status',
                                                                    );
                                                                    throw error;
                                                                  }
                                                                },
                                                              onClose:
                                                                closePanel,
                                                              onUseSkill:
                                                                handleUseSkill,
                                                              initialFocusRef:
                                                                pluginTabRef,
                                                            },
                                                          )
                                                        : activePanel ===
                                                            'channels'
                                                          ? _jsx(
                                                              ChannelsManagerPage,
                                                              {
                                                                onClose:
                                                                  closePanel,
                                                                initialFocusRef:
                                                                  panelHeadingRef,
                                                              },
                                                            )
                                                          : _jsx(
                                                              SessionOverviewPanel,
                                                              {
                                                                onOpenSession:
                                                                  handleOpenSessionFromOverview,
                                                                onOpenSplit:
                                                                  openSplitView,
                                                                includeOtherWorkspaces:
                                                                  !lockedWorkspaceCwd,
                                                                workspaceCwd:
                                                                  lockedWorkspaceCwd,
                                                              },
                                                            ),
                                      }),
                                    },
                                    activePanel,
                                  ),
                                ],
                              }),
                            mainView === 'scheduledTasks' &&
                              _jsxs('div', {
                                className: styles.fullPage,
                                'data-testid': 'scheduled-tasks-page',
                                children: [
                                  _jsxs('div', {
                                    className: styles.fullPageHeader,
                                    children: [
                                      _jsx('button', {
                                        type: 'button',
                                        className: styles.fullPageBack,
                                        onClick: () => setMainView('chat'),
                                        'aria-label': t('common.back'),
                                        title: t('common.back'),
                                        children: _jsx('svg', {
                                          viewBox: '0 0 24 24',
                                          width: '18',
                                          height: '18',
                                          fill: 'none',
                                          stroke: 'currentColor',
                                          strokeWidth: '2',
                                          strokeLinecap: 'round',
                                          strokeLinejoin: 'round',
                                          'aria-hidden': 'true',
                                          children: _jsx('path', {
                                            d: 'M15 18l-6-6 6-6',
                                          }),
                                        }),
                                      }),
                                      _jsx('div', {
                                        className: styles.fullPageTitle,
                                        children: t('scheduledTasks.title'),
                                      }),
                                    ],
                                  }),
                                  _jsx('div', {
                                    className: styles.fullPageBody,
                                    children: _jsx(ScheduledTasksDialog, {
                                      onRunPrompt: runTaskManually,
                                      // Registered workspaces (multi-workspace daemons only) so
                                      // the page aggregates every project's schedule and the New
                                      // form can target one; absent/single → primary-only view.
                                      workspaces: lockedWorkspaceCwd
                                        ? visibleWorkspaces
                                        : workspaces,
                                      lockedWorkspace:
                                        lockedWorkspaceCapability,
                                      onCreateViaChat: () => {
                                        // Start a FRESH session and jump to it so the task-
                                        // creation chat doesn't pile onto the current
                                        // conversation, then prime the composer so the user can
                                        // describe the task in natural language; the agent
                                        // creates it via its cron_create tool. Focus is deferred
                                        // so the new session's composer is mounted/visible first.
                                        void createNewSession().then(
                                          (created) => {
                                            // If the new session couldn't be started,
                                            // createNewSession already surfaced the error — do NOT
                                            // prime the (still-current) session with the task
                                            // starter, which would land in the wrong conversation.
                                            if (!created) return;
                                            onSessionIdChange?.(undefined);
                                            window.setTimeout(() => {
                                              editorRef.current?.insertText(
                                                t('scheduledTasks.chatStarter'),
                                                { mode: 'replace' },
                                              );
                                              editorRef.current?.focus();
                                            }, 0);
                                          },
                                        );
                                      },
                                      onOpenSession: (sessionId) => {
                                        // The task's bound session IS its run history — switch
                                        // to the chat view and load that session's transcript.
                                        setMainView('chat');
                                        loadSidebarSession(sessionId).catch(
                                          (error) => {
                                            reportError(
                                              error,
                                              'Failed to open session',
                                            );
                                          },
                                        );
                                      },
                                      onError: reportError,
                                    }),
                                  }),
                                ],
                              }),
                            mainView === 'goals' &&
                              _jsxs('div', {
                                className: styles.fullPage,
                                'data-testid': 'goals-page',
                                children: [
                                  _jsxs('div', {
                                    className: styles.fullPageHeader,
                                    children: [
                                      _jsx('button', {
                                        type: 'button',
                                        className: styles.fullPageBack,
                                        onClick: () => setMainView('chat'),
                                        'aria-label': t('common.back'),
                                        title: t('common.back'),
                                        children: _jsx('svg', {
                                          viewBox: '0 0 24 24',
                                          width: '18',
                                          height: '18',
                                          fill: 'none',
                                          stroke: 'currentColor',
                                          strokeWidth: '2',
                                          strokeLinecap: 'round',
                                          strokeLinejoin: 'round',
                                          'aria-hidden': 'true',
                                          children: _jsx('path', {
                                            d: 'M15 18l-6-6 6-6',
                                          }),
                                        }),
                                      }),
                                      _jsx('div', {
                                        className: styles.fullPageTitle,
                                        children: t('goals.title'),
                                      }),
                                    ],
                                  }),
                                  _jsx('div', {
                                    className: styles.fullPageBody,
                                    children: _jsx(GoalsDialog, {
                                      onCreateGoal: async (condition) => {
                                        // Setting a goal registers the Stop hook AND kicks off
                                        // the first turn, so it has to travel the prompt path.
                                        // Start a FRESH session so the goal loop doesn't take
                                        // over the conversation the user was already having.
                                        //
                                        // Unless a previous attempt in this same visit to the
                                        // page already made one and then failed to send: that
                                        // session never got its goal and is still current, so
                                        // reuse it. Creating another would strand it, and a user
                                        // retrying a few times would end up with a column of
                                        // blank chats in the sidebar.
                                        //
                                        // Leaving the page forgets it (see the effect on
                                        // `strandedGoalSessionRef`), so this can never reuse a
                                        // session the user has since talked to.
                                        const stranded =
                                          strandedGoalSessionRef.current;
                                        const canReuseStranded =
                                          stranded !== undefined &&
                                          connectionRef.current.sessionId ===
                                            stranded;
                                        if (!canReuseStranded) {
                                          // `keepView`: createNewSession switches to the chat by
                                          // default, which would unmount this form before the
                                          // prompt is even sent and leave a later rejection with
                                          // nowhere to render — the exact failure the deferred
                                          // switch below exists to prevent.
                                          const created =
                                            await createNewSession(undefined, {
                                              keepView: true,
                                            });
                                          // createNewSession already surfaced the failure; don't
                                          // drop the goal into the wrong (still-current) session.
                                          // `false` keeps the form open with the typed condition
                                          // still in it — returning normally would read as
                                          // "created" and reset it.
                                          if (!created) return false;
                                          onSessionIdChange?.(undefined);
                                        }
                                        // Switch to the chat only once the prompt is admitted.
                                        // Switching first unmounts the Goals page, and a later
                                        // rejection would then have nowhere to render: the user
                                        // would land in an empty session with no explanation.
                                        // Letting this reject keeps the error in the form the
                                        // user is looking at.
                                        const owner = {
                                          current: sessionOwnerGuard.capture(),
                                        };
                                        try {
                                          await sendPrompt(
                                            `/goal ${condition}`,
                                            undefined,
                                            {
                                              clearComposerOnPromptStart: true,
                                              ownerRef: owner,
                                            },
                                          );
                                          if (!owner.current.isCurrent())
                                            return false;
                                        } catch (error) {
                                          // `sendPrompt` creates the session lazily, so by now
                                          // one may exist even though the prompt never landed.
                                          // Remember it so the retry reuses it rather than
                                          // stranding it.
                                          if (owner.current.isCurrent()) {
                                            strandedGoalSessionRef.current =
                                              connectionRef.current.sessionId;
                                          }
                                          throw error;
                                        }
                                        strandedGoalSessionRef.current =
                                          undefined;
                                        setMainView('chat');
                                      },
                                      onOpenSession: (sessionId) => {
                                        // The goal's session transcript IS its history.
                                        setMainView('chat');
                                        loadSidebarSession(sessionId).catch(
                                          (error) => {
                                            reportError(
                                              error,
                                              'Failed to open session',
                                            );
                                          },
                                        );
                                      },
                                      onError: reportError,
                                    }),
                                  }),
                                ],
                              }),
                            mainView === 'split' &&
                              _jsxs('div', {
                                className: styles.fullPage,
                                'data-testid': 'split-view-page',
                                children: [
                                  approvalOverlayActive &&
                                    _jsxs('div', {
                                      className: styles.splitApprovalNotice,
                                      role: 'status',
                                      'data-testid': 'split-approval-notice',
                                      children: [
                                        _jsx('span', {
                                          children: t(
                                            'splitView.outerApprovalPending',
                                          ),
                                        }),
                                        _jsx('button', {
                                          type: 'button',
                                          onClick: () => setMainView('chat'),
                                          children: t('splitView.goToApproval'),
                                        }),
                                      ],
                                    }),
                                  _jsx(WebShellCustomizationProvider, {
                                    value: customization,
                                    children: _jsx(
                                      CompactModeContext.Provider,
                                      {
                                        value: compactMode,
                                        children: _jsx(SplitView, {
                                          sessionIds: splitSessionIds,
                                          // Mirror live pane add/remove back up so switching away
                                          // and re-entering restores the same panes. Keep this
                                          // callback stable to avoid looping SplitView's reporting
                                          // effect.
                                          onPanesChange: handleSplitPanesChange,
                                          includeOtherWorkspaces:
                                            !lockedWorkspaceCwd,
                                          workspaceCwd: lockedWorkspaceCwd,
                                          // Back returns to the Session Overview (the hub the split
                                          // is launched from), not the single-session chat.
                                          onExit: handleSplitExit,
                                          onError: reportError,
                                          onImageIngestionNotice: pushToast,
                                          onSlashCommand: onSlashCommand,
                                          onRightPanelOpen:
                                            handleTurnOutputOpen,
                                          onOpenMonitor: openMonitorPanel,
                                          onPaneArtifactsChange:
                                            handlePaneArtifactsChange,
                                          messageTurnOutputs:
                                            messageTurnOutputs,
                                          restartSseOnPrompt:
                                            restartSseOnPrompt,
                                          historyPageSize: historyPageSize,
                                          renderPaneHeaderActions:
                                            renderPaneHeaderActions,
                                          voiceUserRevision: voiceUserRevision,
                                          voiceWorkspaceRevisions:
                                            voiceWorkspaceRevisions,
                                          voiceWorkspaces:
                                            workspace.capabilities
                                              ?.workspaces ||
                                            lockedWorkspaceCapability
                                              ? workspaces
                                              : undefined,
                                          sessionWorkflowEnabled:
                                            sessionWorkflowEnabled,
                                        }),
                                      },
                                    ),
                                  }),
                                ],
                              }),
                            _jsxs('div', {
                              className: [
                                styles.chatViewWrap,
                                hasMobileComposerBottom
                                  ? styles.chatViewWithMobileComposerBottom
                                  : undefined,
                                hasWelcomeMiddle
                                  ? styles.chatViewWithWelcomeMiddle
                                  : undefined,
                                // Marker class (no declarations): keeps the ':not(...)'
                                // exclusion in App.module.css matching.
                                CustomFooter
                                  ? styles.chatViewWithCustomFooter
                                  : undefined,
                                activePanel ||
                                mainView !== 'chat' ||
                                artifactPanelFullscreen
                                  ? styles.chatViewHidden
                                  : undefined,
                              ]
                                .filter(Boolean)
                                .join(' '),
                              'aria-hidden':
                                activePanel ||
                                mainView !== 'chat' ||
                                artifactPanelFullscreen
                                  ? true
                                  : undefined,
                              children: [
                                showMissingSessionState &&
                                  _jsxs('div', {
                                    className: styles.missingSessionState,
                                    children: [
                                      _jsx('div', {
                                        className: styles.missingSessionMessage,
                                        children: t('session.missing'),
                                      }),
                                      _jsx('button', {
                                        type: 'button',
                                        className: styles.missingSessionButton,
                                        disabled: isCreatingMissingSession,
                                        onClick: handleMissingSessionNewSession,
                                        children: t('session.new'),
                                      }),
                                    ],
                                  }),
                                _jsx('div', {
                                  className: showMissingSessionState
                                    ? styles.chatSubtreeHidden
                                    : styles.chatSubtree,
                                  children: _jsxs(
                                    WebShellCustomizationProvider,
                                    {
                                      value: customization,
                                      children: [
                                        _jsx(CompactModeContext.Provider, {
                                          value: compactMode,
                                          children: _jsx(TodoContextsProvider, {
                                            timeline: todoTimeline,
                                            details: todoDetails,
                                            children: _jsx(
                                              InteractionBlockContext.Provider,
                                              {
                                                value:
                                                  registerInteractionBlocker,
                                                children: (() => {
                                                  const contentClassName = [
                                                    styles.content,
                                                    showFloatingTodos ||
                                                    displayMessages.length >
                                                      0 ||
                                                    pendingApproval
                                                      ? styles.contentHasMessages
                                                      : undefined,
                                                  ]
                                                    .filter(Boolean)
                                                    .join(' ');
                                                  const messageListContent =
                                                    _jsx(MessageList, {
                                                      ref: messageListRef,
                                                      messages: displayMessages,
                                                      pendingApproval:
                                                        pendingToolApproval,
                                                      onShowContextDetail:
                                                        handleShowContextDetail,
                                                      loadingTranscript:
                                                        connection.loadingTranscript,
                                                      catchingUp:
                                                        connection.catchingUp,
                                                      hasOlderHistory:
                                                        transcriptHistory.hasMore,
                                                      loadingOlderHistory:
                                                        transcriptHistory.loading,
                                                      historyCapacityReached:
                                                        transcriptHistory.capacityReached,
                                                      historyPaginationError:
                                                        transcriptHistory.paginationError,
                                                      onLoadOlderHistory:
                                                        transcriptHistory.loadMore,
                                                      transcriptBlockCount:
                                                        blocks.length,
                                                      transcriptActivity: store,
                                                      onReloadTranscript:
                                                        transcriptReloadSupported
                                                          ? reloadTranscript
                                                          : undefined,
                                                      isResponding:
                                                        streamingState !==
                                                          'idle' &&
                                                        !suppressFailedPromptRetryStreaming,
                                                      activeTurnStartedAt:
                                                        suppressFailedPromptRetryStreaming
                                                          ? undefined
                                                          : (failedPromptRetry?.startedAt ??
                                                            activeTurnStartedAt),
                                                      workspaceCwd:
                                                        connection.workspaceCwd ||
                                                        '',
                                                      hideSessionTimeline:
                                                        effectiveChatWidthMode ===
                                                        'wide',
                                                      showRetryHint:
                                                        showCurrentRetryHint,
                                                      onRetryClick: handleRetry,
                                                      failedPromptMessageId:
                                                        isPreparingPrompt
                                                          ? undefined
                                                          : visibleFailedPromptBlock?.id,
                                                      onRetryFailedPrompt:
                                                        handleFailedPromptRetry,
                                                      onBranchSession:
                                                        handleBranchCurrentSession,
                                                      bottomOverlayInset:
                                                        bottomPanelInset,
                                                      welcomeHeader:
                                                        isChatEmptyState
                                                          ? welcomeHeader
                                                          : undefined,
                                                      centerWelcomeHeader:
                                                        showMobileWelcomeFooterMiddle ||
                                                        undefined,
                                                      tailContent: undefined,
                                                      tailKey: undefined,
                                                      onCanScrollToBottomChange:
                                                        handleCanScrollToBottomChange,
                                                      virtualScrollThreshold:
                                                        virtualScrollThreshold,
                                                      turnFileChanges:
                                                        visibleTurnOutputKinds.has(
                                                          'file',
                                                        )
                                                          ? fileChangesByTurn
                                                          : undefined,
                                                      turnArtifacts:
                                                        visibleTurnOutputKinds.has(
                                                          'artifact',
                                                        )
                                                          ? artifactsByTurn
                                                          : undefined,
                                                      turnScheduledTasks:
                                                        visibleTurnOutputKinds.has(
                                                          'scheduled_task',
                                                        )
                                                          ? scheduledTasksByTurn
                                                          : undefined,
                                                      onTurnOutputOpen:
                                                        handleTurnOutputOpen,
                                                      onImagePreview:
                                                        openImagePanel,
                                                      onReviewChanges:
                                                        openReviewPanel,
                                                      onOpenArtifact:
                                                        openArtifactPanel,
                                                      onOpenScheduledTask:
                                                        openScheduledTaskPanel,
                                                      onError: reportError,
                                                      generateContent:
                                                        connection.capabilities?.features.includes(
                                                          'session_generation',
                                                        )
                                                          ? sessionActions.generateSessionContent
                                                          : undefined,
                                                    });
                                                  const messageListWithSubagentDetails =
                                                    _jsx(
                                                      SubagentDetailsProvider,
                                                      {
                                                        onOpen:
                                                          openSubagentPanel,
                                                        children:
                                                          messageListContent,
                                                      },
                                                    );
                                                  const messageList =
                                                    monitorDetailsSupported
                                                      ? _jsx(
                                                          MonitorDetailsProvider,
                                                          {
                                                            onOpen:
                                                              openMonitorPanelFromTool,
                                                            children:
                                                              messageListWithSubagentDetails,
                                                          },
                                                        )
                                                      : messageListWithSubagentDetails;
                                                  const btwPanel =
                                                    !showMobileWelcomeFooterMiddle &&
                                                    btwMessage?.role === 'btw'
                                                      ? _jsx('div', {
                                                          className:
                                                            styles.btwPanel,
                                                          children: _jsx(
                                                            BtwMessage,
                                                            {
                                                              question:
                                                                btwMessage.question,
                                                              answer:
                                                                btwMessage.answer,
                                                              isPending:
                                                                btwMessage.isPending,
                                                            },
                                                          ),
                                                        })
                                                      : null;
                                                  if (
                                                    showMobileWelcomeFooterMiddle
                                                  ) {
                                                    return _jsxs('div', {
                                                      className:
                                                        styles.mobileWelcomeGroup,
                                                      children: [
                                                        _jsxs('div', {
                                                          style: contentStyle,
                                                          className:
                                                            contentClassName,
                                                          children: [
                                                            messageList,
                                                            btwPanel,
                                                          ],
                                                        }),
                                                        _jsx('div', {
                                                          className:
                                                            styles.mobileWelcomeFooterMiddle,
                                                          children:
                                                            welcomeFooter,
                                                        }),
                                                      ],
                                                    });
                                                  }
                                                  return _jsxs('div', {
                                                    style: contentStyle,
                                                    className: contentClassName,
                                                    children: [
                                                      messageList,
                                                      btwPanel,
                                                    ],
                                                  });
                                                })(),
                                              },
                                            ),
                                          }),
                                        }),
                                        _jsxs('div', {
                                          ref: footerRef,
                                          style: contentStyle,
                                          className: CustomFooter
                                            ? `${styles.footer} ${styles.footerWithCustomFooter}`
                                            : styles.footer,
                                          children: [
                                            canScrollMessageListToBottom &&
                                              _jsx('div', {
                                                className: showBottomPanels
                                                  ? `${styles.scrollToBottomLayer} ${styles.scrollToBottomLayerWithTodos}`
                                                  : styles.scrollToBottomLayer,
                                                children: _jsx('button', {
                                                  type: 'button',
                                                  className:
                                                    styles.scrollToBottomButton,
                                                  'aria-label': t(
                                                    'chat.scrollToBottom',
                                                  ),
                                                  onClick: () =>
                                                    resumeChatBottomFollow(
                                                      'smooth',
                                                    ),
                                                  children: _jsx('svg', {
                                                    className:
                                                      styles.scrollToBottomIcon,
                                                    viewBox: '0 0 24 24',
                                                    'aria-hidden': 'true',
                                                    children: _jsx('path', {
                                                      d: 'M12 5v13M6.5 12.5 12 18l5.5-5.5',
                                                      fill: 'none',
                                                      stroke: 'currentColor',
                                                      strokeLinecap: 'round',
                                                      strokeLinejoin: 'round',
                                                    }),
                                                  }),
                                                }),
                                              }),
                                            showBottomPanels &&
                                              _jsx('div', {
                                                ref: bottomPanelsRef,
                                                className: styles.bottomPanels,
                                                children: _jsx(TodoPanel, {
                                                  todos: showFloatingTodos
                                                    ? floatingTodos
                                                    : [],
                                                  statusItems:
                                                    floatingBottomStatusItems,
                                                  onOpen:
                                                    sessionWorkflowEnabled &&
                                                    showFloatingTodos
                                                      ? openTasksPanel
                                                      : undefined,
                                                }),
                                              }),
                                            pendingToolApproval &&
                                              mainView === 'chat' &&
                                              _jsx('div', {
                                                'data-testid':
                                                  'approval-overlay',
                                                className:
                                                  styles.approvalOverlay,
                                                children: _jsx(ToolApproval, {
                                                  request: pendingToolApproval,
                                                  onConfirm: handleConfirm,
                                                  variant: 'floating',
                                                  keyboardActive:
                                                    toolApprovalOverlayVisible,
                                                  planTodos:
                                                    sessionWorkflowEnabled
                                                      ? approvalPlanTodos
                                                      : [],
                                                }),
                                              }),
                                            pendingAskUserApproval &&
                                              mainView === 'chat' &&
                                              _jsx('div', {
                                                'data-testid':
                                                  'approval-overlay',
                                                className:
                                                  styles.approvalOverlay,
                                                children: _jsx(
                                                  AskUserQuestion,
                                                  {
                                                    request:
                                                      pendingAskUserApproval,
                                                    onConfirm:
                                                      handleAskUserConfirm,
                                                    onError: reportError,
                                                    variant: 'floating',
                                                    keyboardActive:
                                                      askUserOverlayVisible,
                                                  },
                                                ),
                                              }),
                                            _jsxs('div', {
                                              className: styles.composer,
                                              children: [
                                                streamingState !== 'idle'
                                                  ? suppressFailedPromptRetryStreaming
                                                    ? null
                                                    : _jsx(StreamingStatus, {
                                                        startedAt:
                                                          failedPromptRetry?.startedAt ??
                                                          activeTurnStartedAt,
                                                      })
                                                  : newSessionSuggestion
                                                    ? _jsxs('div', {
                                                        className:
                                                          styles.composerActionTip,
                                                        role: 'status',
                                                        'data-testid':
                                                          newSessionSuggestion.suggestion ===
                                                          'btw'
                                                            ? 'btw-suggestion'
                                                            : 'new-session-suggestion',
                                                        children: [
                                                          _jsx('span', {
                                                            className:
                                                              styles.composerActionTipIcon,
                                                            'aria-hidden':
                                                              'true',
                                                            children: '\u2726',
                                                          }),
                                                          _jsx('span', {
                                                            className:
                                                              styles.composerActionTipText,
                                                            children:
                                                              newSessionSuggestion.suggestion ===
                                                              'btw'
                                                                ? t(
                                                                    'editor.btwSuggestionTitle',
                                                                  )
                                                                : t(
                                                                    'editor.newSessionSuggestionTitle',
                                                                  ),
                                                          }),
                                                          _jsx('div', {
                                                            className:
                                                              styles.composerActionTipActions,
                                                            children: _jsx(
                                                              'button',
                                                              {
                                                                type: 'button',
                                                                className: `${styles.composerActionTipButton} ${styles.composerActionTipButtonPrimary}`,
                                                                'data-testid':
                                                                  newSessionSuggestion.suggestion ===
                                                                  'btw'
                                                                    ? 'btw-suggestion-send'
                                                                    : 'new-session-suggestion-start',
                                                                onMouseDown: (
                                                                  event,
                                                                ) =>
                                                                  event.preventDefault(),
                                                                onClick:
                                                                  newSessionSuggestion.suggestion ===
                                                                  'btw'
                                                                    ? handleAcceptBtwSuggestion
                                                                    : handleAcceptNewSessionSuggestion,
                                                                children:
                                                                  newSessionSuggestion.suggestion ===
                                                                  'btw'
                                                                    ? t(
                                                                        'editor.btwSuggestionSend',
                                                                      )
                                                                    : t(
                                                                        'editor.newSessionSuggestionStart',
                                                                      ),
                                                              },
                                                            ),
                                                          }),
                                                        ],
                                                      })
                                                    : escapeHintVisible &&
                                                        streamingState ===
                                                          'idle'
                                                      ? _jsx('div', {
                                                          className:
                                                            styles.escClearStatus,
                                                          role: 'status',
                                                          children: t(
                                                            'editor.escClearHint',
                                                          ),
                                                        })
                                                      : null,
                                                unknownPromptAdmission &&
                                                  unknownPromptAdmission.sessionId ===
                                                    connection.sessionId &&
                                                  _jsxs('div', {
                                                    className:
                                                      styles.composerActionTip,
                                                    role: 'status',
                                                    'data-testid':
                                                      'prompt-admission-unknown',
                                                    children: [
                                                      _jsx('span', {
                                                        className:
                                                          styles.composerActionTipIcon,
                                                        'aria-hidden': 'true',
                                                        children: '!',
                                                      }),
                                                      _jsx('span', {
                                                        className:
                                                          styles.composerActionTipText,
                                                        children: t(
                                                          'queue.admissionUnknown',
                                                        ),
                                                      }),
                                                      unknownPromptAdmission.payloadAvailable &&
                                                        _jsxs('div', {
                                                          className:
                                                            styles.composerActionTipActions,
                                                          children: [
                                                            _jsx('button', {
                                                              type: 'button',
                                                              className: `${styles.composerActionTipButton} ${styles.composerActionTipButtonPrimary}`,
                                                              onClick:
                                                                restoreUnknownPromptPayload,
                                                              children: t(
                                                                'queue.restoreUnknown',
                                                              ),
                                                            }),
                                                            _jsx('button', {
                                                              type: 'button',
                                                              className:
                                                                styles.composerActionTipButton,
                                                              onClick:
                                                                discardUnknownPromptPayload,
                                                              children: t(
                                                                'queue.discardUnknown',
                                                              ),
                                                            }),
                                                          ],
                                                        }),
                                                    ],
                                                  }),
                                                _jsx(QueuedPromptDisplay, {
                                                  prompts: queuedPrompts,
                                                  t: t,
                                                  canMutateMidTurn:
                                                    canMutateMidTurn,
                                                  onDelete: removeQueuedPrompt,
                                                  onEdit: editQueuedPrompt,
                                                  onRestoreUnknown:
                                                    restoreUnknownQueuedPrompt,
                                                  onDiscardUnknown:
                                                    discardUnknownQueuedPrompt,
                                                }),
                                                CustomComposerHeader &&
                                                  _jsx('div', {
                                                    className:
                                                      styles.composerHeader,
                                                    children: _jsx(
                                                      CustomComposerHeader,
                                                      {
                                                        disabled:
                                                          isDisabled ||
                                                          unknownPromptAdmission?.payloadAvailable ===
                                                            true,
                                                        isRunning:
                                                          streamingState !==
                                                          'idle',
                                                        currentMode:
                                                          currentMode,
                                                        currentModel:
                                                          currentModel,
                                                        sessionName:
                                                          sessionDisplayName,
                                                      },
                                                    ),
                                                  }),
                                                _jsx(ChatEditor, {
                                                  ref: setEditorHandle,
                                                  onSubmit: handleEditorSubmit,
                                                  onInputTextChange:
                                                    handleComposerTextChange,
                                                  onAttachmentsChange:
                                                    handleComposerAttachmentsChange,
                                                  onImageIngestionNotice:
                                                    pushToast,
                                                  onImagePreview:
                                                    openImagePanel,
                                                  onCycleMode: handleCycleMode,
                                                  onToggleShortcuts:
                                                    handleToggleShortcuts,
                                                  onCancel: handleCancel,
                                                  isRunning:
                                                    streamingState !== 'idle',
                                                  isPreparing:
                                                    isPreparingPrompt ||
                                                    isStartingNewSessionSuggestion,
                                                  cancelArmed: cancelArmed,
                                                  disabled:
                                                    isDisabled ||
                                                    isStartingNewSessionSuggestion ||
                                                    interactionBlocked ||
                                                    approvalOverlayActive ||
                                                    unknownPromptAdmission?.payloadAvailable ===
                                                      true,
                                                  commands: commands,
                                                  skills: loadedSkills,
                                                  slashCommandCategoryOrder:
                                                    slashCommandCategoryOrder,
                                                  builtinAtProviders:
                                                    builtinAtProviders,
                                                  atProviders: atProviders,
                                                  composerTagIcons:
                                                    composerTagIcons,
                                                  voiceTarget:
                                                    activePanel !== null ||
                                                    mainView !== 'chat'
                                                      ? undefined
                                                      : mainVoiceTarget,
                                                  voiceStatusRevision:
                                                    mainVoiceStatusRevision,
                                                  queuedMessages: queuedTexts,
                                                  onFocusFooter:
                                                    handleFocusTaskPill,
                                                  onPopQueuedMessages:
                                                    editLastQueuedPrompt,
                                                  onClearQueuedMessages:
                                                    clearQueuedPrompts,
                                                  currentMode: currentMode,
                                                  sessionWorkflowEnabled:
                                                    sessionWorkflowEnabled,
                                                  currentModel: currentModel,
                                                  gitBranch: activeGitBranch,
                                                  gitWorktree:
                                                    Boolean(sessionWorktree),
                                                  gitCwd: sessionWorktree?.path,
                                                  gitModeIntent: gitModeEligible
                                                    ? gitModeIntent
                                                    : undefined,
                                                  onGitModeIntentChange:
                                                    gitModeEligible
                                                      ? setGitModeIntent
                                                      : undefined,
                                                  gitStatus:
                                                    selectedWorkspaceGitStatus,
                                                  onOpenGitDiff:
                                                    gitDiffWorkspaceCwd
                                                      ? handleOpenGitDiff
                                                      : undefined,
                                                  onOpenCommit:
                                                    gitDiffWorkspaceCwd
                                                      ? handleOpenCommit
                                                      : undefined,
                                                  chatWidthMode: chatWidthMode,
                                                  showChatWidthToggle:
                                                    !isChatEmptyState,
                                                  chatWidthToggleMin:
                                                    chatWidthToggleMin,
                                                  visibleToolbarActions:
                                                    composerToolbarActions ??
                                                    (isChatEmptyState ||
                                                    !environmentGitReplacementEnabled
                                                      ? DEFAULT_EMPTY_COMPOSER_TOOLBAR_ACTIONS
                                                      : DEFAULT_COMPOSER_TOOLBAR_ACTIONS),
                                                  tokenCount:
                                                    connection.tokenCount ?? 0,
                                                  contextWindow:
                                                    connection.contextWindow ??
                                                    0,
                                                  onShowContextUsage:
                                                    handleShowContextUsage,
                                                  availableModels:
                                                    availableModels,
                                                  onSelectMode: handleSetMode,
                                                  onSelectModel:
                                                    handleModelSelect,
                                                  reasoning:
                                                    connection.reasoning,
                                                  onSelectReasoningEffort:
                                                    handleReasoningEffort,
                                                  workspaces:
                                                    composerWorkspaces,
                                                  selectedWorkspaceCwd:
                                                    connection.sessionId
                                                      ? workspaces.find(
                                                          (entry) =>
                                                            entry.cwd ===
                                                            connection.workspaceCwd,
                                                        )?.primary
                                                        ? undefined
                                                        : connection.workspaceCwd
                                                      : selectedWorkspaceCwd,
                                                  workspaceSelectionDisabled: false,
                                                  atWorkspaceCwd:
                                                    lockedWorkspaceCwd ??
                                                    (connection.sessionId
                                                      ? connection.workspaceCwd
                                                      : (selectedWorkspaceCwd ??
                                                        workspaces.find(
                                                          (entry) =>
                                                            entry.primary,
                                                        )?.cwd)),
                                                  onSelectWorkspace:
                                                    handleSelectComposerWorkspace,
                                                  scratchWorkspaceSupported:
                                                    scratchWorkspaceRegistrationSupported,
                                                  existingFolderWorkspaceSupported:
                                                    dynamicWorkspaceRegistrationSupported,
                                                  workspaceMutationBusy:
                                                    workspaceMutationBusy,
                                                  onCreateScratchWorkspace:
                                                    handleCreateComposerScratchWorkspace,
                                                  onOpenExistingWorkspace:
                                                    handleOpenExistingWorkspace,
                                                  onChatWidthModeChange:
                                                    handleChatWidthModeChange,
                                                  sessionId:
                                                    connection.sessionId,
                                                  sessionName:
                                                    sessionDisplayName,
                                                  dialogOpen:
                                                    interactionBlocked ||
                                                    approvalOverlayActive,
                                                  followupState: followupState,
                                                  onAcceptFollowup:
                                                    onAcceptFollowup,
                                                  onDismissFollowup:
                                                    onDismissFollowup,
                                                  composerInput: composerInput,
                                                  composerInputVersion:
                                                    composerInputVersion,
                                                  placeholderText:
                                                    composerPlaceholderText,
                                                  animatePlaceholder:
                                                    isChatEmptyState,
                                                }),
                                                CustomComposerFooter &&
                                                  _jsx(CustomComposerFooter, {
                                                    disabled: isDisabled,
                                                    isRunning:
                                                      streamingState !== 'idle',
                                                    currentMode: currentMode,
                                                    currentModel: currentModel,
                                                    sessionName:
                                                      sessionDisplayName,
                                                  }),
                                              ],
                                            }),
                                            CustomFooter
                                              ? hasMobileComposerBottom
                                                ? _jsx('div', {
                                                    className:
                                                      styles.customFooter,
                                                    children: _jsx(
                                                      CustomFooter,
                                                      {
                                                        connected: connected,
                                                        mode: currentMode,
                                                        model: currentModel,
                                                        streamingState:
                                                          streamingState,
                                                        contextUsageRatio:
                                                          (connection.contextWindow ??
                                                            0) > 0
                                                            ? (connection.tokenCount ??
                                                                0) /
                                                              (connection.contextWindow ??
                                                                0)
                                                            : 0,
                                                        activeGoal: activeGoal,
                                                        tasks: footerTasks,
                                                        availableModes:
                                                          MODES_CYCLE,
                                                        availableModels: (
                                                          connection.models ??
                                                          []
                                                        )
                                                          .filter(
                                                            isVisibleComposerModel,
                                                          )
                                                          .map((m) => ({
                                                            id: m.id,
                                                            label:
                                                              getModelDisplayName(
                                                                m.label || m.id,
                                                              ),
                                                            contextWindow:
                                                              m.contextWindow,
                                                          })),
                                                        skills: loadedSkills,
                                                        onSelectMode:
                                                          handleSetMode,
                                                        onSelectModel:
                                                          handleModelSelect,
                                                      },
                                                    ),
                                                  })
                                                : _jsx(CustomFooter, {
                                                    connected: connected,
                                                    mode: currentMode,
                                                    model: currentModel,
                                                    streamingState:
                                                      streamingState,
                                                    contextUsageRatio:
                                                      (connection.contextWindow ??
                                                        0) > 0
                                                        ? (connection.tokenCount ??
                                                            0) /
                                                          (connection.contextWindow ??
                                                            0)
                                                        : 0,
                                                    activeGoal: activeGoal,
                                                    tasks: footerTasks,
                                                    availableModes: MODES_CYCLE,
                                                    availableModels: (
                                                      connection.models ?? []
                                                    )
                                                      .filter(
                                                        isVisibleComposerModel,
                                                      )
                                                      .map((m) => ({
                                                        id: m.id,
                                                        label:
                                                          getModelDisplayName(
                                                            m.label || m.id,
                                                          ),
                                                        contextWindow:
                                                          m.contextWindow,
                                                      })),
                                                    skills: loadedSkills,
                                                    onSelectMode: handleSetMode,
                                                    onSelectModel:
                                                      handleModelSelect,
                                                  })
                                              : _jsx(StatusBar, {
                                                  onSelectMode: () =>
                                                    setShowApprovalModeDialog(
                                                      (v) => !v,
                                                    ),
                                                  onSelectModel: () =>
                                                    setModelDialogMode((v) =>
                                                      v ? null : 'main',
                                                    ),
                                                  onShowContext: () =>
                                                    showContextUsage(
                                                      '/context',
                                                      false,
                                                    ),
                                                  onOpenSettings: () =>
                                                    openPanel('settings'),
                                                  ref: statusBarRef,
                                                  onOpenTasks: () =>
                                                    openTasksPanel(),
                                                  onReturnToInput:
                                                    handleReturnToEditor,
                                                  tasks:
                                                    isChatEmptyState ||
                                                    !environmentTasksReplacementEnabled
                                                      ? backgroundTasks
                                                      : [],
                                                  activeGoal: activeGoal,
                                                  onOpenGoals: openGoals,
                                                  hideSettings: hideSettings,
                                                  onToggleShortcuts:
                                                    handleToggleShortcuts,
                                                  compact: true,
                                                }),
                                            isChatEmptyState &&
                                              welcomeFooter &&
                                              _jsx('div', {
                                                className: [
                                                  styles.emptyWelcomeFooter,
                                                  showMobileWelcomeFooterMiddle
                                                    ? styles.desktopWelcomeFooter
                                                    : undefined,
                                                ]
                                                  .filter(Boolean)
                                                  .join(' '),
                                                children: welcomeFooter,
                                              }),
                                          ],
                                        }),
                                      ],
                                    },
                                  ),
                                }),
                              ],
                            }),
                          ],
                        }),
                        environmentPanelMounted &&
                          _jsx(EnvironmentPanel, {
                            floating: !environmentPanelFits,
                            hidden:
                              !environmentPanelVisible ||
                              artifactPanelFullscreen,
                            workspaceCwd:
                              sessionWorktree?.path ?? activeWorkspaceCwd,
                            gitWorkspaceCwd: connection.sessionId
                              ? gitDiffWorkspaceCwd
                              : undefined,
                            gitCwd: sessionWorktree?.path,
                            branch: activeGitBranch,
                            gitStatus: selectedWorkspaceGitStatus,
                            tasks: sessionTasks,
                            agentTasks: environmentAgentTasks,
                            items: environmentPanelItems,
                            onOpenGitDiff: gitDiffWorkspaceCwd
                              ? handleOpenGitDiff
                              : undefined,
                            onOpenGitCommit: gitDiffWorkspaceCwd
                              ? handleOpenCommit
                              : undefined,
                            onOpenAgent: openEnvironmentAgent,
                            onOpenTask: openEnvironmentTask,
                            onDismiss: dismissEnvironmentPanel,
                          }),
                        artifactPanelOpen &&
                          useFloatingArtifactPanel &&
                          _jsx(Drawer, {
                            open: true,
                            direction: 'right',
                            shouldScaleBackground: false,
                            onOpenChange: (open) => {
                              if (!open) closeArtifactPanel();
                            },
                            children: _jsxs(DrawerContent, {
                              onAnimationEnd: (event) => {
                                if (event.target === event.currentTarget) {
                                  setWaitForSubagentPanelAnimation(false);
                                }
                              },
                              className: artifactPanelFullscreen
                                ? 'data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-none data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:border-0 data-[vaul-drawer-direction=right]:pt-[env(safe-area-inset-top)] data-[vaul-drawer-direction=right]:pr-[env(safe-area-inset-right)] data-[vaul-drawer-direction=right]:pb-[env(safe-area-inset-bottom)] data-[vaul-drawer-direction=right]:pl-[env(safe-area-inset-left)]'
                                : 'data-[vaul-drawer-direction=right]:w-[min(520px,calc(100vw-16px))] data-[vaul-drawer-direction=right]:sm:max-w-[520px]',
                              onEscapeKeyDown: (event) => {
                                if (
                                  event.isComposing ||
                                  event.keyCode === 229
                                ) {
                                  // IME owns Escape; keep the dismiss layer from acting
                                  // on it. The preserveImeEscape mask above normally
                                  // hides composition Escapes from this handler entirely.
                                  event.preventDefault();
                                  return;
                                }
                                // Fullscreen is the topmost surface: Escape shrinks the
                                // panel back to its drawer width. Without this the
                                // drawer's dismiss layer would close the panel instead.
                                if (!artifactPanelFullscreen) return;
                                event.preventDefault();
                                setArtifactPanelFullscreen(false);
                              },
                              children: [
                                _jsx(DrawerTitle, {
                                  className: 'sr-only',
                                  children: 'Right panel',
                                }),
                                _jsx(ArtifactPanel, {
                                  ...artifactPanelSharedProps,
                                  variant: 'drawer',
                                }),
                              ],
                            }),
                          }),
                      ],
                    }),
                  ],
                }),
                _jsx('div', {
                  ref: setArtifactPanelSlotEl,
                  className: styles.artifactPanelSlot,
                }),
                artifactPanelOpen &&
                  !useFloatingArtifactPanel &&
                  artifactPanelSlotEl &&
                  createPortal(
                    _jsxs('div', {
                      ref: artifactPanelFullscreenSurfaceRef,
                      tabIndex: -1,
                      onKeyDown: handleArtifactPanelSurfaceKeyDown,
                      onAnimationEnd: (event) => {
                        if (event.target === event.currentTarget) {
                          setWaitForSubagentPanelAnimation(false);
                        }
                      },
                      ...(artifactPanelFullscreen
                        ? { role: 'dialog', 'aria-label': 'Right panel' }
                        : {}),
                      className: artifactPanelFullscreen
                        ? styles.artifactPanelFullscreen
                        : [
                            styles.artifactPanelDock,
                            suppressArtifactDockOpenAnimation
                              ? styles.artifactPanelDockNoOpenAnimation
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(' '),
                      style: {
                        '--artifact-panel-dock-width': `${artifactPanelWidth + 4}px`,
                      },
                      children: [
                        !artifactPanelFullscreen &&
                          _jsx('div', {
                            className: styles.artifactResizeHandle,
                            role: 'separator',
                            'aria-orientation': 'vertical',
                            'aria-valuemin': MIN_ARTIFACT_PANEL_WIDTH,
                            'aria-valuemax': getMaxArtifactPanelWidth(),
                            'aria-valuenow': artifactPanelWidth,
                            onPointerDown: handleArtifactPanelResizeStart,
                          }),
                        _jsx('div', {
                          className: styles.artifactPanelClip,
                          children: _jsx(ArtifactPanel, {
                            ...artifactPanelSharedProps,
                            panelWidth: artifactPanelWidth,
                          }),
                        }),
                      ],
                    }),
                    artifactPanelSlotEl,
                  ),
              ],
            }),
          ],
        }),
      }),
    }),
  });
}
//# sourceMappingURL=App.js.map
