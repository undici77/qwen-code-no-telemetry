/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TerminalNotification } from '../ui/hooks/useTerminalNotification.js';
export interface NotificationOptions {
    message: string;
    title?: string;
}
/**
 * Send a notification through the auto-detected channel.
 *
 * @param opts - Notification content
 * @param terminal - Terminal notification primitives
 * @param enabled - Whether notifications are enabled (from `terminalBell` setting)
 * @returns The channel method that was actually used, or 'disabled'.
 */
export declare function sendNotification(opts: NotificationOptions, terminal: TerminalNotification, enabled: boolean): string;
