/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export type TrustRuleLevel = 'TRUST_FOLDER' | 'TRUST_PARENT' | 'DO_NOT_TRUST';
export interface TrustPrecedenceRule<TPayload = undefined> {
    readonly level: 'trusted' | 'untrusted';
    readonly variants: ReadonlySet<string>;
    readonly payload?: TPayload;
}
/**
 * Convert persisted folder-trust rules into the shared precedence shape.
 * TRUST_PARENT is resolved to the containing directory before matching.
 */
export declare function buildTrustPrecedenceRules<T extends string>(rules: Iterable<{
    path: string;
    trustLevel: T;
}>): Array<TrustPrecedenceRule<T>>;
/**
 * Resolve the most-specific rule that contains the requested location.
 * An untrusted rule wins when trusted and untrusted rules match at the same
 * depth. The result is independent of persisted rule insertion order.
 */
export declare function resolveTrustRule<TPayload>(rules: Iterable<TrustPrecedenceRule<TPayload>>, locationVariants: ReadonlySet<string>): TrustPrecedenceRule<TPayload> | undefined;
export declare function resolveTrustDecision<TPayload>(rules: Iterable<TrustPrecedenceRule<TPayload>>, locationVariants: ReadonlySet<string>): boolean | undefined;
