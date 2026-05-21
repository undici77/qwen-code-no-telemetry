/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { BtwProps } from '../../types.js';
export interface BtwDisplayProps {
    btw: BtwProps;
    /** Width of the parent container. Used to compute Markdown content width.
     *  Falls back to terminal width when not provided. */
    containerWidth?: number;
}
export declare const BtwMessage: React.NamedExoticComponent<BtwDisplayProps>;
