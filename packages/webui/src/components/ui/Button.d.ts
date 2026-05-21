/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ReactNode } from 'react';
/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg';
/**
 * Button component props interface
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Button content */
    children: ReactNode;
    /** Visual style variant */
    variant?: ButtonVariant;
    /** Button size */
    size?: ButtonSize;
    /** Loading state - shows spinner and disables button */
    loading?: boolean;
    /** Icon to display before children */
    leftIcon?: ReactNode;
    /** Icon to display after children */
    rightIcon?: ReactNode;
    /** Full width button */
    fullWidth?: boolean;
}
/**
 * Button component with multiple variants and sizes
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
declare const Button: import("react").ForwardRefExoticComponent<ButtonProps & import("react").RefAttributes<HTMLButtonElement>>;
export default Button;
