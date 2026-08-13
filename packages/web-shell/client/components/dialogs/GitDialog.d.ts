/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type GitDialogView = 'diff' | 'log' | 'prs' | 'commit';
export declare function GitDialog({ workspaceCwd, gitCwd, initialView, sessionId, resolveSessionForWorkspace, onClose, }: {
    workspaceCwd: string;
    gitCwd?: string;
    initialView: GitDialogView;
    sessionId?: string;
    resolveSessionForWorkspace?: (cwd: string, forceCreate?: boolean) => Promise<string | undefined>;
    onClose: () => void;
}): import("react/jsx-runtime").JSX.Element;
