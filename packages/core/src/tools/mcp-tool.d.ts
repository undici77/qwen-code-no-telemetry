/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ToolInvocation, ToolResult } from './tools.js';
import { BaseDeclarativeTool } from './tools.js';
import type { CallableTool } from '@google/genai';
import type { Config } from '../config/config.js';
type ToolParams = Record<string, unknown>;
/**
 * Minimal interface for the raw MCP Client's callTool method.
 * This avoids a direct import of @modelcontextprotocol/sdk in this file,
 * keeping the dependency contained in mcp-client.ts.
 */
export interface McpDirectClient {
  callTool(
    params: {
      name: string;
      arguments?: Record<string, unknown>;
      _meta?: Record<string, unknown>;
    },
    resultSchema?: unknown,
    options?: {
      onprogress?: (progress: {
        progress: number;
        total?: number;
        message?: string;
      }) => void;
      timeout?: number;
      signal?: AbortSignal;
    },
  ): Promise<McpCallToolResult>;
}
/** The result shape returned by MCP SDK Client.callTool(). */
interface McpCallToolResult {
  content?: Array<{
    type: string;
    text?: string;
    data?: string;
    mimeType?: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
  [key: string]: unknown;
}
/**
 * MCP Tool Annotations as defined in the MCP specification.
 * These provide hints about a tool's behavior to help clients make decisions
 * about tool approval and safety.
 */
export interface McpToolAnnotations {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}
export declare class DiscoveredMCPTool extends BaseDeclarativeTool<
  ToolParams,
  ToolResult
> {
  private readonly mcpTool;
  readonly serverName: string;
  readonly serverToolName: string;
  readonly parameterSchema: unknown;
  readonly trust?: boolean | undefined;
  private readonly cliConfig?;
  private readonly mcpClient?;
  private readonly mcpTimeout?;
  private readonly mcpToolIdleTimeoutMs?;
  readonly annotations?: McpToolAnnotations | undefined;
  private readonly allowInvocationContext;
  get maxOutputChars(): number;
  /** Keeps pre-normalization permission and disabled-tool entries effective. */
  get permissionAliases(): readonly string[];
  constructor(
    mcpTool: CallableTool,
    serverName: string,
    serverToolName: string,
    description: string,
    parameterSchema: unknown,
    trust?: boolean | undefined,
    nameOverride?: string,
    cliConfig?: Config | undefined,
    mcpClient?: McpDirectClient | undefined,
    mcpTimeout?: number | undefined,
    mcpToolIdleTimeoutMs?: number | undefined,
    annotations?: McpToolAnnotations | undefined,
    alwaysLoad?: boolean,
    allowInvocationContext?: boolean,
  );
  asFullyQualifiedTool(): DiscoveredMCPTool;
  /**
   * Return a clone of this tool with a different `trust` value while
   * keeping every other field (including the shared underlying
   * `CallableTool` / MCP transport) identical.
   *
   * Kept as the trust-only convenience used by non-pool callers. Pooled
   * session views use `withSessionConfig` because eager loading can differ
   * between sessions too.
   */
  withTrust(trust: boolean | undefined): DiscoveredMCPTool;
  /**
   * Return a per-session projection of metadata that does not belong to the
   * shared MCP transport snapshot. Pool entries can be shared by sessions
   * whose trust and eager-loading settings differ, so neither field may be
   * mutated on the canonical tool instance.
   */
  withSessionConfig(
    trust: boolean | undefined,
    alwaysLoad: boolean,
  ): DiscoveredMCPTool;
  protected createInvocation(
    params: ToolParams,
  ): ToolInvocation<ToolParams, ToolResult>;
}
/** Visible for testing */
export declare function generateValidName(name: string): string;
export {};
