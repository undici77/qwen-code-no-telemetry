/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import type { LoadedSettings } from '../../config/settings.js';
export declare const SettingsContext: React.Context<LoadedSettings | undefined>;
export declare const useSettings: () => LoadedSettings;
