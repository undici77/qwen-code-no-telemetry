/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
interface RenderInlineProps {
    text: string;
    textColor?: string;
    enableInlineMath?: boolean;
}
export declare const RenderInline: React.NamedExoticComponent<RenderInlineProps>;
/**
 * Utility function to get the plain text length of a string with markdown formatting
 * This is useful for calculating column widths in tables
 */
export declare const getPlainTextLength: (text: string, enableInlineMath?: boolean) => number;
export {};
