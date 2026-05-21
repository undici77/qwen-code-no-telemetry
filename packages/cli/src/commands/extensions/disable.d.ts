/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CommandModule } from 'yargs';
interface DisableArgs {
    name: string;
    scope?: string;
}
export declare function handleDisable(args: DisableArgs): Promise<void>;
export declare const disableCommand: CommandModule;
export {};
