/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandContext } from '../ui/commands/types.js';
export interface SessionPathEntry {
    label: string;
    value: string;
}
export interface SessionPathSection {
    title: string;
    entries: SessionPathEntry[];
}
export interface SessionPathInfo {
    sections: SessionPathSection[];
}
export declare function collectSessionPathInfo(context: CommandContext): Promise<SessionPathInfo>;
export declare function formatSessionPathInfo(info: SessionPathInfo): string;
