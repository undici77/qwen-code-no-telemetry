/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { atomicWriteFileSync } from '@qwen-code/qwen-code-core';
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync, } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { writeStdoutLine } from '../../utils/stdioHelpers.js';
import { git, gitOpt, gitRaw } from './lib/git.js';
import { manifestRepositoryContextProvider } from './lib/manifest-repository-context.js';
import { isSafeRepositoryRelativePath, MAX_IDENTITY_BYTES, validateRepositoryContext, } from './lib/repository-context.js';
import { stringifyPlanReport } from './lib/report.js';
export const REPOSITORY_CONTEXT_PROVIDERS = [manifestRepositoryContextProvider];
function sameFile(left, right) {
    if (left === right)
        return true;
    if (!existsSync(left) || !existsSync(right))
        return false;
    const leftStat = statSync(left);
    const rightStat = statSync(right);
    return leftStat.dev === rightStat.dev && leftStat.ino === rightStat.ino;
}
function recordedWorktreeMatches(recordedPath, worktree) {
    const candidates = [resolve(recordedPath)];
    if (!isAbsolute(recordedPath)) {
        const commonDir = gitOpt('-C', worktree, 'rev-parse', '--git-common-dir');
        if (commonDir !== null) {
            candidates.push(resolve(dirname(resolve(worktree, commonDir)), recordedPath));
        }
    }
    return candidates.some((candidate) => existsSync(candidate) && realpathSync(candidate) === worktree);
}
function trustedMergeBase(plan, worktree) {
    if (plan.mergeBaseSha === undefined)
        return { kind: 'local' };
    if (plan.baseFetchFailed === true || plan.mergeBaseSha === null) {
        return { kind: 'none' };
    }
    if (typeof plan.mergeBaseSha !== 'string' ||
        !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/i.test(plan.mergeBaseSha)) {
        throw new Error('repo-context: plan.mergeBaseSha is invalid');
    }
    if (gitOpt('-C', worktree, 'cat-file', '-e', `${plan.mergeBaseSha}^{commit}`) === null) {
        throw new Error('repo-context: plan.mergeBaseSha cannot be resolved');
    }
    return { kind: 'base', sha: plan.mergeBaseSha };
}
// `git` normalises stdout (CRLF to LF, trimmed); the worktree read must return
// the same shape, or a provider that exact-compares an identity file gets one
// value in a PR review and another in a local review of the same repository.
function normalizeIdentityContent(content) {
    return content.replace(/\r\n/g, '\n').trim();
}
function isAbsentError(error) {
    const code = error?.code;
    return code === 'ENOENT' || code === 'ENOTDIR';
}
/**
 * One `git ls-tree <rev> -- <path>` entry. Exit 0 with empty output is git's
 * DEFINITE "absent at this revision" — unlike `cat-file -e`, whose non-zero
 * exit cannot be told from a failed git call, so a throwing git call below
 * stays a throw (fail closed) and never masquerades as "not this repository".
 */
function baseTreeEntry(worktree, mergeBase, path) {
    const output = git('-C', worktree, 'ls-tree', mergeBase, '--', path);
    if (output === '')
        return null;
    const [mode, type] = output.split(/\s+/);
    return { mode, type };
}
function readBaseBlob(worktree, mergeBase, path) {
    try {
        // `gitRaw`'s raised maxBuffer: `git()` inherits execFileSync's 1 MB
        // default, so a schema-legal manifest past 1 MB would die with ENOBUFS
        // in PR mode while the worktree branch reads it without a cap.
        return gitRaw('-C', worktree, 'show', `${mergeBase}:${path}`).toString('utf8');
    }
    catch (error) {
        throw new Error(`repo-context: identity read failed for ${path}: ` +
            `${error.message}`);
    }
}
/**
 * Resolve a committed symlink's target the way the filesystem resolves one:
 * relative to the link's own directory. `null` means the target escapes the
 * tree (absolute, or climbs past the root); `''` means it climbs to the tree
 * root itself — a directory, never an identity file.
 */
function resolveTreeSymlinkTarget(fromPath, target) {
    if (target.startsWith('/') || /^[A-Za-z]:/.test(target))
        return null;
    const segments = `${dirname(fromPath)}/${target}`.split('/');
    const resolved = [];
    for (const segment of segments) {
        if (segment === '' || segment === '.')
            continue;
        if (segment === '..') {
            if (resolved.length === 0)
                return null;
            resolved.pop();
            continue;
        }
        resolved.push(segment);
    }
    return resolved.join('/');
}
const MAX_IDENTITY_SYMLINK_HOPS = 16;
/**
 * The base-mode identity read, mirroring the worktree branch where git can:
 * `ls-tree` mode stands in for `lstat`/`statSync` (`cat-file -e` would
 * happily "exist" for a tree or symlink entry and hand a provider content
 * the worktree branch can never produce), committed symlinks are followed
 * under the same containment rule `realpathSync` enforces on disk, and a
 * directory yields `null` exactly like `isFile() === false`. One known
 * divergence: `ls-tree` never descends through a symlinked intermediate
 * path COMPONENT, so an identity below one reads `null` here while the
 * worktree branch follows it. The direction is fail-safe — base mode reads
 * strictly less, never more — so the gap degrades to "no context", not a
 * trust hole.
 */
function readBaseIdentity(worktree, mergeBase, relativePath) {
    let path = relativePath;
    // A symlink target ending in `/`, `.`, or `..` requires the finally
    // resolved entry to be a directory, exactly the way realpathSync fails
    // ENOTDIR on disk — without this the two modes diverge on a broken
    // trailing-component link (a target like `a/.` walks THROUGH `a`).
    let requireDirectory = false;
    for (let hop = 0; hop < MAX_IDENTITY_SYMLINK_HOPS; hop++) {
        const entry = baseTreeEntry(worktree, mergeBase, path);
        if (entry === null)
            return null;
        if (entry.mode === '120000') {
            const target = readBaseBlob(worktree, mergeBase, path);
            const lastSegment = target.split('/').pop();
            if (target.endsWith('/') || lastSegment === '.' || lastSegment === '..') {
                requireDirectory = true;
            }
            const resolved = resolveTreeSymlinkTarget(path, target);
            if (resolved === null) {
                throw new Error(`repo-context: identity path escapes the worktree: ` +
                    `${JSON.stringify(relativePath)}`);
            }
            if (resolved === '')
                return null;
            path = resolved;
            continue;
        }
        if (entry.type !== 'blob')
            return null;
        if (requireDirectory)
            return null;
        return normalizeIdentityContent(readBaseBlob(worktree, mergeBase, path));
    }
    throw new Error(`repo-context: identity symlink chain is too deep: ` +
        `${JSON.stringify(relativePath)}`);
}
function identityReader(worktree, mergeBase) {
    return (relativePath) => {
        if (!isSafeRepositoryRelativePath(relativePath)) {
            throw new Error(`repo-context: identity path is unsafe: ${JSON.stringify(relativePath)}`);
        }
        if (mergeBase !== null) {
            return readBaseIdentity(worktree, mergeBase, relativePath);
        }
        const candidate = resolve(worktree, relativePath);
        let resolved;
        try {
            resolved = realpathSync(candidate);
        }
        catch (error) {
            if (isAbsentError(error))
                return null;
            throw error;
        }
        const contained = relative(worktree, resolved);
        // A path resolving to the worktree root itself is a directory, never an
        // identity file; it falls out at the isFile check, not here.
        if (isAbsolute(contained) ||
            contained === '..' ||
            contained.startsWith(`..${sep}`)) {
            throw new Error(`repo-context: identity path escapes the worktree: ${JSON.stringify(relativePath)}`);
        }
        try {
            const stat = statSync(resolved);
            if (!stat.isFile())
                return null;
            // Fail closed before reading (and therefore parsing) an oversized
            // identity — the manifest provider's threat model is an
            // attacker-committed file, and JSON.parse runs before any schema
            // validation can reject it.
            if (stat.size > MAX_IDENTITY_BYTES) {
                throw new Error(`repo-context: identity read exceeds the size limit: ` +
                    `${JSON.stringify(relativePath)}`);
            }
            return normalizeIdentityContent(readFileSync(resolved, 'utf8'));
        }
        catch (error) {
            if (isAbsentError(error))
                return null;
            throw error;
        }
    };
}
function readPlan(path) {
    let value;
    try {
        value = JSON.parse(readFileSync(path, 'utf8'));
    }
    catch (error) {
        throw new Error(`Cannot read plan ${path}: ${error.message}`);
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('repo-context: plan must be a JSON object');
    }
    return value;
}
function changedPaths(plan) {
    if (!Array.isArray(plan.files)) {
        throw new Error('repo-context: plan.files must be an array');
    }
    const paths = [];
    for (const [index, file] of plan.files.entries()) {
        const path = typeof file === 'object' && file !== null
            ? file.path
            : undefined;
        if (typeof path !== 'string') {
            throw new Error(`repo-context: plan.files[${index}].path is invalid`);
        }
        // Changed paths are only ever MATCHED against manifest globs, never opened,
        // so an unsafe-but-real path (a backslash is a legal POSIX filename byte)
        // is skipped rather than aborting a step that runs on every review.
        if (isSafeRepositoryRelativePath(path))
            paths.push(path);
    }
    return [...new Set(paths)].sort();
}
function contextFromProviders(providers, worktree, paths, readIdentityFile) {
    for (const provider of providers) {
        const context = provider.provide({
            worktree,
            changedPaths: paths,
            readIdentityFile,
        });
        if (context !== null)
            return validateRepositoryContext(context);
    }
    return null;
}
export function runRepoContext(args, providers = REPOSITORY_CONTEXT_PROVIDERS) {
    const planPath = resolve(args.plan);
    const outPath = resolve(args.out);
    if (sameFile(planPath, outPath)) {
        throw new Error('repo-context: --out must differ from --plan');
    }
    const worktree = realpathSync(resolve(args.worktree));
    if (!statSync(worktree).isDirectory()) {
        throw new Error(`repo-context: worktree is not a directory: ${worktree}`);
    }
    const plan = readPlan(planPath);
    if (plan.worktreePath !== undefined) {
        if (typeof plan.worktreePath !== 'string' ||
            plan.worktreePath.length === 0) {
            throw new Error('repo-context: plan.worktreePath is invalid');
        }
        if (!recordedWorktreeMatches(plan.worktreePath, worktree)) {
            throw new Error(`repo-context: --worktree does not match plan.worktreePath (${worktree} != ${plan.worktreePath})`);
        }
    }
    const mergeBase = trustedMergeBase(plan, worktree);
    const context = mergeBase.kind === 'none'
        ? null
        : contextFromProviders(providers, worktree, changedPaths(plan), identityReader(worktree, mergeBase.kind === 'base' ? mergeBase.sha : null));
    if (context === null)
        delete plan.repositoryContext;
    else
        plan.repositoryContext = context;
    mkdirSync(dirname(outPath), { recursive: true });
    atomicWriteFileSync(outPath, `${JSON.stringify(context, null, 2)}\n`);
    atomicWriteFileSync(planPath, stringifyPlanReport(plan));
    writeStdoutLine(context === null
        ? `Wrote null repository context to ${outPath}`
        : `Wrote repository context (${context.provider}) to ${outPath}`);
}
export const repoContextCommand = {
    command: 'repo-context',
    describe: 'Attach bounded repository-specific context to a review plan',
    builder: (yargs) => yargs
        .option('plan', {
        type: 'string',
        demandOption: true,
        describe: 'Existing review plan JSON to update',
    })
        .option('worktree', {
        type: 'string',
        demandOption: true,
        describe: 'Repository worktree used to resolve context',
    })
        .option('out', {
        type: 'string',
        demandOption: true,
        describe: 'Independent repository-context artifact path',
    }),
    handler: (argv) => {
        runRepoContext(argv);
    },
};
//# sourceMappingURL=repo-context.js.map