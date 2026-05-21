/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type StartupEventAttrs = Record<string, string | number | boolean>;
export type StartupEventSink = (name: string, attrs?: StartupEventAttrs) => void;
/**
 * Registers the active sink. Typically called once at cli entry.
 */
export declare function setStartupEventSink(handler: StartupEventSink | null): void;
/**
 * Records a startup event. Safe to call from any package; no-op when no sink
 * is registered.
 */
export declare function recordStartupEvent(name: string, attrs?: StartupEventAttrs): void;
