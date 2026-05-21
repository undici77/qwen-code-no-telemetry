/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * Special UI icons
 */
import type { FC } from 'react';
import type { IconProps } from './types.js';
interface ThinkingIconProps extends IconProps {
    /**
     * Whether thinking is enabled (affects styling)
     */
    enabled?: boolean;
}
export declare const ThinkingIcon: FC<ThinkingIconProps>;
export declare const TerminalIcon: FC<IconProps>;
export {};
