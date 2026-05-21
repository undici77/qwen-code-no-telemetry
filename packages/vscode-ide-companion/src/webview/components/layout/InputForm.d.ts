/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 *
 * InputForm adapter for VSCode - wraps webui InputForm with local type handling
 * This allows local ApprovalModeValue to work with webui's EditModeInfo
 */
import type { ClipboardEvent, FC, ReactNode } from 'react';
import type { InputFormProps as BaseInputFormProps } from '@qwen-code/webui';
import type { CompletionItem } from '../../../types/completionItemTypes.js';
import type { ApprovalModeValue } from '../../../types/approvalModeValueTypes.js';
import type { ModelInfo } from '@agentclientprotocol/sdk';
/**
 * Extended props that accept ApprovalModeValue and ModelSelector
 */
export interface InputFormProps extends Omit<BaseInputFormProps, 'editModeInfo' | 'onCompletionFill'> {
    /** Edit mode value (local type) */
    editMode: ApprovalModeValue;
    /** Optional paste handler forwarded to the base input */
    onPaste?: (e: ClipboardEvent) => void;
    /** Optional content rendered between the input and actions */
    extraContent?: ReactNode;
    /** Completion fill callback (Tab or equivalent) */
    onCompletionFill?: (item: CompletionItem) => void;
    /** Whether to show model selector */
    showModelSelector?: boolean;
    /** Available models for selection */
    availableModels?: ModelInfo[];
    /** Current model ID */
    currentModelId?: string | null;
    /** Callback when a model is selected */
    onSelectModel?: (modelId: string) => void;
    /** Callback to close model selector */
    onCloseModelSelector?: () => void;
}
/**
 * InputForm with ApprovalModeValue and ModelSelector support
 *
 * This is an adapter that accepts the local ApprovalModeValue type
 * and converts it to webui's EditModeInfo format.
 * It also renders the ModelSelector component when needed.
 */
export declare const InputForm: FC<InputFormProps>;
