/**
 * @craft-agent/ui - Shared React UI components for Qwen Code
 *
 * This package provides platform-agnostic UI components that work in both:
 * - Electron desktop app (full interactive mode)
 * - Web session viewer (read-only mode)
 *
 * Key components:
 * - SessionViewer: Read-only session transcript viewer (used by web viewer)
 * - TurnCard: Email-like display for assistant turns
 * - Markdown: Customizable markdown renderer with syntax highlighting
 *
 * Platform abstraction:
 * - PlatformProvider/usePlatform: Inject platform-specific actions
 */
// Context
export { PlatformProvider, usePlatform, ShikiThemeProvider, useShikiTheme, } from './context';
// Chat components
export { SessionViewer, TurnCard, TurnCardActionsMenu, ResponseCard, UserMessageBubble, SystemMessage, FileTypeIcon, getFileTypeLabel, asRecord, getAnnotationNoteText, getAnnotationFollowUpState, isAnnotationFollowUpSent, extractAnnotationSelectedText, normalizeFollowUpText, 
// Inline execution for EditPopover
InlineExecution, mapToolEventToActivity, SIZE_CONFIG, ActivityStatusIcon, } from './components/chat';
// Markdown
export { Markdown, MemoizedMarkdown, CodeBlock, InlineCode, CollapsibleMarkdownProvider, useCollapsibleMarkdown, MarkdownDatatableBlock, MarkdownSpreadsheetBlock, MarkdownImageBlock, ImageCardStack, TiptapMarkdownEditor, } from './components/markdown';
// UI primitives
export { Spinner, SimpleDropdown, SimpleDropdownItem, PreviewHeader, PreviewHeaderBadge, PREVIEW_BADGE_VARIANTS, DropdownMenu, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuShortcut, StyledDropdownMenuContent, StyledDropdownMenuItem, StyledDropdownMenuSeparator, StyledDropdownMenuSubTrigger, StyledDropdownMenuSubContent, BrowserShader, BrowserControls, BrowserEmptyStateCard, FilterableSelectPopover, Island, IslandContentView, IslandFollowUpContentView, useIslandNavigation, } from './components/ui';
// Tooltip
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, } from './components/tooltip';
// Code viewer components
export { ShikiCodeViewer, ShikiDiffViewer, getDiffStats, UnifiedDiffViewer, getUnifiedDiffStats, DiffViewerControls, DiffSplitIcon, DiffUnifiedIcon, DiffBackgroundIcon, LANGUAGE_MAP, getLanguageFromPath, formatFilePath, truncateFilePath, } from './components/code-viewer';
// Terminal components
export { TerminalOutput, parseAnsi, stripAnsi, isGrepContentOutput, parseGrepOutput, ANSI_COLORS, } from './components/terminal';
// Overlay components
export { 
// Base overlay components
FullscreenOverlayBase, FullscreenOverlayBaseHeader, PreviewOverlay, ContentFrame, CopyButton, 
// Specialized overlays
CodePreviewOverlay, MultiDiffPreviewOverlay, TerminalPreviewOverlay, GenericOverlay, JSONPreviewOverlay, DataTableOverlay, DocumentFormattedMarkdownOverlay, ImagePreviewOverlay, PDFPreviewOverlay, detectLanguage, detectLanguageFromPath, ActivityCardsOverlay, } from './components/overlay';
// File classification (for link interceptor)
export { classifyFile, } from './lib/file-classification';
// Utilities
export { cn } from './lib/utils';
export { openExternalUrl, } from './lib/open-external-url';
export { setDismissibleLayerBridge, getDismissibleLayerBridge, } from './lib/dismissible-layer-bridge';
// Layout constants and hooks
export { CHAT_LAYOUT, CHAT_CLASSES, OVERLAY_LAYOUT, useOverlayMode, } from './lib/layout';
// Tool result parsers
export { parseReadResult, parseBashResult, parseGrepResult, parseGlobResult, extractOverlayData, extractOverlayCards, } from './lib/tool-parsers';
// Turn utilities (pure functions)
export * from './components/chat/turn-utils';
// Icons
export { Icon_Folder, Icon_Home, Icon_Inbox, } from './components/icons';
//# sourceMappingURL=index.js.map