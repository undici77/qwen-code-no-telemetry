/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SpinnerName } from 'cli-spinners';
interface GeminiRespondingSpinnerProps {
    /**
     * Optional string to display when not in Responding state.
     * If not provided and not Responding, renders null.
     */
    nonRespondingDisplay?: string;
    spinnerType?: SpinnerName;
}
export declare const GeminiRespondingSpinner: React.FC<GeminiRespondingSpinnerProps>;
interface GeminiSpinnerProps {
    spinnerType?: SpinnerName;
    altText?: string;
}
export declare const GeminiSpinner: React.FC<GeminiSpinnerProps>;
export {};
