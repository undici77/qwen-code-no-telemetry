/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare function assumeExhaustive(_value: never): void;
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
export declare function checkExhaustive(value: never, msg?: string): never;
