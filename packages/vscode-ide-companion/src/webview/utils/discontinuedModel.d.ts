/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** Auth type marker for the (now-discontinued) Qwen OAuth free tier. */
export declare const QWEN_OAUTH_AUTH_TYPE = "qwen-oauth";
/** User-facing strings for the discontinued state (English-only — webview has no i18n runtime). */
export declare const DISCONTINUED_MESSAGES: {
    readonly badge: "(Discontinued)";
    readonly description: "Discontinued — switch to Coding Plan or API Key";
    readonly blockedError: "Qwen OAuth free tier was discontinued on 2026-04-15. Please select a model from another provider or run /auth to switch.";
};
export interface ParsedAcpModelId {
    /** Model id with the trailing `(authType)` marker stripped. */
    baseModelId: string;
    /** Auth type extracted from the trailing `(authType)` marker, or `undefined` if none. */
    authType?: string;
    /** True when the id starts with `$runtime|` (cached-token snapshot). */
    isRuntime: boolean;
}
/**
 * Parse an ACP-formatted model id into its components.
 *
 * Returned `baseModelId` may still contain `$runtime|` prefix to preserve the
 * caller's original snapshot id; only the trailing auth-type wrapper is removed.
 */
export declare function parseAcpModelId(modelId: string): ParsedAcpModelId;
/**
 * Returns true when the model id refers to a non-runtime Qwen OAuth registry
 * entry, matching the CLI's discontinued rule.
 *
 * Runtime snapshots from existing cached tokens are intentionally excluded so
 * already-authenticated sessions keep working until the server rejects them.
 */
export declare function isDiscontinuedModel(modelId: string): boolean;
