import './styles/globals.css';
import { type DaemonStreamingState } from '@qwen-code/webui/daemon-react-sdk';
import type {
  DaemonTranscriptBlock,
  DaemonSessionMonitorTaskStatus,
  DaemonSessionTaskStatus,
  DaemonWorkspaceCapability,
} from '@qwen-code/sdk/daemon';
import { type ComposerToolbarAction } from './components/ChatEditor';
import { type ToastTone } from './components/ToastHost';
import { type EnvironmentAgentTask } from './components/panels/EnvironmentPanel';
import type { PaneHeaderActionsRenderer } from './components/ChatPane';
import { type SideTaskListItem } from './components/artifacts/ArtifactPanel';
import type {
  TurnOutputKind,
  TurnOutputOpenRequest,
} from './components/artifacts/TurnOutputs';
import { type WebShellShadowDom } from './shadowDom';
import {
  type WebShellSidebarBranding,
  type WebShellSidebarFooterOptions,
  type WebShellSidebarLockedWorkspace,
  type WebShellSidebarPrimaryNavOptions,
  type WebShellSidebarSessionActionsOptions,
} from './components/sidebar/WebShellSidebar';
import { type WebShellLanguage } from './i18n';
import { type ComposerPlaceholderState } from './utils/composerInputState';
import type { Message } from './adapters/types';
import { type WebShellTheme } from './themeContext';
import {
  type WebShellComposerApi,
  type WebShellComposerInput,
  type WebShellMarkdownCustomization,
  type ToolHeaderExtraRenderer,
  type UserMessageContentRenderer,
  type UserMessageContentParser,
  type AssistantTurnFooterRenderer,
  type WelcomeHeaderRenderer,
  type WelcomeFooterRenderer,
  type ComposerToolbarStartRenderer,
  type ComposerToolbarEndRenderer,
  type ComposerToolbarRightRenderer,
  type ComposerHeaderRenderer,
  type ComposerFooterRenderer,
  type ChatHeaderRenderer,
  type WebShellChatHeaderOptions,
  type WebShellRightPanelOptions,
  type WebShellEnvironmentPanelOptions,
  type FooterRenderer,
  type LoadingPhrasesResolver,
  type MarkdownTableMode,
  type WebShellAtProvider,
  type WebShellBuiltinAtProvidersConfig,
  type ComposerTagClickHandler,
  type ComposerTagRenderer,
  type WebShellComposerTagIconMap,
  type WebShellBottomStatusItem,
} from './customization';
import type { CommandDisplayCategoryOrder } from './utils/commandDisplay';
export declare const CompactModeContext: import('react').Context<boolean>;
/**
 * Per-snapshot status diffs (keyed by tool callId or plan message id), so a
 * history row can render what changed in that snapshot without re-deriving it
 * from the whole transcript. Empty by default so a row rendered outside the
 * provider still falls back gracefully.
 */
export declare const TodoTimelineContext: import('react').Context<
  Map<string, TodoSnapshotDiff>
>;
/**
 * Per-todo timing and resource detail keyed by todoStateKey, consumed by the
 * expanded todo list so a finished task can reveal when it ran and what it
 * spent. Empty by default so a row rendered outside the provider (or in tests)
 * simply shows no expander.
 */
export declare const TodoDetailContext: import('react').Context<
  Map<string, TodoDetail>
>;
export interface BugReportInfo {
  title: string;
  systemInfo: Record<string, string>;
}
export interface WebShellSidebarOptions {
  enabled?: boolean;
  defaultCollapsed?: boolean;
  /** Whether to show WebShell's built-in compact drawer toggle. Defaults to true. */
  showCompactToggle?: boolean;
  /** Hide or replace the complete sidebar branding row. */
  branding?: false | WebShellSidebarBranding;
  /** Customize the primary navigation area (new task button, custom entries). */
  primaryNav?: WebShellSidebarPrimaryNavOptions;
  /** Whether to hide the "Projects" header row (with search and add workspace). Defaults to false (shown). */
  hideProjectHeader?: boolean;
  /** Customize which action buttons appear on session rows. */
  sessionActions?: WebShellSidebarSessionActionsOptions;
  /** Hide the footer completely or select the built-in entries it exposes. */
  footer?: false | WebShellSidebarFooterOptions;
  /** Customize the workspace row shown when lockWorkspaceCwd is active. */
  lockedWorkspace?: WebShellSidebarLockedWorkspace;
}
export type SessionChangeEvent =
  | {
      type: 'rename';
      sessionId: string;
      newName: string;
    }
  | {
      type: 'submit';
      sessionId: string;
      prompt: string;
      queued: boolean;
    }
  | {
      type: 'turn_complete';
      sessionId: string;
      error?: Error;
    };
export interface WebShellApi {
  /** Open the in-window split view, matching the built-in sidebar button. */
  openSplitView: () => void;
  /** Open the Session Overview panel, matching the built-in sidebar button. */
  openSessionOverview: () => void;
  /** Open the compact session drawer, matching the hamburger control. */
  openSessionDrawer: () => void;
  /** Start a new session using the same lifecycle as the built-in New Chat action. */
  createNewSession: () => Promise<boolean>;
  /** Open the right panel with a new side-task draft. */
  createSideTask: () => boolean;
}
export type WebShellComposerPlaceholderState = ComposerPlaceholderState;
export type WebShellComposerPlaceholders = Readonly<
  Partial<Record<WebShellComposerPlaceholderState, string>>
>;
export interface WebShellSlashCommand {
  /** Slash command name without the leading slash, normalized to lower case. */
  command: string;
  /** Trimmed text following the command name. */
  args: string;
  /** Original text submitted from the composer. */
  input: string;
}
export type WebShellSlashCommandHandler = (
  command: WebShellSlashCommand,
) => boolean | void;
export interface WebShellProps {
  desiredSessionTargetPending?: boolean;
  /** Called whenever the attached daemon session or workspace changes. */
  onSessionIdChange?: (
    sessionId: string | undefined,
    workspaceId?: string,
    workspaceCwd?: string,
  ) => void;
  /** Called after a new session is created. Session setup waits up to 30 seconds. */
  onSessionCreated?: (sessionId: string) => Promise<void> | void;
  /** Visual theme for the embedded shell. */
  theme?: WebShellTheme;
  /** Called when `/theme` changes the web-shell theme. */
  onThemeChange?: (theme: WebShellTheme) => void;
  /** UI language for the web-shell. Defaults to `?language=` or browser language. */
  language?: 'en' | 'zh-CN' | 'zh' | 'zh-cn';
  /** Called when `/language ui` changes the web-shell UI language. */
  onLanguageChange?: (language: WebShellLanguage) => void;
  /** Additional CSS class name appended to the root element. */
  className?: string;
  /** Inline styles applied to the root element. */
  style?: React.CSSProperties;
  /** Optional Shadow DOM isolation for plugin content and/or all portals. */
  shadowDom?: WebShellShadowDom;
  /** Maximum chat content width in regular mode. Defaults to 1000px. */
  chatMaxWidth?: number;
  /** Optional workspace sidebar. Disabled by default. */
  sidebar?: boolean | WebShellSidebarOptions;
  /** Persistent chat header options. */
  header?: WebShellChatHeaderOptions;
  /** Right extension panel options. */
  rightPanel?: WebShellRightPanelOptions;
  /** Environment information panel options. */
  environmentPanel?: WebShellEnvironmentPanelOptions;
  /** Session ids to control the split view; an empty array closes it. */
  splitSessionIds?: readonly string[];
  /** Called when the split pane list changes from inside WebShell. */
  onSplitSessionIdsChange?: (sessionIds: string[]) => void;
  /**
   * Extra actions rendered in each split-pane header, before the built-in
   * close button. Receives the pane's session id (and workspace when known).
   * When the actions no longer fit they collapse into a `…` overflow menu.
   */
  renderPaneHeaderActions?: PaneHeaderActionsRenderer;
  /**
   * Called instead of the built-in right panel open behavior when a user clicks
   * a turn output such as review changes, an artifact, or a scheduled task.
   */
  onRightPanelOpen?: (request: TurnOutputOpenRequest) => void;
  /**
   * Controls which turn output cards appear below messages. Defaults to all.
   */
  messageTurnOutputs?: readonly TurnOutputKind[];
  /** Imperative handle for externally opening WebShell surfaces. */
  shellRef?: React.Ref<WebShellApi>;
  /** Built-in composer toolbar actions to show. Defaults to all actions. */
  composerToolbarActions?: readonly ComposerToolbarAction[];
  /**
   * Main-composer copy by semantic state. Omitted or blank entries retain the
   * WebShell localized default; shell-mode and follow-up copy still wins.
   */
  composerPlaceholders?: WebShellComposerPlaceholders;
  /** Called when connection status changes (idle/connecting/connected/disconnected/error). */
  onConnectionChange?: (status: string) => void;
  /** Called when prompt status changes (idle/waiting/responding). */
  onStreamingStateChange?: (state: DaemonStreamingState) => void;
  /**
   * Called whenever transcript blocks change. Receives the full blocks array
   * at most once per animation frame during active generation.
   */
  onTranscriptChange?: (blocks: readonly DaemonTranscriptBlock[]) => void;
  /** Called when a critical error occurs (auth failure, session gone, etc). */
  onError?: (error: Error) => void;
  /** Called when `/bug` is invoked. Receives system info. If omitted, web-shell opens the report URL itself. */
  onBugReport?: (info: BugReportInfo) => void;
  /** Slash command names to hide from completion/help, for example `['approval-mode']`. */
  hiddenSlashCommands?: string[];
  /** Slash command category order. Defaults to custom, skill, system. */
  slashCommandCategoryOrder?: CommandDisplayCategoryOrder;
  /**
   * Called before Web Shell handles a slash command. Return true to skip the
   * built-in or daemon behavior after handling the command in the host.
   */
  onSlashCommand?: WebShellSlashCommandHandler;
  /** Built-in @ mention providers to enable. Defaults to all built-ins. */
  builtinAtProviders?: WebShellBuiltinAtProvidersConfig;
  /**
   * Controls whether the composer's file-upload entry points (drag-and-drop
   * and the @ panel upload item) are enabled. Works alongside the daemon's
   * `workspace_file_upload` capability, not instead of it: `false` force-
   * disables upload even when the daemon advertises the capability, while
   * `true`/omitted still requires the capability to be satisfied.
   */
  fileUploadEnabled?: boolean;
  /** Additional @ mention categories shown alongside built-in files/extensions. */
  atProviders?: readonly WebShellAtProvider[];
  /** Icon URLs for custom composer tag kinds used by @ mention chips. */
  composerTagIcons?: WebShellComposerTagIconMap;
  /** Custom renderer for the tool-card header content after the status icon and tool name. */
  renderToolHeaderExtra?: ToolHeaderExtraRenderer;
  /** Custom renderer for the welcome header. Receives version, cwd, model, and mode. */
  renderWelcomeHeader?: WelcomeHeaderRenderer;
  /** Custom renderer shown below the chat composer in the empty welcome state. */
  renderWelcomeFooter?: WelcomeFooterRenderer;
  /**
   * Show renderWelcomeFooter between the welcome header and composer on
   * mobile empty state. Requires renderWelcomeFooter to be provided for the
   * mobile CSS reordering to take effect.
   */
  mobileWelcomeFooterMiddle?: boolean;
  /** Parse user-message text into display parts such as chips. */
  parseUserMessageContent?: UserMessageContentParser;
  /** Custom renderer for the inside of user chat bubbles. Defaults to plain text. */
  renderUserMessageContent?: UserMessageContentRenderer;
  /** Custom renderer for composer and user-message tags. */
  renderComposerTag?: ComposerTagRenderer;
  /** Custom hover content for composer and user-message tags. */
  renderComposerTagTooltip?: ComposerTagRenderer;
  /** Click handler for composer and user-message tags. */
  onComposerTagClick?: ComposerTagClickHandler;
  /** Custom renderer displayed after the final assistant message of each turn. */
  renderAssistantTurnFooter?: AssistantTurnFooterRenderer;
  /** Custom renderer inserted before the built-in chat composer toolbar controls. */
  renderComposerToolbarStart?: ComposerToolbarStartRenderer;
  /** Custom renderer inserted after the built-in composer toolbar controls. */
  renderComposerToolbarEnd?: ComposerToolbarEndRenderer;
  /** Custom renderer inserted into the composer toolbar's right-side action area. */
  renderComposerToolbarRight?: ComposerToolbarRightRenderer;
  /** Custom renderer shown directly above the chat composer input. */
  renderComposerHeader?: ComposerHeaderRenderer;
  /** Custom renderer shown directly below the chat composer input. */
  renderComposerFooter?: ComposerFooterRenderer;
  /**
   * Replaces the complete persistent chat header. Only rendered when a
   * session is active (not in the welcome/empty state).
   */
  renderChatHeader?: ChatHeaderRenderer;
  /** Custom component for the footer area below the Editor. Replaces the built-in StatusBar. */
  renderFooter?: FooterRenderer;
  /** Extra status items shown in the floating bottom panel beside the TODO summary. */
  bottomStatusItems?: readonly WebShellBottomStatusItem[];
  /** Collapse thinking blocks to 5 lines with a click-to-expand toggle. */
  compactThinking?: boolean;
  /** Auto-collapse completed turns to just the prompt and final answer, with a per-turn toggle. Defaults to true. */
  collapseCompletedTurns?: boolean;
  /** Markdown table rendering mode. Defaults to basic. */
  markdownTableMode?: MarkdownTableMode;
  /** Enable virtual scrolling only when rendered transcript rows exceed this threshold. Defaults to 200. */
  virtualScrollThreshold?: number;
  /** Custom Markdown behavior for assistant content only. */
  markdown?: WebShellMarkdownCustomization;
  /**
   * Override the witty phrases cycled while a prompt is streaming. Receives the
   * resolved UI language; return phrases to replace the built-in defaults, an
   * empty array to hide the phrase, or `undefined`/`null` to keep the defaults.
   */
  loadingPhrases?: LoadingPhrasesResolver;
  /** When provided, all toast notifications are forwarded to this callback and the built-in ToastHost is hidden. */
  onToast?: (tone: ToastTone, message: string) => void;
  /** Imperative handle for externally controlling the composer input. */
  composerRef?: React.Ref<WebShellComposerApi>;
  /** Called once the real composer API is mounted and safe to call. */
  onComposerReady?: (api: WebShellComposerApi) => void;
  /** Declarative composer input value. Increment composerInputVersion to replay the same value. */
  composerInput?: WebShellComposerInput;
  /** Replay key for composerInput. */
  composerInputVersion?: number;
  /** Called when a session-level event occurs (rename, submit, turn complete). */
  onSessionChange?: (event: SessionChangeEvent) => void;
  /**
   * Called before a prompt is submitted. Return a Promise — the prompt is held
   * until the Promise resolves. If the Promise rejects, the prompt is cancelled.
   * `sessionId` is `undefined` when the session has not yet been created (deferred).
   * Also called for queued prompts (submitted while a turn is streaming).
   */
  onSubmitBefore?: (params: {
    sessionId: string | undefined;
    prompt: string;
  }) => Promise<void>;
}
interface AppProps extends WebShellProps {
  initialSelectedWorkspaceCwd?: string;
  lockedWorkspaceCwd?: string;
  lockedWorkspaceCapability?: DaemonWorkspaceCapability;
  restartSseOnPrompt?: boolean;
  historyPageSize?: number;
}
export declare function getTaskActivityKey(
  messages: readonly Message[],
): string;
export declare function mergeMonitorTaskSnapshot(
  current: DaemonSessionMonitorTaskStatus,
  next: DaemonSessionMonitorTaskStatus,
): DaemonSessionMonitorTaskStatus;
interface SideTaskCatalogState {
  parentSessionId?: string;
  items: SideTaskListItem[];
  loaded: boolean;
}
export declare function mergeSideTaskCatalog(
  catalog: SideTaskCatalogState,
  parentSessionId: string,
  listedItems: SideTaskListItem[],
  optimisticIds: ReadonlySet<string>,
): SideTaskCatalogState;
export declare function getEnvironmentAgentTasks(
  messages: readonly Message[],
  sessionTasks: readonly DaemonSessionTaskStatus[],
): EnvironmentAgentTask[];
export declare function App({
  desiredSessionTargetPending,
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
  mobileWelcomeFooterMiddle,
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
  compactThinking,
  collapseCompletedTurns,
  markdownTableMode,
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
}?: AppProps): import('react/jsx-runtime').JSX.Element;
export {};
