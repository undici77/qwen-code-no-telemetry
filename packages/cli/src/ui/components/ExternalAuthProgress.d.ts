/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
interface ExternalAuthProgressProps {
    title: string;
    message: string;
    detail?: string;
    onCancel?: () => void;
}
export declare function ExternalAuthProgress({ title, message, detail, onCancel, }: ExternalAuthProgressProps): React.JSX.Element;
export {};
