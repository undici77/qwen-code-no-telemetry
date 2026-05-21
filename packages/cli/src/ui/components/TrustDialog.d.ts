/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type UseHistoryManagerReturn } from '../hooks/useHistoryManager.js';
interface TrustDialogProps {
    onExit: () => void;
    addItem: UseHistoryManagerReturn['addItem'];
}
export declare function TrustDialog({ onExit, addItem, }: TrustDialogProps): React.JSX.Element;
export {};
