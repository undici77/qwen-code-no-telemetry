/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
interface StreamCost {
  /** `main` for the orchestrator session, else the agent file's id. */
  id: string;
  /** Human label: the role parsed from the launch prompt when one is found. */
  label: string;
  calls: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  thoughtsTokens: number;
  firstAt: string | null;
  lastAt: string | null;
}
interface Ledger {
  totals: Omit<StreamCost, 'id' | 'label'> & {
    wallSeconds: number;
  };
  main: StreamCost | null;
  agents: StreamCost[];
}
export declare function computeLedger(
  planPath: string,
  env?: NodeJS.ProcessEnv,
): Ledger;
/** The printed block: one summary line, the main loop, the top consumers. */
export declare function renderLedger(ledger: Ledger): string;
export declare const costLedgerCommand: CommandModule;
export {};
