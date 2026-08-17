/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { NextFunction, Request, Response } from 'express';
type LegacySessionTelemetryAttribution = 'handler_resolved' | 'pre_resolved';
export declare const legacySessionTelemetryRoutes: readonly [
  {
    readonly method: 'POST';
    readonly path: '/session';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/load';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/load';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/resume';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/resume';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/branch';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/branch';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/fork';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/fork';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/side-task';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/side-task';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/cd';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/cd';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/status';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/status';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/export';
    readonly attribution: 'pre_resolved';
    readonly route: 'GET /session/:id/export';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/transcript';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/transcript';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/context';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/context';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/context-usage';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/context-usage';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/stats';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/stats';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/supported-commands';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/supported-commands';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/tasks';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/tasks';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/subagents/:subagentRef';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/subagents/:subagentRef';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/subagents/:subagentRef/cancel';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/subagents/:subagentRef/cancel';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/lsp';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/lsp';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/hooks';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/hooks';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/artifacts';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/artifacts';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/artifacts';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/artifacts';
  },
  {
    readonly method: 'DELETE';
    readonly path: '/session/:id/artifacts/:artifactId';
    readonly attribution: 'handler_resolved';
    readonly route: 'DELETE /session/:id/artifacts/:artifactId';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/tasks/:taskId/cancel';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/tasks/:taskId/cancel';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/goal/clear';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/goal/clear';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/continue';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/continue';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/prompt';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/prompt';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/generate';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/generate';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/heartbeat';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/heartbeat';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/detach';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/detach';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/cancel';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/cancel';
  },
  {
    readonly method: 'DELETE';
    readonly path: '/session/:id';
    readonly attribution: 'handler_resolved';
    readonly route: 'DELETE /session/:id';
  },
  {
    readonly method: 'POST';
    readonly path: '/sessions/delete';
    readonly attribution: 'pre_resolved';
    readonly route: 'POST /sessions/delete';
  },
  {
    readonly method: 'POST';
    readonly path: '/sessions/archive';
    readonly attribution: 'pre_resolved';
    readonly route: 'POST /sessions/archive';
  },
  {
    readonly method: 'POST';
    readonly path: '/sessions/unarchive';
    readonly attribution: 'pre_resolved';
    readonly route: 'POST /sessions/unarchive';
  },
  {
    readonly method: 'PATCH';
    readonly path: '/session/:id/metadata';
    readonly attribution: 'handler_resolved';
    readonly route: 'PATCH /session/:id/metadata';
  },
  {
    readonly method: 'PATCH';
    readonly path: '/session/:id/organization';
    readonly attribution: 'pre_resolved';
    readonly route: 'PATCH /session/:id/organization';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/model';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/model';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/config-option';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/config-option';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/recap';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/recap';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/btw';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/btw';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/mid-turn-message';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/mid-turn-message';
  },
  {
    readonly method: 'DELETE';
    readonly path: '/session/:id/mid-turn-messages/:messageId';
    readonly attribution: 'handler_resolved';
    readonly route: 'DELETE /session/:id/mid-turn-messages/:messageId';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/mid-turn-messages';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/mid-turn-messages';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/pending-prompts';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/pending-prompts';
  },
  {
    readonly method: 'DELETE';
    readonly path: '/session/:id/pending-prompts/:promptId';
    readonly attribution: 'handler_resolved';
    readonly route: 'DELETE /session/:id/pending-prompts/:promptId';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/shell';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/shell';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/rewind/snapshots';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/rewind/snapshots';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/rewind';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/rewind';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/approval-mode';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/approval-mode';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/language';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/language';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/permission/:requestId';
    readonly attribution: 'handler_resolved';
    readonly route: 'POST /session/:id/permission/:requestId';
  },
  {
    readonly method: 'POST';
    readonly path: '/permission/:requestId';
    readonly attribution: 'pre_resolved';
    readonly route: 'POST /permission/:requestId';
  },
  {
    readonly method: 'GET';
    readonly path: '/session/:id/events';
    readonly attribution: 'handler_resolved';
    readonly route: 'GET /session/:id/events';
  },
  {
    readonly method: 'POST';
    readonly path: '/session/:id/a2ui-action';
    readonly attribution: 'pre_resolved';
    readonly route: 'POST /session/:id/a2ui-action';
  },
];
interface ResolvedDaemonTelemetryRoute {
  route: string;
  sessionId?: string;
  permissionRequestId?: string;
  attribution?: LegacySessionTelemetryAttribution;
}
export declare function setDaemonTelemetryWorkspace(
  res: Response,
  workspaceCwd: string,
): void;
export declare function resolveDaemonTelemetryRoute(
  req: Request,
): ResolvedDaemonTelemetryRoute | undefined;
export declare function daemonTelemetryMiddleware(
  resolveWorkspaceCwd: (req: Request) => string,
  recordRequest?: (durationMs: number, statusCode: number) => void,
): (req: Request, res: Response, next: NextFunction) => void;
export {};
