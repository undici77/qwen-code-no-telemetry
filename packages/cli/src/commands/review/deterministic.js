/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { execFileSync, } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { writeStdoutLine } from '../../utils/stdioHelpers.js';
const TIMEOUT_TYPECHECK_MS = 120_000;
const TIMEOUT_LINTER_MS = 60_000;
const EXEC_MAX_BUFFER = 10 * 1024 * 1024; // 10 MB output cap per tool
function execTool(cwd, cmd, args, timeoutMs) {
    const opts = {
        cwd,
        encoding: 'utf8',
        timeout: timeoutMs,
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: EXEC_MAX_BUFFER,
    };
    try {
        const stdout = execFileSync(cmd, args, opts).replace(/\r\n/g, '\n');
        return { stdout, stderr: '', exitCode: 0, timedOut: false };
    }
    catch (err) {
        const e = err;
        const stdout = (e.stdout ? e.stdout.toString() : '').replace(/\r\n/g, '\n');
        const stderr = (e.stderr ? e.stderr.toString() : '').replace(/\r\n/g, '\n');
        const exitCode = typeof e.status === 'number' ? e.status : 1;
        const timedOut = e.signal === 'SIGTERM' || e.code === 'ETIMEDOUT';
        return { stdout, stderr, exitCode, timedOut };
    }
}
function which(cmd) {
    try {
        execFileSync(process.platform === 'win32' ? 'where' : 'which', [cmd], {
            stdio: 'pipe',
        });
        return true;
    }
    catch {
        return false;
    }
}
function normalizePath(p, worktree) {
    // Forward-slash, strip a leading "./", and strip the worktree prefix so
    // findings line up with the worktree-relative paths the LLM uses
    // throughout the rest of /review.
    let n = p.replace(/\\/g, '/').replace(/^\.\//, '');
    const wt = worktree.replace(/\\/g, '/');
    if (n.startsWith(wt + '/'))
        n = n.slice(wt.length + 1);
    return n;
}
function inChangedFiles(file, set) {
    if (set.size === 0)
        return true; // no filter
    return set.has(file);
}
// --------------------------------------------------------------------------
// Tool: tsc (TypeScript typecheck)
// --------------------------------------------------------------------------
const tscTool = {
    name: 'tsc',
    source: 'typecheck',
    detect: ({ worktree }) => {
        if (!existsSync(join(worktree, 'tsconfig.json'))) {
            return { ok: false, reason: 'tsconfig.json not found' };
        }
        if (!which('npx'))
            return { ok: false, reason: 'npx not found in PATH' };
        return { ok: true };
    },
    run: (ctx) => {
        const ex = execTool(ctx.worktree, 'npx', ['tsc', '--noEmit', '--incremental'], TIMEOUT_TYPECHECK_MS);
        const findings = parseTscOutput(`${ex.stdout}\n${ex.stderr}`, ctx.worktree, ctx.changedFilesSet);
        return { exitCode: ex.exitCode, findings, timedOut: ex.timedOut };
    },
};
function parseTscOutput(output, worktree, set) {
    // tsc's pretty output (default) uses ANSI; we ask for plain output by
    // running through `npx tsc` (no --pretty=false needed — non-TTY pipes
    // already disable pretty by default). Each error line looks like:
    //   src/foo.ts(10,5): error TS2304: Cannot find name 'foo'.
    const findings = [];
    const re = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/gm;
    let m;
    while ((m = re.exec(output)) !== null) {
        const file = normalizePath(m[1], worktree);
        if (!inChangedFiles(file, set))
            continue;
        findings.push({
            source: 'typecheck',
            tool: 'tsc',
            file,
            line: parseInt(m[2], 10),
            column: parseInt(m[3], 10),
            severity: m[4] === 'error' ? 'Critical' : 'Nice to have',
            message: m[6].trim(),
            ruleId: m[5],
        });
    }
    return findings;
}
const ESLINT_CONFIG_FILES = [
    'eslint.config.js',
    'eslint.config.mjs',
    'eslint.config.cjs',
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc.yml',
    '.eslintrc.yaml',
    '.eslintrc',
];
const eslintTool = {
    name: 'eslint',
    source: 'linter',
    detect: ({ worktree }) => {
        if (!which('npx'))
            return { ok: false, reason: 'npx not found in PATH' };
        const found = ESLINT_CONFIG_FILES.some((f) => existsSync(join(worktree, f)));
        if (!found)
            return { ok: false, reason: 'no eslint config found' };
        return { ok: true };
    },
    run: (ctx) => {
        // Lint only changed JS/TS files. If nothing in the changed set is
        // lintable, skip without invoking eslint at all.
        const targets = ctx.changedFiles.filter((f) => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/i.test(f));
        if (targets.length === 0) {
            return { exitCode: 0, findings: [], timedOut: false };
        }
        const ex = execTool(ctx.worktree, 'npx', [
            'eslint',
            '--format=json',
            '--no-error-on-unmatched-pattern',
            ...targets,
        ], TIMEOUT_LINTER_MS);
        const findings = parseEslintJson(ex.stdout, ctx.worktree, ctx.changedFilesSet);
        return { exitCode: ex.exitCode, findings, timedOut: ex.timedOut };
    },
};
function parseEslintJson(stdout, worktree, set) {
    let parsed;
    try {
        parsed = JSON.parse(stdout);
    }
    catch {
        // eslint may emit warnings before its JSON payload (e.g. via
        // configuration warnings). If parsing fails, drop findings — the
        // exit code on the run record still tells the LLM something went
        // wrong.
        return [];
    }
    const findings = [];
    for (const fileResult of parsed) {
        const file = normalizePath(fileResult.filePath, worktree);
        if (!inChangedFiles(file, set))
            continue;
        for (const msg of fileResult.messages) {
            findings.push({
                source: 'linter',
                tool: 'eslint',
                file,
                line: msg.line ?? 0,
                column: msg.column,
                severity: msg.severity === 2 ? 'Critical' : 'Nice to have',
                message: msg.message,
                ruleId: msg.ruleId ?? undefined,
            });
        }
    }
    return findings;
}
function pyprojectHasRuff(worktree) {
    const p = join(worktree, 'pyproject.toml');
    if (!existsSync(p))
        return false;
    try {
        return /\[tool\.ruff\b/.test(readFileSync(p, 'utf8'));
    }
    catch {
        return false;
    }
}
const ruffTool = {
    name: 'ruff',
    source: 'linter',
    detect: ({ worktree }) => {
        const hasConfig = existsSync(join(worktree, 'ruff.toml')) ||
            existsSync(join(worktree, '.ruff.toml')) ||
            pyprojectHasRuff(worktree);
        if (!hasConfig) {
            return {
                ok: false,
                reason: 'no ruff config (ruff.toml / .ruff.toml / pyproject [tool.ruff])',
            };
        }
        if (!which('ruff'))
            return { ok: false, reason: 'ruff not in PATH' };
        return { ok: true };
    },
    run: (ctx) => {
        const targets = ctx.changedFiles.filter((f) => /\.py$/i.test(f));
        if (targets.length === 0) {
            return { exitCode: 0, findings: [], timedOut: false };
        }
        const ex = execTool(ctx.worktree, 'ruff', ['check', '--output-format=json', ...targets], TIMEOUT_LINTER_MS);
        const findings = parseRuffJson(ex.stdout, ctx.worktree, ctx.changedFilesSet);
        return { exitCode: ex.exitCode, findings, timedOut: ex.timedOut };
    },
};
function parseRuffJson(stdout, worktree, set) {
    let parsed;
    try {
        parsed = JSON.parse(stdout);
    }
    catch {
        return [];
    }
    const findings = [];
    for (const m of parsed) {
        const file = normalizePath(m.filename, worktree);
        if (!inChangedFiles(file, set))
            continue;
        findings.push({
            source: 'linter',
            tool: 'ruff',
            file,
            line: m.location.row,
            column: m.location.column,
            severity: 'Critical', // ruff lint findings are violations, not stylistic warnings
            message: m.message,
            ruleId: m.code ?? undefined,
        });
    }
    return findings;
}
const cargoClippyTool = {
    name: 'cargo-clippy',
    source: 'typecheck',
    detect: ({ worktree }) => {
        if (!existsSync(join(worktree, 'Cargo.toml'))) {
            return { ok: false, reason: 'Cargo.toml not found' };
        }
        if (!which('cargo'))
            return { ok: false, reason: 'cargo not in PATH' };
        return { ok: true };
    },
    run: (ctx) => {
        const ex = execTool(ctx.worktree, 'cargo', ['clippy', '--message-format=json', '--quiet'], TIMEOUT_TYPECHECK_MS);
        const findings = parseCargoClippyNdjson(ex.stdout, ctx.worktree, ctx.changedFilesSet);
        return { exitCode: ex.exitCode, findings, timedOut: ex.timedOut };
    },
};
function parseCargoClippyNdjson(stdout, worktree, set) {
    const findings = [];
    for (const line of stdout.split('\n')) {
        if (!line.startsWith('{'))
            continue;
        let entry;
        try {
            entry = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (entry.reason !== 'compiler-message' || !entry.message)
            continue;
        const m = entry.message;
        if (m.level !== 'error' && m.level !== 'warning')
            continue;
        const primary = (m.spans || []).find((s) => s.is_primary);
        if (!primary)
            continue;
        const file = normalizePath(primary.file_name, worktree);
        if (!inChangedFiles(file, set))
            continue;
        findings.push({
            source: 'typecheck',
            tool: 'cargo-clippy',
            file,
            line: primary.line_start,
            column: primary.column_start,
            severity: m.level === 'error' ? 'Critical' : 'Nice to have',
            message: m.message,
            ruleId: m.code?.code,
        });
    }
    return findings;
}
// --------------------------------------------------------------------------
// Tool: go vet (Go — typecheck + static analysis)
// --------------------------------------------------------------------------
const goVetTool = {
    name: 'go-vet',
    source: 'typecheck',
    detect: ({ worktree }) => {
        if (!existsSync(join(worktree, 'go.mod'))) {
            return { ok: false, reason: 'go.mod not found' };
        }
        if (!which('go'))
            return { ok: false, reason: 'go not in PATH' };
        return { ok: true };
    },
    run: (ctx) => {
        const ex = execTool(ctx.worktree, 'go', ['vet', './...'], TIMEOUT_TYPECHECK_MS);
        const findings = parseGoVetOutput(`${ex.stdout}\n${ex.stderr}`, ctx.worktree, ctx.changedFilesSet);
        return { exitCode: ex.exitCode, findings, timedOut: ex.timedOut };
    },
};
function parseGoVetOutput(output, worktree, set) {
    // go vet emits `path/to/file.go:line[:col]: msg`. The column may be absent
    // depending on the analyzer.
    const findings = [];
    const re = /^(.+?\.go):(\d+)(?::(\d+))?:\s+(.+)$/gm;
    let m;
    while ((m = re.exec(output)) !== null) {
        const file = normalizePath(m[1], worktree);
        if (!inChangedFiles(file, set))
            continue;
        findings.push({
            source: 'typecheck',
            tool: 'go-vet',
            file,
            line: parseInt(m[2], 10),
            column: m[3] ? parseInt(m[3], 10) : undefined,
            severity: 'Critical',
            message: m[4].trim(),
        });
    }
    return findings;
}
const golangciLintTool = {
    name: 'golangci-lint',
    source: 'linter',
    detect: ({ worktree }) => {
        if (!existsSync(join(worktree, 'go.mod'))) {
            return { ok: false, reason: 'go.mod not found' };
        }
        if (!which('golangci-lint')) {
            return { ok: false, reason: 'golangci-lint not in PATH' };
        }
        return { ok: true };
    },
    run: (ctx) => {
        const ex = execTool(ctx.worktree, 'golangci-lint', ['run', '--out-format=json', './...'], TIMEOUT_LINTER_MS);
        const findings = parseGolangciJson(ex.stdout, ctx.worktree, ctx.changedFilesSet);
        return { exitCode: ex.exitCode, findings, timedOut: ex.timedOut };
    },
};
function parseGolangciJson(stdout, worktree, set) {
    let parsed;
    try {
        parsed = JSON.parse(stdout);
    }
    catch {
        return [];
    }
    const findings = [];
    for (const issue of parsed.Issues ?? []) {
        const file = normalizePath(issue.Pos.Filename, worktree);
        if (!inChangedFiles(file, set))
            continue;
        findings.push({
            source: 'linter',
            tool: 'golangci-lint',
            file,
            line: issue.Pos.Line,
            column: issue.Pos.Column,
            severity: issue.Severity?.toLowerCase() === 'warning'
                ? 'Nice to have'
                : 'Critical',
            message: issue.Text,
            ruleId: issue.FromLinter,
        });
    }
    return findings;
}
// --------------------------------------------------------------------------
// Driver
// --------------------------------------------------------------------------
const ALL_TOOLS = [
    tscTool,
    eslintTool,
    ruffTool,
    cargoClippyTool,
    goVetTool,
    golangciLintTool,
];
async function runDeterministic(args) {
    const worktree = resolve(args.worktree);
    if (!existsSync(worktree)) {
        throw new Error(`Worktree not found: ${worktree}`);
    }
    let changedFiles = [];
    try {
        const raw = readFileSync(args['changed-files'], 'utf8');
        changedFiles = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`Failed to read changed-files JSON at ${args['changed-files']}: ${err.message}`);
    }
    if (!Array.isArray(changedFiles)) {
        throw new Error('changed-files JSON must be an array of paths');
    }
    const normalizedChanged = changedFiles.map((f) => normalizePath(f, worktree));
    const changedFilesSet = new Set(normalizedChanged);
    const ctx = {
        worktree,
        changedFiles: normalizedChanged,
        changedFilesSet,
    };
    const findings = [];
    const toolsRun = [];
    const toolsSkipped = [];
    for (const tool of ALL_TOOLS) {
        const det = tool.detect(ctx);
        if (!det.ok) {
            toolsSkipped.push({ tool: tool.name, reason: det.reason });
            continue;
        }
        const t0 = Date.now();
        const result = tool.run(ctx);
        const durationMs = Date.now() - t0;
        findings.push(...result.findings);
        toolsRun.push({
            tool: tool.name,
            source: tool.source,
            exitCode: result.exitCode,
            durationMs,
            findingsCount: result.findings.length,
            timedOut: result.timedOut,
        });
    }
    const result = {
        worktree,
        changedFiles: normalizedChanged,
        findings,
        toolsRun,
        toolsSkipped,
    };
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, JSON.stringify(result, null, 2) + '\n', 'utf8');
    const summary = toolsRun
        .map((r) => `${r.tool}=${r.findingsCount}${r.timedOut ? ' (timeout)' : ''}`)
        .join(', ');
    writeStdoutLine(`Wrote deterministic report to ${args.out}: ${findings.length} findings (${summary || 'no tools applicable'}; skipped ${toolsSkipped.length})`);
}
export const deterministicCommand = {
    command: 'deterministic <worktree>',
    describe: 'Run deterministic typecheck / lint on changed files (TypeScript/JavaScript: tsc + eslint)',
    builder: (yargs) => yargs
        .positional('worktree', {
        type: 'string',
        demandOption: true,
        describe: 'Worktree directory to run tools in',
    })
        .option('changed-files', {
        type: 'string',
        demandOption: true,
        describe: 'Path to a JSON file containing an array of changed file paths (relative to worktree)',
    })
        .option('out', {
        type: 'string',
        demandOption: true,
        describe: 'Output JSON path (will be overwritten)',
    }),
    handler: async (argv) => {
        await runDeterministic(argv);
    },
};
//# sourceMappingURL=deterministic.js.map