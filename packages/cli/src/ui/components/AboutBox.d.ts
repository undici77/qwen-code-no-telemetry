/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { ExtendedSystemInfo } from '../../utils/systemInfo.js';
type AboutBoxProps = ExtendedSystemInfo & {
    width?: number;
};
export declare const AboutBox: React.FC<AboutBoxProps>;
export {};
