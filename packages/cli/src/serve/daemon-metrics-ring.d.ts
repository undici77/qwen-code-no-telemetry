/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * One time-bucketed sample of daemon activity, sized for bottleneck analysis:
 * load, throughput, latency, resource pressure, and token burn are all stamped
 * on the SAME timeline so an operator can line up "10 tasks running at once"
 * against event-loop lag, queue wait, memory, and API latency to see *where*
 * the daemon is actually spending / stalling.
 *
 * Each bucket covers the window `(t - intervalMs, t]`. Fields fall into two
 * kinds:
 *  - **window aggregates** (`requests`, `tokensIn`, the `*P95Ms`/`*P50Ms`
 *    percentiles, `promptsCompleted`, `pipe*Bytes`, `rateLimitRejected`,
 *    `llmApiErrors`, `llmApiRetries`): summarize everything that happened
 *    *during* the window.
 *  - **gauges** (`activeSessions`, `activePrompts`, `queuedPrompts`,
 *    `cpuPercent`, `rssBytes`, `heapUsedBytes`, `eventLoopLagP99Ms`, the
 *    `*Connections`): the instantaneous reading at seal time `t`.
 * Windowing server-side means the client never diffs cumulative counters — it
 * plots the series verbatim.
 */
export interface DaemonMetricsBucket {
  /** Epoch ms at which this bucket was sealed (window end). */
  t: number;
  /** Active sessions at seal time. */
  activeSessions: number;
  /** In-flight prompts at seal time — the count of tasks running concurrently. */
  activePrompts: number;
  /** Prompts queued (accepted but not yet dispatched) across all sessions at
   *  seal time — the backpressure depth complementing prompt queue-wait. */
  queuedPrompts: number;
  /** HTTP requests completed in this window. */
  requests: number;
  /** Subset of `requests` that returned a 4xx/5xx status. */
  errors: number;
  /** Median HTTP request duration over the window (ms); 0 when idle. */
  latencyP50Ms: number;
  /** p95 HTTP request duration over the window (ms); 0 when idle. */
  latencyP95Ms: number;
  /** Prompts that finished in this window (task throughput). */
  promptsCompleted: number;
  /** p95 time prompts spent waiting in the per-session FIFO queue (ms); 0 when
   *  none finished. A rising queue-wait under load is the backpressure signal. */
  promptQueueWaitP95Ms: number;
  /** p95 end-to-end prompt duration, dispatch→completion (ms); 0 when none. */
  promptDurationP95Ms: number;
  /** Median per-round LLM API round-trip over the window (ms); 0 when none.
   *  This is daemon→model time (from the token frame's `_meta.durationMs`), NOT
   *  the client→daemon HTTP `latency*` above — it separates "model is slow"
   *  from "we are slow". */
  llmApiP50Ms: number;
  /** p95 per-round LLM API round-trip over the window (ms); 0 when none. */
  llmApiP95Ms: number;
  /** Model API errors in this window (one per failed model API attempt) — the
   *  provider-side failures, distinct from the client→daemon HTTP `errors`
   *  above. Rides the per-round token frame's `_meta`. */
  llmApiErrors: number;
  /** Automatic backoff retries in this window (one per retried attempt). A
   *  rising retry count is the early-warning signal that the model endpoint is
   *  throttling/flapping before it turns into hard `llmApiErrors`. */
  llmApiRetries: number;
  /** Process CPU utilization over the window, percent of total capacity across
   *  all cores, clamped to [0,100]. Complements memory as the other half of "how
   *  much did it cost"; event-loop lag is only an indirect saturation signal. */
  cpuPercent: number;
  /** Resident set size at seal time (bytes). */
  rssBytes: number;
  /** V8 heap used at seal time (bytes). */
  heapUsedBytes: number;
  /** Event-loop lag p99 over the window (ms) — the CPU-saturation / blocking
   *  signal. Sampled from a window-scoped histogram the host resets each seal,
   *  so it reflects *this* interval, not a since-start average. */
  eventLoopLagP99Ms: number;
  /** Bytes received from the ACP child over the stdio pipe in this window. */
  pipeInBytes: number;
  /** Bytes sent to the ACP child over the stdio pipe in this window. */
  pipeOutBytes: number;
  /** Active REST/SSE streams at seal time. */
  sseConnections: number;
  /** Active ACP WebSocket streams at seal time. */
  wsConnections: number;
  /** Active ACP connections at seal time. */
  acpConnections: number;
  /** Rate-limited (429) rejections in this window across all tiers. */
  rateLimitRejected: number;
  /** Input (prompt) tokens attributed to model turns in this window. */
  tokensIn: number;
  /** Output (completion) tokens attributed to model turns in this window. */
  tokensOut: number;
  /** ACP child process CPU utilization at seal time, percent of total capacity
   *  across all cores (clamped [0,100]) — where the real LLM/tool work runs (the
   *  daemon itself mostly just forwards). 0 when no child / not reported. */
  childCpuPercent: number;
  /** ACP child process resident set size at seal time (bytes); 0 when none. */
  childRssBytes: number;
}
/** Instantaneous gauges the host reads and hands to {@link DaemonMetricsRing.sample}. */
export interface DaemonMetricsGauges {
  cpuPercent: number;
  rssBytes: number;
  heapUsedBytes: number;
  activeSessions: number;
  activePrompts: number;
  queuedPrompts: number;
  eventLoopLagP99Ms: number;
  sseConnections: number;
  wsConnections: number;
  acpConnections: number;
  /** Per-window rate-limit rejections (host diffs the since-start counter). */
  rateLimitRejected: number;
  /** ACP child process CPU % (self-reported over ACP); 0 when no child. */
  childCpuPercent: number;
  /** ACP child process RSS bytes (self-reported over ACP); 0 when no child. */
  childRssBytes: number;
}
export interface DaemonMetricsRingOptions {
  /** Max buckets retained; the oldest is evicted once full. */
  capacity: number;
}
/**
 * Fixed-size ring of {@link DaemonMetricsBucket}. Accumulates event-driven
 * activity (requests, prompt/LLM latencies, tokens, pipe bytes) into an open
 * window; {@link sample} folds in the gauges and seals the window into a bucket
 * on a fixed cadence driven by the daemon host. Pure data structure — no
 * Node/timer deps — so it unit-tests directly and the host owns the clock and
 * the gauge reads. Lives in the daemon process, so history survives dialog
 * open/close and browser reload.
 */
export declare class DaemonMetricsRing {
  private readonly capacity;
  private readonly buckets;
  private curRequests;
  private curErrors;
  private readonly curDurations;
  private curPromptsCompleted;
  private readonly curQueueWaits;
  private readonly curPromptDurations;
  private readonly curLlmDurations;
  private curLlmApiErrors;
  private curLlmApiRetries;
  private curPipeInBytes;
  private curPipeOutBytes;
  private curTokensIn;
  private curTokensOut;
  constructor(options: DaemonMetricsRingOptions);
  /** Fold one completed HTTP request into the open window. */
  recordRequest(durationMs: number, statusCode: number): void;
  /** Fold one prompt's queue wait (dispatched from the per-session FIFO). */
  recordPromptQueueWait(durationMs: number): void;
  /** Fold one finished prompt's end-to-end duration (also counts throughput). */
  recordPromptDuration(durationMs: number): void;
  /** Fold one model round's LLM API round-trip time (from the token frame). */
  recordLlmDuration(durationMs: number): void;
  /**
   * Fold one model round's per-round model-API-error and automatic-retry
   * increments (from the same token frame) into the open window. Both are
   * plain counters — a burst in one window accrues exactly, past the sample
   * cap that only bounds the percentile arrays. Non-finite / negative inputs
   * are ignored so a malformed frame cannot poison the totals.
   */
  recordApiActivity(errors: number, retries: number): void;
  /** Fold one ACP-child pipe message's payload size into the open window. */
  recordPipe(direction: 'inbound' | 'outbound', bytes: number): void;
  /** Fold one model turn's token usage into the open window. */
  recordTokens(inputTokens: number, outputTokens: number): void;
  /**
   * Seal the open window into a bucket stamped at `now` (folding in the
   * gauges), append it, evict the oldest past capacity, then reset the
   * accumulators for the next window.
   */
  sample(now: number, gauges: DaemonMetricsGauges): void;
  /** Oldest→newest copy of the retained buckets (safe to serialize). */
  snapshot(): DaemonMetricsBucket[];
}
