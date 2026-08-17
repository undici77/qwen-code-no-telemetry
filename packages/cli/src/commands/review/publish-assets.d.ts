/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface PublishAssetsArgs {
  pr: number;
  reviewedRepo: string | undefined;
  files: string[] | undefined;
  findings: string | undefined;
  findingsOut: string | undefined;
  out: string;
  host: string | undefined;
  userAuthorized: boolean;
  skillArgs: string | undefined;
}
export declare function runPublishAssets(args: PublishAssetsArgs): void;
export declare const publishAssetsCommand: CommandModule;
export {};
