/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type RestartReason } from '../hooks/useIdeTrustListener.js';
interface IdeTrustChangeDialogProps {
    reason: RestartReason;
}
export declare const IdeTrustChangeDialog: ({ reason }: IdeTrustChangeDialogProps) => import("react/jsx-runtime").JSX.Element;
export {};
