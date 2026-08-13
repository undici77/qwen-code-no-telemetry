/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
import { REVIEW_TMP_DIR, tmpFile } from './lib/paths.js';
import { planEffortField } from './lib/effort.js';
import { captureLocalDiff } from './lib/local-diff.js';
import { buildDiffPlan, READ_FILE_CHAR_CAP } from './lib/diff-plan.js';
import { buildPlanReport, warnOnReportSize, stringifyPlanReport, } from './lib/report.js';
/**
 * Render a repo path for a terminal.
 *
 * A filename is workspace-controlled data, and git permits almost any byte in
 * one — including newlines and ESC. Printed raw, a path can forge a second
 * warning line ("...was NOT reviewed\nIncluded 3 untracked files") or emit an
 * OSC/CSI sequence at the user's terminal. `JSON.stringify` escapes the control
 * characters and quotes the result; the machine-readable report keeps the real
 * bytes.
 */
function display(path) {
    // eslint-disable-next-line no-control-regex
    const CONTROL = /[\u0000-\u001f\u007f]/;
    return CONTROL.test(path) ? JSON.stringify(path) : path;
}
function runCaptureLocal(args) {
    const { out, file, target } = args;
    const capture = captureLocalDiff({
        file,
        includeUntracked: args.untracked,
    });
    const diffText = capture.diff.toString('utf8');
    // Two directories, and they are not the same one. The diff always lands in
    // `.qwen/tmp` (its path is ours to choose), but `--out` is the caller's — and
    // `--out reports/plan.json` is a legal request that answering with the temp
    // dir turned into an ENOENT from `writeFileSync`.
    mkdirSync(REVIEW_TMP_DIR, { recursive: true });
    mkdirSync(dirname(resolve(out)), { recursive: true });
    const diffPath = tmpFile(target, 'diff.txt');
    // Write the bytes, not the string: a re-encode would rewrite the content of
    // every hunk touching a file git handed us in a non-UTF-8 encoding.
    writeFileSync(diffPath, capture.diff);
    const plan = buildDiffPlan(diffText);
    const result = {
        diffPath,
        diffPathAbsolute: resolve(diffPath),
        // No ref to `git show` a pre-change file out of, so per-file line counts and
        // heaviness are unavailable — same as `plan-diff`. Chunk coverage, which is
        // what the topology needs, is not.
        ...buildPlanReport(plan, null),
        untrackedFiles: capture.untracked,
        skippedFiles: capture.skipped,
        ...planEffortField(args.effort),
    };
    writeFileSync(out, stringifyPlanReport(result), 'utf8');
    writeStdoutLine(`Wrote diff to ${diffPath} and plan to ${out}`);
    if (capture.unbornHead) {
        writeStderrLine('Note: this repo has no commits yet — diffing against the empty tree, ' +
            'so every file reads as new.');
    }
    if (capture.untracked.length > 0) {
        writeStderrLine(`Included ${capture.untracked.length} untracked file(s) that no ` +
            `\`git diff\` would show: ${capture.untracked.map(display).join(', ')}`);
    }
    for (const s of capture.skipped) {
        // The reason needs escaping too, and for the same reason the path did: it is
        // built from `Error.message`, and a filesystem or git error quotes the
        // filename back at you (`ENOENT: ... stat '<name>'`). Escaping the path and
        // then printing the error that contains it is a lock on the front door.
        writeStderrLine(`WARNING: untracked file ${display(s.path)} was NOT reviewed — ` +
            `${display(s.reason)}. List it under "Not reviewed" in the review output.`);
    }
    if (plan.diffLines === 0) {
        // "Nothing to review" and "nothing was reviewable" are different sentences,
        // and only one of them is a clean tree. An oversized blob or an embedded repo
        // as the *only* change lands here with an empty diff and a non-empty skip
        // list, and calling that clean would hand the review a green verdict over
        // work it explicitly could not read — the whole failure this command exists
        // to end, arriving through the front door.
        writeStderrLine(capture.skipped.length > 0
            ? `WARNING: 0 chunks — nothing reviewable was captured, but ` +
                `${capture.skipped.length} untracked file(s) were SKIPPED (above). ` +
                `This is not a clean tree: report them under "Not reviewed" and do ` +
                `not certify the working tree as reviewed.`
            : 'WARNING: the working tree is clean — 0 chunks. There is nothing to ' +
                'review; do not run the review agents.');
    }
    writeStderrLine(`Diff: ${plan.diffLines} lines (${plan.srcDiffLines} source, ` +
        `${plan.testDiffLines} test, ${plan.docsDiffLines} docs, ` +
        `${plan.generatedDiffLines} generated) -> ${plan.chunks.length} review chunk(s)`);
    warnOnReportSize(out, READ_FILE_CHAR_CAP);
}
export const captureLocalCommand = {
    command: 'capture-local',
    describe: 'Capture staged + unstaged + untracked changes as one diff and partition it into review chunks',
    builder: (yargs) => yargs
        .option('out', {
        type: 'string',
        demandOption: true,
        describe: 'Output JSON path for the chunk plan (will be overwritten)',
    })
        .option('file', {
        type: 'string',
        describe: 'Scope the capture to a single path (a `/review <file-path>` target)',
    })
        .option('target', {
        type: 'string',
        default: 'local',
        describe: 'Target suffix for the diff file name (`local`, or a filename for a file-path review)',
    })
        .option('untracked', {
        type: 'boolean',
        default: true,
        describe: 'Include untracked, non-ignored files. On by default: `git diff` cannot see them, so without this a brand-new file goes unreviewed.',
    })
        .option('effort', {
        type: 'string',
        choices: ['low', 'medium', 'high'],
        describe: 'The review effort. `medium` (balanced) drops the adversarial ' +
            'personas from the required roster; recorded in the plan so ' +
            'check-coverage, agent-prompt --roster and compose-review all read ' +
            'one value. Omit for the full (high) roster.',
    }),
    handler: (argv) => {
        runCaptureLocal(argv);
    },
};
//# sourceMappingURL=capture-local.js.map