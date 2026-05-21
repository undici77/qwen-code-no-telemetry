/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type SlashCommand } from '../commands/types.js';
import type { HelpTab } from '../contexts/UIActionsContext.js';
export type { HelpTab };
interface HelpProps {
    commands: readonly SlashCommand[];
    width?: number;
    activeTab?: HelpTab;
    onTabChange?: (tab: HelpTab) => void;
    onClose?: () => void;
    isInteractive?: boolean;
}
export declare const Help: React.FC<HelpProps>;
