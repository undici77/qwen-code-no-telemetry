/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ExtensionsManagerDialogProps } from './types.js';
export interface StatusMessage {
    type: 'info' | 'success' | 'warning' | 'error';
    text: string;
}
export declare function ExtensionsManagerDialog({ onClose, config, initialTab, }: ExtensionsManagerDialogProps): import("react/jsx-runtime").JSX.Element;
