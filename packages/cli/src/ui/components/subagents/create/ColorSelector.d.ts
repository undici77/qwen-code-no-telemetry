/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
interface ColorSelectorProps {
    color?: string;
    agentName?: string;
    onSelect: (color: string) => void;
}
/**
 * Color selection with preview.
 */
export declare function ColorSelector({ color, agentName, onSelect, }: ColorSelectorProps): import("react/jsx-runtime").JSX.Element;
export {};
