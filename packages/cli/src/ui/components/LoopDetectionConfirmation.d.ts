/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type LoopDetectionConfirmationResult = {
    userSelection: 'disable' | 'keep';
};
interface LoopDetectionConfirmationProps {
    onComplete: (result: LoopDetectionConfirmationResult) => void;
}
export declare function LoopDetectionConfirmation({ onComplete, }: LoopDetectionConfirmationProps): import("react/jsx-runtime").JSX.Element;
export {};
