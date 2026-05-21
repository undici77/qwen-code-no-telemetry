/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ReactNode } from 'react';
type ConsentPromptProps = {
    prompt: ReactNode;
    onConfirm: (value: boolean) => void;
    terminalWidth: number;
};
export declare const ConsentPrompt: (props: ConsentPromptProps) => import("react/jsx-runtime").JSX.Element;
export {};
