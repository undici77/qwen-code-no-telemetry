/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { createHash } from 'node:crypto';
export var CodingPlanRegion;
(function (CodingPlanRegion) {
    CodingPlanRegion["CHINA"] = "china";
    CodingPlanRegion["GLOBAL"] = "global";
})(CodingPlanRegion || (CodingPlanRegion = {}));
export const CODING_PLAN_ENV_KEY = 'BAILIAN_CODING_PLAN_API_KEY';
export const TOKEN_PLAN_ENV_KEY = 'BAILIAN_TOKEN_PLAN_API_KEY';
// keep in sync with packages/cli/src/auth/providers/alibaba/codingPlan.ts MODELSTUDIO_MODELS
const ALIBABA_SUBSCRIPTION_MODELS = [
    { id: 'qwen3.5-plus', contextWindowSize: 1000000, enableThinking: true },
    {
        id: 'qwen3.6-plus',
        description: 'Currently available to Pro subscribers only.',
        contextWindowSize: 1000000,
        enableThinking: true,
    },
    { id: 'glm-5', contextWindowSize: 202752, enableThinking: true },
    { id: 'kimi-k2.5', contextWindowSize: 262144, enableThinking: true },
    { id: 'MiniMax-M2.5', contextWindowSize: 196608, enableThinking: true },
    { id: 'qwen3-coder-plus', contextWindowSize: 1000000 },
    { id: 'qwen3-coder-next', contextWindowSize: 262144 },
    {
        id: 'qwen3-max-2026-01-23',
        contextWindowSize: 262144,
        enableThinking: true,
    },
    { id: 'glm-4.7', contextWindowSize: 202752, enableThinking: true },
];
const CODING_PLAN = {
    id: 'coding',
    option: 'CODING_PLAN',
    title: 'Coding Plan',
    description: 'For individual developers · Weekly quota included',
    envKey: CODING_PLAN_ENV_KEY,
    modelNamePrefix: 'ModelStudio Coding Plan',
    authEventType: 'coding-plan',
    metadataKey: 'codingPlan',
    defaultRegion: CodingPlanRegion.CHINA,
    regions: [
        {
            id: CodingPlanRegion.CHINA,
            title: 'China (Beijing)',
            endpoint: 'https://coding.dashscope.aliyuncs.com/v1',
            documentationUrl: 'https://help.aliyun.com/zh/model-studio/coding-plan',
        },
        {
            id: CodingPlanRegion.GLOBAL,
            title: 'Singapore (International)',
            endpoint: 'https://coding-intl.dashscope.aliyuncs.com/v1',
            documentationUrl: 'https://www.alibabacloud.com/help/en/model-studio/coding-plan',
            modelNamePrefix: 'ModelStudio Coding Plan for Global/Intl',
        },
    ],
    models: ALIBABA_SUBSCRIPTION_MODELS,
};
const TOKEN_PLAN = {
    id: 'token',
    option: 'TOKEN_PLAN',
    title: 'Token Plan',
    description: 'For teams and companies · Usage-based billing with dedicated endpoint',
    envKey: TOKEN_PLAN_ENV_KEY,
    modelNamePrefix: 'ModelStudio Token Plan',
    authEventType: 'coding-plan',
    metadataKey: 'tokenPlan',
    endpoint: 'https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1',
    documentationUrl: 'https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=3028856',
    apiKeyUrl: 'https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=3028856',
    usageDocumentationUrl: 'https://bailian.console.aliyun.com/cn-beijing?tab=doc#/doc/?type=model&url=3028856',
    models: ALIBABA_SUBSCRIPTION_MODELS,
};
const SUBSCRIPTION_PLANS = {
    coding: CODING_PLAN,
    token: TOKEN_PLAN,
};
export const SUBSCRIPTION_PLAN_OPTIONS = Object.values(SUBSCRIPTION_PLANS);
function computeCodingPlanVersion(template) {
    return createHash('sha256').update(JSON.stringify(template)).digest('hex');
}
function resolveSubscriptionPlanRegion(plan, region) {
    if (!plan.regions) {
        return undefined;
    }
    return (plan.regions.find((candidate) => candidate.id === region) ||
        plan.regions.find((candidate) => candidate.id === plan.defaultRegion) ||
        plan.regions[0]);
}
function getSubscriptionPlanEndpoint(plan, region) {
    return (resolveSubscriptionPlanRegion(plan, region)?.endpoint || plan.endpoint || '');
}
function getSubscriptionPlanModelNamePrefix(plan, region) {
    return (resolveSubscriptionPlanRegion(plan, region)?.modelNamePrefix ||
        plan.modelNamePrefix);
}
function buildSubscriptionPlanTemplate(plan, region) {
    const endpoint = getSubscriptionPlanEndpoint(plan, region);
    const modelNamePrefix = getSubscriptionPlanModelNamePrefix(plan, region);
    return plan.models.map((model) => ({
        id: model.id,
        name: `[${modelNamePrefix}] ${model.id}`,
        ...(model.description ? { description: model.description } : {}),
        baseUrl: endpoint,
        envKey: plan.envKey,
        generationConfig: {
            ...(model.enableThinking
                ? { extra_body: { enable_thinking: true } }
                : {}),
            contextWindowSize: model.contextWindowSize,
        },
    }));
}
export function getSubscriptionPlanConfig(planId, region) {
    const plan = SUBSCRIPTION_PLANS[planId];
    const resolvedRegion = resolveSubscriptionPlanRegion(plan, region);
    const template = buildSubscriptionPlanTemplate(plan, resolvedRegion?.id);
    return {
        id: plan.id,
        option: plan.option,
        displayName: plan.title,
        title: plan.title,
        description: plan.description,
        authEventType: plan.authEventType,
        envKey: plan.envKey,
        metadataKey: plan.metadataKey,
        template,
        version: computeCodingPlanVersion(template),
        baseUrl: getSubscriptionPlanEndpoint(plan, resolvedRegion?.id),
        ...(resolvedRegion
            ? { region: resolvedRegion.id }
            : {}),
        documentationUrl: resolvedRegion?.documentationUrl || plan.documentationUrl,
        apiKeyUrl: resolvedRegion?.apiKeyUrl || plan.apiKeyUrl,
        usageDocumentationUrl: plan.usageDocumentationUrl,
    };
}
export function findSubscriptionPlanByConfig(baseUrl, envKey) {
    if (!baseUrl || !envKey) {
        return undefined;
    }
    for (const plan of SUBSCRIPTION_PLAN_OPTIONS) {
        if (plan.envKey !== envKey) {
            continue;
        }
        if (plan.regions) {
            const region = plan.regions.find((candidate) => candidate.endpoint === baseUrl);
            if (region) {
                return { plan, region: region.id };
            }
            continue;
        }
        if (plan.endpoint === baseUrl) {
            return { plan };
        }
    }
    return undefined;
}
export function isSubscriptionPlanConfig(baseUrl, envKey) {
    return findSubscriptionPlanByConfig(baseUrl, envKey) !== undefined;
}
//# sourceMappingURL=subscriptionPlanDefinitions.js.map