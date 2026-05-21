/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface UninstallArgs {
    name: string;
}
export declare function handleUninstall(args: UninstallArgs): Promise<void>;
export declare const uninstallCommand: CommandModule;
export {};
