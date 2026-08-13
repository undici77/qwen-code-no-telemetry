import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { LoadedSettings } from '../config/settings.js';
import { KeypressProvider } from '../ui/contexts/KeypressContext.js';
import { SettingsContext } from '../ui/contexts/SettingsContext.js';
import { ShellFocusContext } from '../ui/contexts/ShellFocusContext.js';
import { ConfigContext } from '../ui/contexts/ConfigContext.js';
const mockSettings = new LoadedSettings({ path: '', settings: {}, originalSettings: {} }, { path: '', settings: {}, originalSettings: {} }, { path: '', settings: {}, originalSettings: {} }, { path: '', settings: {}, originalSettings: {} }, true, new Set());
export const renderWithProviders = (component, { shellFocus = true, settings = mockSettings, config = undefined, } = {}) => render(_jsx(SettingsContext.Provider, { value: settings, children: _jsx(ConfigContext.Provider, { value: config, children: _jsx(ShellFocusContext.Provider, { value: shellFocus, children: _jsx(KeypressProvider, { kittyProtocolEnabled: true, children: component }) }) }) }));
//# sourceMappingURL=render.js.map