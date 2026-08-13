export type GoalStatusKind = 'set' | 'achieved' | 'cleared' | 'failed' | 'aborted' | 'paused' | 'checking';
export interface SerializedGoalStatusMessage {
    kind: GoalStatusKind;
    condition: string;
    iterations?: number;
    durationMs?: number;
    setAt?: number;
    lastReason?: string;
}
export declare const GOAL_STATUS_ACTIVE_EVENT = "web-shell-goal-status-active";
declare const serializeGoalStatusMessage: any;
declare function parseGoalStatusMessage(content: unknown): SerializedGoalStatusMessage | null;
export { serializeGoalStatusMessage, parseGoalStatusMessage };
export declare function GoalStatusMessage({ status, activateFooter, }: {
    status: SerializedGoalStatusMessage;
    activateFooter?: boolean;
}): import("react/jsx-runtime").JSX.Element;
