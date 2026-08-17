/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface MatchRemoteArgs {
  owner: string;
  repo: string;
  /** Absent means inherit an operator-exported GH_HOST, else github.com. */
  host?: string;
}
export declare function runMatchRemote(args: MatchRemoteArgs): void;
export declare const matchRemoteCommand: CommandModule;
export {};
