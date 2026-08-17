/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** One subagent, as the harness recorded it. */
export interface AgentRecord {
  agentId: string;
  agentName: string;
  /** The prompt the agent was launched with — the transcript's first record. */
  launchPrompt: string;
  /** Tool calls that came back without an error. */
  successfulToolCalls: number;
  /**
   * Successful tool calls whose arguments named the diff file.
   *
   * The difference between this and `successfulToolCalls` is the difference
   * between an agent that did *something* and one that opened *the diff*. The old
   * check could not tell them apart: it credited a chunk to any agent that made
   * one successful call, and a `glob` for test files is a successful call. What a
   * review has to be able to say is that someone opened the lines it is about to
   * certify.
   */
  diffToolCalls: number;
  /**
   * Diff line ranges this agent demonstrably read, 1-based and inclusive.
   *
   * Taken from the `offset`/`limit` of its successful `read_file` calls on the
   * diff. This is what it *did*, next to what it was *told* to do — an agent
   * handed the bare diff path with no territory (a reverse-audit pass, a
   * verifier) can still show which lines it opened.
   */
  diffReads: Array<[number, number]>;
  /**
   * The arguments of every successful tool call, serialized.
   *
   * So a check can ask "did this agent open *that* file" of any path, not only the
   * diff. The one that matters is the agent's own brief: the launch prompt now
   * points at it rather than containing it, and whether the agent read it is a fact
   * the harness wrote down, not a hope.
   */
  successfulCallArgs: string[];
  /**
   * The arguments of the successful `read_file` calls, serialized — a subset of
   * `successfulCallArgs` for the checks where NAMING a path is not OPENING it.
   * A `search_file_content` or a `list_directory` over the record dir carries
   * the same stringified path in its args without reading a line; the
   * findings-file floor asks whether the list was read, and only a read is a
   * read.
   */
  successfulReadFileArgs: string[];
  /** The agent's own final text, as the harness saw it. */
  finalText: string;
  /** When the transcript was last written. */
  mtimeMs: number;
}
/** Why no transcripts could be read. Never conflated with "the agents idled". */
export declare class TranscriptsUnavailableError extends Error {}
/**
 * The environment this module reads, validated once and returned together.
 *
 * Both halves come from the environment the CLI exported, never from an argument:
 * a path the model can choose is a path the model can point somewhere flattering.
 * `QWEN_CODE_PROJECT_DIR` exists because the project dir is keyed on the session's
 * *launch* cwd, and this subcommand may well be running inside a PR worktree the
 * skill `cd`-ed into — recomputing it from `process.cwd()` yields a directory that
 * never existed. Callers that need both halves (the chat file lives beside the
 * subagent dir) take them here rather than re-reading the env after `transcriptDir`
 * validated it.
 */
export declare function transcriptPaths(env?: NodeJS.ProcessEnv): {
  projectDir: string;
  sessionId: string;
  dir: string;
};
/** Where this session's subagent transcripts live. */
export declare function transcriptDir(env?: NodeJS.ProcessEnv): string;
/** Text out of a record's message parts. */
export declare function textOf(rec: Record<string, unknown>): string;
/**
 * The session's subagent transcript files, one listing every reader shares.
 *
 * The coverage gate and the cost ledger both claim to read "the same records",
 * and the harness writes sibling file kinds per agent (`.meta.json`,
 * `.jsonl.stream`) with a generalized `<kind>-<id>.jsonl` namespace planned —
 * so the definition of "which files are transcripts" lives here, once, not in
 * each reader's own filter. Throws on any readdir failure; what the caller
 * does with that (name the fault, or treat an absent dir as "no agents") is
 * its decision.
 */
export declare function listAgentTranscriptFiles(dir: string): string[];
/**
 * Every subagent this session launched, as the harness recorded it.
 *
 * `since` drops transcripts older than the plan they are supposed to be evidence
 * for. The transcript dir is scoped to the *session*, not the review, and nothing
 * prunes it — so a second `/review` in one session would otherwise be satisfied
 * by the first one's agents, and the diff path is stable across runs, so the
 * collision is silent. Pass the plan's mtime.
 */
export declare function readTranscripts(
  since?: number,
  env?: NodeJS.ProcessEnv,
  diffPath?: string,
): AgentRecord[];
/**
 * Was this agent given any way to reach the diff?
 *
 * The launch prompt is the harness's record of what the orchestrator actually
 * asked for. A chunk agent whose prompt never names the diff file could not have
 * read it, however confident its answer sounds — and 23 of 23 real ones were
 * launched exactly that way, then said the sentence their prompt had handed them.
 *
 * This is checked against the *prompt*, not the agent's behaviour, because it
 * names the actor that actually failed. "Relaunch the agent" cannot fix a prompt
 * with no diff in it; the second launch is as blind as the first.
 */
export declare function wasGivenTheDiff(
  rec: AgentRecord,
  diffPath: string,
): boolean;
