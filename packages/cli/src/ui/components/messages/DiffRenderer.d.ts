/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { Theme } from '../../themes/theme.js';
import type { LoadedSettings } from '../../../config/settings.js';
interface DiffRendererProps {
    diffContent: string;
    filename?: string;
    tabWidth?: number;
    availableTerminalHeight?: number;
    contentWidth: number;
    theme?: Theme;
    settings?: LoadedSettings;
}
export declare const DiffRenderer: React.FC<DiffRendererProps>;
export {};
