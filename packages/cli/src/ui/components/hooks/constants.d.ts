/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { HooksConfigSource, HookEventName } from '@qwen-code/qwen-code-core';
import type { HookExitCode, HookEventDisplayInfo } from './types.js';
/**
 * Exit code descriptions for different hook types
 */
export declare function getHookExitCodes(eventName: string): HookExitCode[];
/**
 * Short one-line description for hooks list view
 */
export declare function getHookShortDescription(eventName: string): string;
/**
 * Detailed description for each hook event type (shown in detail view)
 */
export declare function getHookDescription(eventName: string): string;
/**
 * Source display mapping (translated)
 */
export declare function getTranslatedSourceDisplayMap(): Record<HooksConfigSource, string>;
/**
 * List of hook events to display in the UI
 * Automatically synced with HookEventName enum from core.
 * Note: Order follows the enum definition order. If UI presentation order
 * needs to be different (e.g., grouped by lifecycle phase), consider using
 * an explicit sorted array instead. Current enum order is acceptable for display.
 */
export declare const DISPLAY_HOOK_EVENTS: HookEventName[];
/**
 * Create empty hook event display info
 */
export declare function createEmptyHookEventInfo(eventName: HookEventName): HookEventDisplayInfo;
