/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
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
export declare const CODING_PLAN_ENV_KEY = "BAILIAN_CODING_PLAN_API_KEY";
export declare const TOKEN_PLAN_ENV_KEY = "BAILIAN_TOKEN_PLAN_API_KEY";
interface SubscriptionPlanRegionConfig<TRegion extends string = SubscriptionPlanRegion> {
    id: TRegion;
    title: string;
    endpoint: string;
    documentationUrl?: string;
    apiKeyUrl?: string;
    modelNamePrefix?: string;
}
interface SubscriptionPlanModelSpec {
    id: string;
    contextWindowSize: number;
    enableThinking?: boolean;
    description?: string;
}
export interface SubscriptionPlanDefinition<TId extends string = SubscriptionPlanId, TRegion extends string = SubscriptionPlanRegion> {
    id: TId;
    option: string;
    title: string;
    description: string;
    envKey: string;
    modelNamePrefix: string;
    authEventType: 'coding-plan';
    metadataKey: string;
    endpoint?: string;
    documentationUrl?: string;
    apiKeyUrl?: string;
    usageDocumentationUrl?: string;
    defaultRegion?: TRegion;
    regions?: ReadonlyArray<SubscriptionPlanRegionConfig<TRegion>>;
    models: readonly SubscriptionPlanModelSpec[];
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
export {};
