/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ProjectSummaryInfo } from '@qwen-code/qwen-code-core';
interface WelcomeBackDialogProps {
    welcomeBackInfo: ProjectSummaryInfo;
    onSelect: (choice: 'restart' | 'continue') => void;
    onClose: () => void;
}
export declare function WelcomeBackDialog({ welcomeBackInfo, onSelect, onClose, }: WelcomeBackDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
