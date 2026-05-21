/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const ENABLE_FOCUS_REPORTING = "\u001B[?1004h";
export declare const DISABLE_FOCUS_REPORTING = "\u001B[?1004l";
export declare const FOCUS_IN = "\u001B[I";
export declare const FOCUS_OUT = "\u001B[O";
export declare const useFocus: () => boolean;
