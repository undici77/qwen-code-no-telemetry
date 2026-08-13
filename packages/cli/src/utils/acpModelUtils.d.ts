/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { AuthType, type AvailableModel, type Config } from '@qwen-code/qwen-code-core';
export declare const ACP_ROUTE_ID_PREFIX = "qwen-route:v1:";
interface AcpModelOption {
    model: AvailableModel;
    modelId: string;
    effectiveModelId: string;
}
export declare function buildAcpModelOptions(models: readonly AvailableModel[]): AcpModelOption[];
export declare function resolveAcpModelOption(input: string, models: readonly AvailableModel[]): {
    modelId: string;
    authType: AuthType;
    baseUrl?: string;
    registryBaseUrl?: string | null;
    isRuntime: boolean;
} | null;
export declare function getCurrentAcpModelId(options: readonly AcpModelOption[], modelId: string, authType?: AuthType, registryBaseUrl?: string | null): string;
export declare function sanitizeProviderBaseUrl(baseUrl: string): string;
/**
 * Extracts the base model id from an ACP model id string.
 *
 * If the string ends with `(...)`, the suffix is removed; otherwise returns the
 * trimmed input as-is.
 */
export declare function parseAcpBaseModelId(value: string): string;
/**
 * Parses an ACP model option string into `{ modelId, authType? }`.
 *
 * Supports the following formats:
 * - `${modelId}(${authType})` - Standard registry model (e.g., "gpt-4(USE_OPENAI)")
 * - `${snapshotId}(${authType})` - Runtime model snapshot (e.g., "$runtime|USE_OPENAI|gpt-4(USE_OPENAI)")
 *   where snapshotId is in format `$runtime|${authType}|${modelId}`
 * - Plain model ID - Returns as-is with no authType
 *
 * If the string ends with `(...)` and `...` is a valid `AuthType`, returns both;
 * otherwise returns the trimmed input as `modelId` only.
 */
export declare function parseAcpModelOption(input: string): {
    modelId: string;
    authType?: AuthType;
};
/**
 * Whether a bare `modelId` resolves to the SAME provider identity as the active
 * content generator — same auth type, base URL, and credential env key.
 *
 * A per-turn inline `modelOverride` reuses the active provider's endpoint and
 * credentials and only swaps the model id; it cannot rebuild baseUrl/envKey for
 * a different provider. Any consumer that applies a `submit_prompt` result's
 * `modelOverride` must gate on this so an override naming a same-id model owned
 * by a different provider (or a different auth type) is never silently sent to
 * the active endpoint/account — even if a future (or untrusted) slash command
 * produces the override instead of the validated `/model` command. `modelId` is
 * the bare id without any `(authType)` suffix.
 */
export declare function isInlineModelOverrideAllowed(config: Config, modelId: string): boolean;
export {};
