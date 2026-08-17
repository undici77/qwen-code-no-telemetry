/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface SubmitArgs {
  pr: number;
  repo: string;
  review: string;
  /** The CLI-written record of what the user typed. Overridable for tests. */
  skillArgs?: string;
  userAuthorized: boolean;
  host?: string;
  dryRun: boolean;
}
export declare function runSubmit(args: SubmitArgs, cliVersion?: string): void;
export declare const submitCommand: CommandModule;
export {};
