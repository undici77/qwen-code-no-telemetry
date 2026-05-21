/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { ToolCallStatus } from '../../types.js';
interface ToolElapsedTimeProps {
    status: ToolCallStatus;
    executionStartTime?: number;
    /**
     * When provided, the elapsed indicator becomes a combined budget display:
     * `(elapsed · timeout N)` visible from t=0 so the timeout is always on
     * screen. When absent, the indicator keeps the 3-second quiet threshold
     * and renders just the elapsed time.
     */
    timeoutMs?: number;
}
/**
 * Right-aligned elapsed-time indicator for an executing tool.
 *
 * Two modes:
 *   - no `timeoutMs`: suppressed for the first 3 seconds so fast tools stay
 *     visually quiet.
 *   - with `timeoutMs`: rendered as `(elapsed · timeout N)` from t=0 so the
 *     user can see both how long the tool has been running and how much
 *     budget remains.
 */
export declare const ToolElapsedTime: React.FC<ToolElapsedTimeProps>;
export {};
