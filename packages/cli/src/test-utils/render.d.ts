/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import type React from 'react';
import type { Config } from '@qwen-code/qwen-code-core';
import { LoadedSettings } from '../config/settings.js';
export declare const renderWithProviders: (component: React.ReactElement, { shellFocus, settings, config, }?: {
    shellFocus?: boolean;
    settings?: LoadedSettings;
    config?: Config;
}) => ReturnType<typeof render>;
