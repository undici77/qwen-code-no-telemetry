import '../styles/globals.css';
import { type CSSProperties, type ReactElement } from 'react';
import type { DaemonTranscriptBlock } from '@qwen-code/sdk/daemon';
import { type AssistantTurnFooterRenderer, type ComposerTagRenderer, type MarkdownTableMode, type ToolHeaderExtraRenderer, type UserMessageContentParser, type UserMessageContentRenderer, type WebShellComposerTagIconMap, type WebShellMarkdownCustomization } from '../customization';
import { type WebShellTheme } from '../themeContext';
export interface WebShellTranscriptProps {
    blocks: readonly DaemonTranscriptBlock[];
    theme?: WebShellTheme;
    language?: 'en' | 'zh-CN' | 'zh' | 'zh-cn';
    className?: string;
    style?: CSSProperties;
    chatMaxWidth?: number;
    workspaceCwd?: string;
    compactThinking?: boolean;
    collapseCompletedTurns?: boolean;
    markdownTableMode?: MarkdownTableMode;
    virtualScrollThreshold?: number;
    markdown?: WebShellMarkdownCustomization;
    composerTagIcons?: WebShellComposerTagIconMap;
    renderToolHeaderExtra?: ToolHeaderExtraRenderer;
    parseUserMessageContent?: UserMessageContentParser;
    renderUserMessageContent?: UserMessageContentRenderer;
    renderComposerTag?: ComposerTagRenderer;
    renderComposerTagTooltip?: ComposerTagRenderer;
    renderAssistantTurnFooter?: AssistantTurnFooterRenderer;
}
export declare function WebShellTranscript(props: WebShellTranscriptProps): ReactElement;
