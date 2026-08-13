/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface StatsDialogProps {
    onClose: () => void;
    width?: number;
    /**
     * When false, the dialog stops consuming keyboard input. Used when the dialog
     * is embedded inside another view (e.g. the Settings dialog's Stats tab) so it
     * only reacts to keys while that tab's content is focused.
     */
    isFocused?: boolean;
    /**
     * Rows available for the dialog content. When set (embedded mode), the
     * Efficiency tab's model table is capped so it cannot overflow the host view.
     */
    availableHeight?: number;
}
export declare const StatsDialog: React.FC<StatsDialogProps>;
export {};
