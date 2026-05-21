/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookEventDisplayInfo } from './types.js';
interface HooksListStepProps {
    hooks: HookEventDisplayInfo[];
    selectedIndex: number;
}
export declare function HooksListStep({ hooks, selectedIndex, }: HooksListStepProps): React.JSX.Element;
export {};
