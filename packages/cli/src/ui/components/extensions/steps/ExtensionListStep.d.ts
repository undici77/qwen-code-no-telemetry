/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type Extension } from '@qwen-code/qwen-code-core';
interface ExtensionListStepProps {
    extensions: Extension[];
    extensionsUpdateState: Map<string, string>;
    onExtensionSelect: (extensionIndex: number) => void;
}
export declare const ExtensionListStep: ({ extensions, extensionsUpdateState, onExtensionSelect, }: ExtensionListStepProps) => import("react/jsx-runtime").JSX.Element;
export {};
