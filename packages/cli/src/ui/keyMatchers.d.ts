/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Key } from './hooks/useKeypress.js';
import type { KeyBindingConfig } from '../config/keyBindings.js';
import { Command } from '../config/keyBindings.js';
/**
 * Key matcher function type
 */
type KeyMatcher = (key: Key) => boolean;
/**
 * Type for key matchers mapped to Command enum
 */
export type KeyMatchers = {
    readonly [C in Command]: KeyMatcher;
};
/**
 * Creates key matchers from a key binding configuration
 */
export declare function createKeyMatchers(config?: KeyBindingConfig): KeyMatchers;
/**
 * Default key binding matchers using the default configuration
 */
export declare const keyMatchers: KeyMatchers;
export { Command };
