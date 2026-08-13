import { type ReactNode, type ClipboardEventHandler, type DragEventHandler } from 'react';
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import type { CommandInfo } from '../adapters/types';
import type { PromptImage } from '../adapters/promptTypes';
import { type UseDaemonFollowupSuggestionReturn } from '@qwen-code/webui/daemon-react-sdk';
import { type SkillInfo, type SlashCommandCompletionResult } from '../completions/slashCompletion';
import { type CommandDisplayCategoryOrder } from '../utils/commandDisplay';
import { type AtMentionMenuState } from './useAtMentionMenu';
import type { DaemonInputAnnotation } from '@qwen-code/sdk/daemon';
import type { ComposerTagClickHandler, ComposerTagRenderer, UserMessageContentParser, WebShellComposerApi, WebShellComposerInput, WebShellComposerTag, WebShellComposerTagIconMap, WebShellComposerTagOptions, WebShellComposerTextOptions, WebShellBuiltinAtProvidersConfig, WebShellAtProvider } from '../customization';
export declare function serializeComposerTag(tag: WebShellComposerTag): string;
export declare function getComposerTagLabel(tag: WebShellComposerTag): string;
export declare function getComposerTagValue(tag: WebShellComposerTag): string;
export declare function getComposerTagDisplay(tag: WebShellComposerTag): string;
export declare function buildComposerPrompt(text: string, tags: readonly WebShellComposerTag[]): string;
export interface InlineTagPlacement {
    start: number;
    end: number;
    tag: WebShellComposerTag;
}
export declare function buildComposerPromptWithInlineTagPlacements(text: string, topTags: readonly WebShellComposerTag[], inlineTags: readonly InlineTagPlacement[]): string;
export declare function replaceInlineTagPlacements(text: string, inlineTags: readonly InlineTagPlacement[]): string;
interface InlineTagRange {
    from: number;
    to: number;
    tag: InlineComposerTag;
}
type InlineComposerTag = WebShellComposerTag & {
    iconUrl?: string;
    renderContent?: ComposerTagRenderer;
    tooltip?: ReactNode;
    tooltipText?: string;
    onClick?: ComposerTagClickHandler;
};
export declare const addInlineTagEffect: import("@codemirror/state").StateEffectType<InlineTagRange>;
export declare const removeInlineTagEffect: import("@codemirror/state").StateEffectType<{
    predicate?: (tag: WebShellComposerTag) => boolean;
}>;
export declare const clearInlineTagsEffect: import("@codemirror/state").StateEffectType<void>;
export declare function getInlineComposerTags(view: EditorView): WebShellComposerTag[];
export interface EditorHandle extends WebShellComposerApi {
    clearText(): void;
    focus(): void;
    getText(): string;
    hasAttachments(): boolean;
    hasInput(): boolean;
    retryLast(): void;
    restoreImages(images: readonly PromptImage[]): void;
    restoreInputAnnotations?(inputAnnotations: readonly DaemonInputAnnotation[]): void;
}
export declare const editableCompartment: Compartment;
export declare const placeholderCompartment: Compartment;
export declare const followupGhostCompartment: Compartment;
export declare function getFollowupCompletion(text: string, suggestion: string | null | undefined): string | null;
export type ComposerSubmitCommit = () => void;
export interface ComposerSubmitMetadata {
    inputAnnotations?: DaemonInputAnnotation[];
}
export interface UseComposerCoreOptions {
    onSubmit: (text: string, images?: PromptImage[], commitAccepted?: ComposerSubmitCommit, metadata?: ComposerSubmitMetadata) => boolean | void;
    onInputTextChange?: (text: string) => void;
    onCycleMode?: () => void;
    onToggleShortcuts?: () => void;
    disabled?: boolean;
    placeholderText?: string;
    commands: CommandInfo[];
    skills?: SkillInfo[];
    slashCommandCategoryOrder?: CommandDisplayCategoryOrder;
    queuedMessages?: string[];
    onPopQueuedMessages?: () => boolean;
    onClearQueuedMessages?: () => boolean;
    currentMode?: string;
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
    atWorkspaceCwd?: string;
    composerTagIcons?: WebShellComposerTagIconMap;
    parseUserMessageContent?: UserMessageContentParser;
    renderComposerTag?: ComposerTagRenderer;
    renderComposerTagTooltip?: ComposerTagRenderer;
    onComposerTagClick?: ComposerTagClickHandler;
    onImageIngestionNotice?: (tone: 'warning' | 'error', message: string) => void;
    /**
     * Invoked when the user selects the @ panel's "Upload file" item, with the
     * directory currently being browsed and a callback that re-inserts the
     * removed mention query when the picker closes without an upload. The
     * composer opens a file picker and uploads into that directory. When
     * absent, the upload item is hidden.
     */
    onFileUploadRequest?: (targetDir: string, restoreQuery?: () => void) => void;
    /**
     * True while a workspace file upload is pending or in flight. Gates
     * submit exactly like the image lane's pending batches, so a prompt cannot
     * go out before the upload's `@file` reference has been inserted.
     */
    workspaceUploadBusy?: boolean;
    /** CodeMirror theme extension for the editor view. Each variant provides its own. */
    editorTheme: Parameters<typeof EditorView.theme>[0];
}
export interface SearchState {
    searchMode: boolean;
    searchQuery: string;
    searchMatches: string[];
    searchActiveIndex: number;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    searchUiRef: React.RefObject<HTMLDivElement | null>;
    openHistorySearch: () => void;
    closeSearch: (restoreDraft: boolean, keepFocus?: boolean) => void;
    submitSearchMatch: (match: string) => void;
    restoreSearchMatch?: (match: string) => void;
    handleSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    handleSearchInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSearchCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void;
}
export interface SlashMenuState extends SlashCommandCompletionResult {
    selectedIndex: number;
}
/**
 * Editor backend for touch devices: instead of a CodeMirror EditorView, the
 * composer renders a plain controlled `<textarea>` wired to these fields.
 * Mobile virtual keyboards and IMEs interact poorly with CodeMirror's
 * contenteditable (see #5958), while a native textarea gets the platform's
 * full input stack for free. Null on desktop.
 */
export interface MobileComposerBackend {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onBlur: () => void;
    placeholder: string;
}
export interface ComposerImageTransferHandlers {
    onPasteCapture: ClipboardEventHandler<HTMLDivElement>;
    onDragEnterCapture: DragEventHandler<HTMLDivElement>;
    onDragOverCapture: DragEventHandler<HTMLDivElement>;
    onDragLeaveCapture: DragEventHandler<HTMLDivElement>;
    onDropCapture: DragEventHandler<HTMLDivElement>;
}
export interface UseComposerCoreReturn {
    containerRef: React.RefObject<HTMLDivElement | null>;
    viewRef: React.RefObject<EditorView | null>;
    mobileComposer: MobileComposerBackend | null;
    focus: () => void;
    submitText: () => void;
    clearText: () => void;
    getText: () => string;
    hasInput: () => boolean;
    hasAttachments: boolean;
    hasContent: boolean;
    canSubmit: boolean;
    pendingImageBatchCount: number;
    imageDragActive: boolean;
    clearImageDragState: () => void;
    imageTransferHandlers: ComposerImageTransferHandlers;
    handle: EditorHandle;
    pastedImages: PromptImage[];
    removeImage: (index: number) => void;
    composerTags: WebShellComposerTag[];
    removeTopTag: (id: string) => void;
    addTags: (tags: readonly WebShellComposerTag[], options?: WebShellComposerTagOptions) => void;
    removeInlineTags: (predicate?: (tag: WebShellComposerTag) => boolean) => void;
    insertText: (text: string, options?: WebShellComposerTextOptions) => void;
    setText: (text: string) => void;
    submit: (input?: WebShellComposerInput) => void;
    clear: (options?: {
        text?: boolean;
        tags?: boolean;
    }) => void;
    retryLast: () => void;
    replaceEditorText: (text: string) => void;
    shellMode: boolean;
    setShellMode: React.Dispatch<React.SetStateAction<boolean>>;
    toggleShellMode: () => void;
    currentMode: string;
    sessionName: string | undefined;
    searchState: SearchState;
    navigatePrevHistory: () => void;
    navigateNextHistory: () => void;
    showShortcutHints: boolean;
    followupState: UseDaemonFollowupSuggestionReturn['followupState'];
    disabled: boolean;
    onAcceptFollowup: UseDaemonFollowupSuggestionReturn['onAcceptFollowup'];
    onDismissFollowup: UseDaemonFollowupSuggestionReturn['onDismissFollowup'];
    slashMenu: SlashMenuState | null;
    closeSlashMenu: () => void;
    selectSlashCompletion: (index: number) => boolean;
    acceptSlashCompletion: (index?: number) => boolean;
    atMenu: AtMentionMenuState | null;
    closeAtMenu: () => void;
    selectAtCompletion: (index: number) => boolean;
    acceptAtCompletion: (index?: number) => boolean;
    enterAtCategory: (index?: number) => boolean;
    backAtCategories: () => false | 'items' | 'categories';
    updateAtSearch: (query: string) => boolean;
    selectAtTab: (tabId: string) => boolean;
}
export declare function useComposerCore(options: UseComposerCoreOptions): UseComposerCoreReturn;
export {};
