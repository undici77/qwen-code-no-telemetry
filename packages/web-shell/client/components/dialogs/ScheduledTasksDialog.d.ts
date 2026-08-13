/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DaemonWorkspaceCapability } from '@qwen-code/sdk/daemon';
interface ScheduledTasksDialogProps {
    /** Manual "run now": execute the task's prompt in its bound session (so it
     * lands in the same transcript as its scheduled runs), or in the current
     * session for an unbound task. The App wiring switches to that session. */
    onRunPrompt: (prompt: string, sessionId: string | null) => void | Promise<void>;
    /** Switch to the chat view with the composer primed to describe a task, so
     * the agent can create it conversationally via its cron_create tool. */
    onCreateViaChat: () => void;
    /** Open a task's bound session — its transcript IS the task's run history.
     * When absent, tasks fall back to the inline fire-timestamp list. */
    onOpenSession?: (sessionId: string) => void;
    /** Registered workspaces on a multi-workspace daemon (from capabilities).
     * When more than one is present the page aggregates every trusted workspace's
     * tasks (each card tagged with its workspace) and the New-task form offers a
     * workspace picker. Absent or a single entry → the plain primary-only view. */
    workspaces?: DaemonWorkspaceCapability[];
    /** Forces all task operations through this workspace's route. */
    lockedWorkspace?: DaemonWorkspaceCapability;
    onError: (error: unknown, fallback: string) => void;
}
export declare function ScheduledTasksDialog({ onRunPrompt, onCreateViaChat, onOpenSession, workspaces, lockedWorkspace, onError, }: ScheduledTasksDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
