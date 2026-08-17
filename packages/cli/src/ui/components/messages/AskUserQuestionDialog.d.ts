/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import {
  type ToolAskUserQuestionConfirmationDetails,
  ToolConfirmationOutcome,
  type ToolConfirmationPayload,
} from '@qwen-code/qwen-code-core';
export declare function computeHeaderCap(
  headerWidths: number[],
  available: number,
): number;
interface AskUserQuestionDialogProps {
  confirmationDetails: ToolAskUserQuestionConfirmationDetails;
  isFocused?: boolean;
  /** Width (cells) of the box the dialog is rendered into; sizes the header
   * tab row. */
  availableWidth: number;
  onConfirm: (
    outcome: ToolConfirmationOutcome,
    payload?: ToolConfirmationPayload,
  ) => Promise<void>;
}
export declare const AskUserQuestionDialog: React.FC<AskUserQuestionDialogProps>;
export {};
