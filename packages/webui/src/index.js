/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// eslint-disable-next-line import/no-internal-modules
import './styles/variables.css';
// eslint-disable-next-line import/no-internal-modules
import './styles/timeline.css';
// eslint-disable-next-line import/no-internal-modules
import './styles/components.css';
// Shared UI Components Export
// Export all shared components from this package
// Context
export { PlatformContext, PlatformProvider, usePlatform, } from './context/PlatformContext';
// Layout components
export { default as Container } from './components/layout/Container';
export { default as Header } from './components/layout/Header';
export { default as Sidebar } from './components/layout/Sidebar';
export { default as Main } from './components/layout/Main';
export { default as Footer } from './components/layout/Footer';
export { FileLink } from './components/layout/FileLink';
export { ChatHeader } from './components/layout/ChatHeader';
export { ContextIndicator } from './components/layout/ContextIndicator';
export { CompletionMenu } from './components/layout/CompletionMenu';
export { SessionSelector } from './components/layout/SessionSelector';
export { EmptyState } from './components/layout/EmptyState';
export { InputForm, getEditModeIcon } from './components/layout/InputForm';
export { Onboarding } from './components/layout/Onboarding';
// Message components
export { default as Message } from './components/messages/Message';
export { default as MessageInput } from './components/messages/MessageInput';
export { default as MessageList } from './components/messages/MessageList';
export { WaitingMessage } from './components/messages/Waiting/WaitingMessage';
export { InterruptedMessage } from './components/messages/Waiting/InterruptedMessage';
export { MarkdownRenderer } from './components/messages/MarkdownRenderer/MarkdownRenderer';
export { MessageContent } from './components/messages/MessageContent';
export { UserMessage } from './components/messages/UserMessage';
export { ThinkingMessage } from './components/messages/ThinkingMessage';
export { AssistantMessage } from './components/messages/Assistant/AssistantMessage';
export { InsightProgressCard } from './components/messages/InsightProgressCard.js';
export { CollapsibleFileContent, parseContentWithFileReferences, } from './components/messages/CollapsibleFileContent';
export { AskUserQuestionDialog } from './components/messages/AskUserQuestionDialog';
export { ImagePreview, ImageMessageRenderer, } from './components/messages/ImageComponents';
// ChatViewer - standalone chat display component
export { ChatViewer, default as ChatViewerDefault, } from './components/ChatViewer';
// UI Elements
export { default as Button } from './components/ui/Button';
export { default as Input } from './components/ui/Input';
export { Tooltip } from './components/ui/Tooltip';
// Permission components
export { PermissionDrawer } from './components/PermissionDrawer';
// ToolCall shared components
export { ToolCallContainer, ToolCallCard, ToolCallRow, StatusIndicator, CodeBlock, LocationsList, handleCopyToClipboard, CopyButton, 
// Utility functions
extractCommandOutput, formatValue, safeTitle, shouldShowToolCall, groupContent, hasToolCallOutput, mapToolStatusToContainerStatus, 
// Business ToolCall components
ThinkToolCall, GenericToolCall, AgentToolCall, isAgentExecutionRawOutput, isAgentExecutionToolCall, EditToolCall, WriteToolCall, SearchToolCall, UpdatedPlanToolCall, ShellToolCall, ReadToolCall, WebFetchToolCall, CheckboxDisplay, getToolCallComponent, } from './components/toolcalls';
// Icons
export { default as Icon } from './components/icons/Icon';
export { default as CloseIcon } from './components/icons/CloseIcon';
export { default as SendIcon } from './components/icons/SendIcon';
// File Icons
export { FileIcon, FileListIcon, SaveDocumentIcon, FolderIcon, } from './components/icons/FileIcons';
// Status Icons
export { PlanCompletedIcon, PlanInProgressIcon, PlanPendingIcon, WarningTriangleIcon, UserIcon, SymbolIcon, SelectionIcon, } from './components/icons/StatusIcons';
// Navigation Icons
export { ChevronDownIcon, PlusIcon, PlusSmallIcon, ArrowUpIcon, CloseIcon as CloseXIcon, CloseSmallIcon, SearchIcon, RefreshIcon, } from './components/icons/NavigationIcons';
// Edit Icons
export { EditPencilIcon, AutoEditIcon, PlanModeIcon, CodeBracketsIcon, HideContextIcon, SlashCommandIcon, LinkIcon, OpenDiffIcon, UndoIcon, } from './components/icons/EditIcons';
// Special Icons
export { ThinkingIcon, TerminalIcon } from './components/icons/SpecialIcons';
// Action Icons
export { StopIcon } from './components/icons/StopIcon';
// Hooks
export { useTheme } from './hooks/useTheme';
export { useLocalStorage } from './hooks/useLocalStorage';
export { useFollowupSuggestions } from './hooks/useFollowupSuggestions';
// Utils
export { groupSessionsByDate, getTimeAgo } from './utils/sessionGrouping';
export { ZERO_WIDTH_SPACE, stripZeroWidthSpaces, } from './utils/inputPlaceholder';
// Adapters - for normalizing different data formats
export { adaptJSONLMessages, adaptACPMessages, filterEmptyMessages, isToolCallData, isMessageData, } from './adapters';
// VSCode Webview utilities
export { default as WebviewContainer } from './components/WebviewContainer';
//# sourceMappingURL=index.js.map