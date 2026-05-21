/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookEventDisplayInfo } from './types.js';
interface HookDetailStepProps {
    hook: HookEventDisplayInfo;
    selectedIndex: number;
}
export declare function HookDetailStep({ hook, selectedIndex, }: HookDetailStepProps): React.JSX.Element;
export {};
