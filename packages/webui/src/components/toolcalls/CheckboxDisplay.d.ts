/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Display-only checkbox component for plan entries
 */
import type { FC } from 'react';
export interface CheckboxDisplayProps {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
}
/**
 * Display-only checkbox styled via Tailwind classes.
 * - Renders a custom-looking checkbox using appearance-none and pseudo-elements.
 * - Supports indeterminate (middle) state using a data- attribute.
 * - Intended for read-only display (disabled by default).
 */
export declare const CheckboxDisplay: FC<CheckboxDisplayProps>;
