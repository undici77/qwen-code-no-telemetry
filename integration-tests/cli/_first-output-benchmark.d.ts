/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const FIRST_OUTPUT_BENCHMARK_VERSION: 2;
export declare const DEFAULT_BOOTSTRAP_ITERATIONS = 10000;
export declare const DEFAULT_MATERIAL_THRESHOLD_MS = 10;
export declare const DEFAULT_ORDER_SENSITIVITY_THRESHOLD_MS = 10;
export declare const DEFAULT_FIRST_OUTPUT_EVENT_BUFFER_LIMIT = 256;
export type BenchmarkVariant = 'single' | 'control' | 'candidate';
export type PairOrder = 'AB' | 'BA';
export type FirstOutputKind = 'answer_text' | 'thought_text' | 'tool_call';
export type BenchmarkDecision = 'improved' | 'regressed' | 'inconclusive' | 'invalid';
export declare function parseBenchmarkPostSessionDwell(configuredValue?: string): 0 | 100 | 500;
export declare function measuredPairCountForDwell(postSessionDwellMs: number, configuredValue?: string): 10 | 30;
export interface BenchmarkDaemonEvent {
    id?: number;
    v?: number;
    type: string;
    data?: unknown;
    promptId?: string;
    _meta?: Record<string, unknown>;
}
export interface TimedDaemonEvent {
    event: BenchmarkDaemonEvent;
    receivedAtMs: number;
}
export interface ClassifiedFirstOutput {
    type: 'output';
    kind: FirstOutputKind;
    text: string | null;
    toolCallId: string | null;
    serverTimestampMs: number | null;
}
export interface ClassifiedTerminal {
    type: 'terminal';
    kind: 'complete' | 'error';
    stopReason: string | null;
    code: string | null;
    message: string | null;
}
export type IgnoredEventReason = 'wrong_prompt_id' | 'unrelated_event' | 'malformed_update' | 'replay' | 'diagnostic' | 'non_output_update' | 'empty_content';
export interface IgnoredFirstOutputEvent {
    type: 'ignore';
    reason: IgnoredEventReason;
}
export type ClassifiedPromptEvent = ClassifiedFirstOutput | ClassifiedTerminal | IgnoredFirstOutputEvent;
export interface FirstOutputObservation {
    kind: FirstOutputKind;
    receivedAtMs: number;
    eventId: number | null;
    text: string | null;
    toolCallId: string | null;
    serverTimestampMs: number | null;
}
export interface FirstOutputUserEchoObservation {
    receivedAtMs: number;
    eventId: number | null;
}
export interface FirstOutputTerminal {
    kind: 'complete' | 'error';
    receivedAtMs: number;
    eventId: number | null;
    stopReason: string | null;
    code: string | null;
    message: string | null;
}
export type TrackerFailureCode = 'event_buffer_overflow' | 'terminal_before_first_output' | 'turn_error';
export interface FirstOutputTrackerSnapshot {
    promptId: string | null;
    bufferedEventCount: number;
    bufferedBeforeAcceptanceCount: number;
    matchingEventCount: number;
    matchingTerminalCount: number;
    userEcho: FirstOutputUserEchoObservation | null;
    firstOutput: FirstOutputObservation | null;
    firstAnswer: FirstOutputObservation | null;
    finalAnswerText: string | null;
    terminal: FirstOutputTerminal | null;
    failureCode: TrackerFailureCode | null;
    failureMessage: string | null;
    runEligible: boolean;
    answerMetricEligible: boolean;
}
export interface FirstOutputTrackerOptions {
    maxBufferedEvents?: number;
}
export declare function classifyFirstOutputEvent(event: BenchmarkDaemonEvent, promptId: string): ClassifiedPromptEvent;
export declare class FirstOutputTracker {
    #private;
    constructor(options?: FirstOutputTrackerOptions);
    push(event: BenchmarkDaemonEvent, receivedAtMs: number): void;
    acceptPrompt(promptId: string): void;
    snapshot(): FirstOutputTrackerSnapshot;
}
export interface PercentileSummary {
    count: number;
    p50: number;
    p90: number;
    p99: number;
    mean: number;
    min: number;
    max: number;
}
export interface NullablePercentileSummary {
    totalCount: number;
    eligibleCount: number;
    missingCount: number;
    distribution: PercentileSummary | null;
}
export declare function percentiles(values: readonly number[]): PercentileSummary | null;
export declare function nullablePercentiles(values: readonly (number | null)[]): NullablePercentileSummary;
export interface PairedMetricSample {
    order: PairOrder;
    valid: boolean;
    controlMs: number | null;
    candidateMs: number | null;
}
export interface BootstrapMedianConfidenceInterval {
    lowMs: number;
    highMs: number;
    iterations: number;
    seed: number;
}
export interface OrderSensitivitySummary {
    abEligiblePairs: number;
    baEligiblePairs: number;
    abMedianDeltaMs: number | null;
    baMedianDeltaMs: number | null;
    thresholdMs: number;
    orderSensitive: boolean;
}
export interface PairedCandidateControlStats {
    totalPairs: number;
    validPairs: number;
    invalidPairs: number;
    eligiblePairs: number;
    missingMetricPairs: number;
    control: PercentileSummary | null;
    candidate: PercentileSummary | null;
    deltaCandidateMinusControl: PercentileSummary | null;
    medianDeltaMs: number | null;
    meanDeltaMs: number | null;
    candidateWins: number;
    controlWins: number;
    ties: number;
    bootstrapMedianCi95: BootstrapMedianConfidenceInterval | null;
    orderSensitivity: OrderSensitivitySummary;
    decision: BenchmarkDecision;
    decisionReason: string;
}
export interface PairedStatsOptions {
    seed: number;
    bootstrapIterations?: number;
    materialThresholdMs?: number;
    orderSensitivityThresholdMs?: number;
}
export declare function pairedCandidateControlStats(samples: readonly PairedMetricSample[], options: PairedStatsOptions): PairedCandidateControlStats;
export declare const FIRST_OUTPUT_FAILURE_CODES: readonly ["invalid_configuration", "daemon_boot_timeout", "daemon_exited_before_listen", "session_create_failed", "sse_connect_timeout", "sse_stream_ended", "prompt_accept_timeout", "prompt_rejected", "legacy_prompt_response", "event_buffer_overflow", "provider_request_count_mismatch", "unexpected_output_kind", "first_output_timeout", "terminal_before_first_output", "turn_error", "terminal_timeout", "wrong_final_text", "cleanup_timeout", "residual_process", "harness_error"];
export type FirstOutputFailureCode = (typeof FIRST_OUTPUT_FAILURE_CODES)[number];
export interface FirstOutputFailure {
    code: FirstOutputFailureCode;
    message: string;
}
export type PromptAcceptanceValidation = {
    kind: 'accepted';
    promptId: string;
    lastEventId: number;
} | {
    kind: 'failure';
    failure: FirstOutputFailure;
};
export declare function validatePromptAcceptance(value: unknown): PromptAcceptanceValidation;
export declare function validateExpectedFinalText(actual: string | null, expected: string): FirstOutputFailure | null;
export interface SingleBundlePrototypeGateInput {
    complete: boolean;
    /** Per-process cold-minus-warm deltas. Cold and warm share a process, so
     * they are paired; the gate is decided on their median, not on a difference
     * of two independent P50s. */
    coldWarmPairedDeltasMs: readonly number[];
    seed: number;
    coldPromptToProviderRequestP50Ms: number | null;
    warmPromptToProviderRequestP50Ms: number | null;
    coldPromptToFirstModelOutputP50Ms: number | null;
    bootstrapIterations?: number;
    absoluteThresholdMs?: number;
    relativeThresholdRatio?: number;
}
export interface SingleBundlePrototypeGateResult {
    passed: boolean;
    providerDeltaMs: number | null;
    pairedMedianDeltaMs: number | null;
    bootstrapMedianCi95: BootstrapMedianConfidenceInterval | null;
    absoluteThresholdMs: number;
    relativeThresholdRatio: number;
}
export declare function evaluateSingleBundlePrototypeGate(input: SingleBundlePrototypeGateInput): SingleBundlePrototypeGateResult;
export interface FirstOutputSessionTimestamps {
    sessionCreateStart: number;
    sessionReady: number | null;
    sseReady: number | null;
    promptStart: number | null;
    promptAccepted: number | null;
    userEcho: number | null;
    providerRequestArrival: number | null;
    providerReady: number | null;
    firstModelOutput: number | null;
    firstAnswerText: number | null;
    terminal: number | null;
}
export interface FirstOutputSessionTimings {
    processToSessionReadyMs: number | null;
    /** Idle window actually granted by the configured post-session dwell. */
    sseReadyToPromptMs: number | null;
    promptToAcceptanceMs: number | null;
    /**
     * Signed offset from HTTP acceptance to Provider request arrival. A negative
     * value is valid when dispatch reaches the Provider before the client reads
     * the `202` response.
     */
    acceptanceToProviderRequestArrivalMs: number | null;
    promptToUserEchoMs: number | null;
    /**
     * Signed offset from the relayed user echo to Provider request arrival. SSE
     * delivery can lag the already-dispatched Provider request.
     */
    userEchoToProviderRequestArrivalMs: number | null;
    /** Existing daemon FIFO queue-wait duration for this isolated prompt. */
    daemonPromptQueueWaitMs: number | null;
    promptToProviderRequestArrivalMs: number | null;
    promptToFirstModelOutputMs: number | null;
    promptToFirstAnswerTextMs: number | null;
    providerReadyToFirstModelOutputMs: number | null;
    processToFirstModelOutputMs: number | null;
    promptToTerminalMs: number | null;
}
export declare function computeFirstOutputSessionTimings(timestamps: FirstOutputSessionTimestamps, processStartedAtMs: number, daemonPromptQueueWaitMs: number | null): FirstOutputSessionTimings;
export declare function findInvalidTimings(timings: FirstOutputSessionTimings): Array<[keyof FirstOutputSessionTimings, number]>;
export interface FirstOutputSessionRunResult {
    ordinal: number;
    sessionId: string | null;
    promptId: string | null;
    timestamps: FirstOutputSessionTimestamps;
    timings: FirstOutputSessionTimings;
    firstOutput: FirstOutputObservation | null;
    firstAnswer: FirstOutputObservation | null;
    finalAnswerText: string | null;
    terminal: FirstOutputTerminal | null;
    providerRequestCount: number;
    runEligible: boolean;
    answerMetricEligible: boolean;
    failure: FirstOutputFailure | null;
    cleanupFailure: FirstOutputFailure | null;
    diagnostics?: Record<string, unknown>;
}
export interface FirstOutputCleanupResult {
    completed: boolean;
    daemonExited: boolean;
    residualProcessCount: number;
    failure: FirstOutputFailure | null;
}
export interface FirstOutputProcessRunResult {
    variant: BenchmarkVariant;
    sampleIndex: number;
    pairIndex: number | null;
    orderPosition: 1 | 2 | null;
    measured: boolean;
    pid: number | null;
    timestamps: {
        processStart: number | null;
        daemonReady: number | null;
    };
    processToListenMs: number | null;
    sessions: FirstOutputSessionRunResult[];
    failure: FirstOutputFailure | null;
    cleanup: FirstOutputCleanupResult;
    stdout: string;
    stderr: string;
    diagnostics?: Record<string, unknown>;
}
export interface FirstOutputPairResult {
    pairIndex: number;
    order: PairOrder;
    control: FirstOutputProcessRunResult;
    candidate: FirstOutputProcessRunResult;
    valid: boolean;
    invalidReason: string | null;
}
export interface FirstOutputVariantDescriptor {
    cliPath: string;
    realpath: string;
    sha256: string;
    compileCache: {
        policy: 'fixed-private-per-variant-warmed';
        directory: string;
    };
}
export type FirstOutputMetricName = 'processToListenMs' | 'processToSessionReadyMs' | 'sseReadyToPromptMs' | 'promptToAcceptanceMs' | 'acceptanceToProviderRequestArrivalMs' | 'promptToUserEchoMs' | 'userEchoToProviderRequestArrivalMs' | 'daemonPromptQueueWaitMs' | 'promptToProviderRequestArrivalMs' | 'promptToFirstModelOutputMs' | 'promptToFirstAnswerTextMs' | 'providerReadyToFirstModelOutputMs' | 'processToFirstModelOutputMs' | 'promptToTerminalMs';
export interface FirstOutputSingleMetricSummary {
    all: NullablePercentileSummary | null;
    bySession: Record<string, NullablePercentileSummary>;
}
export interface FirstOutputPairedMetricSummary {
    all: PairedCandidateControlStats | null;
    bySession: Record<string, PairedCandidateControlStats>;
}
interface FirstOutputBenchmarkArtifactBaseV2 {
    version: typeof FIRST_OUTPUT_BENCHMARK_VERSION;
    benchmark: 'daemon-first-output';
    capturedAt: string;
    harnessGitCommit: string | null;
    platform: {
        os: string;
        arch: string;
        nodeVersion: string;
        cpuModel: string;
        logicalCpuCount: number;
        availableCpuCount: number;
        totalMemoryBytes: number;
        loadAverage: [number, number, number];
    };
}
interface FirstOutputBenchmarkCommonConfig {
    seed: number;
    providerDelayMs: number;
    providerConnection: 'close-per-response';
    postSessionDwellMs: number;
    promptShape: string;
    expectedAnswer: string;
    maxBufferedEvents: number;
    providerRequestsPerSession: number;
    timeoutsMs: Record<string, number>;
}
export interface FirstOutputSingleBenchmarkArtifactV2 extends FirstOutputBenchmarkArtifactBaseV2 {
    mode: 'single';
    config: FirstOutputBenchmarkCommonConfig & {
        warmupRuns: number;
        measuredRuns: number;
        variant: FirstOutputVariantDescriptor;
    };
    warmupRuns: FirstOutputProcessRunResult[];
    runs: FirstOutputProcessRunResult[];
    summary: {
        expectedRuns: number;
        successfulRuns: number;
        failedRuns: number;
        failuresByCode: Partial<Record<FirstOutputFailureCode, number>>;
        metrics: Partial<Record<FirstOutputMetricName, FirstOutputSingleMetricSummary>>;
        decision: {
            outcome: 'prototype_allowed' | 'stop' | 'invalid';
            reasons: string[];
            gate: {
                coldPromptToProviderRequestP50Ms: number | null;
                warmPromptToProviderRequestP50Ms: number | null;
                providerDeltaMs: number | null;
                pairedMedianDeltaMs: number | null;
                bootstrapMedianCi95: BootstrapMedianConfidenceInterval | null;
                coldPromptToFirstModelOutputP50Ms: number | null;
                absoluteThresholdMs: number;
                relativeThresholdRatio: number;
                passed: boolean;
            };
        };
    };
}
export interface FirstOutputPairedBenchmarkArtifactV2 extends FirstOutputBenchmarkArtifactBaseV2 {
    mode: 'paired';
    config: FirstOutputBenchmarkCommonConfig & {
        warmupPairs: number;
        measuredPairs: number;
        bootstrapIterations: number;
        materialThresholdMs: number;
        orderSensitivityThresholdMs: number;
        variants: Record<Exclude<BenchmarkVariant, 'single'>, FirstOutputVariantDescriptor>;
    };
    warmups: FirstOutputPairResult[];
    pairs: FirstOutputPairResult[];
    summary: {
        expectedPairs: number;
        validPairs: number;
        invalidPairs: number;
        failuresByCode: Partial<Record<FirstOutputFailureCode, number>>;
        metrics: Partial<Record<FirstOutputMetricName, FirstOutputPairedMetricSummary>>;
        decision: {
            outcome: BenchmarkDecision;
            scope: 'primary_metric_only';
            publicationGateEvaluated: false;
            primaryMetric: FirstOutputMetricName;
            primarySession: 1;
            reasons: string[];
        };
    };
}
export interface FirstOutputFailedBenchmarkArtifactV2 extends FirstOutputBenchmarkArtifactBaseV2 {
    mode: 'failed';
    config: {
        requestedMode: 'single' | 'paired' | 'unknown';
    };
    failure: FirstOutputFailure;
    summary: {
        failuresByCode: Partial<Record<FirstOutputFailureCode, number>>;
        decision: {
            outcome: 'invalid';
            reasons: string[];
        };
    };
}
export type FirstOutputBenchmarkArtifactV2 = FirstOutputSingleBenchmarkArtifactV2 | FirstOutputPairedBenchmarkArtifactV2 | FirstOutputFailedBenchmarkArtifactV2;
export declare function renderFirstOutputBenchmarkMarkdown(artifact: FirstOutputBenchmarkArtifactV2): string;
export {};
