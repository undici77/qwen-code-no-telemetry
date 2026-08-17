/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Hook output type for HTTP hook responses
 */
export interface HookOutput {
  continue?: boolean;
  stopReason?: string;
  suppressOutput?: boolean;
  systemMessage?: string;
  decision?: 'ask' | 'block' | 'deny' | 'approve' | 'allow';
  reason?: string;
  hookSpecificOutput?: Record<string, unknown>;
}
/**
 * Mock HTTP Server for testing HTTP hooks
 * Provides endpoints that simulate various hook response scenarios
 */
export declare class MockHttpServer {
  private server;
  private port;
  private readonly responses;
  private readonly requestLogs;
  /**
   * Start the mock server on a random available port
   */
  start(): Promise<number>;
  /**
   * Stop the mock server
   */
  stop(): Promise<void>;
  /**
   * Get the server's base URL
   */
  getUrl(): string;
  /**
   * Set response for a specific path
   */
  setResponse(
    path: string,
    response: HookOutput | ((input: Record<string, unknown>) => HookOutput),
  ): void;
  /**
   * Get all received request logs
   */
  getRequestLogs(): Array<{
    url: string;
    body: Record<string, unknown>;
    timestamp: number;
  }>;
  /**
   * Clear request logs
   */
  clearRequestLogs(): void;
  /**
   * Handle incoming HTTP request
   */
  private handleRequest;
}
/**
 * Pre-defined response scenarios for HTTP hook testing
 */
export declare const HttpHookResponses: {
  /** Allow execution */
  allow: HookOutput;
  /** Block execution */
  block: HookOutput;
  /** Ask for permission */
  ask: HookOutput;
  /** Deny execution */
  deny: HookOutput;
  /** Return additional context */
  withContext: (context: string) => HookOutput;
  /** Return system message */
  withSystemMessage: (message: string) => HookOutput;
  /** PreToolUse allow with permission decision */
  preToolUseAllow: HookOutput;
  /** PreToolUse deny with permission decision */
  preToolUseDeny: HookOutput;
  /** PreToolUse ask for confirmation */
  preToolUseAsk: HookOutput;
  /** UserPromptSubmit with additional context */
  userPromptSubmitContext: (context: string) => HookOutput;
  /** PostToolUse with additional context */
  postToolUseContext: (context: string) => HookOutput;
  /** Stop hook with stop reason */
  stopWithReason: (reason: string) => HookOutput;
};
