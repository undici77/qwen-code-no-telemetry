/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { StartupEventAttrs } from '@qwen-code/qwen-code-core';
export interface StartupPhase {
    name: string;
    startMs: number;
    durationMs: number;
    heapUsedMb?: number;
}
export interface StartupEvent {
    name: string;
    tMs: number;
    heapUsedMb?: number;
    attrs?: StartupEventAttrs;
}
/**
 * Derived phase summary, keyed by phase name. Values are absolute ms from T0.
 * Mirrors the spirit of Claude Code's PHASE_DEFINITIONS for nightly CI thresholds.
 * Only phases for which the underlying checkpoint/event was recorded appear.
 */
export type DerivedPhases = Partial<{
    /** Time from process start to T0 (covers V8 module-eval). */
    module_load: number;
    /** T0 → after_load_settings. */
    settings_time: number;
    /** after_load_settings → after_load_cli_config. */
    config_time: number;
    /** after_load_cli_config → after_initialize_app. */
    init_time: number;
    /** T0 → before_render. */
    pre_render: number;
    /** T0 → first_paint. */
    to_first_paint: number;
    /** T0 → input_enabled. (Real TTI.) */
    to_input_enabled: number;
    /** Duration of `config.initialize()` (interactive only). */
    config_initialize_dur: number;
    /** T0 → mcp_first_tool_registered. */
    mcp_first_tool: number;
    /** T0 → mcp_all_servers_settled. */
    mcp_all_settled: number;
    /** mcp_first_tool_registered → gemini_tools_updated lag. */
    gemini_tools_lag: number;
}>;
export interface StartupReport {
    timestamp: string;
    sessionId: string;
    /** Whether this run was an interactive UI startup. */
    interactiveMode: boolean;
    /** True when the report was produced by the outer (pre-sandbox) process. */
    outerProcess: boolean;
    /** Time from Node.js process start to T0 (initStartupProfiler call), covers module loading. */
    processUptimeAtT0Ms: number;
    totalMs: number;
    phases: StartupPhase[];
    events: StartupEvent[];
    /** True if the events list hit MAX_EVENTS and dropped some entries. */
    eventsTruncated: boolean;
    derivedPhases: DerivedPhases;
    nodeVersion: string;
    platform: string;
    arch: string;
}
export declare function initStartupProfiler(): void;
export declare function profileCheckpoint(name: string): void;
/**
 * Records a discrete startup event (allowed to fire multiple times).
 * Distinct from `profileCheckpoint` which is sequential and assumed unique.
 *
 * Once {@link finalizeStartupProfile} runs, further events are dropped to
 * keep memory bounded — long-running interactive sessions still call
 * `setTools()` (which emits `gemini_tools_updated`) for each MCP refresh.
 */
export declare function recordStartupEvent(name: string, attrs?: StartupEventAttrs): void;
/**
 * Marks this run as an interactive UI startup. Affects derived phases and
 * is recorded in the report for downstream filtering.
 */
export declare function setInteractiveMode(value: boolean): void;
export declare function getStartupReport(): StartupReport | null;
export declare function finalizeStartupProfile(sessionId?: string): void;
export declare function resetStartupProfiler(): void;
/**
 * Test-only: returns whether profiling is currently active. Used by the
 * cli to short-circuit the cross-package event sink registration.
 */
export declare function isStartupProfilerEnabled(): boolean;
