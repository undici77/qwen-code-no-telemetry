/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// Read what the review's agents actually did, from the harness's own records.
//
// Every gate this skill has built read a file the orchestrator wrote, and the
// orchestrator is the thing being checked. The coverage gate asked it to copy the
// agents' returns into `returns.txt`; on its sixth dogfood it fabricated them
// instead — invented file lists, invented `Covered: chunk N lines X-Y` — and the
// check reported 23/23 covered over a diff nobody had read. Evidence authored by
// the subject is not evidence.
//
// The harness writes its own record of every subagent: `<projectDir>/subagents/
// <sessionId>/agent-<id>.jsonl`, one line per event, opened at launch and flushed
// per record. The orchestrator does not author it, is never told its path, and
// cannot retcon it — the launch prompt is the file's first line, written before
// the model has said anything.
//
// Two things are read out of it, and they answer different questions:
//
//   - **Was this agent able to work at all?** Its launch prompt is in the record.
//     Measured across the real runs, 23 of 23 chunk agents were launched with a
//     prompt that named no diff file: no path, no `read_file`, no offset. They
//     could not have read the diff, and all 23 made zero tool calls. That is not
//     a whiff, it is a defective launch, and it needs its own name.
//
//   - **Did it work?** Its tool calls are in the record. A whiffing agent leaves
//     zero — and, crucially, its *prose* looks fine: of 129 real transcripts, 80
//     made no tool call at all, and every one of those returned more than 40
//     characters of plausible, specific-sounding text ("No issues found —
//     reviewed chunk 13 (packages/cli/…)"). Any check on the text of a return is
//     blind to this. Only the tool calls see it.
//
// This module never takes a path from the model. The session id and project dir
// come from the environment the CLI itself exported.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { ToolNames } from '@qwen-code/qwen-code-core';
import { join } from 'node:path';
/** Why no transcripts could be read. Never conflated with "the agents idled". */
export class TranscriptsUnavailableError extends Error {
}
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
export function transcriptPaths(env = process.env) {
    const projectDir = env['QWEN_CODE_PROJECT_DIR']?.trim();
    const sessionId = env['QWEN_CODE_SESSION_ID']?.trim();
    if (!projectDir || !sessionId) {
        throw new TranscriptsUnavailableError('the CLI did not export QWEN_CODE_PROJECT_DIR / QWEN_CODE_SESSION_ID, so ' +
            "this run cannot find the harness's record of what its agents did");
    }
    return {
        projectDir,
        sessionId,
        dir: join(projectDir, 'subagents', sessionId),
    };
}
/** Where this session's subagent transcripts live. */
export function transcriptDir(env = process.env) {
    return transcriptPaths(env).dir;
}
/** Text out of a record's message parts. */
export function textOf(rec) {
    const msg = rec['message'];
    const parts = Array.isArray(msg?.parts) ? msg.parts : [];
    return parts
        .map((p) => p.text)
        .filter((t) => typeof t === 'string')
        .join('');
}
/**
 * Did this tool result come back as an error?
 *
 * The whiff bar is a *successful* call, not any call. The agent runtime writes a
 * `functionCall` record before the permission check and before the tool runs, and
 * it writes one for a hallucinated tool name too. So a single invented or denied
 * call would otherwise clear a bar set at "made a tool call" while having read
 * precisely nothing.
 *
 * Read the response object itself, not the stringified record. A tool whose
 * *output* happens to contain the text `"error":` — a JSON payload with an
 * `error: null` field, a log line, this very file quoted in a diff — is not a
 * failed call, and treating it as one would mark a working agent idle.
 */
function isErrorPart(part) {
    const resp = part.functionResponse?.response;
    return !!resp && resp['error'] !== undefined && resp['error'] !== null;
}
/**
 * The diff lines a `read_file` call asked for, 1-based and inclusive.
 *
 * `read_file`'s `offset` is a 0-based line offset. A call with no `limit` asks
 * for as much as one read returns, which is a character budget, not a line count
 * — so it is not a range, and this returns null rather than guessing one. That is
 * deliberate: a guess here would credit a chunk to an agent that read the first
 * screenful of a diff and stopped.
 */
function rangeOf(args) {
    const offset = args['offset'];
    const limit = args['limit'];
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit <= 0) {
        return null;
    }
    const off = typeof offset === 'number' && Number.isInteger(offset) && offset >= 0
        ? offset
        : 0;
    return [off + 1, off + limit];
}
/**
 * Parse one transcript. Returns null for a file that is not one.
 *
 * `diffPath` is what makes a call "a read of the diff" rather than "a call". Pass
 * it and `diffToolCalls` is populated; omit it and the field stays 0.
 */
function parseTranscript(file, diffPath) {
    let raw;
    try {
        raw = readFileSync(file, 'utf8');
    }
    catch {
        return null;
    }
    const lines = raw.split('\n').filter((l) => l.trim());
    if (lines.length === 0)
        return null;
    let agentId = '';
    let agentName = '';
    let launchPrompt = '';
    let finalText = '';
    let successfulToolCalls = 0;
    let diffToolCalls = 0;
    const diffReads = [];
    const successfulCallArgs = [];
    const successfulReadFileArgs = [];
    const byId = new Map();
    const anonymous = [];
    for (const line of lines) {
        let rec;
        try {
            rec = JSON.parse(line);
        }
        catch {
            continue; // A partial last line: an agent still running. Skip it.
        }
        if (!agentId && typeof rec['agentId'] === 'string')
            agentId = rec['agentId'];
        if (!agentName && typeof rec['agentName'] === 'string') {
            agentName = rec['agentName'];
        }
        const type = rec['type'];
        // The first `user` record is the launch prompt: the harness writes it when it
        // attaches, before the model has produced anything.
        if (!launchPrompt && type === 'user')
            launchPrompt = textOf(rec);
        // Read the message PARTS, not a regex over the serialized record. An agent
        // reviewing this module's own diff will have `"functionCall"` and
        // `"functionResponse"` sitting inside a `read_file` result as ordinary text,
        // and a substring match would count that as a tool call the agent never made.
        const msg = rec['message'];
        const parts = Array.isArray(msg?.parts) ? msg.parts : [];
        for (const part of parts) {
            const fc = part.functionCall;
            if (!fc)
                continue;
            // Serialize only the ARGUMENTS. The diff path is a path the agent was told
            // to open; a tool *result* that quotes it (a grep over `.qwen/tmp`, this
            // file in a diff) says nothing about what the agent opened.
            const args = (fc.args ?? {});
            // Match the path as a whole JSON string value, quotes included: a bare
            // substring credits `…/diff.txt.bak` for `…/diff.txt`.
            const namedTheDiff = diffPath
                ? JSON.stringify(args).includes(JSON.stringify(diffPath))
                : false;
            const pending = {
                namedTheDiff,
                readFile: fc.name === ToolNames.READ_FILE,
                range: namedTheDiff ? rangeOf(args) : null,
                args: JSON.stringify(args),
            };
            if (typeof fc.id === 'string' && fc.id)
                byId.set(fc.id, pending);
            else
                anonymous.push(pending);
        }
        for (const part of parts) {
            const fr = part.functionResponse;
            if (!fr)
                continue;
            let pending;
            if (typeof fr.id === 'string' && byId.has(fr.id)) {
                pending = byId.get(fr.id);
                byId.delete(fr.id);
            }
            else if (anonymous.length > 0) {
                // FIFO, not LIFO: a JSONL transcript is chronological, so the oldest
                // un-paired call is the one this earliest un-paired result belongs to.
                pending = anonymous.shift();
            }
            else {
                // A result with no call before it is not evidence of a call.
                continue;
            }
            if (!isErrorPart(part)) {
                successfulToolCalls++;
                successfulCallArgs.push(pending.args);
                if (pending.readFile)
                    successfulReadFileArgs.push(pending.args);
                if (pending.namedTheDiff) {
                    diffToolCalls++;
                    if (pending.range)
                        diffReads.push(pending.range);
                }
            }
        }
        if (type === 'assistant') {
            const t = textOf(rec);
            if (t)
                finalText = t;
        }
    }
    if (!agentId)
        return null;
    let mtimeMs = 0;
    try {
        mtimeMs = statSync(file).mtimeMs;
    }
    catch {
        /* gone between readdir and stat */
    }
    return {
        agentId,
        agentName,
        launchPrompt,
        successfulToolCalls,
        diffToolCalls,
        diffReads,
        successfulCallArgs,
        successfulReadFileArgs,
        finalText,
        mtimeMs,
    };
}
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
export function listAgentTranscriptFiles(dir) {
    return readdirSync(dir).filter((name) => name.endsWith('.jsonl'));
}
/**
 * Every subagent this session launched, as the harness recorded it.
 *
 * `since` drops transcripts older than the plan they are supposed to be evidence
 * for. The transcript dir is scoped to the *session*, not the review, and nothing
 * prunes it — so a second `/review` in one session would otherwise be satisfied
 * by the first one's agents, and the diff path is stable across runs, so the
 * collision is silent. Pass the plan's mtime.
 */
export function readTranscripts(since, env = process.env, diffPath) {
    const dir = transcriptDir(env);
    let names;
    try {
        names = listAgentTranscriptFiles(dir);
    }
    catch (err) {
        // No directory at all is an *infrastructure* fact, not a verdict about the
        // agents. Conflating the two would let a read-only HOME or a full disk read
        // as "every agent idled" and block every review with no diagnosable cause.
        throw new TranscriptsUnavailableError(`no subagent transcripts at ${dir} (${err.message}). The ` +
            'harness writes one per agent; if there are none, either no agents ran ' +
            'or the harness could not write them.');
    }
    const out = [];
    for (const name of names) {
        const rec = parseTranscript(join(dir, name), diffPath);
        if (!rec)
            continue;
        if (since !== undefined && rec.mtimeMs < since)
            continue;
        out.push(rec);
    }
    return out;
}
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
export function wasGivenTheDiff(rec, diffPath) {
    const p = rec.launchPrompt;
    if (!p)
        return false;
    // The diff file, by name. Nothing weaker: a bare `read_file(` in the prompt
    // proves only that *some* file was named, and a prompt that points an agent at
    // source files while never mentioning the diff is exactly as blind as one that
    // names no file at all. It would pass a `read_file`-anywhere check, be called
    // "not blind", and its silence would then be read as a whiff — sending the
    // reader to relaunch an agent whose prompt is the actual defect.
    return p.includes(diffPath);
}
//# sourceMappingURL=transcripts.js.map