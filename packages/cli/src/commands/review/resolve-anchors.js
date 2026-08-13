/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { resolveAnchors, } from './lib/anchors.js';
/** Every request carries an id, a path and a snippet; the rest is optional. */
export function validateRequests(raw) {
    if (!Array.isArray(raw)) {
        throw new Error('Input must be a JSON array of findings.');
    }
    const requests = raw.map((r, i) => {
        // `null` is an object to `typeof`, and indexing it throws a TypeError that
        // says nothing about which entry was wrong. Every other malformed input gets
        // a message naming the index and the field; this one deserves the same.
        if (r === null || typeof r !== 'object' || Array.isArray(r)) {
            throw new Error(`Finding at index ${i} is ${JSON.stringify(r)}, not an object. ` +
                `Each entry needs {id, path, anchor} and may carry {line}.`);
        }
        const o = r;
        for (const key of ['id', 'path', 'anchor']) {
            if (typeof o[key] !== 'string' || o[key] === '') {
                throw new Error(`Finding at index ${i} is missing a non-empty string "${key}". ` +
                    `Each entry needs {id, path, anchor} and may carry {line}.`);
            }
        }
        // The same rule `findings`'s parseLocations applies: two validators in one
        // pipeline must not disagree, or an entry passes here and hard-fails there.
        if (o['line'] !== undefined &&
            (typeof o['line'] !== 'number' ||
                !Number.isSafeInteger(o['line']) ||
                o['line'] <= 0)) {
            throw new Error(`Finding "${o['id']}" has an invalid "line".`);
        }
        return {
            id: o['id'],
            path: o['path'],
            anchor: o['anchor'],
            ...(o['line'] !== undefined ? { line: o['line'] } : {}),
        };
    });
    // The report splits into `resolved` and `unmatched`, so the caller cannot
    // re-join by position — it joins by id. A duplicate id therefore pairs some
    // finding with another finding's line, and posts a comment on code it is not
    // about. Refuse it here rather than let it resolve into a plausible wrong
    // answer.
    const seen = new Set();
    const dupes = new Set();
    for (const r of requests) {
        if (seen.has(r.id))
            dupes.add(r.id);
        seen.add(r.id);
    }
    if (dupes.size > 0) {
        throw new Error(`Duplicate finding id(s): ${[...dupes].join(', ')}. Ids are how each ` +
            `resolution is matched back to its finding, so they must be unique.`);
    }
    return requests;
}
function runResolveAnchors(args) {
    let diffText;
    try {
        diffText = readFileSync(args.diff, 'utf8');
    }
    catch (err) {
        throw new Error(`Cannot read diff file ${args.diff}: ${err.message}`);
    }
    // Two failures, two messages. One `try` around both told a user with a stray
    // trailing comma that their file "could not be read", and sent them looking at
    // permissions.
    let rawText;
    try {
        rawText = readFileSync(args.input, 'utf8');
    }
    catch (err) {
        throw new Error(`Cannot read findings file ${args.input}: ${err.message}`);
    }
    let raw;
    try {
        raw = JSON.parse(rawText);
    }
    catch (err) {
        throw new Error(`Cannot parse findings file ${args.input} as JSON: ${err.message}`);
    }
    const results = resolveAnchors(diffText, validateRequests(raw));
    const resolved = results.filter((r) => r.status === 'resolved');
    const unmatched = results.filter((r) => r.status === 'unmatched');
    const report = {
        resolved,
        unmatched,
        stats: {
            total: results.length,
            resolved: resolved.length,
            unmatched: unmatched.length,
            ambiguous: resolved.filter((r) => r.ambiguous).length,
            // A confident match a long way from where the agent said it was. The
            // finding is fine; the agent's counting was not. Worth seeing.
            drifted: resolved.filter((r) => (r.drift ?? 0) > 0).length,
            loose: resolved.filter((r) => r.tier?.startsWith('loose')).length,
        },
    };
    // The directory of the path the CALLER chose, which is not necessarily
    // `.qwen/tmp` — `--out reports/anchors.json` is a legal request, and creating
    // the temp dir instead answered it with ENOENT.
    mkdirSync(dirname(resolve(args.out)), { recursive: true });
    writeFileSync(args.out, JSON.stringify(report, null, 2), 'utf8');
    writeStdoutLine(`Wrote resolved anchors to ${args.out}`);
    const s = report.stats;
    writeStderrLine(`Anchors: ${s.resolved}/${s.total} resolved` +
        (s.drifted ? `, ${s.drifted} corrected` : '') +
        (s.ambiguous ? `, ${s.ambiguous} ambiguous` : '') +
        (s.loose
            ? `, ${s.loose} matched only after normalising indentation`
            : '') +
        (s.unmatched ? `, ${s.unmatched} UNMATCHED` : ''));
    for (const r of resolved) {
        if ((r.drift ?? 0) > 0) {
            // Print the range, not just `line`. `drift` is measured against
            // `startLine`, so reporting the end line here reads as a contradiction
            // ("agent said 420, the snippet is at 420") on any multi-line anchor.
            const span = r.startLine === r.line ? `${r.line}` : `${r.startLine}-${r.line}`;
            writeStderrLine(`  corrected ${r.path}: agent said line ${r.claimedLine}, ` +
                `the snippet is at ${span}`);
        }
        if (r.ambiguous) {
            writeStderrLine(`  ambiguous ${r.path}:${r.line} — the snippet appears ` +
                `${r.matchCount} times; picked the one nearest the agent's claim. ` +
                `A longer anchor would settle it.`);
        }
    }
    for (const r of unmatched) {
        writeStderrLine(`  UNMATCHED ${r.id} (${r.path}): ${r.reason}`);
    }
}
export const resolveAnchorsCommand = {
    command: 'resolve-anchors',
    describe: "Compute each finding's diff line from its quoted code snippet (never trust an agent's line number)",
    builder: (yargs) => yargs
        .option('diff', {
        type: 'string',
        demandOption: true,
        describe: 'Path to the captured diff (`diffPath` from fetch-pr / capture-local / plan-diff)',
    })
        .option('input', {
        type: 'string',
        demandOption: true,
        describe: "JSON array of findings: [{id, path, anchor, line?}]. `anchor` is a verbatim snippet from the diff; `line` is the agent's claim, used only to break ties.",
    })
        .option('out', {
        type: 'string',
        demandOption: true,
        describe: 'Output JSON path (will be overwritten)',
    }),
    handler: (argv) => {
        runResolveAnchors(argv);
    },
};
//# sourceMappingURL=resolve-anchors.js.map