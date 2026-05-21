/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/* Fail to compile on unexpected values. */
export function assumeExhaustive(_value) { }
/**
 * Throws an exception on unexpected values.
 *
 * A common use case is switch statements:
 * switch(enumValue) {
 *   case Enum.A:
 *   case Enum.B:
 *     break;
 *   default:
 *     checkExhaustive(enumValue);
 * }
 */
export function checkExhaustive(value, msg = `unexpected value ${value}!`) {
    assumeExhaustive(value);
    throw new Error(msg);
}
//# sourceMappingURL=checks.js.map