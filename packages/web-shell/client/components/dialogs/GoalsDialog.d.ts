/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
interface GoalsDialogProps {
    /** Send `/goal <condition>` into a brand-new session and switch to it. Setting
     * a goal is not a pure write — the daemon registers the Stop hook AND kicks
     * off the first turn — so it has to travel the prompt path, not a REST POST.
     *
     * Return `false` to report a failure this form must not treat as a creation —
     * the condition stays in the box. Reserved for failures already surfaced
     * elsewhere; throw to have the message rendered inline instead. */
    onCreateGoal: (condition: string) => boolean | void | Promise<boolean | void>;
    /** Open the session driving a goal — its transcript IS the goal's history. */
    onOpenSession: (sessionId: string) => void;
    onError: (error: unknown, fallback: string) => void;
}
export declare function GoalsDialog({ onCreateGoal, onOpenSession, onError, }: GoalsDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
