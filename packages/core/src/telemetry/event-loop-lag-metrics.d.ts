/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { EventLoopLagSnapshot } from './event-loop-lag.js';
export declare function registerDaemonEventLoopLagGauge(
  read: () => EventLoopLagSnapshot,
): void;
export declare function registerAcpEventLoopLagGauge(
  read: () => EventLoopLagSnapshot,
): void;
