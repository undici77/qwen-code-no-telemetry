/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
export declare const MAX_WIDTH = 150;
export interface PrepareLabelProps {
    label: string;
    matchedIndex?: number;
    userInput: string;
    textColor: string;
    isExpanded?: boolean;
}
export declare const PrepareLabel: React.NamedExoticComponent<PrepareLabelProps>;
