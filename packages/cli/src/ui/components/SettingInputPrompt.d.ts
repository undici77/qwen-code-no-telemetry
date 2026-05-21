/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
type SettingInputPromptProps = {
    settingName: string;
    settingDescription: string;
    sensitive: boolean;
    onSubmit: (value: string) => void;
    onCancel: () => void;
    terminalWidth: number;
};
export declare const SettingInputPrompt: (props: SettingInputPromptProps) => import("react/jsx-runtime").JSX.Element;
export {};
