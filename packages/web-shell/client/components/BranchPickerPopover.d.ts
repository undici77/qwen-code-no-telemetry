/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
interface BranchPickerPopoverProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceCwd: string;
    gitCwd?: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    onBranchChanged?: () => void;
    onOpenDiff?: () => void;
    onOpenCommit?: () => void;
    children: React.ReactNode;
}
export declare function BranchPickerPopover({ open, onOpenChange, workspaceCwd, gitCwd, side, onBranchChanged, onOpenDiff, onOpenCommit, children, }: BranchPickerPopoverProps): import("react/jsx-runtime").JSX.Element;
export {};
