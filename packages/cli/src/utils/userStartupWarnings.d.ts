/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
type WarningCheckOptions = {
    workspaceRoot: string;
    useRipgrep: boolean;
    useBuiltinRipgrep: boolean;
};
export declare function getUserStartupWarnings(options: WarningCheckOptions): Promise<string[]>;
export {};
