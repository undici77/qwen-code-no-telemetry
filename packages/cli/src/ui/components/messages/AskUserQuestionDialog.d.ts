/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import { type ToolAskUserQuestionConfirmationDetails, ToolConfirmationOutcome, type ToolConfirmationPayload } from '@qwen-code/qwen-code-core';
interface AskUserQuestionDialogProps {
    confirmationDetails: ToolAskUserQuestionConfirmationDetails;
    isFocused?: boolean;
    onConfirm: (outcome: ToolConfirmationOutcome, payload?: ToolConfirmationPayload) => Promise<void>;
}
export declare const AskUserQuestionDialog: React.FC<AskUserQuestionDialogProps>;
export {};
