/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The placeholder string for shorthand argument injection in custom commands.
 * When used outside of !{...}, arguments are injected raw.
 * When used inside !{...}, arguments are shell-escaped.
 */
export const SHORTHAND_ARGS_PLACEHOLDER = '{{args}}';
/**
 * The trigger string for shell command injection in custom commands.
 */
export const SHELL_INJECTION_TRIGGER = '!{';
/**
 * The trigger string for at file injection in custom commands.
 */
export const AT_FILE_INJECTION_TRIGGER = '@{';
//# sourceMappingURL=types.js.map