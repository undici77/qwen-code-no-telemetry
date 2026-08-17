/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
const MAX_REQUEST_BODY_BYTES = 10 * 1024 * 1024;
class RequestBodyTooLargeError extends Error {
  constructor() {
    super('fake OpenAI request body too large');
  }
}
export function fakeToolCall(name, args, id = `call_${randomUUID()}`) {
  return {
    id,
    type: 'function',
    function: {
      name,
      arguments: JSON.stringify(args),
    },
  };
}
export async function startFakeOpenAIServer(handler, options = {}) {
  const requests = [];
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST' || !req.url?.endsWith('/chat/completions')) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    try {
      const rawBody = await readRequestBody(req);
      const body = parseJsonBody(rawBody);
      if (!body) {
        res.writeHead(400);
        res.end('bad json');
        return;
      }
      const requestIndex = requests.length;
      requests.push({ body, headers: req.headers });
      const response = await handler({ body, requestIndex });
      if (body['stream'] === true) {
        writeStreamed(
          res,
          getModel(body),
          response,
          options.keepAlive !== false,
        );
      } else {
        writeNonStreamed(
          res,
          getModel(body),
          response,
          options.keepAlive !== false,
        );
      }
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        res.writeHead(413);
        res.end('request body too large');
        return;
      }
      if (res.headersSent) {
        if (!res.writableEnded) {
          res.destroy();
        }
        return;
      }
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            message: 'fake OpenAI server handler failed',
            type: 'server_error',
          },
        }),
      );
    }
  });
  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(0, options.listenHost ?? '127.0.0.1');
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to start fake OpenAI server');
  }
  let closePromise;
  return {
    baseUrl: `http://${options.baseUrlHost ?? '127.0.0.1'}:${address.port}/v1`,
    requests,
    close: () => (closePromise ??= closeServer(server)),
  };
}
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalLength = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      if (tooLarge) return;
      totalLength += chunk.length;
      if (totalLength > MAX_REQUEST_BODY_BYTES) {
        tooLarge = true;
        reject(new RequestBodyTooLargeError());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!tooLarge) resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}
function parseJsonBody(rawBody) {
  try {
    const parsed = JSON.parse(rawBody);
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
function isJsonObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function getModel(body) {
  return typeof body['model'] === 'string' ? body['model'] : 'fake-model';
}
function writeNonStreamed(res, model, message, keepAlive) {
  res.writeHead(
    200,
    keepAlive
      ? { 'content-type': 'application/json' }
      : { connection: 'close', 'content-type': 'application/json' },
  );
  res.end(
    JSON.stringify({
      id: chatCompletionId(),
      object: 'chat.completion',
      created: nowSeconds(),
      model: message.model ?? model,
      choices: responseChoices(message).map((choice) => ({
        index: choice.index,
        message: {
          role: 'assistant',
          content: choice.content ?? choice.contentChunks?.join('') ?? null,
          ...(choice.toolCalls ? { tool_calls: choice.toolCalls } : {}),
        },
        finish_reason: finishReason(choice),
      })),
      usage: message.usage ?? DEFAULT_USAGE,
    }),
  );
}
function writeStreamed(res, model, message, keepAlive) {
  res.writeHead(200, {
    'cache-control': 'no-cache',
    connection: keepAlive ? 'keep-alive' : 'close',
    'content-type': 'text/event-stream',
  });
  const id = chatCompletionId();
  const created = nowSeconds();
  const responseModel = message.model ?? model;
  const chunk = (index, delta, finish_reason = null, usage) => ({
    id,
    object: 'chat.completion.chunk',
    created,
    model: responseModel,
    choices: [{ index, delta, finish_reason }],
    ...(usage ? { usage } : {}),
  });
  const send = (payload, callback) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`, callback);
  };
  const choices = responseChoices(message);
  for (const [choicePosition, choice] of choices.entries()) {
    send(chunk(choice.index, { role: 'assistant' }));
    for (const [contentIndex, content] of (
      choice.contentChunks ?? []
    ).entries()) {
      if (message.disconnectAfterContentChunks === contentIndex + 1) {
        send(chunk(choice.index, { content }), () => res.destroy());
        return;
      }
      send(chunk(choice.index, { content }));
    }
    if (!choice.contentChunks && choice.content) {
      send(chunk(choice.index, { content: choice.content }));
    }
    for (const [toolIndex, toolCall] of (choice.toolCalls ?? []).entries()) {
      send(
        chunk(choice.index, {
          tool_calls: [
            {
              index: toolIndex,
              id: toolCall.id,
              type: toolCall.type,
              function: {
                name: toolCall.function.name,
                arguments: '',
              },
            },
          ],
        }),
      );
      if (toolCall.function.arguments) {
        send(
          chunk(choice.index, {
            tool_calls: [
              {
                index: toolIndex,
                function: {
                  arguments: toolCall.function.arguments,
                },
              },
            ],
          }),
        );
      }
    }
    send(
      chunk(
        choice.index,
        {},
        finishReason(choice),
        choices.length === 1 && choicePosition === choices.length - 1
          ? (message.usage ?? DEFAULT_USAGE)
          : undefined,
      ),
    );
  }
  if (choices.length > 1) {
    send({
      id,
      object: 'chat.completion.chunk',
      created,
      model: responseModel,
      choices: [],
      usage: message.usage ?? DEFAULT_USAGE,
    });
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
function responseChoices(message) {
  return (
    message.choices ?? [
      {
        index: 0,
        content: message.content,
        contentChunks: message.contentChunks,
        toolCalls: message.toolCalls,
        finishReason: message.finishReason,
      },
    ]
  );
}
function finishReason(message) {
  return message.finishReason ?? (message.toolCalls ? 'tool_calls' : 'stop');
}
const DEFAULT_USAGE = {
  prompt_tokens: 0,
  completion_tokens: 0,
  total_tokens: 0,
};
function chatCompletionId() {
  return `chatcmpl-${randomUUID()}`;
}
function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}
function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
}
//# sourceMappingURL=fake-openai-server.js.map
