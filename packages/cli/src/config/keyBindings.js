/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Command enum for all available keyboard shortcuts
 */
export var Command;
(function (Command) {
    // Basic bindings
    Command["RETURN"] = "return";
    Command["ESCAPE"] = "escape";
    // Cursor movement
    Command["HOME"] = "home";
    Command["END"] = "end";
    // Text deletion
    Command["KILL_LINE_RIGHT"] = "killLineRight";
    Command["KILL_LINE_LEFT"] = "killLineLeft";
    Command["CLEAR_INPUT"] = "clearInput";
    Command["DELETE_WORD_BACKWARD"] = "deleteWordBackward";
    // Screen control
    Command["CLEAR_SCREEN"] = "clearScreen";
    // History navigation
    Command["HISTORY_UP"] = "historyUp";
    Command["HISTORY_DOWN"] = "historyDown";
    Command["NAVIGATION_UP"] = "navigationUp";
    Command["NAVIGATION_DOWN"] = "navigationDown";
    // Selection list navigation (dialogs, menus)
    Command["SELECTION_UP"] = "selectionUp";
    Command["SELECTION_DOWN"] = "selectionDown";
    // Auto-completion
    Command["ACCEPT_SUGGESTION"] = "acceptSuggestion";
    Command["COMPLETION_UP"] = "completionUp";
    Command["COMPLETION_DOWN"] = "completionDown";
    Command["COMPLETION_TAB_LEFT"] = "completionTabLeft";
    Command["COMPLETION_TAB_RIGHT"] = "completionTabRight";
    // Text input
    Command["SUBMIT"] = "submit";
    Command["QUEUE_MESSAGE"] = "queueMessage";
    Command["NEWLINE"] = "newline";
    Command["VOICE_PUSH_TO_TALK"] = "voicePushToTalk";
    // External tools
    Command["OPEN_EXTERNAL_EDITOR"] = "openExternalEditor";
    Command["PASTE_CLIPBOARD_IMAGE"] = "pasteClipboardImage";
    // App level bindings
    Command["TOGGLE_TOOL_DESCRIPTIONS"] = "toggleToolDescriptions";
    Command["TOGGLE_IDE_CONTEXT_DETAIL"] = "toggleIDEContextDetail";
    Command["QUIT"] = "quit";
    Command["EXIT"] = "exit";
    Command["SHOW_MORE_LINES"] = "showMoreLines";
    Command["RETRY_LAST"] = "retryLast";
    Command["TOGGLE_RENDER_MODE"] = "toggleRenderMode";
    /**
     * Promote the running foreground shell command to a background task.
     * The child process keeps running and the agent's turn unblocks; the
     * shell becomes a regular `BackgroundShellEntry` visible in `/tasks`,
     * the Background tasks dialog, and stoppable via `task_stop`.
     * No-op when no foreground shell is currently executing.
     */
    Command["PROMOTE_SHELL_TO_BACKGROUND"] = "promoteShellToBackground";
    // Shell commands
    Command["REVERSE_SEARCH"] = "reverseSearch";
    Command["SUBMIT_REVERSE_SEARCH"] = "submitReverseSearch";
    Command["ACCEPT_SUGGESTION_REVERSE_SEARCH"] = "acceptSuggestionReverseSearch";
    Command["TOGGLE_SHELL_INPUT_FOCUS"] = "toggleShellInputFocus";
    // Suggestion expansion
    Command["EXPAND_SUGGESTION"] = "expandSuggestion";
    Command["COLLAPSE_SUGGESTION"] = "collapseSuggestion";
    // Thinking expansion
    Command["TOGGLE_THINKING_EXPANDED"] = "toggleThinkingExpanded";
    // Scroll commands
    Command["SCROLL_UP"] = "scrollUp";
    Command["SCROLL_DOWN"] = "scrollDown";
    Command["PAGE_UP"] = "pageUp";
    Command["PAGE_DOWN"] = "pageDown";
    Command["SCROLL_HOME"] = "scrollHome";
    Command["SCROLL_END"] = "scrollEnd";
})(Command || (Command = {}));
/**
 * Default key binding configuration
 * Matches the original hard-coded logic exactly
 */
export const defaultKeyBindings = {
    // Basic bindings
    [Command.RETURN]: [{ key: 'return' }],
    [Command.ESCAPE]: [{ key: 'escape' }],
    // Cursor movement
    [Command.HOME]: [{ key: 'a', ctrl: true }],
    [Command.END]: [{ key: 'e', ctrl: true }],
    // Text deletion
    [Command.KILL_LINE_RIGHT]: [{ key: 'k', ctrl: true }],
    [Command.KILL_LINE_LEFT]: [{ key: 'u', ctrl: true }],
    [Command.CLEAR_INPUT]: [{ key: 'c', ctrl: true, shift: false }],
    // Added command (meta/alt/option) for mac compatibility
    [Command.DELETE_WORD_BACKWARD]: [
        { key: 'backspace', ctrl: true },
        { key: 'backspace', command: true },
        // MinTTY (Git Bash on Windows) emits the byte \x1f (ASCII Unit
        // Separator, rendered as "^_" by `cat -v`) for Ctrl+Backspace under
        // its standard Ctrl-modifies-meta-keys convention. The same byte is
        // the historical Ctrl-mapping of the Unit Separator on traditional
        // ANSI/VT terminals (Ctrl+_ and Ctrl+/ also emit it), but qwen-code
        // doesn't bind those keystrokes elsewhere so this entry is additive
        // and non-conflicting on every platform.
        { sequence: '\x1f' },
    ],
    // Screen control
    [Command.CLEAR_SCREEN]: [{ key: 'l', ctrl: true }],
    // History navigation
    [Command.HISTORY_UP]: [{ key: 'p', ctrl: true }],
    [Command.HISTORY_DOWN]: [{ key: 'n', ctrl: true }],
    [Command.NAVIGATION_UP]: [{ key: 'up', shift: false }],
    [Command.NAVIGATION_DOWN]: [{ key: 'down', shift: false }],
    // Selection-list nav: arrows + k/j + Ctrl+P/Ctrl+N
    // ctrl: false on bare k/j skips Ctrl+K and Ctrl+J
    [Command.SELECTION_UP]: [
        { key: 'up', shift: false },
        { key: 'k', ctrl: false },
        { key: 'p', ctrl: true },
    ],
    [Command.SELECTION_DOWN]: [
        { key: 'down', shift: false },
        { key: 'j', ctrl: false },
        { key: 'n', ctrl: true },
    ],
    // Auto-completion
    [Command.ACCEPT_SUGGESTION]: [
        { key: 'tab' },
        { key: 'return', ctrl: false, shift: false },
    ],
    // Completion navigation: arrows + readline/Vim-style Ctrl+P/Ctrl+N
    [Command.COMPLETION_UP]: [
        { key: 'up', shift: false },
        { key: 'p', ctrl: true },
    ],
    [Command.COMPLETION_DOWN]: [
        { key: 'down', shift: false },
        { key: 'n', ctrl: true },
    ],
    // Completion category tab switching (for the tabbed @ completion UI).
    // Bound to the BARE arrow keys: Ctrl+←/→ was the original binding but many
    // terminals intercept it for word-jump, and on macOS the system claims it
    // for Mission Control, so the documented gesture was unreachable for most
    // users (#8069).
    //
    // Tradeoff, accepted deliberately: while the `@` category tabs are visible,
    // the bare arrows no longer move the caret in the input buffer — press Esc
    // to dismiss the menu first. InputPrompt only renders and handles the tabs
    // when they own the arrows, so search and attachment navigation keep their
    // normal behavior.
    //
    // Modifiers are pinned false so Alt/Option+arrow word movement and any
    // Ctrl+arrow terminal binding fall through untouched.
    [Command.COMPLETION_TAB_LEFT]: [
        { key: 'left', shift: false, ctrl: false, meta: false },
    ],
    [Command.COMPLETION_TAB_RIGHT]: [
        { key: 'right', shift: false, ctrl: false, meta: false },
    ],
    // Text input
    // Must also exclude shift to allow shift+enter for newline
    [Command.SUBMIT]: [
        {
            key: 'return',
            ctrl: false,
            command: false,
            paste: false,
            shift: false,
        },
    ],
    [Command.QUEUE_MESSAGE]: [
        { key: 'q', ctrl: true, command: false, shift: false, paste: false },
    ],
    // Split into multiple data-driven bindings
    // Now also includes shift+enter for multi-line input
    [Command.NEWLINE]: [
        { key: 'return', ctrl: true },
        { key: 'return', command: true },
        { key: 'return', paste: true },
        { key: 'return', shift: true },
        { key: 'j', ctrl: true },
    ],
    [Command.VOICE_PUSH_TO_TALK]: [{ key: 'space', ctrl: false, meta: false }],
    // External tools
    [Command.OPEN_EXTERNAL_EDITOR]: [
        { key: 'x', ctrl: true },
        { sequence: '\x18', ctrl: true },
    ],
    [Command.PASTE_CLIPBOARD_IMAGE]: process.platform === 'win32'
        ? [
            { key: 'v', command: true },
            { key: 'v', meta: true },
        ]
        : [
            { key: 'v', ctrl: true },
            { key: 'v', command: true },
        ],
    // App level bindings
    [Command.TOGGLE_TOOL_DESCRIPTIONS]: [{ key: 't', ctrl: true }],
    [Command.TOGGLE_IDE_CONTEXT_DETAIL]: [{ key: 'g', ctrl: true }],
    [Command.QUIT]: [{ key: 'c', ctrl: true, shift: false }],
    [Command.EXIT]: [{ key: 'd', ctrl: true }],
    [Command.SHOW_MORE_LINES]: [{ key: 's', ctrl: true }],
    [Command.RETRY_LAST]: [{ key: 'y', ctrl: true }],
    [Command.TOGGLE_RENDER_MODE]: [{ key: 'm', meta: true }],
    [Command.PROMOTE_SHELL_TO_BACKGROUND]: [{ key: 'b', ctrl: true }],
    // Shell commands
    [Command.REVERSE_SEARCH]: [{ key: 'r', ctrl: true }],
    // Note: original logic ONLY checked ctrl=false, ignored meta/shift/paste
    [Command.SUBMIT_REVERSE_SEARCH]: [{ key: 'return', ctrl: false }],
    [Command.ACCEPT_SUGGESTION_REVERSE_SEARCH]: [{ key: 'tab' }],
    [Command.TOGGLE_SHELL_INPUT_FOCUS]: [{ key: 'f', ctrl: true }],
    // Suggestion expansion
    [Command.EXPAND_SUGGESTION]: [{ key: 'right' }],
    [Command.COLLAPSE_SUGGESTION]: [{ key: 'left' }],
    // Thinking expansion (Ctrl+O primary, Alt+T legacy)
    [Command.TOGGLE_THINKING_EXPANDED]: [
        { key: 'o', ctrl: true },
        { key: 't', meta: true },
    ],
    // Scroll commands
    [Command.SCROLL_UP]: [{ key: 'up', shift: true }],
    [Command.SCROLL_DOWN]: [{ key: 'down', shift: true }],
    [Command.PAGE_UP]: [{ key: 'pageup' }],
    [Command.PAGE_DOWN]: [{ key: 'pagedown' }],
    [Command.SCROLL_HOME]: [{ key: 'home', ctrl: true }],
    [Command.SCROLL_END]: [{ key: 'end', ctrl: true }],
};
//# sourceMappingURL=keyBindings.js.map