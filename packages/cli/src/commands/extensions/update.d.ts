/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface UpdateArgs {
    name?: string;
    all?: boolean;
}
export declare function handleUpdate(args: UpdateArgs): Promise<void>;
export declare const updateCommand: CommandModule;
export {};
