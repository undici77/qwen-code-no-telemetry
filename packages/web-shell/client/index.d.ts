import { type WebShellProps } from './App';
export { WebShellTranscript } from './components/WebShellTranscript';
export type { WebShellTranscriptProps } from './components/WebShellTranscript';
export interface WebShellWithProvidersProps extends WebShellProps {
    /** Daemon API base URL. Defaults to the browser origin when omitted. */
    baseUrl?: string;
    /** Bearer token passed to daemon requests. */
    token?: string;
    /** Session id to load. Undefined starts on an empty page. */
    sessionId?: string;
    /** Registered daemon workspace id for the session. Undefined uses primary. */
    workspaceId?: string;
    /** Registered daemon workspace path for the session. Takes precedence over workspaceId. */
    workspaceCwd?: string;
    /**
     * Workspace path to lock this shell to. Missing paths are registered
     * persistently before rendering. Takes precedence over workspaceCwd and workspaceId.
     */
    lockWorkspaceCwd?: string;
    /** Client identity to reuse when attaching to an externally created session. */
    clientId?: string;
    /** Restart the SSE event stream after each accepted prompt. Disabled by default. */
    restartSseOnPrompt?: boolean;
    /** Persisted transcript records requested per page. Defaults to 100; valid range is 1–500. */
    historyPageSize?: number;
}
/**
 * Low-level UI component. Requires ancestor `DaemonWorkspaceProvider` and
 * `DaemonSessionProvider` from `@qwen-code/webui/daemon-react-sdk`. The consumer
 * owns those providers, so this boundary covers only what we render (`App`).
 */
export declare function WebShell(props: WebShellProps): import("react/jsx-runtime").JSX.Element;
/**
 * Batteries-included component for product integrations. It wraps WebShell
 * with both daemon providers, so MCP/tools/skills/memory/agents/session APIs
 * are available without extra setup.
 */
export declare function WebShellWithProviders(props: WebShellWithProvidersProps): import("react/jsx-runtime").JSX.Element;
/** Alias for consumers who prefer a standalone naming style. */
export declare const StandaloneWebShell: typeof WebShellWithProviders;
export type { WebShellApi, WebShellComposerPlaceholders, WebShellComposerPlaceholderState, WebShellSlashCommand, WebShellSlashCommandHandler, WebShellProps, WebShellSidebarOptions, BugReportInfo, SessionChangeEvent, } from './App';
export type { WebShellShadowDom, WebShellShadowDomOptions } from './shadowDom';
export type { ToastTone } from './components/ToastHost';
export type { WebShellSidebarBranding, WebShellSidebarFooterItem, WebShellSidebarFooterOptions, WebShellSidebarLockedWorkspace, WebShellSidebarPrimaryNavOptions, WebShellSidebarPrimaryNavItem, WebShellSidebarSessionActionsOptions, WebShellSidebarSessionActionItem, WebShellSidebarSessionInlineActionItem, } from './components/sidebar/WebShellSidebar';
export type { WebShellLanguage } from './i18n';
export type { WebShellTheme } from './themeContext';
export type { CommandDisplayCategory, CommandDisplayCategoryOrder, } from './utils/commandDisplay';
export type { ComposerToolbarAction } from './components/ChatEditor';
export type { CodeBlockRenderer, MarkdownContentSource, MarkdownTableMode, MarkdownRenderContext, ToolHeaderExtraRenderer, ToolHeaderExtraRenderInfo, ToolHeaderKind, ComposerTagClickHandler, ComposerTagRenderer, AssistantTurnFooterRenderer, UserMessageContentRenderer, UserMessageContentRenderInfo, UserMessageContentParser, ComposerHeaderRenderer, ComposerFooterRenderer, ComposerToolbarStartRenderer, ComposerToolbarRightRenderer, WebShellAtItemRenderInfo, WebShellAtItemRenderer, WebShellComposerApi, WebShellBuiltinComposerTagKind, WebShellBuiltinAtProviderId, WebShellBuiltinAtProvidersConfig, WebShellComposerInput, WebShellComposerTag, WebShellComposerTagIconMap, WebShellComposerTagKind, WebShellComposerTagOptions, WebShellComposerTagPlacement, WebShellComposerToolbarRenderInfo, WebShellComposerToolbarStartRenderInfo, WebShellComposerToolbarRightRenderInfo, WebShellComposerTextOptions, WelcomeFooterRenderer, WelcomeHeaderRenderer, ChatHeaderRenderer, ChatHeaderRenderInfo, WebShellChatHeaderItem, WebShellChatHeaderOptions, WebShellRightPanelItem, WebShellRightPanelOptions, WebShellEnvironmentPanelItem, WebShellEnvironmentPanelOptions, WebShellFooterRenderInfo, FooterRenderer, LoadingPhrasesResolver, WebShellAtProviderTab, WebShellAtItem, WebShellAtProvider, WebShellBottomStatusItem, WebShellCodeBlockRenderInfo, WebShellMarkdownChartCustomization, WebShellMarkdownCustomization, WebShellAssistantMessageInfo, WebShellAssistantTurnFooterRenderInfo, WebShellIconSource, WebShellTaskInfo, WebShellUserMessagePart, WebShellAgentTask, WebShellShellTask, WebShellMonitorTask, WebShellModelInfo, WebShellSkillInfo, } from './customization';
export type { WelcomeHeaderProps } from './components/WelcomeHeader';
export type { PaneHeaderActionsInfo, PaneHeaderActionsRenderer, } from './components/ChatPane';
export type { TurnOutputKind, TurnOutputOpenRequest, } from './components/artifacts/TurnOutputs';
export { ECHARTS_FULLDATA_LANGUAGE, EchartsFullDataBlock, createMarkdownChartRegistry, createEchartsFullDataRenderer, } from './components/messages/MarkdownChartRenderer';
export type { DatasetCell, EchartsFullDataBlockProps, EchartsFullDataOption, EchartsFullDataRefMeta, EchartsFullDataRefResolver, EchartsFullDataResolvedDataset, EchartsFullDataRendererOptions, EchartsInstance, EchartsRuntime, EchartsRuntimeLoader, } from './components/messages/MarkdownChartRenderer';
