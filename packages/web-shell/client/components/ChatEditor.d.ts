import type { CommandInfo } from '../adapters/types';
import type { UseDaemonFollowupSuggestionReturn } from '@qwen-code/webui/daemon-react-sdk';
import type { DaemonSessionGroupPresetColor, DaemonWorkspaceGitStatus } from '@qwen-code/sdk/daemon';
import type { CommandDisplayCategoryOrder } from '../utils/commandDisplay';
import type { SkillInfo } from '../completions/slashCompletion';
import type { DaemonReasoningControls } from '@qwen-code/webui/daemon-react-sdk';
import { type WebShellComposerInput, type WebShellComposerTagIconMap, type WebShellAtProvider, type WebShellBuiltinAtProvidersConfig } from '../customization';
import { type ComposerSubmitMetadata } from '../hooks/useComposerCore';
import type { VoiceStatusRevision, VoiceWorkspaceTarget } from '../voice/voice-workspace-target';
import { type SessionGitIntent } from './GitModePopover';
export type ComposerToolbarAction = 'approvalMode' | 'contextUsage' | 'gitBranch' | 'model' | 'commands' | 'files' | 'widthMode' | 'voice' | 'workspace';
interface ChatEditorProps {
    onSubmit: (text: string, images?: import('../adapters/promptTypes').PromptImage[], commitAccepted?: import('../hooks/useComposerCore').ComposerSubmitCommit, metadata?: ComposerSubmitMetadata) => boolean | void;
    onInputTextChange?: (text: string) => void;
    onAttachmentsChange?: (hasAttachments: boolean) => void;
    onCycleMode?: () => void;
    onToggleShortcuts?: () => void;
    onCancel?: () => void;
    isRunning?: boolean;
    isPreparing?: boolean;
    /** First Esc armed a cancel — the send button shows an "Esc to stop" hint. */
    cancelArmed?: boolean;
    disabled?: boolean;
    placeholderText?: string;
    animatePlaceholder?: boolean;
    commands: CommandInfo[];
    skills?: SkillInfo[];
    slashCommandCategoryOrder?: CommandDisplayCategoryOrder;
    queuedMessages?: string[];
    onPopQueuedMessages?: () => boolean;
    onClearQueuedMessages?: () => boolean;
    currentMode?: string;
    sessionWorkflowEnabled?: boolean;
    currentModel?: string;
    gitBranch?: string;
    /** Whether the session is in a worktree (styles the git chip purple). */
    gitWorktree?: boolean;
    /** Git working directory for worktree sessions; targets git operations. */
    gitCwd?: string;
    /** Git mode intent for the empty-state composer chip (branch/worktree selection). */
    gitModeIntent?: SessionGitIntent;
    /** Callback when the user changes the git mode intent via the composer chip popover. */
    onGitModeIntentChange?: (intent: SessionGitIntent) => void;
    /** Enriched working-tree summary (dirty / ahead-behind / stash / operation). */
    gitStatus?: DaemonWorkspaceGitStatus;
    /** Opens the working-tree Changes dialog; makes the git chip clickable. */
    onOpenGitDiff?: () => void;
    /** Opens the commit dialog. */
    onOpenCommit?: () => void;
    /** Workspace name shown in the pane composer's `workspace` toolbar chip. */
    workspaceName?: string;
    /** Full workspace cwd, used as the chip's tooltip. */
    workspaceTitle?: string;
    /**
     * Stable per-workspace accent color for the chip, so it stays distinguishable
     * from other panes' chips even when it collapses to an icon on a narrow split.
     */
    workspaceColor?: DaemonSessionGroupPresetColor;
    chatWidthMode?: '1000' | 'wide';
    showChatWidthToggle?: boolean;
    chatWidthToggleMin?: number;
    visibleToolbarActions?: readonly ComposerToolbarAction[];
    /** Current context-window occupancy for the `contextUsage` toolbar ring. */
    tokenCount?: number;
    contextWindow?: number;
    /** Show the context-usage breakdown, exactly like typing /context. */
    onShowContextUsage?: () => void;
    availableModels?: Array<{
        id: string;
        label?: string;
    }>;
    onSelectMode?: (mode: string) => void;
    onSelectModel?: (model: string) => void;
    reasoning?: DaemonReasoningControls;
    onSelectReasoningEffort?: (value: string) => Promise<void> | void;
    workspaces?: Array<{
        id: string;
        cwd: string;
        label: string;
        primary: boolean;
        trusted: boolean;
    }>;
    selectedWorkspaceCwd?: string;
    workspaceSelectionDisabled?: boolean;
    onSelectWorkspace?: (workspaceCwd: string | undefined) => void;
    scratchWorkspaceSupported?: boolean;
    existingFolderWorkspaceSupported?: boolean;
    workspaceMutationBusy?: boolean;
    onCreateScratchWorkspace?: () => void;
    onOpenExistingWorkspace?: () => void;
    atWorkspaceCwd?: string;
    onChatWidthModeChange?: (mode: '1000' | 'wide') => void;
    onFocusFooter?: () => boolean;
    dialogOpen?: boolean;
    followupState?: UseDaemonFollowupSuggestionReturn['followupState'];
    onAcceptFollowup?: UseDaemonFollowupSuggestionReturn['onAcceptFollowup'];
    onDismissFollowup?: UseDaemonFollowupSuggestionReturn['onDismissFollowup'];
    sessionId?: string;
    sessionName?: string;
    composerInput?: WebShellComposerInput;
    composerInputVersion?: number;
    builtinAtProviders?: WebShellBuiltinAtProvidersConfig;
    atProviders?: readonly WebShellAtProvider[];
    composerTagIcons?: WebShellComposerTagIconMap;
    voiceTarget?: VoiceWorkspaceTarget;
    voiceStatusRevision?: VoiceStatusRevision;
    onImageIngestionNotice?: (tone: 'warning' | 'error', message: string) => void;
    /** Click a pasted image in the composer to preview it in the right panel. */
    onImagePreview?: (src: string, alt?: string) => void;
}
export declare const ChatEditor: import("react").NamedExoticComponent<ChatEditorProps & import("react").RefAttributes<EditorHandle>>;
export {};
