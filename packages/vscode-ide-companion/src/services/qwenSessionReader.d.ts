/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface QwenMessage {
  id: string;
  timestamp: string;
  type: 'user' | 'qwen';
  content: string;
  thoughts?: unknown[];
  tokens?: {
    input: number;
    output: number;
    cached: number;
    thoughts: number;
    total: number;
  };
  model?: string;
}
export interface QwenSession {
  sessionId: string;
  projectHash: string;
  startTime: string;
  lastUpdated: string;
  messages: QwenMessage[];
  filePath?: string;
  messageCount?: number;
  firstUserText?: string;
  customTitle?: string;
  cwd?: string;
}
export declare class QwenSessionReader {
  private get runtimeDir();
  /**
   * Get all session list (optional: current project only or all projects)
   */
  getAllSessions(
    workingDir?: string,
    allProjects?: boolean,
  ): Promise<QwenSession[]>;
  /**
   * Read all sessions from specified directory
   */
  private readSessionsFromDir;
  /**
   * Get details of specific session
   */
  getSession(
    sessionId: string,
    _workingDir?: string,
  ): Promise<QwenSession | null>;
  /**
   * Get session title (based on first user message)
   */
  getSessionTitle(session: QwenSession): string;
  /**
   * Parse a JSONL session file written by the CLI.
   * When includeMessages is false, only lightweight metadata is returned.
   */
  private readJsonlSession;
  /**
   * Reads the UUID of the last record in a JSONL file via tail-read.
   */
  private readLastRecordUuid;
  /**
   * Delete session file
   */
  deleteSession(sessionId: string, workingDir: string): Promise<boolean>;
  /**
   * Rename session by appending a custom_title system record to the JSONL file.
   */
  renameSession(
    sessionId: string,
    title: string,
    workingDir: string,
  ): Promise<boolean>;
}
