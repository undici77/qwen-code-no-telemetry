/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  SDKMessage,
  SDKAssistantMessage,
  SDKSystemMessage,
  SDKUserMessage,
  ContentBlock,
  ToolUseBlock,
} from '@qwen-code/sdk';
export interface SDKTestHelperOptions {
  /**
   * Optional settings for .qwen/settings.json
   */
  settings?: Record<string, unknown>;
  /**
   * Whether to create .qwen/settings.json
   */
  createQwenConfig?: boolean;
  /**
   * Whether to enable chat recording for this test.
   * - Set to `true` to enable recording (needed for session-id duplicate detection tests)
   * - Set to `false` or leave undefined to disable recording (default for most tests)
   * This sets chatRecording in general settings.
   */
  chatRecording?: boolean;
}
/**
 * Helper class for SDK E2E tests
 * Provides isolated test environments for each test case
 */
export declare class SDKTestHelper {
  testDir: string | null;
  testName?: string;
  private baseDir;
  constructor();
  /**
   * Setup an isolated test directory for a specific test
   */
  setup(testName: string, options?: SDKTestHelperOptions): Promise<string>;
  /**
   * Create a file in the test directory
   */
  createFile(fileName: string, content: string): Promise<string>;
  /**
   * Read a file from the test directory
   */
  readFile(fileName: string): Promise<string>;
  /**
   * Create a subdirectory in the test directory
   */
  mkdir(dirName: string): Promise<string>;
  /**
   * Check if a file exists in the test directory
   */
  fileExists(fileName: string): boolean;
  /**
   * Get the full path to a file in the test directory
   */
  getPath(fileName: string): string;
  /**
   * Cleanup test directory
   */
  cleanup(): Promise<void>;
  /**
   * Sanitize test name to create valid directory name
   */
  private sanitizeTestName;
}
export interface MCPServerConfig {
  command: string;
  args: string[];
}
export interface MCPServerResult {
  scriptPath: string;
  config: MCPServerConfig;
}
/**
 * Create an MCP server script in the test directory
 * @param helper - SDKTestHelper instance
 * @param type - Type of MCP server ('math' or provide custom script)
 * @param serverName - Name of the MCP server (default: 'test-math-server')
 * @param customScript - Custom MCP server script (if type is not 'math')
 * @returns Object with scriptPath and config
 */
export declare function createMCPServer(
  helper: SDKTestHelper,
  type?: 'math' | 'custom',
  serverName?: string,
  customScript?: string,
): Promise<MCPServerResult>;
/**
 * Extract text from ContentBlock array
 */
export declare function extractText(content: ContentBlock[]): string;
/**
 * Collect messages by type
 */
export declare function collectMessagesByType<T extends SDKMessage>(
  messages: SDKMessage[],
  predicate: (msg: SDKMessage) => msg is T,
): T[];
/**
 * Find tool use blocks in a message
 */
export declare function findToolUseBlocks(
  message: SDKAssistantMessage,
  toolName?: string,
): ToolUseBlock[];
/**
 * Extract all assistant text from messages
 */
export declare function getAssistantText(messages: SDKMessage[]): string;
/**
 * Find system message with optional subtype filter
 */
export declare function findSystemMessage(
  messages: SDKMessage[],
  subtype?: string,
): SDKSystemMessage | null;
/**
 * Find all tool calls in messages
 */
export declare function findToolCalls(
  messages: SDKMessage[],
  toolName?: string,
): Array<{
  message: SDKAssistantMessage;
  toolUse: ToolUseBlock;
}>;
/**
 * Find tool result for a specific tool use ID
 */
export declare function findToolResult(
  messages: SDKMessage[],
  toolUseId: string,
): {
  content: string;
  isError: boolean;
} | null;
/**
 * Find all tool results for a specific tool name
 */
export declare function findToolResults(
  messages: SDKMessage[],
  toolName: string,
): Array<{
  toolUseId: string;
  content: string;
  isError: boolean;
}>;
/**
 * Find all tool result blocks from messages (without requiring tool name)
 */
export declare function findAllToolResultBlocks(messages: SDKMessage[]): Array<{
  toolUseId: string;
  content: string;
  isError: boolean;
}>;
/**
 * Check if any tool results exist in messages
 */
export declare function hasAnyToolResults(messages: SDKMessage[]): boolean;
/**
 * Check if any successful (non-error) tool results exist
 */
export declare function hasSuccessfulToolResults(
  messages: SDKMessage[],
): boolean;
/**
 * Check if any error tool results exist
 */
export declare function hasErrorToolResults(messages: SDKMessage[]): boolean;
export declare function createResultWaiter(expectedResults: number): {
  waitForResult: (index: number) => Promise<void>;
  notifyResult: () => void;
};
/**
 * Create a simple streaming input from an array of message contents
 */
export declare function createStreamingInput(
  messageContents: string[],
  sessionId?: string,
): AsyncIterable<SDKUserMessage>;
/**
 * Create a controlled streaming input with pause/resume capability
 */
export declare function createControlledStreamingInput(
  messageContents: string[],
  sessionId?: string,
): {
  generator: AsyncIterable<SDKUserMessage>;
  resume: () => void;
  resumeAll: () => void;
};
/**
 * Assert that messages follow expected type sequence
 */
export declare function assertMessageSequence(
  messages: SDKMessage[],
  expectedTypes: string[],
): void;
/**
 * Assert that a specific tool was called
 */
export declare function assertToolCalled(
  messages: SDKMessage[],
  toolName: string,
): void;
/**
 * Assert that the conversation completed successfully
 */
export declare function assertSuccessfulCompletion(
  messages: SDKMessage[],
): void;
/**
 * Wait for a condition to be true with timeout
 */
export declare function waitFor(
  predicate: () => boolean | Promise<boolean>,
  options?: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  },
): Promise<void>;
/**
 * Validate model output and warn about unexpected content
 * Inspired by integration-tests test-helper
 */
export declare function validateModelOutput(
  result: string,
  expectedContent?: string | (string | RegExp)[] | null,
  testName?: string,
): boolean;
/**
 * Print debug information when tests fail
 */
export declare function printDebugInfo(
  messages: SDKMessage[],
  context?: Record<string, unknown>,
): void;
/**
 * Create detailed error message for tool call expectations
 */
export declare function createToolCallErrorMessage(
  expectedTools: string | string[],
  foundTools: string[],
  messages: SDKMessage[],
): string;
/**
 * Create shared test options with CLI path
 */
export declare function createSharedTestOptions(
  overrides?: Record<string, unknown>,
): {
  pathToQwenExecutable: string;
};
