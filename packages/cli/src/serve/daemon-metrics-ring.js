/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
// Cap the per-window sample used for percentiles so a burst in a single
// interval can't grow an unbounded array. Far more than a loopback daemon sees
// in one window, and keeps the per-seal sort cheap; the plain counters
// (`requests`, `promptsCompleted`, tokens, pipe bytes) still accrue exactly
// past the cap.
const MAX_SAMPLES_PER_WINDOW = 4096;
/**
 * Fixed-size ring of {@link DaemonMetricsBucket}. Accumulates event-driven
 * activity (requests, prompt/LLM latencies, tokens, pipe bytes) into an open
 * window; {@link sample} folds in the gauges and seals the window into a bucket
 * on a fixed cadence driven by the daemon host. Pure data structure — no
 * Node/timer deps — so it unit-tests directly and the host owns the clock and
 * the gauge reads. Lives in the daemon process, so history survives dialog
 * open/close and browser reload.
 */
export class DaemonMetricsRing {
    capacity;
    buckets = [];
    curRequests = 0;
    curErrors = 0;
    curDurations = [];
    curPromptsCompleted = 0;
    curQueueWaits = [];
    curPromptDurations = [];
    curLlmDurations = [];
    curLlmApiErrors = 0;
    curLlmApiRetries = 0;
    curPipeInBytes = 0;
    curPipeOutBytes = 0;
    curTokensIn = 0;
    curTokensOut = 0;
    constructor(options) {
        this.capacity = Math.max(1, Math.floor(options.capacity));
    }
    /** Fold one completed HTTP request into the open window. */
    recordRequest(durationMs, statusCode) {
        this.curRequests += 1;
        if (statusCode >= 400)
            this.curErrors += 1;
        pushCapped(this.curDurations, durationMs);
    }
    /** Fold one prompt's queue wait (dispatched from the per-session FIFO). */
    recordPromptQueueWait(durationMs) {
        pushCapped(this.curQueueWaits, durationMs);
    }
    /** Fold one finished prompt's end-to-end duration (also counts throughput). */
    recordPromptDuration(durationMs) {
        this.curPromptsCompleted += 1;
        pushCapped(this.curPromptDurations, durationMs);
    }
    /** Fold one model round's LLM API round-trip time (from the token frame). */
    recordLlmDuration(durationMs) {
        pushCapped(this.curLlmDurations, durationMs);
    }
    /**
     * Fold one model round's per-round model-API-error and automatic-retry
     * increments (from the same token frame) into the open window. Both are
     * plain counters — a burst in one window accrues exactly, past the sample
     * cap that only bounds the percentile arrays. Non-finite / negative inputs
     * are ignored so a malformed frame cannot poison the totals.
     */
    recordApiActivity(errors, retries) {
        if (Number.isFinite(errors) && errors > 0)
            this.curLlmApiErrors += errors;
        if (Number.isFinite(retries) && retries > 0) {
            this.curLlmApiRetries += retries;
        }
    }
    /** Fold one ACP-child pipe message's payload size into the open window. */
    recordPipe(direction, bytes) {
        if (!Number.isFinite(bytes) || bytes < 0)
            return;
        if (direction === 'inbound')
            this.curPipeInBytes += bytes;
        else
            this.curPipeOutBytes += bytes;
    }
    /** Fold one model turn's token usage into the open window. */
    recordTokens(inputTokens, outputTokens) {
        if (Number.isFinite(inputTokens) && inputTokens > 0) {
            this.curTokensIn += inputTokens;
        }
        if (Number.isFinite(outputTokens) && outputTokens > 0) {
            this.curTokensOut += outputTokens;
        }
    }
    /**
     * Seal the open window into a bucket stamped at `now` (folding in the
     * gauges), append it, evict the oldest past capacity, then reset the
     * accumulators for the next window.
     */
    sample(now, gauges) {
        // Gauges come from host getters (process.memoryUsage(), the event-loop
        // histogram, bridge counters); sanitize each so a NaN/±Infinity from an
        // unexpected state (e.g. a histogram percentile queried right after reset)
        // serializes as 0 rather than JSON `null`, which would gap the chart. The
        // window aggregates below are already finite: percentile() returns 0 for an
        // empty sample and the counters only accumulate finite values.
        this.buckets.push({
            t: now,
            activeSessions: finiteGauge(gauges.activeSessions),
            activePrompts: finiteGauge(gauges.activePrompts),
            queuedPrompts: finiteGauge(gauges.queuedPrompts),
            requests: this.curRequests,
            errors: this.curErrors,
            latencyP50Ms: percentile(this.curDurations, 0.5),
            latencyP95Ms: percentile(this.curDurations, 0.95),
            promptsCompleted: this.curPromptsCompleted,
            promptQueueWaitP95Ms: percentile(this.curQueueWaits, 0.95),
            promptDurationP95Ms: percentile(this.curPromptDurations, 0.95),
            llmApiP50Ms: percentile(this.curLlmDurations, 0.5),
            llmApiP95Ms: percentile(this.curLlmDurations, 0.95),
            llmApiErrors: this.curLlmApiErrors,
            llmApiRetries: this.curLlmApiRetries,
            cpuPercent: finiteGauge(gauges.cpuPercent),
            rssBytes: finiteGauge(gauges.rssBytes),
            heapUsedBytes: finiteGauge(gauges.heapUsedBytes),
            eventLoopLagP99Ms: finiteGauge(gauges.eventLoopLagP99Ms),
            pipeInBytes: this.curPipeInBytes,
            pipeOutBytes: this.curPipeOutBytes,
            sseConnections: finiteGauge(gauges.sseConnections),
            wsConnections: finiteGauge(gauges.wsConnections),
            acpConnections: finiteGauge(gauges.acpConnections),
            rateLimitRejected: finiteGauge(gauges.rateLimitRejected),
            tokensIn: this.curTokensIn,
            tokensOut: this.curTokensOut,
            childCpuPercent: finiteGauge(gauges.childCpuPercent),
            childRssBytes: finiteGauge(gauges.childRssBytes),
        });
        if (this.buckets.length > this.capacity) {
            this.buckets.splice(0, this.buckets.length - this.capacity);
        }
        this.curRequests = 0;
        this.curErrors = 0;
        this.curDurations.length = 0;
        this.curPromptsCompleted = 0;
        this.curQueueWaits.length = 0;
        this.curPromptDurations.length = 0;
        this.curLlmDurations.length = 0;
        this.curLlmApiErrors = 0;
        this.curLlmApiRetries = 0;
        this.curPipeInBytes = 0;
        this.curPipeOutBytes = 0;
        this.curTokensIn = 0;
        this.curTokensOut = 0;
    }
    /** Oldest→newest copy of the retained buckets (safe to serialize). */
    snapshot() {
        return this.buckets.slice();
    }
}
/** Coerce a host-supplied gauge to a finite number (NaN/±Infinity → 0) so a
 *  bad reading serializes as 0 rather than JSON null and never gaps the chart. */
function finiteGauge(value) {
    return Number.isFinite(value) ? value : 0;
}
/** Append a finite, non-negative duration up to the per-window cap. */
function pushCapped(target, value) {
    if (Number.isFinite(value) &&
        value >= 0 &&
        target.length < MAX_SAMPLES_PER_WINDOW) {
        target.push(value);
    }
}
/**
 * Nearest-rank percentile over an UNSORTED sample (sorts a copy). Returns 0 for
 * an empty sample so an idle window reads as a clean zero rather than NaN.
 */
function percentile(samples, q) {
    if (samples.length === 0)
        return 0;
    const sorted = samples.slice().sort((a, b) => a - b);
    const rank = Math.ceil(q * sorted.length);
    const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
    return sorted[idx];
}
//# sourceMappingURL=daemon-metrics-ring.js.map