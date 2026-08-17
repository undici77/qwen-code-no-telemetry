/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ViewportRect } from './selection-coords.js';
interface ScrollState {
  scrollTop: number;
  scrollHeight: number;
  innerHeight: number;
}
export interface TextSelectionControllerProps {
  /** Selection is only handled while active (VP mode, no dialog, focused). */
  isActive: boolean;
  /** Reads from the history viewport; called at event time (may be null early). */
  getViewportRect: () => ViewportRect | null;
  /** Additional selectable regions outside the history viewport. */
  getAdditionalSelectableRects?: () => readonly ViewportRect[];
  getScrollState: () => ScrollState;
  hitTestScrollbar: (location: { col: number; row: number }) => boolean;
}
/**
 * Headless controller that turns mouse press/drag/release in selectable VP
 * regions into a text selection: it maps terminal coordinates to the
 * composited frame, drives the {@link SelectionState}, highlights the range
 * through the frame controller, and copies on release. Double/triple click
 * select a word/line. B1 scope: visible-region only; history selections clear
 * on scroll, while every selection clears when its owning content or layout
 * changes.
 */
export declare function TextSelectionController(
  props: TextSelectionControllerProps,
): null;
export {};
