/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const SESSION_MENTION_PREFIX = "session:";
export interface SessionRef {
    id?: string;
    title?: string;
}
export declare function isSessionId(value: string): boolean;
export declare function parseSessionRef(pathName: string): SessionRef | null;
export declare function buildSessionRef(idOrTitle: string): string;
