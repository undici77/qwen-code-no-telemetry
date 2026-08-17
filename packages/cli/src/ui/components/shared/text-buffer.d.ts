/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type EditorType } from '@qwen-code/qwen-code-core';
export type Direction =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'wordLeft'
  | 'wordRight'
  | 'home'
  | 'end';
export declare const isWordCharStrict: (char: string) => boolean;
export declare const isWhitespace: (char: string) => boolean;
export declare const isCombiningMark: (char: string) => boolean;
export declare const isWordCharWithCombining: (char: string) => boolean;
export declare const getCharScript: (char: string) => string;
export declare const isDifferentScript: (
  char1: string,
  char2: string,
) => boolean;
/**
 * Reset word segmentation state for testing.
 * Clears the cache and forces re-initialization of Intl.Segmenter.
 * @internal — only used in tests to ensure test isolation.
 */
export declare function __resetWordSegmenter(): void;
export declare const findNextWordStartInLine: (
  line: string,
  col: number,
) => number | null;
export declare const findPrevWordStartInLine: (
  line: string,
  col: number,
) => number | null;
export declare const findWordEndInLine: (
  line: string,
  col: number,
) => number | null;
export declare const findNextWordAcrossLines: (
  lines: string[],
  cursorRow: number,
  cursorCol: number,
  searchForWordStart: boolean,
) => {
  row: number;
  col: number;
} | null;
export declare const findPrevWordAcrossLines: (
  lines: string[],
  cursorRow: number,
  cursorCol: number,
) => {
  row: number;
  col: number;
} | null;
export declare const getPositionFromOffsets: (
  startOffset: number,
  endOffset: number,
  lines: string[],
) => {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};
export declare const getLineRangeOffsets: (
  startRow: number,
  lineCount: number,
  lines: string[],
) => {
  startOffset: number;
  endOffset: number;
};
export declare const replaceRangeInternal: (
  state: TextBufferState,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  text: string,
) => TextBufferState;
export interface Viewport {
  height: number;
  width: number;
}
interface UseTextBufferProps {
  initialText?: string;
  initialCursorOffset?: number;
  viewport: Viewport;
  stdin?: NodeJS.ReadStream | null;
  setRawMode?: (mode: boolean) => void;
  onChange?: (text: string) => void;
  isValidPath: (path: string) => boolean;
  shellModeActive?: boolean;
  preferredEditor?: EditorType;
}
interface UndoHistoryEntry {
  lines: string[];
  cursorRow: number;
  cursorCol: number;
}
export declare function offsetToLogicalPos(
  text: string,
  offset: number,
): [number, number];
/**
 * Converts logical row/col position to absolute text offset
 * Inverse operation of offsetToLogicalPos
 */
export declare function logicalPosToOffset(
  lines: string[],
  row: number,
  col: number,
): number;
export interface VisualLayout {
  visualLines: string[];
  logicalToVisualMap: Array<Array<[number, number]>>;
  visualToLogicalMap: Array<[number, number]>;
}
export interface TextBufferState {
  lines: string[];
  cursorRow: number;
  cursorCol: number;
  preferredCol: number | null;
  undoStack: UndoHistoryEntry[];
  redoStack: UndoHistoryEntry[];
  clipboard: string | null;
  selectionAnchor: [number, number] | null;
  viewportWidth: number;
  viewportHeight: number;
  visualLayout: VisualLayout;
}
export declare const pushUndo: (
  currentState: TextBufferState,
) => TextBufferState;
export type TextBufferAction =
  | {
      type: 'set_text';
      payload: string;
      pushToUndo?: boolean;
      clearUndoHistory?: boolean;
    }
  | {
      type: 'insert';
      payload: string;
    }
  | {
      type: 'backspace';
    }
  | {
      type: 'move';
      payload: {
        dir: Direction;
      };
    }
  | {
      type: 'set_cursor';
      payload: {
        cursorRow: number;
        cursorCol: number;
        preferredCol: number | null;
      };
    }
  | {
      type: 'delete';
    }
  | {
      type: 'delete_word_left';
    }
  | {
      type: 'delete_word_right';
    }
  | {
      type: 'kill_line_right';
    }
  | {
      type: 'kill_line_left';
    }
  | {
      type: 'undo';
    }
  | {
      type: 'redo';
    }
  | {
      type: 'replace_range';
      payload: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
        text: string;
      };
    }
  | {
      type: 'move_to_offset';
      payload: {
        offset: number;
      };
    }
  | {
      type: 'create_undo_snapshot';
    }
  | {
      type: 'set_viewport';
      payload: {
        width: number;
        height: number;
      };
    }
  | {
      type: 'vim_delete_word_forward';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_delete_word_backward';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_delete_word_end';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_change_word_forward';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_change_word_backward';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_change_word_end';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_delete_line';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_change_line';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_delete_to_end_of_line';
    }
  | {
      type: 'vim_change_to_end_of_line';
    }
  | {
      type: 'vim_change_movement';
      payload: {
        movement: 'h' | 'j' | 'k' | 'l';
        count: number;
      };
    }
  | {
      type: 'vim_delete_movement';
      payload: {
        movement: 'h' | 'j' | 'k' | 'l';
        count: number;
      };
    }
  | {
      type: 'vim_move_left';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_move_right';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_move_up';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_move_down';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_move_word_forward';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_move_word_backward';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_move_word_end';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_delete_char';
      payload: {
        count: number;
      };
    }
  | {
      type: 'vim_insert_at_cursor';
    }
  | {
      type: 'vim_append_at_cursor';
    }
  | {
      type: 'vim_open_line_below';
    }
  | {
      type: 'vim_open_line_above';
    }
  | {
      type: 'vim_append_at_line_end';
    }
  | {
      type: 'vim_insert_at_line_start';
    }
  | {
      type: 'vim_move_to_line_start';
    }
  | {
      type: 'vim_move_to_line_end';
    }
  | {
      type: 'vim_move_to_first_nonwhitespace';
    }
  | {
      type: 'vim_move_to_first_line';
    }
  | {
      type: 'vim_move_to_last_line';
    }
  | {
      type: 'vim_move_to_line';
      payload: {
        lineNumber: number;
      };
    }
  | {
      type: 'vim_escape_insert_mode';
    };
export declare function textBufferReducer(
  state: TextBufferState,
  action: TextBufferAction,
): TextBufferState;
export declare function useTextBuffer({
  initialText,
  initialCursorOffset,
  viewport,
  stdin,
  setRawMode,
  onChange,
  isValidPath,
  shellModeActive,
  preferredEditor,
}: UseTextBufferProps): TextBuffer;
export interface TextBuffer {
  lines: string[];
  text: string;
  cursor: [number, number];
  /**
   * When the user moves the caret vertically we try to keep their original
   * horizontal column even when passing through shorter lines.  We remember
   * that *preferred* column in this field while the user is still travelling
   * vertically.  Any explicit horizontal movement resets the preference.
   */
  preferredCol: number | null;
  selectionAnchor: [number, number] | null;
  allVisualLines: string[];
  viewportVisualLines: string[];
  visualCursor: [number, number];
  visualScrollRow: number;
  /**
   * For each visual line (by absolute index in allVisualLines) provides a tuple
   * [logicalLineIndex, startColInLogical] that maps where that visual line
   * begins within the logical buffer. Indices are code-point based.
   */
  visualToLogicalMap: Array<[number, number]>;
  /**
   * Replaces the entire buffer content with the provided text.
   * The operation is undoable unless `clearUndoHistory` is set.
   */
  setText: (
    text: string,
    options?: {
      clearUndoHistory?: boolean;
    },
  ) => void;
  /**
   * Insert a single character or string without newlines.
   */
  insert: (
    ch: string,
    opts?: {
      paste?: boolean;
    },
  ) => void;
  newline: () => void;
  backspace: () => void;
  del: () => void;
  move: (dir: Direction) => void;
  undo: () => void;
  redo: () => void;
  /**
   * Replaces the text within the specified range with new text.
   * Handles both single-line and multi-line ranges.
   *
   * @param startRow The starting row index (inclusive).
   * @param startCol The starting column index (inclusive, code-point based).
   * @param endRow The ending row index (inclusive).
   * @param endCol The ending column index (exclusive, code-point based).
   * @param text The new text to insert.
   * @returns True if the buffer was modified, false otherwise.
   */
  replaceRange: (
    startRow: number,
    startCol: number,
    endRow: number,
    endCol: number,
    text: string,
  ) => void;
  /**
   * Delete the word to the *left* of the caret, mirroring common
   * Ctrl/Alt+Backspace behaviour in editors & terminals. Both the adjacent
   * whitespace *and* the word characters immediately preceding the caret are
   * removed.  If the caret is already at column‑0 this becomes a no-op.
   */
  deleteWordLeft: () => void;
  /**
   * Delete the word to the *right* of the caret, akin to many editors'
   * Ctrl/Alt+Delete shortcut.  Removes any whitespace/punctuation that
   * follows the caret and the next contiguous run of word characters.
   */
  deleteWordRight: () => void;
  /**
   * Deletes text from the cursor to the end of the current line.
   */
  killLineRight: () => void;
  /**
   * Deletes text from the start of the current line to the cursor.
   */
  killLineLeft: () => void;
  /**
   * High level "handleInput" – receives what Ink gives us.
   */
  handleInput: (key: {
    name: string;
    ctrl: boolean;
    meta: boolean;
    shift: boolean;
    paste: boolean;
    sequence: string;
  }) => void;
  /**
   * Opens the current buffer contents in an external editor.  Resolution
   * order: `/editor` preference → `$VISUAL` → `$EDITOR` → platform default (`vi` on Unix, `notepad` on Windows).
   *
   * The undo snapshot is created *after* the editor exits and only when
   * the content actually changed, so one `undo()` reverts the entire edit.
   *
   * Uses the synchronous spawn API so the calling process blocks until the
   * editor closes, mirroring Git's behaviour.
   */
  openInExternalEditor: (opts?: { editor?: string }) => Promise<void>;
  replaceRangeByOffset: (
    startOffset: number,
    endOffset: number,
    replacementText: string,
  ) => void;
  moveToOffset(offset: number): void;
  /**
   * Delete N words forward from cursor position (vim 'dw' command)
   */
  vimDeleteWordForward: (count: number) => void;
  /**
   * Delete N words backward from cursor position (vim 'db' command)
   */
  vimDeleteWordBackward: (count: number) => void;
  /**
   * Delete to end of N words from cursor position (vim 'de' command)
   */
  vimDeleteWordEnd: (count: number) => void;
  /**
   * Change N words forward from cursor position (vim 'cw' command)
   */
  vimChangeWordForward: (count: number) => void;
  /**
   * Change N words backward from cursor position (vim 'cb' command)
   */
  vimChangeWordBackward: (count: number) => void;
  /**
   * Change to end of N words from cursor position (vim 'ce' command)
   */
  vimChangeWordEnd: (count: number) => void;
  /**
   * Delete N lines from cursor position (vim 'dd' command)
   */
  vimDeleteLine: (count: number) => void;
  /**
   * Change N lines from cursor position (vim 'cc' command)
   */
  vimChangeLine: (count: number) => void;
  /**
   * Delete from cursor to end of line (vim 'D' command)
   */
  vimDeleteToEndOfLine: () => void;
  /**
   * Change from cursor to end of line (vim 'C' command)
   */
  vimChangeToEndOfLine: () => void;
  /**
   * Change movement operations (vim 'ch', 'cj', 'ck', 'cl' commands)
   */
  vimChangeMovement: (movement: 'h' | 'j' | 'k' | 'l', count: number) => void;
  /**
   * Delete movement operations (vim 'dh', 'dj', 'dk', 'dl' commands)
   */
  vimDeleteMovement: (movement: 'h' | 'j' | 'k' | 'l', count: number) => void;
  /**
   * Move cursor left N times (vim 'h' command)
   */
  vimMoveLeft: (count: number) => void;
  /**
   * Move cursor right N times (vim 'l' command)
   */
  vimMoveRight: (count: number) => void;
  /**
   * Move cursor up N times (vim 'k' command)
   */
  vimMoveUp: (count: number) => void;
  /**
   * Move cursor down N times (vim 'j' command)
   */
  vimMoveDown: (count: number) => void;
  /**
   * Move cursor forward N words (vim 'w' command)
   */
  vimMoveWordForward: (count: number) => void;
  /**
   * Move cursor backward N words (vim 'b' command)
   */
  vimMoveWordBackward: (count: number) => void;
  /**
   * Move cursor to end of Nth word (vim 'e' command)
   */
  vimMoveWordEnd: (count: number) => void;
  /**
   * Delete N characters at cursor (vim 'x' command)
   */
  vimDeleteChar: (count: number) => void;
  /**
   * Enter insert mode at cursor (vim 'i' command)
   */
  vimInsertAtCursor: () => void;
  /**
   * Enter insert mode after cursor (vim 'a' command)
   */
  vimAppendAtCursor: () => void;
  /**
   * Open new line below and enter insert mode (vim 'o' command)
   */
  vimOpenLineBelow: () => void;
  /**
   * Open new line above and enter insert mode (vim 'O' command)
   */
  vimOpenLineAbove: () => void;
  /**
   * Move to end of line and enter insert mode (vim 'A' command)
   */
  vimAppendAtLineEnd: () => void;
  /**
   * Move to first non-whitespace and enter insert mode (vim 'I' command)
   */
  vimInsertAtLineStart: () => void;
  /**
   * Move cursor to beginning of line (vim '0' command)
   */
  vimMoveToLineStart: () => void;
  /**
   * Move cursor to end of line (vim '$' command)
   */
  vimMoveToLineEnd: () => void;
  /**
   * Move cursor to first non-whitespace character (vim '^' command)
   */
  vimMoveToFirstNonWhitespace: () => void;
  /**
   * Move cursor to first line (vim 'gg' command)
   */
  vimMoveToFirstLine: () => void;
  /**
   * Move cursor to last line (vim 'G' command)
   */
  vimMoveToLastLine: () => void;
  /**
   * Move cursor to specific line number (vim '[N]G' command)
   */
  vimMoveToLine: (lineNumber: number) => void;
  /**
   * Handle escape from insert mode (moves cursor left if not at line start)
   */
  vimEscapeInsertMode: () => void;
}
export {};
