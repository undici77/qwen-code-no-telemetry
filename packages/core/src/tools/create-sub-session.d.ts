/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * `create_sub_session` tool — spawns a FRESH top-level sub-session (a sibling
 * of the current session, its own transcript) and runs a prompt in it.
 *
 * Daemon-only: it works only when running under `qwen serve`, where the ACP
 * session wires a {@link SubSessionSpawner} that routes the request to the
 * daemon bridge (`spawnOrAttach` + `sendPrompt`). In interactive TUI / headless
 * there is no bridge, so no spawner is wired and the tool reports itself
 * unavailable.
 *
 * Two completion modes:
 *  - `'sent'`      — resolve as soon as the prompt is dispatched (fire-and-
 *                    forget); the sub-session keeps running independently.
 *  - `'first-turn'`— wait for the sub-session's first turn to finish and return
 *                    its result to the caller (default).
 */
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import type { Config } from '../config/config.js';
export interface CreateSubSessionParams {
  prompt: string;
  completion?: 'sent' | 'first-turn';
  model?: string;
  name?: string;
}
/** Ceiling on the delegated prompt. Mirrors the scheduled-task REST route's
 * `MAX_PROMPT_LENGTH`: both hand a model-authored prompt to a fresh session, so
 * they cap it the same way. Rejected here (a clear tool error the model can act
 * on) as well as at the bridge boundary, which cannot trust this side. */
export declare const MAX_SUB_SESSION_PROMPT_CHARS = 100000;
export declare class CreateSubSessionTool extends BaseDeclarativeTool<
  CreateSubSessionParams,
  ToolResult
> {
  private config;
  static readonly Name: 'create_sub_session';
  constructor(config: Config);
  protected createInvocation(
    params: CreateSubSessionParams,
  ): ToolInvocation<CreateSubSessionParams, ToolResult>;
  protected validateToolParamValues(
    params: CreateSubSessionParams,
  ): string | null;
  /**
   * Surface the delegated prompt + mode to the AUTO classifier. The sub-session
   * executes this prompt with tool access, so it must face the same scrutiny as
   * a direct command — without this the classifier sees `create_sub_session({})`
   * and is blind to what the sub-session will be asked to do.
   */
  toAutoClassifierInput(
    params: CreateSubSessionParams,
  ): Record<string, unknown>;
}
