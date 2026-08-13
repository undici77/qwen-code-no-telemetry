/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type FrameController, type ReadonlyFrame, type ScreenSelection } from 'ink';
/** A single addressable cell of the composited screen. */
export interface ScreenCell {
    /** The character in this cell; empty string for a wide-character spacer. */
    value: string;
    /** Whether this cell holds the leading half of a wide (2-column) character. */
    fullWidth: boolean;
}
/**
 * Read side of the frame-buffer bridge. Wraps Ink's {@link FrameController} to
 * answer "what character is at (x, y)" against the latest composited frame and
 * to push a selection range that the renderer highlights before serialization.
 *
 * This is the foundation the selection state machine (M1) builds on; it does
 * not itself own any mouse or keyboard handling.
 */
export declare class ScreenBuffer {
    private readonly controller;
    constructor(controller: FrameController);
    get frame(): ReadonlyFrame | null;
    get dimensions(): {
        width: number;
        height: number;
    };
    getCellAt(x: number, y: number): ScreenCell | null;
    /** Visual text of a row, with trailing padding trimmed. */
    lineText(y: number): string;
    setSelection(selection: ScreenSelection | null): void;
    subscribe(listener: (frame: ReadonlyFrame) => void): () => void;
}
/**
 * Returns the screen buffer for the given output stream, or `undefined` if no
 * Ink instance is rendering to it (e.g. non-TTY or before render).
 */
export declare function getScreenBuffer(stdout: NodeJS.WriteStream): ScreenBuffer | undefined;
