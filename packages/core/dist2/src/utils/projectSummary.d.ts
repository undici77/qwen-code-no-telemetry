/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export interface ProjectSummaryInfo {
    hasHistory: boolean;
    content?: string;
    timestamp?: string;
    timeAgo?: string;
    goalContent?: string;
    planContent?: string;
    totalTasks?: number;
    doneCount?: number;
    inProgressCount?: number;
    todoCount?: number;
    pendingTasks?: string[];
    summaryFingerprint?: string;
}
export interface WelcomeBackProjectState {
    lastChoice: 'restart';
    summaryFingerprint: string;
}
export declare function getWelcomeBackState(): Promise<WelcomeBackProjectState | null>;
export declare function saveWelcomeBackRestartChoice(summaryFingerprint: string): Promise<void>;
export declare function clearWelcomeBackState(): Promise<void>;
/**
 * Reads and parses the project summary file to extract structured information
 */
export declare function getProjectSummaryInfo(): Promise<ProjectSummaryInfo>;
