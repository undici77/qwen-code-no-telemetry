/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createServer } from 'http';
/**
 * Mock HTTP Server for testing HTTP hooks
 * Provides endpoints that simulate various hook response scenarios
 */
export class MockHttpServer {
  server = null;
  port = 0;
  responses = new Map();
  requestLogs = [];
  /**
   * Start the mock server on a random available port
   */
  async start() {
    return new Promise((resolve, reject) => {
      this.server = createServer((req, res) => {
        this.handleRequest(req, res);
      });
      this.server.listen(0, () => {
        const address = this.server.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          resolve(this.port);
        } else {
          reject(new Error('Failed to get server port'));
        }
      });
      this.server.on('error', reject);
    });
  }
  /**
   * Stop the mock server
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
  /**
   * Get the server's base URL
   */
  getUrl() {
    return `http://127.0.0.1:${this.port}`;
  }
  /**
   * Set response for a specific path
   */
  setResponse(path, response) {
    this.responses.set(path, response);
  }
  /**
   * Get all received request logs
   */
  getRequestLogs() {
    return [...this.requestLogs];
  }
  /**
   * Clear request logs
   */
  clearRequestLogs() {
    this.requestLogs.length = 0;
  }
  /**
   * Handle incoming HTTP request
   */
  handleRequest(req, res) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const parsedBody = JSON.parse(body || '{}');
      // Log the request
      this.requestLogs.push({
        url: req.url || '/',
        body: parsedBody,
        timestamp: Date.now(),
      });
      // Find matching response
      const response = this.responses.get(req.url || '/');
      if (response) {
        const output =
          typeof response === 'function' ? response(parsedBody) : response;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(output));
      } else {
        // Default response: allow with continue
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ continue: true }));
      }
    });
    req.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
  }
}
/**
 * Pre-defined response scenarios for HTTP hook testing
 */
export const HttpHookResponses = {
  /** Allow execution */
  allow: { decision: 'allow', continue: true },
  /** Block execution */
  block: {
    decision: 'block',
    reason: 'Blocked by HTTP hook',
    continue: false,
  },
  /** Ask for permission */
  ask: { decision: 'ask', reason: 'User confirmation required' },
  /** Deny execution */
  deny: { decision: 'deny', reason: 'Denied by HTTP hook' },
  /** Return additional context */
  withContext: (context) => ({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: context,
    },
  }),
  /** Return system message */
  withSystemMessage: (message) => ({
    continue: true,
    systemMessage: message,
  }),
  /** PreToolUse allow with permission decision */
  preToolUseAllow: {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: 'Tool execution approved by HTTP hook',
    },
  },
  /** PreToolUse deny with permission decision */
  preToolUseDeny: {
    continue: false,
    decision: 'deny',
    reason: 'Tool execution denied by HTTP hook',
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'Security policy violation',
    },
  },
  /** PreToolUse ask for confirmation */
  preToolUseAsk: {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason: 'Requires user confirmation',
    },
  },
  /** UserPromptSubmit with additional context */
  userPromptSubmitContext: (context) => ({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: context,
    },
  }),
  /** PostToolUse with additional context */
  postToolUseContext: (context) => ({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }),
  /** Stop hook with stop reason */
  stopWithReason: (reason) => ({
    continue: true,
    stopReason: reason,
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: `Stop reason: ${reason}`,
    },
  }),
};
//# sourceMappingURL=mockHttpServer.js.map
