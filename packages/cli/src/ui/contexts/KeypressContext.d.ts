/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
import type React from 'react';
import { type MouseEvent as SgrMouseEvent } from '../utils/mouse.js';
export declare const PASTE_MODE_PREFIX = '\u001B[200~';
export declare const PASTE_MODE_SUFFIX = '\u001B[201~';
export declare const DRAG_COMPLETION_TIMEOUT_MS = 100;
export declare const KITTY_SEQUENCE_TIMEOUT_MS = 200;
export declare const PASTE_IDLE_TIMEOUT_MS = 1000;
export declare const SINGLE_QUOTE = "'";
export declare const DOUBLE_QUOTE = '"';
export interface Key {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  paste: boolean;
  sequence: string;
  kittyProtocol?: boolean;
  pasteImage?: boolean;
  clipboardImageUnavailable?: boolean;
}
export type KeypressHandler = (key: Key) => void;
export type MouseHandler = (event: SgrMouseEvent) => void;
export interface PasteProgress {
  active: boolean;
  receivedBytes: number;
}
interface KeypressContextValue {
  subscribe: (handler: KeypressHandler) => void;
  unsubscribe: (handler: KeypressHandler) => void;
  subscribeMouse: (handler: MouseHandler) => void;
  unsubscribeMouse: (handler: MouseHandler) => void;
  pasteWorkaround: boolean;
  pasteProgress: PasteProgress;
}
export declare function useKeypressContext(): KeypressContextValue;
export declare function KeypressProvider({
  children,
  kittyProtocolEnabled,
  pasteWorkaround,
  config,
  debugKeystrokeLogging,
  initialCapturedInput,
}: {
  children?: React.ReactNode;
  kittyProtocolEnabled: boolean;
  pasteWorkaround?: boolean;
  config?: Config;
  debugKeystrokeLogging?: boolean;
  initialCapturedInput?: Buffer;
}): import('react/jsx-runtime').JSX.Element;
export {};
