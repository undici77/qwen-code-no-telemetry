/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface SetArgs {
    names?: string[];
    'daemon-url'?: string;
    token?: string;
    timeout?: number;
}
export declare const setCommand: CommandModule<unknown, SetArgs>;
export {};
