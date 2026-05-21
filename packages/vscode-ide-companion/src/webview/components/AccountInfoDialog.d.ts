/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { FC } from 'react';
export interface AccountInfo {
    authType?: string | null;
    baseUrl?: string | null;
    envKey?: string | null;
    modelId?: string | null;
    error?: string;
}
interface AccountInfoDialogProps {
    info: AccountInfo;
    onClose: () => void;
}
export declare const AccountInfoDialog: FC<AccountInfoDialogProps>;
export {};
