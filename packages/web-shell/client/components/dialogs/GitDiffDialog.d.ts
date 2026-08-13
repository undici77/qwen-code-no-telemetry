/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function GitDiffContent({ workspaceCwd, gitCwd, onSubtitleChange, }: {
    workspaceCwd: string;
    gitCwd?: string;
    onSubtitleChange?: (subtitle: string | undefined) => void;
}): import("react/jsx-runtime").JSX.Element;
export declare function GitDiffDialog({ workspaceCwd, onClose, }: {
    workspaceCwd: string;
    onClose: () => void;
}): import("react/jsx-runtime").JSX.Element;
