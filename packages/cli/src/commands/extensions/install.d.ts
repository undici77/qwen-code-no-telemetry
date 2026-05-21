/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface InstallArgs {
    source: string;
    ref?: string;
    autoUpdate?: boolean;
    allowPreRelease?: boolean;
    consent?: boolean;
    registry?: string;
}
export declare function handleInstall(args: InstallArgs): Promise<void>;
export declare const installCommand: CommandModule;
export {};
