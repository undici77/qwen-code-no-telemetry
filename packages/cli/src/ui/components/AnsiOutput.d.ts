/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { AnsiOutput } from '@qwen-code/qwen-code-core';
interface AnsiOutputProps {
    data: AnsiOutput;
    availableTerminalHeight?: number;
    maxWidth: number;
}
export declare const AnsiOutputText: React.FC<AnsiOutputProps>;
export interface ShellStatsBarProps {
    totalLines?: number;
    totalBytes?: number;
    displayHeight?: number;
}
export declare const ShellStatsBar: React.FC<ShellStatsBarProps>;
export {};
