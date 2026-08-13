/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { TranscriptsUnavailableError } from './transcripts.js';
export interface CoverageFromTranscripts {
    /** True only when every chunk was reviewed by an agent that could and did. */
    ok: boolean;
    /** How many subagent transcripts the harness wrote for this run. */
    agents: number;
    /**
     * Chunk agents launched with a prompt that never named the diff.
     *
     * They cannot have read it. This is not a whiff and must not be reported as
     * one: relaunching an agent whose prompt has no diff in it produces a second
     * agent that also cannot read the diff. The prompt is the defect.
     */
    blindAgents: string[];
    /** Agents that made no successful tool call: they read nothing. */
    idleAgents: string[];
    /**
     * Agents pointed at diff lines that never opened the diff.
     *
     * They worked — they just worked on something else. An agent handed chunk 3 and
     * a diff path, which then spends its run grepping the source tree, has reviewed
     * the post-change file and not the change. The old check credited it: any one
     * successful call was enough.
     */
    unopenedAgents: string[];
    /**
     * Chunks whose agent got something other than the prompt the CLI built for it.
     *
     * "Pass what it prints to the agent verbatim" is prose, and prose is what this
     * skill keeps discovering it cannot rely on. Dogfooded, the orchestrator invoked
     * `agent-prompt` for all five chunks and then **paraphrased** what came back:
     * the delivered prompt had dropped the instruction not to recite a stock
     * sentence, dropped the half-read warning, and replaced the project's review
     * rules with a three-sentence summary of its own.
     */
    rewrittenPrompts: string[];
    /**
     * Launches whose prompt drifted from the built block while the payload
     * provably arrived anyway: the transcript shows the agent opened the brief
     * the block points at and did the work (a chunk agent also opened the
     * diff). The brief is where the method, the severity bar and the project
     * rules live — the launch prompt is a pointer to it — so a drifted pointer
     * with a proven brief-read is a NOTE, never a failure and never a
     * relaunch. Measured: a model asked to copy twelve blocks normalized one
     * word in every block's tail ("you" → "it"), every role failed the
     * verbatim match, and the run relaunched all twelve agents — the most
     * expensive repair in the pipeline, spent redelivering text the agents had
     * already acted on.
     */
    driftedLaunches: string[];
    /**
     * Agents the plan requires that this review did not launch.
     *
     * Every other field here asks a question of an agent that ran. An agent that did
     * not run leaves no transcript to ask, so its absence is invisible — which is how
     * a real PR review shipped having never launched Agent 0 at all, on a review whose
     * job includes asking whether the PR fixes the thing it claims to. The roster is
     * derived from the plan; nothing in it is supplied by the caller.
     */
    missingRoles: string[];
    /**
     * The exact `agent-prompt` selector that rebuilds each missing brief, in the
     * same order as its `missingRoles` entries would list them per-role. For
     * stderr, never for the body: a human-facing label does not name its role id.
     */
    missingRoleSelectors: string[];
    /**
     * Required agents that never opened the brief they were pointed at.
     *
     * The launch prompt names the brief rather than containing it — a 4 652-character
     * prompt is not something an orchestrator pastes twelve times, and the run that
     * was asked to delivered 2 893 characters of it. So the instructions arrive only
     * if the agent reads the file. Whether it did is a tool call, and the harness
     * wrote it down.
     */
    unreadBriefs: string[];
    /** Chunk ids no working agent covered. */
    missingChunks: number[];
    /** Chunk ids an agent declared unreachable. */
    uncoverableChunks: number[];
    /**
     * `Budget gap: <the check>` lines parsed from agent returns — the fixed
     * disclosure format the tool-budget brief mandates when an agent's soft
     * ceiling stopped a check it wanted. Detection is deterministic (this
     * parse); the RULING stays with the orchestrator, exactly as it does for
     * whiffs: a gap naming an incomplete required trace joins
     * `unreviewedDimensions` and caps Approve, a gap naming optional depth is
     * disclosed in the report. An empty list on a budgeted run means no agent
     * hit its ceiling mid-check.
     */
    budgetGaps: Array<{
        agent: string;
        gaps: string[];
    }>;
    /** Chunk ids a working agent actually reviewed. */
    coveredChunks: number[];
    /**
     * The pre-formed disclosure entries (`rewrittenPrompts`, `missingRoles`,
     * `unreadBriefs`), as `{subject, reason}` pairs in push order — for
     * `compose-review`, which dedupes caller echoes by subject and groups
     * same-reason subjects into one sentence. The prose twins above remain for
     * the stderr formatting; REPARSING them was the bug: a reason is free-form
     * text (labels carry ` — ` for an invariant's file, error interpolations
     * can carry anything), so a subject/reason boundary recovered from rendered
     * prose garbles exactly the entries it matters for.
     */
    disclosures: Array<{
        subject: string;
        reason: string;
        /**
         * The subject, said in the POSTED body's register (`Brief.publicLabel`) —
         * absent when the internal subject already is that register (`chunk N`
         * is translated downstream by `describeChunkGap`; `every dimension`,
         * `coverage` and the Step 4/5 subjects are plain English). The internal
         * `subject` stays the dedup and certification key, and the stderr twin
         * keeps it: the codename is the selector an operator acts on.
         */
        publicSubject?: string;
        /**
         * The reason for the POSTED body, when the internal one carries something
         * only an operator can use — today, the unread brief's filesystem path.
         */
        publicReason?: string;
        /**
         * The printed subject and reason, for the Chinese half of a bilingual
         * body (the plan's `prDescriptionHasHan`). `subjectZh` is absent for
         * chunk subjects — the chunk collapse translates those — and for
         * subjects with no Chinese variant the renderer falls back to the
         * English text rather than dropping the disclosure.
         */
        subjectZh?: string;
        reasonZh?: string;
    }>;
    /**
     * Every planned chunk with the source files it covers, in plan order — the
     * body renderer's translation table. A chunk id is the run's own
     * bookkeeping: it selects a rebuild command on stderr, and nothing on the PR
     * page maps it to code, so the POSTED body names files (the author's units)
     * or counts against this list's length instead. The ids themselves stay in
     * the structural entries — the caps, the dedup and the remediation
     * selectors all still key on them. `files` is empty for a plan written
     * before chunks carried them.
     */
    plannedChunks: Array<{
        id: number;
        files: string[];
    }>;
}
/** `chunk 13 of 25` — written into the prompt by `agent-prompt`, in code. */
export declare const CHUNK_RE: RegExp;
/**
 * What the agents of this run actually did, as the harness recorded it.
 *
 * Nothing here is supplied by the caller except the plan path. The transcripts
 * are found from the environment the CLI exported; their contents are the
 * harness's, written at launch and flushed per event.
 *
 * Transcripts older than the plan are ignored. The transcript directory is scoped
 * to the session, not the review, and nothing prunes it — so a second `/review`
 * in one session would otherwise be satisfied by the first one's agents. The diff
 * path is stable across runs, which makes that collision silent.
 */
export declare function coverageFromTranscripts(planPath: string, env?: NodeJS.ProcessEnv): CoverageFromTranscripts;
export interface VerificationReport {
    /** True when every required Step 4/5 agent ran and read its brief. */
    ok: boolean;
    /**
     * The Step 4/5 gaps, structural — subject and reason apart, in both body
     * languages, so `compose-review` never recovers a boundary from rendered
     * prose (reparsing was the bug the disclosure entries already fixed).
     * These reach the POSTED review body: author-facing register, no internal
     * commands.
     */
    gaps: Array<{
        subject: string;
        reason: string;
        subjectZh: string;
        reasonZh: string;
    }>;
    /**
     * The per-shape fix for each gap, in the same order — for stderr, where the
     * orchestrator reads. Never rendered into the body.
     */
    remediation: string[];
    /**
     * True when this review posts findings and NO verifier's delivery came back
     * clean — the structured form of the `verification — …` gap line, for the
     * verdict computation. A Request changes is "earned by a confirmed
     * Critical", and this is the bit that says the confirmation never happened;
     * parsing the gap text for it would put the verdict at the mercy of a
     * wording change.
     */
    unverifiedFindings: boolean;
}
/**
 * Did Step 4 (verify) and Step 5 (reverse audit) actually run, and read their
 * briefs?
 *
 * `check-coverage` proves Step 3 was done — but it runs at Step 3D, *before* these
 * two, so its roster (`requiredAgents`) cannot reach them. And their count is not
 * in the plan: verify shards on the finding count (`ceil(N/8)`), reverse audit
 * loops until it goes dry. So this is not an exact roster — it is a floor, and it
 * is asked only by `compose-review`, which runs at high AND medium effort. High
 * requires both steps; medium runs verify but skips the reverse audit by design
 * (see `balancedMedium` below), so at medium the reverse-audit floor becomes a
 * Comment cap, not a repairable gap. Low emits no verdict, calls no
 * `compose-review`, and never reaches here.
 *
 * The floor is deliberately one agent per step, for the failure it exists to catch:
 * the step skipped **wholesale**, or run with agents that never opened their brief —
 * the same silent omission the rest of this file is a response to. Per-chunk
 * completeness of a Step 3B reverse audit is the orchestrator's Step 5 loop
 * contract, disclosed through `unreviewedDimensions` when a scope is left
 * outstanding; this does not re-litigate it.
 *
 * Like everything here, nothing is supplied by the caller but the plan path. The
 * proof is the intersection of two artifacts with different authors: the prompt the
 * CLI recorded building (`reverse-audit` / `reverse-audit--chunk-N` / `verify`) and
 * the harness's transcript of an agent launched with it that opened its brief.
 */
export declare function verificationGaps(planPath: string, opts: {
    postsFindings: boolean;
}, env?: NodeJS.ProcessEnv): VerificationReport;
export { TranscriptsUnavailableError };
