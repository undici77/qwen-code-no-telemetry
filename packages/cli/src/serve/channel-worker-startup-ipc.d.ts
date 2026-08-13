/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const MAX_CHANNEL_STARTUP_FAILURES = 64;
export declare const MAX_CHANNEL_STARTUP_FAILURE_CHANNEL_LENGTH = 128;
export declare const MAX_CHANNEL_STARTUP_FAILURE_CODE_LENGTH = 64;
export declare const MAX_CHANNEL_STARTUP_FAILURE_MESSAGE_LENGTH = 512;
export interface ChannelStartupFailure {
    channel: string;
    phase: 'connect';
    code?: string;
    message: string;
}
export interface ChannelAdapterSnapshot {
    name: string;
    state: 'starting' | 'connected' | 'error';
    error?: string;
}
export interface ChannelStartupFailureMessage {
    type: 'channel_startup_failure';
    failure: ChannelStartupFailure;
}
export interface ChannelStartupFailuresTruncatedMessage {
    type: 'channel_startup_failures_truncated';
}
export type ChannelStartupReportMessage = ChannelStartupFailureMessage | ChannelStartupFailuresTruncatedMessage;
export interface ChannelStartupReportAckMessage {
    type: 'channel_startup_report_ack';
}
export declare function isChannelStartupFailure(value: unknown): value is ChannelStartupFailure;
export declare function isChannelStartupReportMessage(value: unknown): value is ChannelStartupReportMessage;
export declare function isChannelStartupReportAckMessage(value: unknown): value is ChannelStartupReportAckMessage;
export declare function isChannelStartupReportType(value: unknown): boolean;
