/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReactNode } from 'react';
/**
 * Input size types
 */
export type InputSize = 'sm' | 'md' | 'lg';
/**
 * Input component props interface
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    /** Input size */
    size?: InputSize;
    /** Error state */
    error?: boolean;
    /** Error message to display */
    errorMessage?: string;
    /** Label for the input */
    label?: string;
    /** Helper text below input */
    helperText?: string;
    /** Left icon/element */
    leftElement?: ReactNode;
    /** Right icon/element */
    rightElement?: ReactNode;
    /** Full width input */
    fullWidth?: boolean;
}
/**
 * Input component with multiple sizes and states
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   error={!!errors.email}
 *   errorMessage={errors.email}
 * />
 * ```
 */
declare const Input: import("react").ForwardRefExoticComponent<InputProps & import("react").RefAttributes<HTMLInputElement>>;
export default Input;
