/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderExternalContext } from './context.js';
import { loadConfig } from './config.js';
import { installEnvironmentProxy } from './proxy.js';
import { createProvider } from './providers.js';
const MAX_HOOK_INPUT_BYTES = 1024 * 1024;
const MAX_AUTO_QUERY_CHARACTERS = 512;
const HOOK_WALL_CLOCK_TIMEOUT_MS = 6500;
// Bounds the input before the redaction regexes run. Only
// MAX_AUTO_QUERY_CHARACTERS code points survive, and capping the work here
// keeps a worst-case prompt from driving the assignment regex into quadratic
// backtracking that would block the event loop past the wall-clock budget.
const MAX_SANITIZER_INPUT_CHARACTERS = 4096;
// The secret keyword must belong to the name that owns the separator, so a
// preceding prose label cannot claim the match and a secret word used as
// ordinary prose is not redacted.
const SECRET_ASSIGNMENT_PATTERN = /["']?[A-Za-z0-9_.-]*(?:api[_-]?key|token|password|secret)[A-Za-z0-9_.-]*["']?[^\S\r\n]*[:=][^\S\r\n]*(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;]+)?/gi;
export async function runAutoRecall(value, env = process.env, signal = new AbortController().signal) {
    const input = parseHookInput(value);
    if (!input) {
        return {};
    }
    const config = await loadConfig(env);
    if (config.version !== 2) {
        return {};
    }
    const cwd = await resolveDirectory(input.cwd);
    if (!isWithin(config.autoRecall.repositoryRoot, cwd)) {
        return {};
    }
    const query = createAutoRecallQuery(input.submittedPrompt, providerCredential(config.provider));
    if (!query) {
        return {};
    }
    const dispatcher = installEnvironmentProxy();
    try {
        const provider = createProvider(config.provider);
        const items = await provider.search({
            query,
            limit: 5,
            signal: AbortSignal.any([
                signal,
                AbortSignal.timeout(config.autoRecall.timeoutMs),
            ]),
        });
        if (items.length === 0) {
            return {};
        }
        return {
            hookSpecificOutput: {
                hookEventName: 'UserPromptSubmit',
                additionalContext: renderExternalContext(items),
            },
        };
    }
    finally {
        await dispatcher.destroy();
    }
}
export function createAutoRecallQuery(submittedPrompt, credential) {
    let query = submittedPrompt;
    if (query.length > MAX_SANITIZER_INPUT_CHARACTERS) {
        query = Array.from(query).slice(0, MAX_SANITIZER_INPUT_CHARACTERS).join('');
    }
    query = query
        .replace(/(```|~~~)[\s\S]*?\1/g, ' ')
        .replace(/(?:```|~~~)[\s\S]*$/g, ' ');
    if (credential) {
        query = query.replaceAll(credential, ' ');
    }
    query = query
        .replace(SECRET_ASSIGNMENT_PATTERN, ' ')
        .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, ' ')
        .replace(/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, ' ')
        .replace(/\b[A-Za-z0-9_-]{32,}\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!query) {
        return undefined;
    }
    return Array.from(query).slice(0, MAX_AUTO_QUERY_CHARACTERS).join('');
}
export async function runAutoRecallCli(inputStream = process.stdin, outputStream = process.stdout, env = process.env) {
    const controller = new AbortController();
    let timeout;
    const timedOut = new Promise((resolveTimeout) => {
        timeout = setTimeout(() => {
            controller.abort();
            inputStream.destroy?.();
            resolveTimeout({});
        }, HOOK_WALL_CLOCK_TIMEOUT_MS);
    });
    const work = (async () => {
        const input = await readHookInput(inputStream);
        return input === undefined
            ? {}
            : runAutoRecall(input, env, controller.signal);
    })().catch(() => ({}));
    const output = await Promise.race([work, timedOut]);
    controller.abort();
    if (timeout !== undefined) {
        clearTimeout(timeout);
    }
    outputStream.write(JSON.stringify(output));
}
async function readHookInput(inputStream) {
    const chunks = [];
    let total = 0;
    for await (const source of inputStream) {
        const chunk = Buffer.from(source);
        total += chunk.byteLength;
        if (total > MAX_HOOK_INPUT_BYTES) {
            return undefined;
        }
        chunks.push(chunk);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
    catch {
        return undefined;
    }
}
function parseHookInput(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    const hookEventName = value['hook_event_name'];
    const submittedPrompt = value['submitted_prompt'];
    const cwd = value['cwd'];
    if (hookEventName !== 'UserPromptSubmit' ||
        typeof submittedPrompt !== 'string' ||
        submittedPrompt.trim().length === 0 ||
        typeof cwd !== 'string') {
        return undefined;
    }
    return { hook_event_name: hookEventName, submittedPrompt, cwd };
}
async function resolveDirectory(value) {
    if (!isAbsolute(value)) {
        throw new Error('Hook working directory is invalid.');
    }
    const resolved = await realpath(value);
    if (!(await stat(resolved)).isDirectory()) {
        throw new Error('Hook working directory is invalid.');
    }
    return resolved;
}
function isWithin(root, candidate) {
    const pathFromRoot = relative(root, candidate);
    return (pathFromRoot === '' ||
        (!pathFromRoot.startsWith(`..${sep}`) &&
            pathFromRoot !== '..' &&
            !isAbsolute(pathFromRoot)));
}
function providerCredential(config) {
    switch (config.type) {
        case 'mem0-platform-v3':
            return config.apiKey;
        case 'generic-http-search-v1':
            return config.token;
        // no default
    }
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
async function isDirectEntryPoint() {
    const entryPoint = process.argv[1];
    if (entryPoint === undefined) {
        return false;
    }
    try {
        return ((await realpath(fileURLToPath(import.meta.url))) ===
            (await realpath(resolve(entryPoint))));
    }
    catch {
        return false;
    }
}
if (await isDirectEntryPoint()) {
    await runAutoRecallCli().catch(() => undefined);
}
//# sourceMappingURL=auto-recall.js.map