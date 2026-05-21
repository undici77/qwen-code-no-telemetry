/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface StatusMessageProps {
    text: string;
    prefix: string;
    prefixColor: string;
    textColor: string;
    children?: React.ReactNode;
    footer?: React.ReactNode;
}
interface StatusTextProps {
    text: string;
    linkUrl?: string;
    linkText?: string;
}
/**
 * Shared renderer for status-like history messages (info/warning/error/retry).
 * Keeps prefix spacing and wrapping behavior consistent across variants.
 */
export declare const StatusMessage: React.FC<StatusMessageProps>;
export declare const InfoMessage: React.FC<StatusTextProps>;
export declare const SuccessMessage: React.FC<StatusTextProps>;
export declare const WarningMessage: React.FC<StatusTextProps>;
export declare const ErrorMessage: React.FC<StatusTextProps & {
    hint?: string;
}>;
export declare const RetryCountdownMessage: React.FC<StatusTextProps>;
export declare const AwayRecapMessage: React.FC<StatusTextProps>;
export {};
