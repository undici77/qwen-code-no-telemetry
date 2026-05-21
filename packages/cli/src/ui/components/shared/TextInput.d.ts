/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Key } from '../../hooks/useKeypress.js';
export interface TextInputProps {
    value: string;
    onChange: (text: string) => void;
    onSubmit?: () => void;
    /** Called when Tab is pressed; if provided, prevents the default tab-insertion behaviour. */
    onTab?: (key: Key) => void;
    /** Called when ↑ is pressed; if provided, prevents cursor-up in the buffer. */
    onUp?: () => void;
    /** Called when ↓ is pressed; if provided, prevents cursor-down in the buffer. */
    onDown?: () => void;
    placeholder?: string;
    height?: number;
    isActive?: boolean;
    validationErrors?: string[];
    inputWidth?: number;
    initialCursorOffset?: number;
    ellipsizeOverflow?: boolean;
}
export declare function TextInput({ value, onChange, onSubmit, onTab, onUp, onDown, placeholder, height, isActive, validationErrors, inputWidth, initialCursorOffset, ellipsizeOverflow, }: TextInputProps): import("react/jsx-runtime").JSX.Element | null;
