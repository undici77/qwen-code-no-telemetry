/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createServer, } from 'node:http';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeStdoutLine, writeStderrLine } from '../../utils/stdioHelpers.js';
/** Flatten `messages[].content` the way every hand-written mock had to. */
export function messagesText(body) {
    const msgs = Array.isArray(body?.['messages']) ? body['messages'] : [];
    const one = (m) => {
        const c = m?.content;
        if (typeof c === 'string')
            return c;
        if (Array.isArray(c))
            return c
                .map((p) => String(p?.text ?? ''))
                .join('');
        return '';
    };
    return msgs.map(one).join('\n');
}
const enc = (o) => `data: ${JSON.stringify(o)}\n\n`;
/**
 * Ceiling on a request body, and on what the record keeps of one.
 *
 * Neither was bounded. Measured: a 40 MiB POST was read whole into memory,
 * handed to the responder, and then written to the JSONL twice — once as the
 * request and once inside the reply record — leaving an 80 MiB log. `drive`
 * had just grown an 8 MiB log cap for exactly this hazard, and this served as
 * a larger door beside it: the review's own machine is the one that fills up,
 * and `build-test`'s disk floors exist because that already happened once.
 *
 * A body over the ceiling is refused with 413 rather than truncated. A
 * truncated body parses to different JSON, which would make the mock answer a
 * request the client never sent — a behaviour difference introduced by the
 * harness, which is the one thing it must never do.
 */
const BODY_MAX_BYTES = 4 * 1024 * 1024;
/** How much of a request's text the record keeps. The evidence is the SHAPE. */
const RECORD_TEXT_MAX = 8 * 1024;
/**
 * Is this something the responder is allowed to have returned?
 *
 * The responder is the caller's module, and a caller's module is exactly the
 * kind of thing that returns `undefined` from a branch nobody took. Measured,
 * before this existed: `undefined`, `null`, a bare string, a `status` that was
 * not a number, and `args` holding a circular reference each left the request
 * **hanging** — no response at all. That is the worst shape it could take here:
 * the product under test waits, `drive` eventually reports `timed-out`, and a
 * bug in the harness has been presented as the behaviour of the diff.
 *
 * An empty `{}` was worse in its own way — a 200 with an empty completion,
 * indistinguishable from a model that legitimately said nothing.
 */
export function replyProblem(r) {
    if (r === null || typeof r !== 'object')
        return `responder returned ${r === undefined ? 'undefined' : JSON.stringify(r)}; it must return {text} | {tool, args?} | {status, body?}`;
    const o = r;
    if ('status' in o) {
        const st = o['status'];
        if (!(typeof st === 'number' &&
            Number.isInteger(st) &&
            st >= 100 &&
            st <= 599))
            return `responder returned a non-HTTP status ${JSON.stringify(st)}`;
        // The same guard the tool branch has, and for the same reason — it was on
        // that branch only. Measured: `{status: 500, body: circularObj}` passed
        // validation, and `record()`'s `JSON.stringify` then threw "Converting
        // circular structure to JSON" as an unhandled rejection, so the request
        // hung and the drive around it timed out. One-directional reasoning:
        // whether a reply can be serialised is a property of the reply, not of the
        // branch it arrived on.
        try {
            JSON.stringify(o['body'] ?? {});
        }
        catch {
            return 'responder returned a status body that cannot be serialised (a circular reference?)';
        }
        return null;
    }
    if ('tool' in o) {
        if (typeof o['tool'] !== 'string' || o['tool'] === '')
            return `responder returned an empty or non-string tool name ${JSON.stringify(o['tool'])}`;
        try {
            JSON.stringify(o['args'] ?? {});
        }
        catch {
            return 'responder returned tool args that cannot be serialised (a circular reference?)';
        }
        return null;
    }
    if ('text' in o)
        return typeof o['text'] === 'string'
            ? null
            : `responder returned a non-string text ${JSON.stringify(o['text'])}`;
    return `responder returned an object with none of text/tool/status: ${JSON.stringify(o).slice(0, 80)}`;
}
/** Trim a recorded field, saying so, so a diff of two logs stays honest. */
function forRecord(v) {
    return v.length <= RECORD_TEXT_MAX
        ? v
        : `${v.slice(0, RECORD_TEXT_MAX)}…[${v.length - RECORD_TEXT_MAX} more characters]`;
}
/**
 * The request as the RECORD should hold it.
 *
 * Trimming `text` alone left `body` spread into the same entry carrying the
 * identical payload: measured, a 200 KB system prompt produced an 8 KB `text`
 * and a 205 KB log. The evidence an A/B needs is the request's SHAPE — which
 * wire, which n, streaming or not, and enough text to tell two runs apart — so
 * the parsed body is summarised by its keys rather than copied.
 */
function forRecordReq(r) {
    return {
        method: r.method,
        path: r.path,
        wire: r.wire,
        n: r.n,
        stream: r.stream,
        text: forRecord(r.text),
        bodyKeys: r.body ? Object.keys(r.body) : [],
    };
}
/**
 * One SSE chunk in the shape the protocol requires.
 *
 * `index` is unanimous across every hand-written mock that emitted a tool call
 * (41 of 41) — which is what makes this a fixture rather than a choice.
 */
export function chunk(delta, finish = null) {
    return {
        id: 'chatcmpl-qwen-review-mock',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'qwen-review-mock',
        choices: [{ index: 0, delta, finish_reason: finish }],
    };
}
/** The chunk sequence for a reply — the half the caller should never write. */
export function chunksFor(reply) {
    const out = [
        chunk({ role: 'assistant', content: '' }),
    ];
    if ('tool' in reply) {
        out.push(chunk({
            tool_calls: [
                {
                    index: 0,
                    id: `call_${reply.tool}_1`,
                    type: 'function',
                    function: {
                        name: reply.tool,
                        arguments: JSON.stringify(reply.args ?? {}),
                    },
                },
            ],
        }), chunk({}, 'tool_calls'));
        return out;
    }
    if ('text' in reply) {
        for (const piece of reply.text.match(/[\s\S]{1,40}/g) ?? [])
            out.push(chunk({ content: piece }));
    }
    out.push(chunk({}, 'stop'));
    return out;
}
/** A non-streaming answer, for the side queries 20% of the corpus classified. */
export function completionFor(reply) {
    const message = 'tool' in reply
        ? {
            role: 'assistant',
            content: null,
            tool_calls: [
                {
                    index: 0,
                    id: `call_${reply.tool}_1`,
                    type: 'function',
                    function: {
                        name: reply.tool,
                        arguments: JSON.stringify(reply.args ?? {}),
                    },
                },
            ],
        }
        : { role: 'assistant', content: 'text' in reply ? reply.text : '' };
    return {
        id: 'chatcmpl-qwen-review-mock',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'qwen-review-mock',
        choices: [
            {
                index: 0,
                message,
                finish_reason: 'tool' in reply ? 'tool_calls' : 'stop',
            },
        ],
        // 69% of the corpus carried one, and a client that reads token counts
        // behaves differently without it — an absent usage block is a behaviour
        // difference the mock introduced, not one the diff did.
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}
/** One `event:`/`data:` pair. Anthropic names its events; OpenAI does not. */
function sseEvent(type, data) {
    return `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
}
/**
 * The Anthropic stream for a reply, in the shapes this repo's own generator
 * parses — `message_start`, `content_block_start`, `content_block_delta`,
 * `content_block_stop`, `message_delta`, `message_stop`.
 *
 * There is no `[DONE]`: that is OpenAI's terminator, and a client waiting for
 * `message_stop` would hang on it. The two wires end differently and this is
 * the difference most easily got wrong from memory.
 */
export function anthropicStream(reply) {
    const usage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
    };
    let out = sseEvent('message_start', {
        message: {
            id: 'msg_qwen_review_mock',
            type: 'message',
            role: 'assistant',
            model: 'qwen-review-mock',
            content: [],
            stop_reason: null,
            usage,
        },
    });
    if ('tool' in reply) {
        out += sseEvent('content_block_start', {
            index: 0,
            content_block: {
                type: 'tool_use',
                id: `toolu_${reply.tool}_1`,
                name: reply.tool,
                input: {},
            },
        });
        // Streamed as `input_json_delta`, not as a finished object: a client that
        // accumulates partial JSON and one that expects it whole behave
        // differently, and the real API streams it.
        out += sseEvent('content_block_delta', {
            index: 0,
            delta: {
                type: 'input_json_delta',
                partial_json: JSON.stringify(reply.args ?? {}),
            },
        });
        out += sseEvent('content_block_stop', { index: 0 });
        out += sseEvent('message_delta', {
            delta: { stop_reason: 'tool_use', stop_sequence: null },
            usage: { output_tokens: 0 },
        });
    }
    else {
        const text = 'text' in reply ? reply.text : '';
        out += sseEvent('content_block_start', {
            index: 0,
            content_block: { type: 'text', text: '' },
        });
        for (const piece of text.match(/[\s\S]{1,40}/g) ?? [])
            out += sseEvent('content_block_delta', {
                index: 0,
                delta: { type: 'text_delta', text: piece },
            });
        out += sseEvent('content_block_stop', { index: 0 });
        out += sseEvent('message_delta', {
            delta: { stop_reason: 'end_turn', stop_sequence: null },
            usage: { output_tokens: 0 },
        });
    }
    return out + sseEvent('message_stop', {});
}
/** The non-streaming Anthropic body — content is a BLOCK ARRAY, not a string. */
export function anthropicMessage(reply) {
    const content = 'tool' in reply
        ? [
            {
                type: 'tool_use',
                id: `toolu_${reply.tool}_1`,
                name: reply.tool,
                input: reply.args ?? {},
            },
        ]
        : [{ type: 'text', text: 'text' in reply ? reply.text : '' }];
    return {
        id: 'msg_qwen_review_mock',
        type: 'message',
        role: 'assistant',
        model: 'qwen-review-mock',
        content,
        stop_reason: 'tool' in reply ? 'tool_use' : 'end_turn',
        stop_sequence: null,
        usage: {
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
        },
    };
}
/**
 * Anthropic puts the system prompt in a top-level `system`, not in `messages`.
 * A responder that branches on prompt text would never see it otherwise —
 * and "the system prompt says verifier" is how 20% of the corpus classified
 * its requests.
 */
export function anthropicText(body) {
    const sys = body?.['system'];
    const sysText = typeof sys === 'string'
        ? sys
        : Array.isArray(sys)
            ? sys.map((b) => String(b?.text ?? '')).join('')
            : '';
    const rest = messagesText(body);
    return sysText && rest ? `${sysText}\n${rest}` : sysText || rest;
}
const DEFAULT_REPLY = { text: 'ok' };
export async function startMockProvider(args, respondOverride) {
    let respond = respondOverride ?? (() => DEFAULT_REPLY);
    if (!respondOverride && args.responder) {
        const mod = (await import(pathToFileURL(resolve(args.responder)).href));
        const fn = mod.respond ?? mod.default;
        if (typeof fn !== 'function') {
            throw new Error(`mock-provider: ${args.responder} exports no \`respond\` function — a responder module must export \`respond(req)\` (or a default export of the same shape)`);
        }
        respond = fn;
    }
    const logPath = resolve(args.log);
    mkdirSync(dirname(logPath), { recursive: true });
    writeFileSync(logPath, '');
    let n = 0;
    const record = (entry) => appendFileSync(logPath, `${JSON.stringify(entry)}\n`);
    const server = createServer((req, res) => {
        const parts = [];
        let size = 0;
        let tooBig = false;
        req.on('data', (d) => {
            size += d.length;
            if (size > BODY_MAX_BYTES) {
                tooBig = true;
                parts.length = 0;
                return;
            }
            parts.push(d);
        });
        req.on('end', () => {
            if (tooBig) {
                appendFileSync(logPath, `${JSON.stringify({ t: Date.now(), method: req.method, path: req.url, refused: 'body-too-large', bytes: size })}\n`);
                res.writeHead(413, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: `request body exceeded ${BODY_MAX_BYTES} bytes; refused rather than truncated, because a truncated body is a different request`,
                }));
                return;
            }
            void (async () => {
                const raw = Buffer.concat(parts).toString('utf8');
                let body = null;
                try {
                    body = raw ? JSON.parse(raw) : null;
                }
                catch {
                    body = null;
                }
                const path = req.url ?? '/';
                const isModels = path.startsWith('/v1/models');
                // A number is spent only when the responder is actually asked. Round 1
                // stopped `/v1/models` from taking one; round 5 found the other two
                // ways it still could. Measured across one mixed run: `[1, 2, 2, 3, 4,
                // 5]` — the models call REUSED the previous request's number (it has
                // none of its own), and a refused `/v1/embeddings` incremented to 5. A
                // responder keyed on its Nth call reads that sequence and fires late.
                const chat = path.includes('/chat/completions') || path.includes('/v1/messages');
                const willAsk = !isModels &&
                    chat &&
                    (req.method ?? 'GET') === 'POST' &&
                    body !== null;
                // The wire is decided by the path the product dialled, not by a flag:
                // whichever endpoint it chose is the one it can parse back.
                const wire = path.includes('/v1/messages')
                    ? 'anthropic'
                    : 'openai';
                if (willAsk)
                    n += 1;
                const mreq = {
                    method: req.method ?? 'GET',
                    path,
                    body,
                    wire,
                    text: wire === 'anthropic' ? anthropicText(body) : messagesText(body),
                    stream: body?.['stream'] === true,
                    // Null for anything the responder was never asked about, so the
                    // record cannot be read as "the responder saw this".
                    n: willAsk ? n : null,
                };
                // Only the two chat endpoints, and only by POST with a JSON body.
                // Measured: a call to `/v1/embeddings`, a GET, a non-JSON body and an
                // EMPTY body each got back a plausible 200 completion — so a product
                // that dialled the wrong endpoint, used the wrong method, or sent a
                // broken payload looked like it was working. That is the mock hiding
                // the very defect the review is looking for, which is worse than any
                // answer it could give.
                if (!isModels) {
                    const why = !chat
                        ? `this mock serves /v1/chat/completions and /v1/messages only; ${path} is not one of them`
                        : mreq.method !== 'POST'
                            ? `${mreq.method} is not how either chat endpoint is called; use POST`
                            : body === null
                                ? 'the request body was empty or not JSON, so there is nothing to answer'
                                : null;
                    if (why) {
                        record({ t: Date.now(), ...forRecordReq(mreq), refused: why });
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: why }));
                        return;
                    }
                }
                if (isModels) {
                    record({ t: Date.now(), ...forRecordReq(mreq), reply: 'models' });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        object: 'list',
                        data: [{ id: 'qwen-review-mock', object: 'model' }],
                    }));
                    return;
                }
                let reply;
                try {
                    reply = await respond(mreq);
                    const problem = replyProblem(reply);
                    if (problem)
                        throw new Error(problem);
                }
                catch (err) {
                    // A responder that throws is the caller's bug, and hiding it behind a
                    // 200 would make the drive look like a product failure.
                    reply = {
                        status: 500,
                        body: { error: String(err.message) },
                    };
                }
                record({ t: Date.now(), ...forRecordReq(mreq), reply });
                if ('status' in reply) {
                    res.writeHead(reply.status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(reply.body ?? {}));
                    return;
                }
                if (!mreq.stream) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(wire === 'anthropic'
                        ? anthropicMessage(reply)
                        : completionFor(reply)));
                    return;
                }
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                });
                if (wire === 'anthropic') {
                    // Ends on `message_stop`. No `[DONE]` — that is OpenAI's terminator,
                    // and a client waiting for one would hang on this stream.
                    res.write(anthropicStream(reply));
                }
                else {
                    for (const c of chunksFor(reply))
                        res.write(enc(c));
                    res.write('data: [DONE]\n\n');
                }
                res.end();
            })();
        });
    });
    // Port 0: the OS picks, and this reports what it picked. 67 of 94 mocks read
    // a port from an env var instead — a number the caller chose and hoped was
    // free, which is a collision waiting for the second review on the machine.
    await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    return {
        report: {
            port,
            baseUrl: `http://127.0.0.1:${port}/v1`,
            logPath,
            note: `mock provider on port ${port}; every request is appended to ${logPath} as JSONL — diff those between two trees and the difference is evidence`,
        },
        close: () => new Promise((ok) => {
            server.close(() => ok());
        }),
    };
}
export const mockProviderCommand = {
    command: 'mock-provider',
    describe: 'Serve OpenAI (/v1/chat/completions) and Anthropic (/v1/messages) endpoints for the review to drive the real product against, recording every request as JSONL — the protocol is provided, the answers are yours; for any other kind of upstream, start it yourself and use `drive`',
    builder: (yargs) => yargs
        .option('responder', {
        type: 'string',
        describe: 'Module exporting `respond(req)` returning {text} | {tool,args} | {status,body}',
    })
        .option('log', {
        type: 'string',
        demandOption: true,
        describe: 'Where to append the JSONL request record',
    })
        .option('ttl', {
        type: 'number',
        default: 600,
        describe: 'Seconds to serve before shutting down on its own',
    })
        .option('out', {
        type: 'string',
        describe: 'Write the JSON report here',
    }),
    // `async`, and the returned promise is what keeps the process alive. A
    // fire-and-forget `void (async () => …)()` here produced a command that
    // printed nothing at all and exited: yargs returned, node found no pending
    // work it could see, and the server it had just bound went with it. Measured
    // — both streams empty, exit 0, a mock that was never reachable.
    handler: async (argv) => {
        try {
            const args = argv;
            const { report, close } = await startMockProvider(args);
            if (args.out) {
                mkdirSync(dirname(resolve(args.out)), { recursive: true });
                writeFileSync(resolve(args.out), JSON.stringify(report, null, 2));
            }
            writeStdoutLine(JSON.stringify(report, null, 2));
            writeStderrLine(`mock-provider: ${report.note}`);
            // A serving process needs an end, or a review that forgets to kill it
            // leaves it holding a port until the machine reboots. This await is also
            // what holds the process open while it serves.
            await new Promise((done) => {
                setTimeout(done, Math.max(1, args.ttl) * 1000);
            });
            await close();
        }
        catch (err) {
            writeStderrLine(err.message);
            process.exitCode = 1;
        }
    },
};
//# sourceMappingURL=mock-provider.js.map