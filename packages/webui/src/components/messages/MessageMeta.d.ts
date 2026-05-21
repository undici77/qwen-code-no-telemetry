/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type FC, type ReactNode } from 'react';
interface MessageMetaProps {
    timestamp?: number;
    copyText: string;
    onEdit?: () => void;
    editDisabled?: boolean;
    editIcon?: ReactNode;
}
export declare const MessageMeta: FC<MessageMetaProps>;
export {};
