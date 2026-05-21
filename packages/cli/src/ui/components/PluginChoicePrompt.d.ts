/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
interface PluginChoice {
    name: string;
    description?: string;
}
type PluginChoicePromptProps = {
    marketplaceName: string;
    plugins: PluginChoice[];
    onSelect: (pluginName: string) => void;
    onCancel: () => void;
    terminalWidth: number;
};
export declare const PluginChoicePrompt: (props: PluginChoicePromptProps) => import("react/jsx-runtime").JSX.Element;
export {};
