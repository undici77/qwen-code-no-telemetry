#!/usr/bin/env npx tsx
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createServer, } from 'node:http';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TerminalCapture } from './terminal-capture.js';
const TERMINAL_COLS = 100;
const TERMINAL_ROWS = 32;
const TABLE_NAME = 'deleted_t_spark_odps_sql_type_system2_test_view_more_times_expand_view_f44c82c06096_244650615';
const TABLE_NAME_SUFFIX = '244650615';
const PROMPT_TEXT = 'Render the table inline-code wrap regression fixture.';
const MARKDOWN_RESPONSE = [
    '已找到您有权限的 1 张表：',
    '',
    '| 表名 | 生命周期 | 备注 |',
    '| --- | --- | --- |',
    `| \`${TABLE_NAME}\` | N/A | 测试视图 |`,
    '',
    'REGRESSION_TABLE_DONE',
].join('\n');
function sendJson(res, body) {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
}
function sendStream(res, chunks) {
    res.writeHead(200, {
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'content-type': 'text/event-stream; charset=utf-8',
    });
    for (const chunk of chunks) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
}
function chatCompletionId() {
    return `chatcmpl-table-wrap-${Date.now()}`;
}
function streamWrap(id, delta, finishReason, usage) {
    return {
        id,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'dummy',
        choices: [{ index: 0, delta, finish_reason: finishReason }],
        ...(usage ? { usage } : {}),
    };
}
function readRequestBody(req) {
    return new Promise((resolveRead, rejectRead) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolveRead(Buffer.concat(chunks).toString('utf8')));
        req.on('error', rejectRead);
    });
}
async function startFakeOpenAIServer() {
    let requestCount = 0;
    const server = createServer(async (req, res) => {
        if (req.method !== 'POST' || !req.url?.endsWith('/chat/completions')) {
            res.writeHead(404);
            res.end('not found');
            return;
        }
        requestCount += 1;
        const body = await readRequestBody(req);
        const parsed = JSON.parse(body);
        const id = chatCompletionId();
        const usage = {
            prompt_tokens: 24,
            completion_tokens: 16,
            total_tokens: 40,
        };
        if (parsed.stream) {
            sendStream(res, [
                streamWrap(id, { role: 'assistant' }, null),
                streamWrap(id, { content: MARKDOWN_RESPONSE }, null),
                streamWrap(id, {}, 'stop', usage),
            ]);
            return;
        }
        sendJson(res, {
            id,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'dummy',
            choices: [
                {
                    index: 0,
                    message: { role: 'assistant', content: MARKDOWN_RESPONSE },
                    finish_reason: 'stop',
                },
            ],
            usage,
        });
    });
    await new Promise((resolveListen) => {
        server.listen(0, '127.0.0.1', resolveListen);
    });
    const address = server.address();
    if (!address) {
        throw new Error('failed to start fake OpenAI server');
    }
    return {
        baseUrl: `http://127.0.0.1:${address.port}/v1`,
        close: () => new Promise((resolveClose) => {
            server.close(() => resolveClose());
        }),
        getRequestCount: () => requestCount,
    };
}
function qwenArgs(baseUrl) {
    return [
        'dist/cli.js',
        '--no-chat-recording',
        '--approval-mode',
        'yolo',
        '--auth-type',
        'openai',
        '--openai-api-key',
        'dummy',
        '--openai-base-url',
        baseUrl,
        '--model',
        'dummy',
    ];
}
function updateForeground(currentForeground, paramsText) {
    const params = paramsText.length > 0
        ? paramsText.split(';').map((param) => Number(param))
        : [0];
    let foreground = currentForeground;
    for (let index = 0; index < params.length; index++) {
        const code = params[index];
        if (code === 0 || code === 39) {
            foreground = undefined;
        }
        else if (typeof code === 'number' &&
            ((code >= 30 && code <= 37) || (code >= 90 && code <= 97))) {
            foreground = String(code);
        }
        else if (code === 38) {
            const mode = params[index + 1];
            if (mode === 5 && Number.isFinite(params[index + 2])) {
                foreground = `38;5;${params[index + 2]}`;
                index += 2;
            }
            else if (mode === 2 &&
                Number.isFinite(params[index + 2]) &&
                Number.isFinite(params[index + 3]) &&
                Number.isFinite(params[index + 4])) {
                foreground = `38;2;${params[index + 2]};${params[index + 3]};${params[index + 4]}`;
                index += 4;
            }
        }
    }
    return foreground;
}
function foregroundsAtOccurrences(raw, needle) {
    const foregrounds = [];
    let foreground;
    let index = 0;
    while (index < raw.length) {
        if (raw.startsWith(needle, index)) {
            foregrounds.push(foreground ?? '');
            index += needle.length;
            continue;
        }
        if (raw[index] === '\x1b' && raw[index + 1] === '[') {
            const sgrEnd = raw.indexOf('m', index + 2);
            if (sgrEnd !== -1) {
                const paramsText = raw.slice(index + 2, sgrEnd);
                if (/^[0-9;]*$/.test(paramsText)) {
                    foreground = updateForeground(foreground, paramsText);
                    index = sgrEnd + 1;
                    continue;
                }
                index += 1;
                continue;
            }
        }
        index += 1;
    }
    return foregrounds;
}
async function main() {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const defaultRepoRoot = resolve(scriptDir, '../..');
    const repoRoot = resolve(process.env['QWEN_TUI_E2E_REPO'] ?? defaultRepoRoot);
    const outputDir = resolve(process.env['QWEN_TUI_E2E_OUT'] ??
        join(tmpdir(), 'qwen-table-wrap-ansi', basename(repoRoot)));
    const expectedPass = process.env['QWEN_TUI_E2E_EXPECT_PASS'] !== 'false';
    if (existsSync(outputDir)) {
        rmSync(outputDir, { recursive: true });
    }
    mkdirSync(outputDir, { recursive: true });
    const fakeServer = await startFakeOpenAIServer();
    const homeDir = join(outputDir, 'home');
    mkdirSync(homeDir, { recursive: true });
    const env = {
        ...process.env,
        FORCE_COLOR: '1',
        HOME: homeDir,
        NODE_NO_WARNINGS: '1',
        QWEN_CODE_DISABLE_SYNCHRONIZED_OUTPUT: '1',
        QWEN_CODE_NO_RELAUNCH: '1',
        QWEN_SANDBOX: 'false',
        TERM: 'xterm-256color',
        USERPROFILE: homeDir,
    };
    delete env['NO_COLOR'];
    delete env['QWEN_CODE_SIMPLE'];
    for (const key of [
        'HTTP_PROXY',
        'http_proxy',
        'HTTPS_PROXY',
        'https_proxy',
        'ALL_PROXY',
        'all_proxy',
    ]) {
        delete env[key];
    }
    const terminal = await TerminalCapture.create({
        chrome: false,
        cols: TERMINAL_COLS,
        cwd: repoRoot,
        env,
        fontSize: 14,
        outputDir,
        rows: TERMINAL_ROWS,
        theme: 'github-dark',
        title: 'table inline-code wrap regression',
    });
    const screenshots = [];
    try {
        await terminal.spawn('node', qwenArgs(fakeServer.baseUrl));
        await terminal.waitFor('Type your message', { timeout: 30000 });
        await terminal.type(PROMPT_TEXT, { delay: 12, slow: true });
        await terminal.idle(400, 4000);
        await terminal.type('\n');
        await terminal.waitFor(TABLE_NAME_SUFFIX, { timeout: 30000 });
        await terminal.waitForAndIdle('REGRESSION_TABLE_DONE', {
            stableMs: 1000,
            timeout: 30000,
        });
        screenshots.push(await terminal.capture('table-inline-code-wrap.png'));
        screenshots.push(await terminal.captureFull('table-inline-code-wrap-full.png'));
        const raw = terminal.getRawOutput();
        const finalScreen = await terminal.getScreenText();
        const foregrounds = foregroundsAtOccurrences(raw, TABLE_NAME_SUFFIX);
        const coloredContinuationOccurrences = foregrounds.filter((foreground) => foreground.startsWith('38;2;')).length;
        const uncoloredContinuationOccurrences = foregrounds.length - coloredContinuationOccurrences;
        const finalScreenWrappedTableName = finalScreen.includes(TABLE_NAME_SUFFIX) &&
            !finalScreen.includes(TABLE_NAME);
        const pass = fakeServer.getRequestCount() > 0 &&
            finalScreenWrappedTableName &&
            foregrounds.length > 0 &&
            uncoloredContinuationOccurrences === 0;
        writeFileSync(join(outputDir, 'raw.ansi.log'), raw);
        writeFileSync(join(outputDir, 'final-screen.txt'), finalScreen);
        const summary = {
            repoRoot,
            outputDir,
            requestCount: fakeServer.getRequestCount(),
            rawBytes: raw.length,
            finalScreenLines: finalScreen.split('\n').length,
            continuationOccurrences: foregrounds.length,
            coloredContinuationOccurrences,
            uncoloredContinuationOccurrences,
            continuationForegrounds: foregrounds.map((foreground) => foreground.length > 0 ? foreground : null),
            finalScreenWrappedTableName,
            pass,
            expectedPass,
            screenshots,
        };
        writeFileSync(join(outputDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
        console.log(JSON.stringify(summary, null, 2));
        if (pass !== expectedPass) {
            throw new Error(`Expected pass=${expectedPass} but observed pass=${pass}. ` +
                `See ${join(outputDir, 'summary.json')}`);
        }
    }
    finally {
        await terminal.close();
        await fakeServer.close();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=table-inline-code-wrap-regression.js.map