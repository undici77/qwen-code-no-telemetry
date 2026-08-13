/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Whether in-app SGR mouse tracking is on (`ui.mouseTracking`, default true).
 * Reads the raw context, not the throwing useSettings, so callers still render
 * outside a SettingsProvider (e.g. unit tests). Shared by the useMouseEvents
 * gate and the mouse-dependent affordances so they cannot drift apart.
 */
export declare function useMouseTrackingEnabled(): boolean;
