/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { CODING_PLAN_ENV_KEY, TOKEN_PLAN_ENV_KEY } from '@qwen-code/qwen-code-core';
export { CODING_PLAN_ENV_KEY, TOKEN_PLAN_ENV_KEY };
export declare enum CodingPlanRegion {
    CHINA = "china",
    GLOBAL = "global"
}
export type SubscriptionPlanId = 'coding' | 'token';
export type SubscriptionPlanRegion = CodingPlanRegion | string;
export interface SubscriptionPlanModelConfig {
    id: string;
    name?: string;
    baseUrl?: string;
    envKey?: string;
    generationConfig?: Record<string, unknown>;
}
export type CodingPlanTemplate = SubscriptionPlanModelConfig[];
interface SubscriptionPlanRegionConfig<TRegion extends string = SubscriptionPlanRegion> {
    id: TRegion;
    title: string;
    endpoint: string;
    documentationUrl?: string;
    apiKeyUrl?: string;
}
export interface SubscriptionPlanDefinition<TId extends string = SubscriptionPlanId, TRegion extends string = SubscriptionPlanRegion> {
    id: TId;
    option: string;
    title: string;
    description: string;
    envKey: string;
    authEventType: 'coding-plan';
    metadataKey: string;
    endpoint?: string;
    documentationUrl?: string;
    apiKeyUrl?: string;
    usageDocumentationUrl?: string;
    defaultRegion?: TRegion;
    regions?: ReadonlyArray<SubscriptionPlanRegionConfig<TRegion>>;
}
export interface SubscriptionPlanConfig {
    id: SubscriptionPlanId;
    option: string;
    displayName: string;
    title: string;
    description: string;
    authEventType: 'coding-plan';
    envKey: string;
    metadataKey: string;
    template: CodingPlanTemplate;
    version: string;
    baseUrl: string;
    region?: CodingPlanRegion;
    documentationUrl?: string;
    apiKeyUrl?: string;
    usageDocumentationUrl?: string;
}
export declare const SUBSCRIPTION_PLAN_OPTIONS: SubscriptionPlanDefinition[];
export declare function getSubscriptionPlanConfig(planId: SubscriptionPlanId, region?: SubscriptionPlanRegion): SubscriptionPlanConfig;
export declare function findSubscriptionPlanByConfig(baseUrl: string | undefined, envKey: string | undefined): {
    plan: SubscriptionPlanDefinition;
    region?: SubscriptionPlanRegion;
} | undefined;
export declare function isSubscriptionPlanConfig(baseUrl: string | undefined, envKey: string | undefined): boolean;
