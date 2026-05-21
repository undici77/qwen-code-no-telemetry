/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export interface FollowupState {
    /** Current suggestion text */
    suggestion: string | null;
    /** Whether to show suggestion */
    isVisible: boolean;
    /** Timestamp when suggestion was shown (for telemetry) */
    shownAt: number;
}
export declare const INITIAL_FOLLOWUP_STATE: Readonly<FollowupState>;
