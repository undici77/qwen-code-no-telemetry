/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Scheduled-tasks CRUD over the durable cron file (`scheduled_tasks.json`).
 *
 * This is the daemon-side surface behind the Web Shell "Scheduled tasks"
 * page. It only reads/writes the per-project durable-task file via core's
 * `cronTasksFile` helpers (atomic writes, cross-process lock) — it does NOT
 * run a scheduler of its own. Tasks created here fire the same way
 * cron_create's durable tasks do: an agent session with durable cron enabled
 * loads them from disk (watched, 300 ms debounce) and fires them at their
 * cron time. Disabling a task (`enabled: false`) keeps it on disk but makes
 * the scheduler skip it.
 *
 * Writes use the non-strict `mutate()` gate — creating a scheduled prompt is
 * the same capability class as `POST /session/:id/prompt` (both enqueue a
 * prompt that runs with tool access), and that route is non-strict too, so a
 * loopback web-shell without a token can manage its own schedule.
 *
 * The same CRUD handlers are mounted twice: once unqualified (`/scheduled-tasks`,
 * bound to the primary workspace) and once workspace-qualified
 * (`/workspaces/:workspace/scheduled-tasks`, resolving the cron file + session
 * bridge of any registered workspace). Both share {@link
 * registerScheduledTaskCrudRoutes}; they differ only in how the target
 * workspace and its bridge are resolved per request, so a multi-workspace Web
 * Shell manages each project's schedule against that project's own file.
 */
import type { Application, Request, RequestHandler } from 'express';
import type { ChannelDeliveryAuthorizationStore } from '../channel-delivery-authorization.js';
import type { WorkspaceRegistry, WorkspaceRuntime } from '../workspace-registry.js';
/**
 * The slice of the session bridge this route needs: mint a task's dedicated
 * session, and tear it back down if the create fails after minting. Narrowed
 * to a structural type so tests can stub it without the full bridge.
 */
export interface ScheduledTasksSessionBridge {
    spawnOrAttach(req: {
        workspaceCwd: string;
        sessionScope?: 'single' | 'thread';
        sourceType?: string;
        sourceId?: string;
    }): Promise<{
        sessionId: string;
    }>;
    closeSession(sessionId: string): Promise<unknown>;
    /** Give the task's session a readable name so it's recognizable in the
     * session list (rather than a bare id). Best-effort. */
    updateSessionMetadata(sessionId: string, metadata: {
        displayName?: string;
    }): unknown;
}
/** Builds a readable session name for a task from its name (or prompt), marked
 * with a clock so scheduled-task sessions are recognizable in the list. Strips
 * terminal control sequences (C0/C1/DEL/ANSI) — the bridge's title guard REJECTS
 * them, so an unsanitized control char would silently drop the whole rename and
 * leave a bare-id session — plus Unicode Bidi_Control marks (ALM/LRM/RLM,
 * embedding/override, isolates) as a Trojan-Source-style reordering defense for
 * the session list — and truncates on a code-point boundary so slicing can't
 * leave a lone surrogate rendered as `�`. */
export declare function scheduledTaskSessionName(label: string): string;
interface RegisterScheduledTasksRoutesDeps {
    boundWorkspace: string;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    /**
     * Session bridge used to mint a dedicated session per task. When absent
     * (e.g. a minimal embedding), tasks are created without a bound session and
     * fall back to the shared per-project durable-owner firing model.
     */
    bridge?: ScheduledTasksSessionBridge;
    channelDeliveryAuthorizations?: ChannelDeliveryAuthorizationStore;
    getRuntime?: () => WorkspaceRuntime | undefined;
    cleanupSession?: (runtime: WorkspaceRuntime, sessionId: string) => Promise<unknown>;
}
interface RegisterWorkspaceQualifiedScheduledTasksRoutesDeps {
    workspaceRegistry: WorkspaceRegistry;
    mutate: (opts?: {
        strict?: boolean;
    }) => RequestHandler;
    safeBody: (req: Request) => Record<string, unknown>;
    channelDeliveryAuthorizations?: ChannelDeliveryAuthorizationStore;
    /**
     * When true, a task created through a qualified route binds to a dedicated
     * session in the target workspace (its bridge mints one). Must mirror the
     * primary surface's `bridge` gate — the daemon only keeps bound sessions
     * resident + rehydrated when scheduled-task session management is on, so
     * binding without it would leave the task firing in a session nothing
     * revives. Off → tasks are created unbound (shared-owner firing).
     */
    manageScheduledTaskSessions: boolean;
    cleanupSession?: (runtime: WorkspaceRuntime, sessionId: string) => Promise<unknown>;
}
/**
 * The primary (unqualified) `/scheduled-tasks` surface, bound to the daemon's
 * primary workspace. Every request resolves to the same fixed workspace + bridge.
 */
export declare function registerScheduledTasksRoutes(app: Application, deps: RegisterScheduledTasksRoutesDeps): void;
/**
 * The workspace-qualified `/workspaces/:workspace/scheduled-tasks` surface. Each
 * request resolves `:workspace` (a workspace id or absolute path) to a
 * registered runtime, requiring it be trusted before any read or write — the
 * same gate the other qualified routes use — then targets that workspace's cron
 * file and, when session management is on, its bridge. Lets a multi-workspace
 * Web Shell manage every registered project's schedule, not just the primary's.
 */
export declare function registerWorkspaceQualifiedScheduledTasksRoutes(app: Application, deps: RegisterWorkspaceQualifiedScheduledTasksRoutesDeps): void;
export {};
