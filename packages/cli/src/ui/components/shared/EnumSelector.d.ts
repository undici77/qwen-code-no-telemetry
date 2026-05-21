/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SettingEnumOption } from '../../../config/settingsSchema.js';
interface EnumSelectorProps {
    options: readonly SettingEnumOption[];
    currentValue: string | number;
    isActive: boolean;
    onValueChange: (value: string | number) => void;
}
/**
 * A left-right scrolling selector for enum values
 */
export declare function EnumSelector({ options, currentValue, isActive, onValueChange: _onValueChange, }: EnumSelectorProps): React.JSX.Element;
export type { EnumSelectorProps };
