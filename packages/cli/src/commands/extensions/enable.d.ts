/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CommandModule } from 'yargs';
interface EnableArgs {
    name: string;
    scope?: string;
}
export declare function handleEnable(args: EnableArgs): Promise<void>;
export declare const enableCommand: CommandModule;
export {};
