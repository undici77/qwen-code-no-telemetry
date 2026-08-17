/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CommandModule } from 'yargs';
/** What a responder may ask this command to send back. */
export type MockReply =
  | {
      text: string;
    }
  | {
      tool: string;
      args?: unknown;
    }
  | {
      status: number;
      body?: unknown;
    };
/** Which wire the product dialled. The responder may branch on it; most won't. */
export type MockWire = 'openai' | 'anthropic';
/** One request, as the responder sees it and as the log records it. */
export interface MockRequest {
  /**
   * `openai` for `/v1/chat/completions`, `anthropic` for `/v1/messages`.
   * Recorded as well as passed: an A/B whose two sides dialled different wires
   * is not comparing the same thing, and the log is where that shows.
   */
  wire: MockWire;
  method: string;
  path: string;
  /** Parsed JSON body when there was one, else null. */
  body: Record<string, unknown> | null;
  /** `messages` flattened to text, in order — what a responder branches on. */
  text: string;
  /** True when the caller asked for a stream; false for a side query. */
  stream: boolean;
  /**
   * 1-based count of the requests the RESPONDER was asked about — a responder
   * that answers the Nth call needs this, and it needs it to be its own N.
   * `null` in a record for anything the responder was never asked about.
   *
   * Everything the responder does not see is excluded, and finding them took
   * two passes: `/v1/models` first (counting it gave `[1, 3]` for two calls),
   * then, in a mixed run, a models call REUSING the previous number and a
   * refused request incrementing past it — `[1, 2, 2, 3, 4, 5]`. A responder
   * keyed on its Nth call reads a sequence like that and fires on the wrong
   * request.
   */
  n: number | null;
}
/**
 * What the responder is handed. `n` is never null here — the responder is only
 * ever called for a request that spent one, which is the invariant the type
 * states rather than leaves to a comment.
 */
export type RespondedRequest = MockRequest & {
  n: number;
};
export type Responder = (
  req: RespondedRequest,
) => MockReply | Promise<MockReply>;
export interface MockProviderReport {
  /** The port the OS gave us — never one this command or its caller chose. */
  port: number;
  baseUrl: string;
  logPath: string;
  note: string;
}
/** Flatten `messages[].content` the way every hand-written mock had to. */
export declare function messagesText(
  body: Record<string, unknown> | null,
): string;
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
export declare function replyProblem(r: unknown): string | null;
/**
 * One SSE chunk in the shape the protocol requires.
 *
 * `index` is unanimous across every hand-written mock that emitted a tool call
 * (41 of 41) — which is what makes this a fixture rather than a choice.
 */
export declare function chunk(
  delta: Record<string, unknown>,
  finish?: string | null,
): Record<string, unknown>;
/** The chunk sequence for a reply — the half the caller should never write. */
export declare function chunksFor(
  reply: MockReply,
): Array<Record<string, unknown>>;
/** A non-streaming answer, for the side queries 20% of the corpus classified. */
export declare function completionFor(
  reply: MockReply,
): Record<string, unknown>;
/**
 * The Anthropic stream for a reply, in the shapes this repo's own generator
 * parses — `message_start`, `content_block_start`, `content_block_delta`,
 * `content_block_stop`, `message_delta`, `message_stop`.
 *
 * There is no `[DONE]`: that is OpenAI's terminator, and a client waiting for
 * `message_stop` would hang on it. The two wires end differently and this is
 * the difference most easily got wrong from memory.
 */
export declare function anthropicStream(reply: MockReply): string;
/** The non-streaming Anthropic body — content is a BLOCK ARRAY, not a string. */
export declare function anthropicMessage(
  reply: MockReply,
): Record<string, unknown>;
/**
 * Anthropic puts the system prompt in a top-level `system`, not in `messages`.
 * A responder that branches on prompt text would never see it otherwise —
 * and "the system prompt says verifier" is how 20% of the corpus classified
 * its requests.
 */
export declare function anthropicText(
  body: Record<string, unknown> | null,
): string;
export interface MockProviderArgs {
  /** Module exporting `respond(req): MockReply`. Absent → a fixed greeting. */
  responder?: string;
  /** Where the JSONL request record goes. */
  log: string;
  out?: string;
  /** Seconds to serve before shutting down on its own. */
  ttl: number;
}
export declare function startMockProvider(
  args: MockProviderArgs,
  respondOverride?: Responder,
): Promise<{
  report: MockProviderReport;
  close: () => Promise<void>;
}>;
export declare const mockProviderCommand: CommandModule;
