/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
declare module 'vitest' {
    interface Assertion<T> {
        toHaveOnlyValidCharacters(): T;
    }
    interface AsymmetricMatchersContaining {
        toHaveOnlyValidCharacters(): void;
    }
}
export {};
