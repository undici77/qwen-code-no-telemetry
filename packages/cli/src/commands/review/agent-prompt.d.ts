/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
import { type RoleId } from './lib/agent-briefs.js';
/** The plan report, as far as this command needs it. */
interface PlanReport {
    diffPathAbsolute?: unknown;
    chunks?: unknown;
    files?: unknown;
    prNumber?: unknown;
    ownerRepo?: unknown;
    worktreePath?: unknown;
    mergeBaseSha?: unknown;
    repositoryContext?: unknown;
    budget?: {
        agentToolBudget?: unknown;
    };
}
/**
 * The launch prompt for the agent that owns `chunk`.
 *
 * Exported for the tests, which assert the properties that were missing from
 * every real launch: the diff path is in it, the read call is in it, and the
 * agent is not handed a sentence to recite when it finds nothing.
 */
export declare function buildChunkAgentPrompt(report: PlanReport, id: number, rules?: string): string;
/**
 * The launch prompt for a territory agent: short, and it points at the brief.
 *
 * The same arithmetic that moved the dimension agents' briefs onto disk applies
 * here, and harder. A chunk agent's brief runs to about five kilobytes with the
 * project rules in it — and a Step 3B review of a real pull request (#6606: 5 511
 * diff lines) has **seventeen** of them. Eighty-seven kilobytes, in one response,
 * pasted without an edit. Measured at a twelfth of that load the orchestrator
 * already cut nineteen hundred characters out of a single prompt, and then talked
 * its way past the check that caught it.
 *
 * So the brief goes on disk beside the diff, and the launch prompt carries the two
 * things that cannot live anywhere else: the chunk's identity, and the exact read
 * that defines its territory. Coverage is computed from those — from the prompt the
 * harness recorded, not from anything the agent says afterwards — so they stay.
 */
export declare function buildChunkLaunchPrompt(report: PlanReport, id: number, briefFile: string): string;
/**
 * The block every review agent that is NOT a territory agent must be launched
 * with — the Step-3A dimension agents, and 3B's whole-diff agents (removed
 * behaviour, cross-file tracing, the test-coverage matrix, the invariant agents).
 *
 * They were the half of the fan-out this command did not cover, and they were
 * launched exactly the way the chunk agents used to be. Measured against the
 * harness's record of one real 3B run: all three whole-diff agents — cross-file
 * tracer, test-coverage matrix, build-and-test — got a prompt that named **no diff
 * file at all**. The test-coverage matrix was told, in prose, to "Read the diff
 * chunks and the test files", and given no path to read them from. It went and
 * read the post-change source instead, which on a diff with deletions shows it
 * precisely nothing: a removed `clearTimeout` is not in the file any more.
 *
 * These agents own the classes a chunk agent is structurally blind to. The review's
 * only cross-file trace, its only cross-chunk removed-behaviour audit, and its only
 * test-coverage matrix were all done by agents that never opened the diff — and the
 * coverage gate could not see it, because it only ever asked the question of agents
 * whose prompt said `chunk N of M`.
 */
export declare function buildWholeDiffBlock(report: PlanReport, rules?: string): string;
/**
 * The launch prompt for any role that is not a territory agent.
 *
 * Every agent in the fan-out is now built here. The ones that were not used to be
 * described to the orchestrator in prose and composed by it, and the prose lost:
 * three whole-diff agents of one real run were launched with no diff path at all,
 * and Agent 0 was not launched at all — which nothing could see, because an
 * omission leaves no transcript to inspect.
 */
export declare function buildRoleBrief(report: PlanReport, role: RoleId, opts?: {
    rules?: string;
    file?: string;
    planPath?: string;
    chunk?: number;
}): string;
/**
 * The launch prompt for a role: short, and it points at the brief.
 *
 * **The brief is not in here, and that is the whole design.** Asked to paste a
 * 4 652-character prompt to each of twelve agents, a real run delivered 2 893
 * characters — it kept the head, added a preamble of its own, and cut 1 900
 * characters out of the middle. Then it read the check's exit-3, reasoned that "the
 * agents clearly did their job", skipped `compose-review`, and filed an Approve it
 * had written itself. Telling it once more to paste verbatim is the same prose that
 * has now failed at every layer of this skill.
 *
 * So the instructions go where the diff already goes: on disk, read by the agent
 * that needs them. What the orchestrator must carry drops to a few hundred
 * characters — something it will actually carry — and *whether the agent read its
 * brief* stops being a hope and becomes a line in the harness's transcript.
 */
export declare function buildRoleLaunchPrompt(report: PlanReport, role: RoleId, briefFile: string, opts?: {
    file?: string;
    chunk?: number;
    round?: number;
}): string;
/**
 * The findings section folded above a verify / reverse-audit launch prompt, so
 * the caller pastes one thing instead of hand-assembling it.
 *
 * The list itself rides a file the block points at (`findingsFile`), named by
 * the same findings digest that keys the record — the block stays a few hundred
 * characters however long the list grows. The list used to be inlined here, and
 * the inlining was the point: the record is the exact printed block, keyed per
 * findings digest, so a launch that drops or rewrites this section matches no
 * record. Inlined in EVERY block of a 12-14-auditor round, though, the list made
 * the launch one 65-82 KB assistant message, and the stream generating it never
 * completed (issue #8597). The pointer keeps the guarantee — a launch that drops
 * it matches no record, and the delivery floor counts the read it instructs
 * exactly as it counts the brief's — at a size the orchestrator will actually
 * carry. Each branch also restates, above the pointer, that the brief is
 * authoritative ("this list does not replace the brief; read it first") — the
 * exact sentence the orchestrator truncated when it used to build this by hand.
 *
 * When the findings write failed (`findingsFile` null, non-empty list), the
 * section falls back to inlining the list — pointing at a file that was never
 * written would run the whole round against a dead path, while the inline
 * list keeps the recorded prompt self-contained exactly as it was pre-#8597.
 *
 * Each `acceptsFindings` role has its own framing, and the branches are explicit: a
 * future role that opts into `--findings` but has no framing here throws, rather than
 * silently inheriting the reverse auditor's "do not re-report" prose — which is wrong
 * for any role not hunting gaps. (Same reasoning as the no-role guard message, which
 * also derives from `acceptsFindings` so a new role cannot leave it stale.)
 */
export declare function findingsSection(role: RoleId, content: string, findingsFile: string | null): string;
export declare const agentPromptCommand: CommandModule;
export {};
