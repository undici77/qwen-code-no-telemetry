/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { SettingScope } from '../../../config/settings.js';
interface ScopeSelectorProps {
    /** Callback function when a scope is selected */
    onSelect: (scope: SettingScope) => void;
    /** Callback function when a scope is highlighted */
    onHighlight: (scope: SettingScope) => void;
    /** Whether the component is focused */
    isFocused: boolean;
    /** The initial scope to select */
    initialScope: SettingScope;
}
export declare function ScopeSelector({ onSelect, onHighlight, isFocused, initialScope, }: ScopeSelectorProps): React.JSX.Element;
export {};
