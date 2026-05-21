/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { HookConfigDisplayInfo, HookEventDisplayInfo } from './types.js';
interface HookConfigDetailStepProps {
    hookEvent: HookEventDisplayInfo;
    hookConfig: HookConfigDisplayInfo;
}
export declare function HookConfigDetailStep({ hookEvent, hookConfig, }: HookConfigDetailStepProps): React.JSX.Element;
export {};
