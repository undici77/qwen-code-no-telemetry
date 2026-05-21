/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * AskUserQuestionDialog component for displaying questions to the user
 * and collecting their responses in the WebView
 */
import type { FC } from 'react';
export interface QuestionOption {
    label: string;
    description: string;
}
export interface Question {
    question: string;
    header: string;
    options: QuestionOption[];
    multiSelect: boolean;
}
export interface AskUserQuestionDialogProps {
    questions: Question[];
    onSubmit: (answers: Record<string, string>) => void;
    onCancel: () => void;
}
export declare const AskUserQuestionDialog: FC<AskUserQuestionDialogProps>;
