import type { Content } from '@google/genai';
import type { Config } from '../../config/config.js';
export declare const FORK_SUBAGENT_TYPE = 'fork';
/**
 * Forking is an explicit choice — the caller selects it with
 * `subagent_type: "fork"`. Omitting `subagent_type` always resolves to the
 * general-purpose subagent, never a fork. Regular top-level subagents run in
 * the background by default; callers can set `run_in_background: false` for an
 * inline result. Forks are available in both interactive and headless
 * sessions; headless forks use the background registry so the caller waits for
 * completion and non-interactive permission policy is applied.
 */
export declare const FORK_BOILERPLATE_TAG = 'fork-boilerplate';
export declare const FORK_DIRECTIVE_PREFIX = 'Directive: ';
export declare const FORK_AGENT: {
  name: string;
  description: string;
  tools: string[];
  systemPrompt: string;
  approvalMode: string;
  level: 'session';
};
export declare const FORK_DEFAULT_MAX_TURNS = 200;
export declare function runInForkContext<T>(fn: () => Promise<T>): Promise<T>;
export declare function isInForkExecution(): boolean;
/**
 * Keeps the fork's model-visible declarations cache-identical while removing
 * the main-session-only image renderer from its execution capability.
 */
export declare function resolveForkExecutionAllowedTools(
  advertisedToolNames: readonly string[],
  requestedToolNames: readonly string[] | undefined,
): string[] | undefined;
/**
 * Restores the parent's display schema in a fork registry for prompt-cache
 * parity. Callers must pair this with resolveForkExecutionAllowedTools().
 */
export declare function registerForkDisplayImageForCache(
  config: Config,
  advertisedToolNames: readonly string[],
): void;
export declare const FORK_PLACEHOLDER_RESULT =
  'Fork started \u2014 processing in background';
export declare function buildForkExecutionAllowlist(
  requestedTools: readonly string[] | undefined,
  declaredTools: readonly string[],
): string[];
export type ForkTurns = 'all' | `${number}`;
export type NormalizedForkTurns = 'all' | number;
export declare function isValidForkToolWildcard(toolName: string): boolean;
export declare function validateForkToolList(
  tools: unknown,
): string | undefined;
export declare function normalizeForkTurns(
  forkTurns: ForkTurns | undefined,
): NormalizedForkTurns;
/**
 * Build functionResponse parts for every open function call in a model message.
 *
 * Shared by the fork subagent (agent.ts) and background agent history
 * construction (e.g. extractionAgentPlanner.ts) to close open tool calls
 * before injecting history into a new agent session.
 *
 * @param assistantMessage - The model message that may contain functionCall parts.
 * @param placeholderOutput - The placeholder string to use as each response's output.
 */
export declare function buildFunctionResponseParts(
  assistantMessage: Content,
  placeholderOutput: string,
): Array<{
  functionResponse: {
    id: string | undefined;
    name: string | undefined;
    response: {
      output: string;
    };
  };
}>;
/**
 * Select parent conversation history for a fork.
 *
 * A turn is a real user prompt, not a function response or a pure structural
 * reminder. A bounded selection omits synthetic prefixes; the caller can
 * reattach startup context that the fork still needs.
 */
export declare function selectForkHistory(
  history: Content[],
  forkTurns: NormalizedForkTurns,
): Content[];
/**
 * Build extra history messages for a forked subagent.
 *
 * When the last model message has function calls, we must include matching
 * function responses in a user message (Gemini API requirement). The
 * directive is embedded in this same user message to avoid consecutive
 * user messages. Each replayed functionCall's `args` are redacted so a fork
 * launched alongside siblings does not inherit the siblings' directives.
 *
 * When there are no function calls, we return [] — the parent history
 * already ends with a model text message and the directive will be sent
 * as the task_prompt by agent-headless (model → user alternation is OK).
 *
 * @param directive - The fork directive text (user's prompt)
 * @param assistantMessage - The last model message from the parent history
 * @returns Extra messages to append to history (may be empty)
 */
export declare function buildForkedMessages(
  directive: string,
  assistantMessage: Content,
  executionAllowedTools?: readonly string[],
  promptHint?: string,
): Content[];
/**
 * Notice injected into a subagent that has been spun up inside an isolated
 * git worktree (via `AgentTool` `isolation: 'worktree'`). Tells the agent
 * to confine all file operations to the worktree path and to re-read any
 * file inherited from the parent's context before editing it.
 *
 * Mirrors claude-code's `buildWorktreeNotice` in
 * `tools/AgentTool/forkSubagent.ts`.
 */
export declare function buildWorktreeNotice(
  parentCwd: string,
  worktreeCwd: string,
): string;
/**
 * Notice for a sub-agent pinned to a caller-owned worktree via `working_dir`.
 *
 * Deliberately narrower than {@link buildWorktreeNotice}: that one describes a
 * freshly provisioned copy of the parent's tree, so it asks the agent to
 * translate inherited paths and to re-read files the parent may have touched.
 * A pinned worktree is instead the code the agent was asked to work on, and its
 * cwd already IS that directory — telling it to prefix absolute paths or to
 * translate the parent's paths would contradict the caller's own instructions.
 */
export declare function buildPinnedWorktreeNotice(worktreeCwd: string): string;
export declare function buildChildMessage(
  directive: string,
  executionAllowedTools?: readonly string[],
  promptHint?: string,
): string;
