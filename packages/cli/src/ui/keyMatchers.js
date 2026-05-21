/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Command, defaultKeyBindings } from '../config/keyBindings.js';
/**
 * Matches a KeyBinding against an actual Key press
 * Pure data-driven matching logic
 */
function matchKeyBinding(keyBinding, key) {
    // Either key name or sequence must match (but not both should be defined)
    let keyMatches = false;
    if (keyBinding.key !== undefined) {
        keyMatches = keyBinding.key === key.name;
    }
    else if (keyBinding.sequence !== undefined) {
        keyMatches = keyBinding.sequence === key.sequence;
    }
    else {
        // Neither key nor sequence defined - invalid binding
        return false;
    }
    if (!keyMatches) {
        return false;
    }
    // Check modifiers - follow original logic:
    // undefined = ignore this modifier (original behavior)
    // true = modifier must be pressed
    // false = modifier must NOT be pressed
    if (keyBinding.ctrl !== undefined && key.ctrl !== keyBinding.ctrl) {
        return false;
    }
    if (keyBinding.shift !== undefined && key.shift !== keyBinding.shift) {
        return false;
    }
    if (keyBinding.command !== undefined && key.meta !== keyBinding.command) {
        return false;
    }
    if (keyBinding.paste !== undefined && key.paste !== keyBinding.paste) {
        return false;
    }
    if (keyBinding.meta !== undefined && key.meta !== keyBinding.meta) {
        return false;
    }
    return true;
}
/**
 * Checks if a key matches any of the bindings for a command
 */
function matchCommand(command, key, config = defaultKeyBindings) {
    const bindings = config[command];
    return bindings.some((binding) => matchKeyBinding(binding, key));
}
/**
 * Creates key matchers from a key binding configuration
 */
export function createKeyMatchers(config = defaultKeyBindings) {
    const matchers = {};
    for (const command of Object.values(Command)) {
        matchers[command] = (key) => matchCommand(command, key, config);
    }
    return matchers;
}
/**
 * Default key binding matchers using the default configuration
 */
export const keyMatchers = createKeyMatchers(defaultKeyBindings);
// Re-export Command for convenience
export { Command };
//# sourceMappingURL=keyMatchers.js.map