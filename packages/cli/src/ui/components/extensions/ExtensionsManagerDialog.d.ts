/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '@qwen-code/qwen-code-core';
interface ExtensionsManagerDialogProps {
    onClose: () => void;
    config: Config | null;
}
export declare function ExtensionsManagerDialog({ onClose, config, }: ExtensionsManagerDialogProps): import("react/jsx-runtime").JSX.Element;
export {};
