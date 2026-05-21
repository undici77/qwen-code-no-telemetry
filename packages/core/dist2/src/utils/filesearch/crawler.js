/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fdir } from 'fdir';
import * as cache from './crawlCache.js';
function toPosixPath(p) {
    return p.split(path.sep).join(path.posix.sep);
}
function normalizeGitPath(p, stripTrailingSlash = false) {
    let s = toPosixPath(p);
    while (s.startsWith('./')) {
        s = s.slice(2);
    }
    return stripTrailingSlash ? s.replace(/\/+$/, '') : s;
}
function repoRelativePathsCaseFold() {
    return process.platform === 'win32' || process.platform === 'darwin';
}
function equalsRepoRelativeCaseAware(a, b) {
    const x = a.replace(/\/+$/, '');
    const y = b.replace(/\/+$/, '');
    if (x === y) {
        return true;
    }
    if (repoRelativePathsCaseFold()) {
        return x.toLowerCase() === y.toLowerCase();
    }
    return false;
}
function sliceAfterGitPathspecPrefix(nf, rg) {
    const prefix = `${rg}/`;
    if (nf.startsWith(prefix)) {
        const rest = nf.slice(prefix.length);
        if (rest === '') {
            return null;
        }
        return rest;
    }
    if (repoRelativePathsCaseFold()) {
        const lp = `${rg.toLowerCase()}/`;
        const ln = nf.toLowerCase();
        if (ln.startsWith(lp)) {
            const rest = nf.slice(lp.length);
            if (rest === '') {
                return null;
            }
            return rest;
        }
    }
    return null;
}
const THROTTLE_MS = 5_000;
const PATH_CACHE_TTL_MS = 30_000;
const MAX_PATH_CACHE_ENTRIES = 200;
const MAX_CHANGE_STATE_ENTRIES = 50;
const STDERR_LOG_MAX_CHARS = 4_096;
const lastRebuildTime = new Map();
function trimPathCache(map) {
    while (map.size > MAX_PATH_CACHE_ENTRIES) {
        const oldest = map.keys().next().value;
        if (oldest === undefined) {
            break;
        }
        map.delete(oldest);
    }
}
function pathCacheGet(map, key) {
    const entry = map.get(key);
    if (!entry) {
        return undefined;
    }
    if (Date.now() - entry.cachedAt > PATH_CACHE_TTL_MS) {
        map.delete(key);
        return undefined;
    }
    return entry.value;
}
function pathCacheSet(map, key, value) {
    map.set(key, { value, cachedAt: Date.now() });
    trimPathCache(map);
}
function truncateStderrSnippet(stderr) {
    const t = stderr.trim();
    if (t.length <= STDERR_LOG_MAX_CHARS) {
        return t;
    }
    return `${t.slice(0, STDERR_LOG_MAX_CHARS)}…`;
}
function redactArgsForLog(args) {
    return args
        .map((t) => {
        if (/^[A-Za-z]:[\\/]/.test(t) || (t.startsWith('/') && t.length > 1)) {
            return '<abs-path>';
        }
        if (t.includes(path.sep) && t.length > 32) {
            return '<path>';
        }
        return t;
    })
        .join(' ');
}
function logCommandProblem(kind, command, args, detail) {
    const parts = [`[crawler] ${kind}:`, command, redactArgsForLog(args)];
    if (detail.code !== undefined && detail.code !== null) {
        parts.push(`exit=${String(detail.code)}`);
    }
    if (detail.stderr && detail.stderr.length > 0) {
        parts.push(truncateStderrSnippet(detail.stderr));
    }
    // eslint-disable-next-line no-console -- intentional diagnostics for git/rg failures
    console.warn(parts.join(' '));
}
function withSafeGitConfig(args) {
    return [
        '-c',
        'core.fsmonitor=false',
        '-c',
        'core.untrackedCache=false',
        ...args,
    ];
}
function canonicalStatePath(p) {
    return toPosixPath(path.resolve(p));
}
function getStateKey(options) {
    return [
        canonicalStatePath(options.crawlDirectory),
        canonicalStatePath(options.cwd),
        options.ignore.getFingerprint(),
        options.useGitignore === false ? 'no-gitignore' : 'gitignore',
        options.maxDepth === undefined ? 'undefined' : String(options.maxDepth),
        options.maxFiles === undefined ? 'undefined' : String(options.maxFiles),
    ].join('|');
}
function isThrottled(stateKey) {
    const last = lastRebuildTime.get(stateKey);
    if (last === undefined)
        return false;
    return Date.now() - last < THROTTLE_MS;
}
function recordRebuild(stateKey) {
    lastRebuildTime.set(stateKey, Date.now());
}
const changeStateMap = new Map();
const resolveGitDirCache = new Map();
function evictChangeStateIfNeeded() {
    while (changeStateMap.size >= MAX_CHANGE_STATE_ENTRIES) {
        const oldest = changeStateMap.keys().next().value;
        if (oldest === undefined) {
            break;
        }
        changeStateMap.delete(oldest);
        lastRebuildTime.delete(oldest);
    }
}
function resolveGitDir(crawlDirectory) {
    const cacheKey = canonicalStatePath(crawlDirectory);
    const cached = pathCacheGet(resolveGitDirCache, cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    let current = crawlDirectory;
    while (current) {
        const gitPath = path.join(current, '.git');
        try {
            const stat = fs.statSync(gitPath);
            if (stat.isDirectory()) {
                pathCacheSet(resolveGitDirCache, cacheKey, gitPath);
                return gitPath;
            }
            if (stat.isFile()) {
                const contents = fs.readFileSync(gitPath, 'utf8').trim();
                const match = contents.match(/^gitdir:\s*(.+)$/i);
                if (!match) {
                    pathCacheSet(resolveGitDirCache, cacheKey, null);
                    return null;
                }
                const resolvedGitDir = match[1].trim();
                let resolvedAbs = path.isAbsolute(resolvedGitDir)
                    ? path.resolve(resolvedGitDir)
                    : path.resolve(current, resolvedGitDir);
                try {
                    resolvedAbs = fs.realpathSync(resolvedAbs);
                    try {
                        fs.statSync(path.join(resolvedAbs, 'HEAD'));
                    }
                    catch {
                        fs.statSync(path.join(resolvedAbs, 'index'));
                    }
                }
                catch {
                    pathCacheSet(resolveGitDirCache, cacheKey, null);
                    return null;
                }
                pathCacheSet(resolveGitDirCache, cacheKey, resolvedAbs);
                return resolvedAbs;
            }
        }
        catch (error) {
            const errno = error;
            if (errno.code !== 'ENOENT') {
                pathCacheSet(resolveGitDirCache, cacheKey, null);
                return null;
            }
        }
        const parent = path.dirname(current);
        if (parent === current) {
            break;
        }
        current = parent;
    }
    pathCacheSet(resolveGitDirCache, cacheKey, null);
    return null;
}
function getGitRootMtime(crawlDirectory) {
    try {
        const gitDir = resolveGitDir(crawlDirectory);
        if (!gitDir) {
            return null;
        }
        const indexPath = path.join(gitDir, 'index');
        const indexStat = fs.statSync(indexPath);
        return indexStat.mtimeMs;
    }
    catch {
        // Ignore errors when .git metadata or index file doesn't exist.
    }
    return null;
}
function hasFileListChanged(stateKey, crawlDirectory) {
    const currentMtime = getGitRootMtime(crawlDirectory);
    const state = changeStateMap.get(stateKey);
    if (!state)
        return true;
    if (currentMtime !== null && state.gitRootMtimeMs !== null) {
        // `currentMtime > state.gitRootMtimeMs` is handled in `crawl()` via
        // `scanWorkingTreeForChange` so a mere index touch (e.g. `git status`)
        // does not always force a full `ls-files --cached` re-listing.
        return currentMtime < state.gitRootMtimeMs || !isThrottled(stateKey);
    }
    // For non-git paths, we can only rely on time-based throttling.
    if (currentMtime === null && state.gitRootMtimeMs === null) {
        return !isThrottled(stateKey);
    }
    return true;
}
function refreshChangeStateGitMtime(stateKey, crawlDirectory) {
    const state = changeStateMap.get(stateKey);
    if (!state) {
        return;
    }
    const mtime = getGitRootMtime(crawlDirectory);
    changeStateMap.set(stateKey, {
        ...state,
        gitRootMtimeMs: mtime,
    });
}
function updateChangeState(stateKey, crawlDirectory, fileList, untrackedFiles, deletedFiles) {
    evictChangeStateIfNeeded();
    const mtime = getGitRootMtime(crawlDirectory);
    changeStateMap.set(stateKey, {
        gitRootMtimeMs: mtime,
        untrackedFingerprint: untrackedFiles === undefined
            ? null
            : computeLinesFingerprint(untrackedFiles),
        deletedFingerprint: deletedFiles === undefined ? null : computeLinesFingerprint(deletedFiles),
        fileList,
    });
}
function computeLinesFingerprint(lines) {
    let hash = 5381;
    for (const line of lines) {
        for (let i = 0; i < line.length; i++) {
            hash = ((hash << 5) + hash + line.charCodeAt(i)) >>> 0;
        }
        hash = ((hash << 5) + hash + 10) >>> 0;
    }
    return `${lines.length}:${hash}`;
}
function runCommand(command, args, cwd, timeoutMs = 20_000, options) {
    const collectLines = options?.collectLines !== false;
    return new Promise((resolve) => {
        const lines = [];
        let settled = false;
        let timedOut = false;
        let killedByLimit = false;
        let streamBuffer = '';
        let streamedLineCount = 0;
        const finalize = (success, resultLines) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve({ success, lines: resultLines });
        };
        let stderrBuf = '';
        let child;
        try {
            child = spawn(command, args, {
                cwd,
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe'],
                ...(command === 'git'
                    ? {
                        env: {
                            ...process.env,
                            GIT_DIR: undefined,
                            GIT_WORK_TREE: undefined,
                            GIT_INDEX_FILE: undefined,
                        },
                    }
                    : {}),
            });
        }
        catch (err) {
            if (!options?.silentOnFailure) {
                logCommandProblem('command spawn threw', command, args, {
                    stderr: err instanceof Error ? err.message : String(err),
                });
            }
            finalize(false, []);
            return;
        }
        if (child.stderr) {
            child.stderr.setEncoding('utf8');
            child.stderr.on('data', (chunk) => {
                if (stderrBuf.length < STDERR_LOG_MAX_CHARS) {
                    stderrBuf += chunk;
                    if (stderrBuf.length > STDERR_LOG_MAX_CHARS) {
                        stderrBuf = stderrBuf.slice(0, STDERR_LOG_MAX_CHARS);
                    }
                }
            });
        }
        const stopProcess = () => {
            if (child.killed) {
                return;
            }
            try {
                child.kill();
            }
            catch {
                // Ignore kill failures.
            }
        };
        const processLine = (line) => {
            const normalized = line.endsWith('\r') ? line.slice(0, -1) : line;
            if (normalized.length === 0) {
                return true;
            }
            if (options?.onLine && !options.onLine(normalized)) {
                killedByLimit = true;
                stopProcess();
                return false;
            }
            if (collectLines) {
                lines.push(normalized);
            }
            streamedLineCount++;
            const yieldEvery = options?.yieldEveryLines;
            if (yieldEvery !== undefined &&
                yieldEvery > 0 &&
                streamedLineCount % yieldEvery === 0 &&
                child.stdout &&
                typeof child.stdout.pause === 'function') {
                child.stdout.pause();
                setImmediate(() => {
                    try {
                        child.stdout?.resume();
                    }
                    catch {
                        // Stream may already be closed.
                    }
                });
            }
            return true;
        };
        const processChunk = (chunk) => {
            streamBuffer += chunk;
            const delim = options?.recordDelimiter ?? '\n';
            if (delim === '\0') {
                while (true) {
                    const idx = streamBuffer.indexOf('\0');
                    if (idx === -1) {
                        break;
                    }
                    const record = streamBuffer.slice(0, idx);
                    streamBuffer = streamBuffer.slice(idx + 1);
                    if (!processLine(record)) {
                        break;
                    }
                }
                return;
            }
            while (true) {
                const newlineIndex = streamBuffer.indexOf('\n');
                if (newlineIndex === -1) {
                    break;
                }
                const line = streamBuffer.slice(0, newlineIndex);
                streamBuffer = streamBuffer.slice(newlineIndex + 1);
                if (!processLine(line)) {
                    break;
                }
            }
        };
        const flushRemainder = () => {
            if (streamBuffer.length === 0) {
                return;
            }
            processLine(streamBuffer);
            streamBuffer = '';
        };
        let timeout;
        if (timeoutMs > 0) {
            timeout = setTimeout(() => {
                timedOut = true;
                stopProcess();
            }, timeoutMs);
        }
        child.stdout.setEncoding('utf8');
        child.stdout.on('data', (chunk) => {
            processChunk(chunk);
        });
        child.on('error', (err) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (!options?.silentOnFailure) {
                logCommandProblem('command spawn failed', command, args, {
                    stderr: `${String(err.code ?? '')} ${String(err)}`.trim(),
                });
            }
            finalize(false, []);
        });
        child.on('close', (code) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (killedByLimit) {
                finalize(true, lines);
                return;
            }
            if (timedOut) {
                if (!options?.silentOnFailure) {
                    logCommandProblem('command timed out', command, args, {
                        code,
                        stderr: stderrBuf,
                    });
                }
                finalize(false, []);
                return;
            }
            flushRemainder();
            const ok = code === 0;
            if (!ok && !options?.silentOnFailure) {
                logCommandProblem('command failed', command, args, {
                    code,
                    stderr: stderrBuf,
                });
            }
            finalize(ok, ok ? lines : []);
        });
    });
}
let commandRunner = runCommand;
export function __setCommandRunnerForTests(runner) {
    commandRunner = runner ?? runCommand;
}
export function __resetCrawlerStateForTests() {
    lastRebuildTime.clear();
    changeStateMap.clear();
    resolveGitDirCache.clear();
}
function normalizePath(p) {
    return toPosixPath(p);
}
function getPosixRelative(from, to) {
    const fromResolved = path.resolve(from);
    const toResolved = path.resolve(to);
    let fromAbs = fromResolved;
    let toAbs = toResolved;
    try {
        fromAbs = fs.realpathSync(fromResolved);
    }
    catch {
        // Path may not exist; keep resolved form for best-effort relativity.
    }
    try {
        toAbs = fs.realpathSync(toResolved);
    }
    catch {
        // Path may not exist; keep resolved form for best-effort relativity.
    }
    const relative = path.relative(fromAbs, toAbs);
    const posixRel = toPosixPath(relative);
    return posixRel === '' ? '.' : posixRel;
}
function isValidIgnorePath(relativePath) {
    if (!relativePath || relativePath === '.') {
        return false;
    }
    if (path.posix.isAbsolute(relativePath)) {
        return false;
    }
    return (relativePath !== '..' &&
        !relativePath.startsWith('../') &&
        !relativePath.includes('/../'));
}
/** Relative path from crawl root for ignore checks; avoids symlink canonicalization (fdir hot path). */
function toFdirExcludeRelativePath(crawlDirectory, dirPath) {
    const base = path.resolve(crawlDirectory);
    const absoluteCandidate = path.isAbsolute(dirPath)
        ? dirPath
        : path.join(base, dirPath);
    let rel = path.relative(base, absoluteCandidate);
    rel = toPosixPath(rel);
    if (!rel || rel.startsWith('..') || path.posix.isAbsolute(rel)) {
        return null;
    }
    return isValidIgnorePath(rel) ? rel : null;
}
function getEntryDepth(entry) {
    if (entry === '.') {
        return -1;
    }
    const withoutTrailingSlash = entry.endsWith('/') ? entry.slice(0, -1) : entry;
    if (withoutTrailingSlash.length === 0) {
        return -1;
    }
    return withoutTrailingSlash.split('/').length - 1;
}
function stripCrawlDirectoryPrefix(entry, relativeToCrawlDir) {
    if (entry === '.' ||
        relativeToCrawlDir === '' ||
        relativeToCrawlDir === '.') {
        return entry;
    }
    const prefix = relativeToCrawlDir.endsWith('/')
        ? relativeToCrawlDir
        : `${relativeToCrawlDir}/`;
    if (entry === relativeToCrawlDir) {
        return '.';
    }
    if (entry.startsWith(prefix)) {
        return entry.slice(prefix.length) || '.';
    }
    return entry;
}
/**
 * Applies depth limits and ignore rules. Git/rg streaming may add paths that are
 * dropped here by depth while still contributing parent directory rows via
 * `buildResultsFromFileSet`; optional `prevalidatedFiles` skips redundant ignore
 * checks for streamed paths already accepted into `fileSet`.
 */
function applyFilters(results, options, relativeToCrawlDir, prevalidatedFiles) {
    const maxDepth = options.maxDepth;
    const dirFilter = options.ignore.getDirectoryFilter();
    const fileFilter = options.ignore.getFileFilter();
    return results.filter((p) => {
        if (maxDepth !== undefined && p !== '.') {
            const crawlRootRelativeEntry = relativeToCrawlDir
                ? stripCrawlDirectoryPrefix(p, relativeToCrawlDir)
                : p;
            if (getEntryDepth(crawlRootRelativeEntry) > maxDepth) {
                return false;
            }
        }
        if (p === '.')
            return true;
        if (p.endsWith('/')) {
            if (!isValidIgnorePath(p.slice(0, -1))) {
                return false;
            }
            return !dirFilter(p);
        }
        if (prevalidatedFiles?.has(p)) {
            return true;
        }
        if (!isValidIgnorePath(p)) {
            return false;
        }
        if (isUnderIgnoredDirectory(p, dirFilter)) {
            return false;
        }
        return !fileFilter(p);
    });
}
function isUnderIgnoredDirectory(filePath, dirFilter) {
    const parts = filePath.split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
        current = current ? `${current}/${parts[i]}` : parts[i];
        if (dirFilter(`${current}/`)) {
            return true;
        }
    }
    return false;
}
const YIELD_INTERVAL = 1000;
async function maybeYield(index) {
    if (index > 0 && index % YIELD_INTERVAL === 0) {
        await new Promise((resolve) => setImmediate(resolve));
    }
}
async function findGitRoot(dir) {
    const result = await commandRunner('git', withSafeGitConfig(['rev-parse', '--show-toplevel']), dir, 5_000, { silentOnFailure: true });
    if (!result.success || result.lines.length === 0)
        return null;
    return normalizePath(result.lines[0]);
}
function shouldIncludeFile(filePath, dirFilter, fileFilter) {
    if (!isValidIgnorePath(filePath)) {
        return false;
    }
    if (isUnderIgnoredDirectory(filePath, dirFilter)) {
        return false;
    }
    if (fileFilter(filePath)) {
        return false;
    }
    return true;
}
function hasReachedFileBudget(fileCount, maxFiles) {
    return maxFiles !== undefined && fileCount >= maxFiles;
}
function shouldCountTowardBudget(fullPath, relativeToCrawlDir, maxDepth) {
    if (maxDepth === undefined) {
        return true;
    }
    const crawlRootRelativeEntry = stripCrawlDirectoryPrefix(fullPath, relativeToCrawlDir);
    return getEntryDepth(crawlRootRelativeEntry) <= maxDepth;
}
async function listUntrackedFiles(gitRoot, relativeToGitRoot, useGitignore) {
    // Global `--literal-pathspecs` (before `ls-files`) matches Git CLI expectations on Windows;
    // pathspec characters are then treated literally for optional trailing paths.
    const untrackedArgs = ['--literal-pathspecs', 'ls-files', '-z', '--others'];
    if (useGitignore) {
        untrackedArgs.push('--exclude-standard');
    }
    if (relativeToGitRoot && relativeToGitRoot !== '.') {
        untrackedArgs.push(relativeToGitRoot);
    }
    const untrackedResult = await commandRunner('git', withSafeGitConfig(untrackedArgs), gitRoot, 10_000, { silentOnFailure: true, recordDelimiter: '\0' });
    if (!untrackedResult.success) {
        return null;
    }
    return untrackedResult.lines.map((file) => normalizePath(file));
}
async function listDeletedTrackedFiles(gitRoot, relativeToGitRoot) {
    const deletedArgs = ['--literal-pathspecs', 'ls-files', '-z', '--deleted'];
    if (relativeToGitRoot && relativeToGitRoot !== '.') {
        deletedArgs.push(relativeToGitRoot);
    }
    const deletedResult = await commandRunner('git', withSafeGitConfig(deletedArgs), gitRoot, 10_000, { silentOnFailure: true, recordDelimiter: '\0' });
    if (!deletedResult.success) {
        return null;
    }
    return deletedResult.lines.map((file) => normalizePath(file));
}
async function scanWorkingTreeForChange(state, crawlDirectory, useGitignore) {
    if (state.gitRootMtimeMs === null &&
        state.untrackedFingerprint === null &&
        state.deletedFingerprint === null) {
        return { changed: false };
    }
    const gitRoot = await findGitRoot(crawlDirectory);
    if (state.untrackedFingerprint === null &&
        state.deletedFingerprint === null) {
        return gitRoot ? { changed: true } : { changed: false };
    }
    if (!gitRoot) {
        return { changed: true };
    }
    const relativeToGitRoot = getPosixRelative(gitRoot, crawlDirectory);
    const [untrackedFiles, deletedFiles] = await Promise.all([
        listUntrackedFiles(gitRoot, relativeToGitRoot, useGitignore),
        listDeletedTrackedFiles(gitRoot, relativeToGitRoot),
    ]);
    if (untrackedFiles === null || deletedFiles === null) {
        return { changed: true };
    }
    const changed = computeLinesFingerprint(untrackedFiles) !== state.untrackedFingerprint ||
        computeLinesFingerprint(deletedFiles) !== state.deletedFingerprint;
    if (!changed) {
        return { changed: false };
    }
    return {
        changed: true,
        prefetch: { gitRoot, untrackedFiles, deletedFiles },
    };
}
function posixPathUnderGitRoot(normalizedFile, relativeToGitRoot, relativeToCrawlDir, normGitRoot, normCrawlDir) {
    const nf = normalizeGitPath(normalizedFile, false);
    if (relativeToGitRoot && relativeToGitRoot !== '.') {
        const rest = sliceAfterGitPathspecPrefix(nf, normGitRoot);
        if (rest !== null) {
            return path.posix.join(normCrawlDir, rest);
        }
        if (equalsRepoRelativeCaseAware(nf, normGitRoot)) {
            const base = nf.replace(/\/+$/, '');
            return `${base}/`;
        }
        const nfFile = nf.replace(/\/+$/, '');
        return path.posix.join(normCrawlDir, nfFile);
    }
    return path.posix.join(normCrawlDir, nf.replace(/\/+$/, ''));
}
async function crawlWithGitLsFiles(stateKey, crawlDirectory, cwd, options, workingTreePrefetch) {
    let gitRoot;
    let untrackedFiles;
    let deletedFiles;
    if (workingTreePrefetch) {
        gitRoot = workingTreePrefetch.gitRoot;
        untrackedFiles = workingTreePrefetch.untrackedFiles;
        deletedFiles = workingTreePrefetch.deletedFiles;
    }
    else {
        gitRoot = await findGitRoot(crawlDirectory);
        if (!gitRoot) {
            return { success: false, files: [], gitRepoListingFailed: false };
        }
        const relativeToGitRootForLists = getPosixRelative(gitRoot, crawlDirectory);
        const lists = await Promise.all([
            listUntrackedFiles(gitRoot, relativeToGitRootForLists, options.useGitignore !== false),
            listDeletedTrackedFiles(gitRoot, relativeToGitRootForLists),
        ]);
        untrackedFiles = lists[0];
        deletedFiles = lists[1];
    }
    if (!gitRoot) {
        return { success: false, files: [], gitRepoListingFailed: false };
    }
    if (!workingTreePrefetch &&
        (untrackedFiles === null || deletedFiles === null)) {
        return { success: false, files: [], gitRepoListingFailed: true };
    }
    const relativeToCrawlDir = getPosixRelative(cwd, crawlDirectory);
    const relativeToGitRoot = getPosixRelative(gitRoot, crawlDirectory);
    const normGitRoot = normalizeGitPath(relativeToGitRoot, true);
    const normCrawlDir = normalizeGitPath(relativeToCrawlDir, true);
    const dirFilter = options.ignore.getDirectoryFilter();
    const fileFilter = options.ignore.getFileFilter();
    // Avoid `-z` with `-t`: record shape for `ls-files -t` + `-z` is not stable across Git
    // versions; newline-delimited output is fine here (index paths cannot contain newlines).
    const trackedArgs = ['--literal-pathspecs', 'ls-files', '--cached'];
    trackedArgs.push('-t');
    if (relativeToGitRoot && relativeToGitRoot !== '.') {
        trackedArgs.push(relativeToGitRoot);
    }
    const deletedSet = new Set(deletedFiles);
    const fileSet = new Set();
    let budgetedFileCount = 0;
    const parseTrackedLine = (line) => {
        if (line.length === 0) {
            return null;
        }
        // `git ls-files -t` emits "<status><one separator char><path>" (space or tab).
        // Do not trim further — the path may start with spaces.
        if (line.length >= 3 && /\s/.test(line[1]) && /[A-Za-z]/.test(line[0])) {
            return { status: line[0].toUpperCase(), filePath: line.slice(2) };
        }
        return { status: null, filePath: line };
    };
    const processTrackedFile = (file) => {
        if (hasReachedFileBudget(budgetedFileCount, options.maxFiles)) {
            return false;
        }
        const parsed = parseTrackedLine(file);
        if (!parsed) {
            return true;
        }
        if (parsed.status === 'S') {
            return true;
        }
        const normalizedFile = normalizePath(parsed.filePath);
        if (deletedSet.has(normalizedFile)) {
            return true;
        }
        if (relativeToGitRoot &&
            relativeToGitRoot !== '.' &&
            normalizedFile === relativeToGitRoot) {
            return true;
        }
        const fullPath = posixPathUnderGitRoot(normalizedFile, relativeToGitRoot, relativeToCrawlDir, normGitRoot, normCrawlDir);
        if (!shouldIncludeFile(fullPath, dirFilter, fileFilter)) {
            return true;
        }
        const before = fileSet.size;
        fileSet.add(fullPath);
        if (fileSet.size > before &&
            shouldCountTowardBudget(fullPath, relativeToCrawlDir, options.maxDepth)) {
            budgetedFileCount++;
        }
        return !hasReachedFileBudget(budgetedFileCount, options.maxFiles);
    };
    const trackedResult = await commandRunner('git', withSafeGitConfig(trackedArgs), gitRoot, 20_000, {
        collectLines: false,
        onLine: processTrackedFile,
        yieldEveryLines: YIELD_INTERVAL,
    });
    if (!trackedResult.success) {
        return { success: false, files: [], gitRepoListingFailed: true };
    }
    // Test doubles may return `lines` without streaming `onLine`; drain any leftovers.
    for (const file of trackedResult.lines) {
        if (!processTrackedFile(file)) {
            break;
        }
    }
    let count = 0;
    if (untrackedFiles !== null) {
        for (const normalizedFile of untrackedFiles) {
            if (hasReachedFileBudget(budgetedFileCount, options.maxFiles)) {
                break;
            }
            await maybeYield(count++);
            const fullPath = posixPathUnderGitRoot(normalizedFile, relativeToGitRoot, relativeToCrawlDir, normGitRoot, normCrawlDir);
            if (!shouldIncludeFile(fullPath, dirFilter, fileFilter)) {
                continue;
            }
            if (!fileSet.has(fullPath)) {
                fileSet.add(fullPath);
                if (shouldCountTowardBudget(fullPath, relativeToCrawlDir, options.maxDepth)) {
                    budgetedFileCount++;
                }
            }
        }
    }
    const results = buildResultsFromFileSet(fileSet);
    const filteredResults = applyFilters(results, options, relativeToCrawlDir, fileSet);
    const limitedResults = applyMaxFilesLimit(filteredResults, options.maxFiles);
    updateChangeState(stateKey, crawlDirectory, limitedResults, untrackedFiles === null ? undefined : untrackedFiles, deletedFiles === null ? undefined : deletedFiles);
    recordRebuild(stateKey);
    return { success: true, files: limitedResults };
}
function buildResultsFromFileSet(files) {
    const dirSet = new Set();
    for (const file of files) {
        const parts = file.split('/');
        let current = '';
        for (let i = 0; i < parts.length - 1; i++) {
            current = current ? current + '/' + parts[i] : parts[i];
            dirSet.add(current + '/');
        }
    }
    return ['.', ...Array.from(dirSet), ...Array.from(files)];
}
async function crawlWithRipgrep(stateKey, crawlDirectory, cwd, options) {
    const rgArgs = ['--files', '--no-require-git', '--hidden'];
    if (options.useGitignore === false) {
        rgArgs.push('--no-ignore');
    }
    const relativeToCrawlDir = getPosixRelative(cwd, crawlDirectory);
    const dirFilter = options.ignore.getDirectoryFilter();
    const fileFilter = options.ignore.getFileFilter();
    const fileSet = new Set();
    let budgetedFileCount = 0;
    const processRgFile = (file) => {
        if (hasReachedFileBudget(budgetedFileCount, options.maxFiles)) {
            return false;
        }
        const normalizedFile = normalizePath(file);
        const fullPath = path.posix.join(relativeToCrawlDir, normalizedFile);
        if (!shouldIncludeFile(fullPath, dirFilter, fileFilter)) {
            return true;
        }
        const before = fileSet.size;
        fileSet.add(fullPath);
        if (fileSet.size > before &&
            shouldCountTowardBudget(fullPath, relativeToCrawlDir, options.maxDepth)) {
            budgetedFileCount++;
        }
        return !hasReachedFileBudget(budgetedFileCount, options.maxFiles);
    };
    const rgResult = await commandRunner('rg', rgArgs, crawlDirectory, 20_000, {
        collectLines: false,
        onLine: processRgFile,
    });
    if (!rgResult.success) {
        return { success: false, files: [] };
    }
    for (const file of rgResult.lines) {
        if (!processRgFile(file)) {
            break;
        }
    }
    const results = buildResultsFromFileSet(fileSet);
    const filteredResults = applyFilters(results, options, relativeToCrawlDir, fileSet);
    const limitedResults = applyMaxFilesLimit(filteredResults, options.maxFiles);
    updateChangeState(stateKey, crawlDirectory, limitedResults);
    recordRebuild(stateKey);
    return { success: true, files: limitedResults };
}
async function crawlWithFdir(options) {
    const relativeToCrawlDir = getPosixRelative(options.cwd, options.crawlDirectory);
    let results;
    try {
        const dirFilter = options.ignore.getDirectoryFilter();
        const fileFilter = options.ignore.getFileFilter();
        const api = new fdir()
            .withRelativePaths()
            .withDirs()
            .withPathSeparator('/')
            .exclude((_excludedName, dirPath) => {
            const relativePath = toFdirExcludeRelativePath(options.crawlDirectory, dirPath);
            if (!relativePath) {
                return false;
            }
            return dirFilter(`${relativePath}/`);
        })
            .filter((filePath, isDirectory) => {
            if (isDirectory)
                return true;
            const cwdRelative = path.posix.join(relativeToCrawlDir, filePath);
            if (!isValidIgnorePath(cwdRelative)) {
                return false;
            }
            return !fileFilter(cwdRelative);
        });
        if (options.maxDepth !== undefined) {
            api.withMaxDepth(options.maxDepth);
        }
        // Do not pass `maxFiles` into fdir: it caps raw walk entries (often
        // directories first), which can yield no file paths. `crawl()` applies
        // `applyMaxFilesLimit` after this path, matching git/rg semantics.
        results = await api.crawl(options.crawlDirectory).withPromise();
    }
    catch {
        return [];
    }
    // fdir `withDirs()` already emits directory rows with trailing slashes. Do not
    // run `buildResultsFromFileSet` here — it would duplicate every directory
    // (it also synthesizes parents from file paths). Git/rg only list files and
    // need that helper; fdir does not.
    const mapped = results
        .filter((p) => p.length > 0 && p !== '.')
        .map((p) => path.posix.join(relativeToCrawlDir, p));
    // Align with git/rg: include the crawl root as a directory row when it is not
    // the project cwd (fdir walks inside `crawlDirectory` and never emits that row).
    if (relativeToCrawlDir !== '.') {
        const rootDir = relativeToCrawlDir.endsWith('/')
            ? relativeToCrawlDir
            : `${relativeToCrawlDir}/`;
        if (!mapped.includes(rootDir)) {
            return [rootDir, ...mapped];
        }
    }
    return mapped;
}
export async function crawl(options) {
    const stateKey = getStateKey(options);
    const cacheKey = options.cache
        ? cache.getCacheKey(canonicalStatePath(options.crawlDirectory), options.ignore.getFingerprint(), options.maxDepth, options.maxFiles, options.useGitignore !== false)
        : undefined;
    if (options.cache) {
        const cachedResults = cache.read(cacheKey);
        if (cachedResults) {
            return cachedResults;
        }
    }
    let workingTreePrefetch;
    // Typical callers (see `fileSearch.ts`) pass `cache: true` and rely on the TTL
    // crawlCache only. This branch is for tests and any caller that sets
    // `cache: false`: it keeps an in-memory snapshot plus git index / untracked
    // fingerprints to avoid redundant subprocess work within the throttle window.
    if (!options.cache) {
        const state = changeStateMap.get(stateKey);
        if (state) {
            const currentMtime = getGitRootMtime(options.crawlDirectory);
            const indexNewerThanState = currentMtime !== null &&
                state.gitRootMtimeMs !== null &&
                currentMtime > state.gitRootMtimeMs;
            if (indexNewerThanState) {
                const scan = await scanWorkingTreeForChange(state, options.crawlDirectory, options.useGitignore !== false);
                if (!scan.changed) {
                    refreshChangeStateGitMtime(stateKey, options.crawlDirectory);
                    return state.fileList;
                }
                workingTreePrefetch = scan.prefetch;
            }
            else if (!hasFileListChanged(stateKey, options.crawlDirectory)) {
                const scan = await scanWorkingTreeForChange(state, options.crawlDirectory, options.useGitignore !== false);
                if (!scan.changed) {
                    return state.fileList;
                }
                workingTreePrefetch = scan.prefetch;
            }
        }
    }
    const gitResult = await crawlWithGitLsFiles(stateKey, options.crawlDirectory, options.cwd, options, workingTreePrefetch);
    if (gitResult.success) {
        const results = gitResult.files;
        if (options.cache) {
            cache.write(cacheKey, results, options.cacheTtl * 1000);
        }
        return results;
    }
    if (gitResult.gitRepoListingFailed) {
        // eslint-disable-next-line no-console -- operator-visible crawl strategy degradation
        console.warn('[crawler] falling back to ripgrep (git ls-files unavailable)');
    }
    const rgResult = await crawlWithRipgrep(stateKey, options.crawlDirectory, options.cwd, options);
    if (rgResult.success) {
        const results = rgResult.files;
        if (options.cache) {
            cache.write(cacheKey, results, options.cacheTtl * 1000);
        }
        return results;
    }
    // Ripgrep failed — fdir is the slowest crawl path (including non-git trees).
    // eslint-disable-next-line no-console -- operator-visible crawl strategy degradation
    console.warn('[crawler] falling back to fdir (ripgrep unavailable)');
    const relativeToCrawlDirForFdir = getPosixRelative(options.cwd, options.crawlDirectory);
    let fdirResults = await crawlWithFdir(options);
    fdirResults = applyFilters(fdirResults, options, relativeToCrawlDirForFdir);
    // Match git/rg list shape (`'.'` first) so `maxFiles` caps the same row count
    // (including `.`) as the tracked-file paths.
    if (fdirResults.length === 0) {
        fdirResults = ['.'];
    }
    else if (fdirResults[0] !== '.') {
        fdirResults = ['.', ...fdirResults];
    }
    const limitedResults = applyMaxFilesLimit(fdirResults, options.maxFiles);
    updateChangeState(stateKey, options.crawlDirectory, limitedResults);
    recordRebuild(stateKey);
    if (options.cache) {
        cache.write(cacheKey, limitedResults, options.cacheTtl * 1000);
    }
    return limitedResults;
}
/**
 * Caps the number of listed entries. When the caller passes a small `maxFiles`,
 * the naive prefix slice can contain only `.` and synthetic directory rows
 * before the first file path; in that case we extend through the first file row
 * so the crawl does not return an empty-looking tree (see crawler tests).
 */
function applyMaxFilesLimit(results, maxFiles) {
    if (maxFiles === undefined || results.length <= maxFiles) {
        return results;
    }
    const clipped = results.slice(0, maxFiles);
    const rowIsFile = (e) => e !== '.' && !e.endsWith('/');
    if (clipped.some(rowIsFile)) {
        return clipped;
    }
    const firstFileIdx = results.findIndex(rowIsFile);
    if (firstFileIdx === -1) {
        return clipped;
    }
    return results.slice(0, firstFileIdx + 1);
}
//# sourceMappingURL=crawler.js.map