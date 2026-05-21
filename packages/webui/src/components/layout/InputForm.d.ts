/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * InputForm component - Main chat input with toolbar
 * Platform-agnostic version with configurable edit modes
 */
import type { FC } from 'react';
import type { ReactNode } from 'react';
import type { CompletionItem } from '../../types/completion.js';
import type { ContextUsage } from './ContextIndicator.js';
import type { FollowupState } from '../../types/followup.js';
/**
 * Edit mode display information
 */
export interface EditModeInfo {
    /** Display label */
    label: string;
    /** Tooltip text */
    title: string;
    /** Icon to display */
    icon: ReactNode;
}
/**
 * Built-in icon types for edit modes
 */
export type EditModeIconType = 'edit' | 'auto' | 'plan' | 'yolo';
/**
 * Get icon component for edit mode type
 */
export declare const getEditModeIcon: (iconType: EditModeIconType) => ReactNode;
/**
 * Props for InputForm component
 */
export interface InputFormProps {
    /** Current input text */
    inputText: string;
    /** Ref for the input field */
    inputFieldRef: React.RefObject<HTMLDivElement | null>;
    /** Whether AI is currently generating */
    isStreaming: boolean;
    /** Whether waiting for response */
    isWaitingForResponse: boolean;
    /** Whether IME composition is in progress */
    isComposing: boolean;
    /** Edit mode display information */
    editModeInfo: EditModeInfo;
    /** Whether thinking mode is enabled */
    thinkingEnabled: boolean;
    /** Active file name (from editor) */
    activeFileName: string | null;
    /** Active selection range */
    activeSelection: {
        startLine: number;
        endLine: number;
    } | null;
    /** Whether to skip auto-loading active context */
    skipAutoActiveContext: boolean;
    /** Context usage information */
    contextUsage: ContextUsage | null;
    /** Input change callback */
    onInputChange: (text: string) => void;
    /** Composition start callback */
    onCompositionStart: () => void;
    /** Composition end callback */
    onCompositionEnd: () => void;
    /** Key down callback */
    onKeyDown: (e: React.KeyboardEvent) => void;
    /** Submit callback. When explicitText is provided, submit that value instead of reading from input state. */
    onSubmit(e: React.FormEvent | React.KeyboardEvent, explicitText?: string): void;
    /** Cancel callback */
    onCancel: () => void;
    /** Toggle edit mode callback */
    onToggleEditMode: () => void;
    /** Toggle thinking callback */
    onToggleThinking: () => void;
    /** Focus active editor callback */
    onFocusActiveEditor?: () => void;
    /** Toggle skip auto context callback */
    onToggleSkipAutoActiveContext: () => void;
    /** Show command menu callback */
    onShowCommandMenu: () => void;
    /** Attach context callback */
    onAttachContext: () => void;
    /** Whether completion menu is open */
    completionIsOpen: boolean;
    /** Completion items */
    completionItems?: CompletionItem[];
    /** Completion select callback (Enter / click) */
    onCompletionSelect?: (item: CompletionItem) => void;
    /** Completion fill callback (Tab — fill without executing). Falls back to onCompletionSelect. */
    onCompletionFill?: (item: CompletionItem) => void;
    /** Completion close callback */
    onCompletionClose?: () => void;
    /** Optional paste handler for the contentEditable input */
    onPaste?: (e: React.ClipboardEvent) => void;
    /** Optional content rendered between the input and actions */
    extraContent?: ReactNode;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the current draft is eligible to submit */
    canSubmit?: boolean;
    /** Prompt suggestion state */
    followupState?: FollowupState;
    /** Callback to accept prompt suggestion */
    onAcceptFollowup?: (method?: 'tab' | 'enter' | 'right', options?: {
        skipOnAccept?: boolean;
    }) => void;
    /** Callback to dismiss prompt suggestion */
    onDismissFollowup?: () => void;
}
/**
 * InputForm component
 *
 * Features:
 * - ContentEditable input with placeholder
 * - Edit mode toggle with customizable icons
 * - Active file/selection indicator
 * - Context usage display
 * - Command and attach buttons
 * - Send/Stop button based on state
 * - Completion menu integration
 *
 * @example
 * ```tsx
 * <InputForm
 *   inputText={text}
 *   inputFieldRef={inputRef}
 *   isStreaming={false}
 *   isWaitingForResponse={false}
 *   isComposing={false}
 *   editModeInfo={{ label: 'Auto', title: 'Auto mode', icon: <AutoEditIcon /> }}
 *   // ... other props
 * />
 * ```
 */
export declare const InputForm: FC<InputFormProps>;
