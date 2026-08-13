/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Where the prompts this plan's agents were built from are recorded.
 *
 * Derived from the plan path, by both the writer and the reader, so that neither
 * takes it as an argument. A path the model can choose is a path the model can
 * point somewhere flattering.
 */
export declare function promptRecordDir(planPath: string): string;
/** Where this agent's brief lives — the file it is told to read first. */
export declare function briefPath(planPath: string, key: string): string;
/** Where a round's findings list lives — the file the launch block points at. */
export declare function findingsFilePath(planPath: string, key: string): string;
/**
 * The findings file a recorded launch prompt points at, if any — the pointer
 * `findingsSection` bakes into the block. Anchored to the exact shape that
 * builder emits: the pointer sits alone on its own line inside its fence.
 * The anchor matters because of the write-failure fallback: when the findings
 * file could not be written, `findingsSection` inlines the LIST in that same
 * position, and a finding entry there can itself quote a
 * `read_file(file_path="….findings.md")` line. A loose first-match would then
 * extract the QUOTATION as the pointer — and the readers diverge: coverage
 * demands a read of a path no agent was told to read (spurious
 * `findings-unread` on an already-degraded run), and retirement, worse,
 * confines-and-reads an earlier round's file, flipping `yielded` to dry and
 * retiring a chunk that just reported — the one direction this module's
 * header says it never fails. A quoted pointer inside a findings entry is
 * indented or embedded in prose, so requiring it standalone removes it. A
 * brief path (`.brief.md`) can never match the `.findings.md` suffix.
 * Shared by every reader of the pointer: the delivery floor (coverage) and
 * the retirement echo-guard both extract it from the recorded prompt rather
 * than deriving a path from the record key — a per-chunk record key and its
 * round's findings file are keyed differently, so the prompt is the only
 * source that is always right.
 */
export declare function findingsPointerOf(prompt: string): string | null;
/**
 * Write the findings list a verify/reverse-audit launch block points at.
 *
 * The list used to be folded verbatim into every printed block — the point was
 * a record a partial delivery cannot satisfy, and inlining made the findings
 * part of the recorded prompt. On a 12-14-chunk round that made the orchestrator
 * re-emit 65-82 KB in ONE assistant message, and the stream generating that
 * message never completed (issue #8597). So the list goes where the brief already
 * goes: on disk, named by the same digest that keys the record, read by the
 * agent. The block carries the pointer; dropping it mismatches the recorded
 * prompt exactly as dropping the list did, and the delivery floor counts the
 * read it instructs exactly as it counts the brief's — an agent that opens
 * its brief but skips this file does not clear it.
 *
 * Returns null when the write fails (a read-only tmp dir): the caller then
 * inlines the list into the block — the pre-#8597 shape — instead of
 * pointing a whole round at a file that does not exist.
 */
export declare function writeFindingsFile(planPath: string, key: string, content: string): string | null;
/**
 * Write the brief this agent is told to read.
 *
 * The brief is not in the launch prompt, and that is deliberate. Measured on a real
 * run: asked to paste a 4 652-character prompt to each of twelve agents, the
 * orchestrator delivered 2 893 characters — it kept the head, added a preamble of
 * its own, and **cut 1 900 characters out of the middle**. It will not carry
 * fifty-five kilobytes of instructions across twelve tool calls, and telling it
 * again to do so is the same prose that has failed every time.
 *
 * So the brief goes where the diff already goes: on disk, read by the agent that
 * needs it. What the orchestrator has to carry shrinks to something it will
 * actually carry — and whether the agent read it is then a fact in the harness's
 * transcript, not a hope.
 */
export declare function writeBrief(planPath: string, key: string, brief: string): string;
/** Record the prompt `key` was built with. Best-effort: never fails a build. */
export declare function recordPrompt(planPath: string, key: string, prompt: string): void;
/**
 * Every prompt this plan's builder emitted, keyed as it was recorded.
 *
 * `sinceMs` is the same fence every other reader of this directory applies —
 * the plan's mtime. Nothing clears the record dir, and a run that dies
 * mid-review leaves its records beside the retry's (the CI retry re-runs the
 * review at the SAME plan path, under a freshly-captured plan): a record file
 * older than the plan belongs to that dead attempt. A caller that reads
 * records as OBLIGATIONS (coverage: "an agent was owed for this key") passes
 * nothing — an obligation is not less owed for being stale, and dropping one
 * would excuse the agent it demands. A caller that reads them as HISTORY
 * (retirement) must pass the fence, or the dead attempt's records shadow the
 * live ones.
 */
export declare function readRecordedPrompts(planPath: string, sinceMs?: number): Map<string, string>;
/**
 * Was `built` delivered to the agent intact?
 *
 * **You may add. You may not remove, alter, or reorder.** Every line the builder
 * emitted has to turn up in the delivered prompt, in the order it was emitted.
 * Anything the caller puts *between* them is its own business.
 *
 * The first version of this was a straight substring test, and it was wrong in a
 * way that would have been worse than no check at all. Dogfooded on a Step 3B
 * review, it failed all nine agents — and both differences were legitimate:
 *
 *   - the caller had inserted **the one-sentence summary of the change that the
 *     skill explicitly tells it to add**, which breaks contiguity by construction;
 *   - and it had reflowed a hard-wrapped sentence onto one line, which changes not
 *     one character of meaning.
 *
 * A gate that fires on a correct run is a gate that gets talked around — this
 * skill has the dogfood transcript of a model doing exactly that, reasoning its way
 * past a refusal it had decided was noise. Precision here is not politeness; it is
 * the difference between a check that works and a check that trains the reader to
 * ignore it.
 *
 * So: normalize whitespace away entirely (a wrap is not an edit), then walk the
 * built lines and require each to appear at or after the last one's position.
 */
export declare function wasDeliveredVerbatim(launchPrompt: string, built: string): boolean;
/**
 * `wasDeliveredVerbatim` with the launch prompt already put through
 * `flattenPrompt`. The family exists for the one caller that pairs MANY
 * records against MANY transcripts (the retirement scheduler): flattening is
 * the expensive half of the check, and a caller that flattens each launch
 * once pays it per transcript instead of per (record, transcript) pair — a
 * few thousand full-prompt passes on the run the scheduler was built for,
 * all before the round is admitted. Same contract, same failure modes.
 */
export declare function deliveredVerbatim(flattenedLaunch: string, built: string): boolean;
/**
 * `deliveredVerbatim` with BOTH halves pre-flattened: the launch through
 * `flattenPrompt`, the built prompt through `promptLines`. The scheduler
 * hoists each record's `promptLines` alongside each transcript's flatten, so
 * the pairing walk re-splits neither side — on the 6-chunk x 4-prior-round
 * shape the old per-pair record flatten re-split every record's whole folded
 * prompt (cumulative findings list included) once per candidate.
 */
export declare function deliveredVerbatimLines(flattenedLaunch: string, builtLines: string[]): boolean;
/**
 * Whitespace collapsed to single spaces: a re-wrap is not an edit. What
 * `deliveredVerbatim` expects its launch side to have been put through.
 */
export declare function flattenPrompt(s: string): string;
/** The built prompt's lines, whitespace-normalized, blanks dropped. */
export declare function promptLines(built: string): string[];
