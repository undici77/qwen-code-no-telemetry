import type { Content } from '@google/genai';
export declare const FORK_SUBAGENT_TYPE = "fork";
export declare const FORK_BOILERPLATE_TAG = "fork-boilerplate";
export declare const FORK_DIRECTIVE_PREFIX = "Directive: ";
export declare const FORK_AGENT: {
    name: string;
    description: string;
    tools: string[];
    systemPrompt: string;
    level: "session";
};
export declare function runInForkContext<T>(fn: () => Promise<T>): Promise<T>;
export declare function isInForkExecution(): boolean;
export declare const FORK_PLACEHOLDER_RESULT = "Fork started \u2014 processing in background";
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
export declare function buildFunctionResponseParts(assistantMessage: Content, placeholderOutput: string): Array<{
    functionResponse: {
        id: string | undefined;
        name: string | undefined;
        response: {
            output: string;
        };
    };
}>;
/**
 * Build extra history messages for a forked subagent.
 *
 * When the last model message has function calls, we must include matching
 * function responses in a user message (Gemini API requirement). The
 * directive is embedded in this same user message to avoid consecutive
 * user messages.
 *
 * When there are no function calls, we return [] — the parent history
 * already ends with a model text message and the directive will be sent
 * as the task_prompt by agent-headless (model → user alternation is OK).
 *
 * @param directive - The fork directive text (user's prompt)
 * @param assistantMessage - The last model message from the parent history
 * @returns Extra messages to append to history (may be empty)
 */
export declare function buildForkedMessages(directive: string, assistantMessage: Content): Content[];
/**
 * Notice injected into a subagent that has been spun up inside an isolated
 * git worktree (via `AgentTool` `isolation: 'worktree'`). Tells the agent
 * to confine all file operations to the worktree path and to re-read any
 * file inherited from the parent's context before editing it.
 *
 * Mirrors claude-code's `buildWorktreeNotice` in
 * `tools/AgentTool/forkSubagent.ts`.
 */
export declare function buildWorktreeNotice(parentCwd: string, worktreeCwd: string): string;
export declare function buildChildMessage(directive: string): string;
