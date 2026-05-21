/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
export interface ApiKeyInputPlan {
    apiKeyUrl: string;
    helpText: string;
    placeholder: string;
    validate?: (apiKey: string) => string | null;
}
interface ApiKeyInputProps {
    onSubmit: (apiKey: string) => void;
    onCancel: () => void;
    plan: ApiKeyInputPlan;
}
export declare const CODING_PLAN_API_KEY_URL = "https://bailian.console.aliyun.com/?tab=model#/efm/coding_plan";
export declare const CODING_PLAN_INTL_API_KEY_URL = "https://modelstudio.console.alibabacloud.com/?tab=dashboard#/efm/coding_plan";
export declare const TOKEN_PLAN_API_KEY_URL = "https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=3028856";
export declare function ApiKeyInput({ onSubmit, onCancel, plan, }: ApiKeyInputProps): React.JSX.Element;
export {};
