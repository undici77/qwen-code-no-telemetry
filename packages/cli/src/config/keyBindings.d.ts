/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Command enum for all available keyboard shortcuts
 */
export declare enum Command {
  RETURN = 'return',
  ESCAPE = 'escape',
  HOME = 'home',
  END = 'end',
  KILL_LINE_RIGHT = 'killLineRight',
  KILL_LINE_LEFT = 'killLineLeft',
  CLEAR_INPUT = 'clearInput',
  DELETE_WORD_BACKWARD = 'deleteWordBackward',
  CLEAR_SCREEN = 'clearScreen',
  HISTORY_UP = 'historyUp',
  HISTORY_DOWN = 'historyDown',
  NAVIGATION_UP = 'navigationUp',
  NAVIGATION_DOWN = 'navigationDown',
  SELECTION_UP = 'selectionUp',
  SELECTION_DOWN = 'selectionDown',
  ACCEPT_SUGGESTION = 'acceptSuggestion',
  COMPLETION_UP = 'completionUp',
  COMPLETION_DOWN = 'completionDown',
  COMPLETION_TAB_LEFT = 'completionTabLeft',
  COMPLETION_TAB_RIGHT = 'completionTabRight',
  SUBMIT = 'submit',
  QUEUE_MESSAGE = 'queueMessage',
  NEWLINE = 'newline',
  VOICE_PUSH_TO_TALK = 'voicePushToTalk',
  OPEN_EXTERNAL_EDITOR = 'openExternalEditor',
  PASTE_CLIPBOARD_IMAGE = 'pasteClipboardImage',
  TOGGLE_TOOL_DESCRIPTIONS = 'toggleToolDescriptions',
  TOGGLE_IDE_CONTEXT_DETAIL = 'toggleIDEContextDetail',
  QUIT = 'quit',
  EXIT = 'exit',
  SHOW_MORE_LINES = 'showMoreLines',
  RETRY_LAST = 'retryLast',
  TOGGLE_RENDER_MODE = 'toggleRenderMode',
  /**
   * Promote the running foreground shell command to a background task.
   * The child process keeps running and the agent's turn unblocks; the
   * shell becomes a regular `BackgroundShellEntry` visible in `/tasks`,
   * the Background tasks dialog, and stoppable via `task_stop`.
   * No-op when no foreground shell is currently executing.
   */
  PROMOTE_SHELL_TO_BACKGROUND = 'promoteShellToBackground',
  REVERSE_SEARCH = 'reverseSearch',
  SUBMIT_REVERSE_SEARCH = 'submitReverseSearch',
  ACCEPT_SUGGESTION_REVERSE_SEARCH = 'acceptSuggestionReverseSearch',
  TOGGLE_SHELL_INPUT_FOCUS = 'toggleShellInputFocus',
  EXPAND_SUGGESTION = 'expandSuggestion',
  COLLAPSE_SUGGESTION = 'collapseSuggestion',
  TOGGLE_THINKING_EXPANDED = 'toggleThinkingExpanded',
  SCROLL_UP = 'scrollUp',
  SCROLL_DOWN = 'scrollDown',
  PAGE_UP = 'pageUp',
  PAGE_DOWN = 'pageDown',
  SCROLL_HOME = 'scrollHome',
  SCROLL_END = 'scrollEnd',
}
/**
 * Data-driven key binding structure for user configuration
 */
export interface KeyBinding {
  /** The key name (e.g., 'a', 'return', 'tab', 'escape') */
  key?: string;
  /** The key sequence (e.g., '\x18' for Ctrl+X) - alternative to key name */
  sequence?: string;
  /** Control key requirement: true=must be pressed, false=must not be pressed, undefined=ignore */
  ctrl?: boolean;
  /** Shift key requirement: true=must be pressed, false=must not be pressed, undefined=ignore */
  shift?: boolean;
  /** Command/meta key requirement: true=must be pressed, false=must not be pressed, undefined=ignore */
  command?: boolean;
  /** Paste operation requirement: true=must be paste, false=must not be paste, undefined=ignore */
  paste?: boolean;
  meta?: boolean;
}
/**
 * Configuration type mapping commands to their key bindings
 */
export type KeyBindingConfig = {
  readonly [C in Command]: readonly KeyBinding[];
};
/**
 * Default key binding configuration
 * Matches the original hard-coded logic exactly
 */
export declare const defaultKeyBindings: KeyBindingConfig;
