/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { RecentSlashCommands } from '../hooks/useSlashCompletion.js';
import type { TextBuffer } from './shared/text-buffer.js';
import type { Key } from '../hooks/useKeypress.js';
import type { CommandContext, SlashCommand } from '../commands/types.js';
import { ApprovalMode, type Config } from '@qwen-code/qwen-code-core';
/**
 * Represents an attachment (e.g., pasted image) displayed above the input prompt
 */
export interface Attachment {
  id: string;
  path: string;
  filename: string;
}
/**
 * Classify a pasted blob as image-file-path(s).
 *
 * Some terminals and clipboard helpers handle an image paste by injecting the
 * saved file path as text (optionally prefixed with `@`, shell-escaped, or
 * space/newline-separated for multiple files) instead of routing through our
 * own Ctrl+V handler. Recognizing those lets Cmd+V (terminal-driven) converge
 * on the same attachment UX as Ctrl+V. Mirrors Claude Code's usePasteHandler:
 * split on newlines and on spaces that precede an absolute path (spaces inside
 * a path are shell-escaped), then normalize each token.
 *
 * @returns `imagePaths` (normalized tokens with an image extension) and
 *   `allImages` (true only when every token is such a path), so the caller can
 *   promote a pure image-path paste without swallowing mixed text.
 */
export declare function classifyPastedImagePaths(pasted: string): {
  imagePaths: string[];
  allImages: boolean;
};
export declare function expandPendingPastePlaceholders(
  value: string,
  pendingPastes: ReadonlyMap<string, string>,
): string;
export interface InputPromptProps {
  buffer: TextBuffer;
  onSubmit: (
    value: string,
    options?: {
      deferUntilIdle?: boolean;
      submittedPrompt?: string;
    },
  ) => void;
  userMessages: readonly string[];
  onClearScreen: () => void;
  config: Config;
  slashCommands: readonly SlashCommand[];
  commandContext: CommandContext;
  recentSlashCommands?: RecentSlashCommands;
  placeholder?: string;
  focus?: boolean;
  inputWidth: number;
  suggestionsWidth: number;
  shellModeActive: boolean;
  setShellModeActive: (value: boolean) => void;
  approvalMode: ApprovalMode;
  onEscapePromptChange?: (showPrompt: boolean) => void;
  onToggleShortcuts?: () => void;
  showShortcuts?: boolean;
  /**
   * Reports autocomplete-dropdown visibility specifically. Composer uses
   * this to hide the Footer / KeyboardShortcuts when the dropdown would
   * overlap their vertical space. Must stay narrow — followup suggestions
   * and mid-input ghost text don't take Footer's space and shouldn't hide
   * it. See #4171 / #4308 review.
   */
  onSuggestionsVisibilityChange?: (visible: boolean) => void;
  /**
   * Reports whether any input-area handler will consume a Tab keystroke
   * (autocomplete dropdown, followup prompt suggestion, or mid-input ghost
   * text). AppContainer feeds this into useAutoAcceptIndicator's
   * `shouldBlockTab` to suppress the Windows-only "bare Tab cycles approval
   * mode" fallback. See #4171.
   */
  onTabConsumerChange?: (active: boolean) => void;
  vimHandleInput?: (key: Key) => boolean;
  isEmbeddedShellFocused?: boolean;
  /** Prompt suggestion text to display after response completes */
  promptSuggestion?: string | null;
  /** Called when prompt suggestion is dismissed (user typed) */
  onPromptSuggestionDismiss?: () => void;
  clipboardUnavailableShownRef?: React.MutableRefObject<boolean>;
}
export { calculatePromptWidths } from '../utils/layoutUtils.js';
export declare const InputPrompt: React.FC<InputPromptProps>;
