/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AuthType } from '../core/contentGenerator.js';
import type { ModelProvidersConfig } from '../models/types.js';
import type { ProviderInstallPlan, ProviderSettingsAdapter } from './types.js';
export interface ApplyProviderInstallPlanOptions {
    settings: ProviderSettingsAdapter;
    /** Callback to reload model providers config in the runtime. */
    reloadModelProviders?: (mp: ModelProvidersConfig) => void;
    /** Callback to sync auth state after install. */
    syncAuthState?: (authType: AuthType, modelId: string) => void;
    /** Callback to refresh auth after install. */
    refreshAuth?: (authType: AuthType) => Promise<void>;
    /** Whether to call refreshAuth after install. Defaults to true. */
    doRefreshAuth?: boolean;
}
export interface ApplyProviderInstallPlanResult {
    updatedModelProviders: ModelProvidersConfig;
}
/**
 * Error thrown by {@link applyProviderInstallPlan} when a step fails. The
 * message is the underlying error's message (safe to surface to users); the
 * `step` and `authType` properties carry diagnostic context, and `cause`
 * preserves the original error (so callers matching on `err.code` still work
 * via the chain).
 *
 * A class (not an interface) so `err instanceof ProviderInstallError` works
 * at runtime — an interface would erase at compile time and silently always
 * be false.
 */
export declare class ProviderInstallError extends Error {
    readonly step: string;
    readonly authType: AuthType;
    constructor(message: string, step: string, authType: AuthType, options?: {
        cause?: unknown;
    });
}
export declare function applyProviderInstallPlan(plan: ProviderInstallPlan, options: ApplyProviderInstallPlanOptions): Promise<ApplyProviderInstallPlanResult>;
