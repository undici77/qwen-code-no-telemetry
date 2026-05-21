/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { IdeInfo } from '@qwen-code/qwen-code-core';
export type IdeIntegrationNudgeResult = {
    userSelection: 'yes' | 'no' | 'dismiss';
    isExtensionPreInstalled: boolean;
};
interface IdeIntegrationNudgeProps {
    ide: IdeInfo;
    onComplete: (result: IdeIntegrationNudgeResult) => void;
}
export declare function IdeIntegrationNudge({ ide, onComplete, }: IdeIntegrationNudgeProps): import("react/jsx-runtime").JSX.Element;
export {};
