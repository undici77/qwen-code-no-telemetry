/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const WITTY_LOADING_PHRASES: string[];
export declare const PHRASE_CHANGE_INTERVAL_MS = 15000;
/**
 * Custom hook to manage cycling through loading phrases.
 * @param isActive Whether the phrase cycling should be active.
 * @param isWaiting Whether to show a specific waiting phrase.
 * @returns The current loading phrase.
 */
export declare const usePhraseCycler: (isActive: boolean, isWaiting: boolean, customPhrases?: string[]) => string;
