/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview BaseTextInput — shared text input component with rendering
 * and common readline keyboard handling.
 *
 * Provides:
 *  - Viewport line rendering from a TextBuffer with cursor display
 *  - Placeholder support when buffer is empty
 *  - Configurable border/prefix styling
 *  - Standard readline shortcuts (Ctrl+A/E/K/U/W, Escape, etc.)
 *  - An `onKeypress` interceptor so consumers can layer custom behavior
 *
 * Used by both InputPrompt (with syntax highlighting + complex key handling)
 * and AgentComposer (with minimal customization).
 */
import type { ReactNode } from 'react';
import { type DOMElement } from 'ink';
import type { TextBuffer } from './shared/text-buffer.js';
import type { Key } from '../hooks/useKeypress.js';
export interface RenderLineOptions {
  /** The text content of this visual line. */
  lineText: string;
  /** Whether the cursor is on this visual line. */
  isOnCursorLine: boolean;
  /** The cursor column within this visual line (visual col, not logical). */
  cursorCol: number;
  /** Whether the cursor should be rendered. */
  showCursor: boolean;
  /** Index of this line within the rendered viewport (0-based). */
  visualLineIndex: number;
  /** Absolute visual line index (scrollVisualRow + visualLineIndex). */
  absoluteVisualIndex: number;
  /** The underlying text buffer. */
  buffer: TextBuffer;
  /** The first visible visual row (scroll offset). */
  scrollVisualRow: number;
}
export interface BaseTextInputProps {
  /** The text buffer driving this input. */
  buffer: TextBuffer;
  /** Called when the user submits (Enter). Buffer is cleared automatically. */
  onSubmit: (text: string) => void;
  /**
   * Optional key interceptor. Called before default readline handling.
   * Return `true` if the key was handled (skips default processing).
   */
  onKeypress?: (key: Key) => boolean;
  /** Whether to show the blinking block cursor. Defaults to true. */
  showCursor?: boolean;
  /** Placeholder text shown when the buffer is empty. */
  placeholder?: string;
  /** Custom prefix node (defaults to `> `). */
  prefix?: ReactNode;
  /** Width of the prefix in terminal columns. Defaults to 2 (for "> "). */
  prefixWidth?: number;
  /** Border color for the input box. */
  borderColor?: string;
  /** Label rendered on the top border line (right-aligned). Plain string for width calculation. */
  topRightLabel?: string;
  /** Whether keyboard handling is active. Defaults to true. */
  isActive?: boolean;
  /**
   * Custom line renderer for advanced rendering (e.g. syntax highlighting).
   * When not provided, lines are rendered as plain text with cursor overlay.
   */
  renderLine?: (opts: RenderLineOptions) => ReactNode;
  /** Enable click-to-position-cursor (alternate-screen / ui.useTerminalBuffer mode). */
  mouseEnabled?: boolean;
}
/**
 * Renders a single visual line with a high-contrast block cursor.
 * Uses codepoint-aware string operations for Unicode/emoji safety.
 */
export declare function defaultRenderLine({
  lineText,
  isOnCursorLine,
  cursorCol,
  showCursor,
}: RenderLineOptions): ReactNode;
export type PhysicalCursorState = {
  hasMeasured: boolean;
  showCursor: boolean;
  cursorVisualRow: number;
  cursorVisualCol: number;
  scrollVisualRow: number;
  linesToRender: string[];
  prefixWidth: number;
};
export declare function getAbsolutePosition(node: DOMElement | null):
  | {
      top: number;
      left: number;
    }
  | undefined;
export declare function getPhysicalCursorPosition(
  node: DOMElement | null,
  {
    hasMeasured,
    showCursor,
    cursorVisualRow,
    cursorVisualCol,
    scrollVisualRow,
    linesToRender,
    prefixWidth,
  }: PhysicalCursorState,
):
  | {
      x: number;
      y: number;
    }
  | undefined;
export declare const BaseTextInput: ({
  buffer,
  onSubmit,
  onKeypress,
  showCursor,
  placeholder,
  prefix,
  prefixWidth,
  borderColor,
  topRightLabel,
  isActive,
  renderLine,
  mouseEnabled,
}: BaseTextInputProps) => ReactNode;
