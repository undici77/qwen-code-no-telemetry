/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import { AuthType } from '../core/authTypes.js';
export interface ResolvedModelId {
    authType?: AuthType;
    modelId: string;
}
export interface ModelIdResolutionContext {
    currentModel?: string;
    currentAuthType?: AuthType;
    fastModel?: string;
    getAvailableModels?: (authTypes?: AuthType[]) => readonly ModelIdAvailableModel[];
}
export interface ModelIdAvailableModel {
    id: string;
    authType: AuthType;
}
/**
 * Resolve a model selector to the concrete model ID a caller should use.
 *
 * Supported forms:
 * - omitted / inherit -> use parent conversation model
 * - fast -> use the configured fastModel
 * - modelId -> use current authType when available, otherwise the first
 *   configured authType that contains the model
 * - authType:modelId -> use explicit authType and modelId
 */
export declare function resolveModelId(model: string | undefined, context?: ModelIdResolutionContext): ResolvedModelId | undefined;
/**
 * Build a {@link ModelIdResolutionContext} from a {@link Config}, wiring the
 * standard adapter calls (current model, current auth type, configured fast
 * model, configured models per auth type) used by every runtime caller.
 */
export declare function buildModelIdContext(config: Config): ModelIdResolutionContext;
