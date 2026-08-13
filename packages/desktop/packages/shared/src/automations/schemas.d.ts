/**
 * Automations Schema Definitions
 *
 * Zod schemas for validating automations.json configuration.
 * Extracted from index.ts for better separation of concerns.
 */
import { z } from 'zod';
import type { ValidationIssue } from '../config/validators.ts';
export declare const PromptActionSchema: z.ZodObject<{
    type: z.ZodLiteral<"prompt">;
    prompt: z.ZodString;
    llmConnection: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "prompt";
    prompt: string;
    model?: string | undefined;
    llmConnection?: string | undefined;
}, {
    type: "prompt";
    prompt: string;
    model?: string | undefined;
    llmConnection?: string | undefined;
}>;
export declare const WebhookActionSchema: z.ZodObject<{
    type: z.ZodLiteral<"webhook">;
    url: z.ZodEffects<z.ZodString, string, string>;
    method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    bodyFormat: z.ZodOptional<z.ZodEnum<["json", "form", "raw"]>>;
    body: z.ZodOptional<z.ZodUnknown>;
    captureResponse: z.ZodOptional<z.ZodBoolean>;
    auth: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"basic">;
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "basic";
        username: string;
        password: string;
    }, {
        type: "basic";
        username: string;
        password: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"bearer">;
        token: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
        type: "bearer";
    }, {
        token: string;
        type: "bearer";
    }>]>>;
}, "strip", z.ZodTypeAny, {
    type: "webhook";
    url: string;
    auth?: {
        type: "basic";
        username: string;
        password: string;
    } | {
        token: string;
        type: "bearer";
    } | undefined;
    headers?: Record<string, string> | undefined;
    method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
    body?: unknown;
    bodyFormat?: "raw" | "json" | "form" | undefined;
    captureResponse?: boolean | undefined;
}, {
    type: "webhook";
    url: string;
    auth?: {
        type: "basic";
        username: string;
        password: string;
    } | {
        token: string;
        type: "bearer";
    } | undefined;
    headers?: Record<string, string> | undefined;
    method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
    body?: unknown;
    bodyFormat?: "raw" | "json" | "form" | undefined;
    captureResponse?: boolean | undefined;
}>;
/** Accepts prompt and webhook actions strictly; passes through legacy/unknown action types without erroring */
export declare const ActionDefinitionSchema: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"prompt">;
    prompt: z.ZodString;
    llmConnection: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "prompt";
    prompt: string;
    model?: string | undefined;
    llmConnection?: string | undefined;
}, {
    type: "prompt";
    prompt: string;
    model?: string | undefined;
    llmConnection?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"webhook">;
    url: z.ZodEffects<z.ZodString, string, string>;
    method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    bodyFormat: z.ZodOptional<z.ZodEnum<["json", "form", "raw"]>>;
    body: z.ZodOptional<z.ZodUnknown>;
    captureResponse: z.ZodOptional<z.ZodBoolean>;
    auth: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"basic">;
        username: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "basic";
        username: string;
        password: string;
    }, {
        type: "basic";
        username: string;
        password: string;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"bearer">;
        token: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        token: string;
        type: "bearer";
    }, {
        token: string;
        type: "bearer";
    }>]>>;
}, "strip", z.ZodTypeAny, {
    type: "webhook";
    url: string;
    auth?: {
        type: "basic";
        username: string;
        password: string;
    } | {
        token: string;
        type: "bearer";
    } | undefined;
    headers?: Record<string, string> | undefined;
    method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
    body?: unknown;
    bodyFormat?: "raw" | "json" | "form" | undefined;
    captureResponse?: boolean | undefined;
}, {
    type: "webhook";
    url: string;
    auth?: {
        type: "basic";
        username: string;
        password: string;
    } | {
        token: string;
        type: "bearer";
    } | undefined;
    headers?: Record<string, string> | undefined;
    method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
    body?: unknown;
    bodyFormat?: "raw" | "json" | "form" | undefined;
    captureResponse?: boolean | undefined;
}>, z.ZodObject<{
    type: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    type: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    type: z.ZodString;
}, z.ZodTypeAny, "passthrough">>]>;
export declare const TimeConditionSchema: z.ZodObject<{
    condition: z.ZodLiteral<"time">;
    after: z.ZodOptional<z.ZodString>;
    before: z.ZodOptional<z.ZodString>;
    weekday: z.ZodOptional<z.ZodArray<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, "many">>;
    timezone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    condition: "time";
    before?: string | undefined;
    after?: string | undefined;
    weekday?: ("sat" | "mon" | "tue" | "wed" | "thu" | "fri" | "sun")[] | undefined;
    timezone?: string | undefined;
}, {
    condition: "time";
    before?: string | undefined;
    after?: string | undefined;
    weekday?: ("sat" | "mon" | "tue" | "wed" | "thu" | "fri" | "sun")[] | undefined;
    timezone?: string | undefined;
}>;
export declare const StateConditionSchema: z.ZodEffects<z.ZodObject<{
    condition: z.ZodLiteral<"state">;
    field: z.ZodString;
    value: z.ZodOptional<z.ZodUnknown>;
    from: z.ZodOptional<z.ZodUnknown>;
    to: z.ZodOptional<z.ZodUnknown>;
    contains: z.ZodOptional<z.ZodString>;
    not_value: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    condition: "state";
    field: string;
    value?: unknown;
    contains?: string | undefined;
    to?: unknown;
    from?: unknown;
    not_value?: unknown;
}, {
    condition: "state";
    field: string;
    value?: unknown;
    contains?: string | undefined;
    to?: unknown;
    from?: unknown;
    not_value?: unknown;
}>, {
    condition: "state";
    field: string;
    value?: unknown;
    contains?: string | undefined;
    to?: unknown;
    from?: unknown;
    not_value?: unknown;
}, {
    condition: "state";
    field: string;
    value?: unknown;
    contains?: string | undefined;
    to?: unknown;
    from?: unknown;
    not_value?: unknown;
}>;
export declare const AutomationConditionSchema: z.ZodType;
export declare const AutomationMatcherSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    matcher: z.ZodOptional<z.ZodString>;
    cron: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    permissionMode: z.ZodOptional<z.ZodEnum<["allow-all", "safe", "ask", "auto-edit"]>>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>;
    actions: z.ZodArray<z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"prompt">;
        prompt: z.ZodString;
        llmConnection: z.ZodOptional<z.ZodString>;
        model: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "prompt";
        prompt: string;
        model?: string | undefined;
        llmConnection?: string | undefined;
    }, {
        type: "prompt";
        prompt: string;
        model?: string | undefined;
        llmConnection?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"webhook">;
        url: z.ZodEffects<z.ZodString, string, string>;
        method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        bodyFormat: z.ZodOptional<z.ZodEnum<["json", "form", "raw"]>>;
        body: z.ZodOptional<z.ZodUnknown>;
        captureResponse: z.ZodOptional<z.ZodBoolean>;
        auth: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
            type: z.ZodLiteral<"basic">;
            username: z.ZodString;
            password: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "basic";
            username: string;
            password: string;
        }, {
            type: "basic";
            username: string;
            password: string;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"bearer">;
            token: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            token: string;
            type: "bearer";
        }, {
            token: string;
            type: "bearer";
        }>]>>;
    }, "strip", z.ZodTypeAny, {
        type: "webhook";
        url: string;
        auth?: {
            type: "basic";
            username: string;
            password: string;
        } | {
            token: string;
            type: "bearer";
        } | undefined;
        headers?: Record<string, string> | undefined;
        method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
        body?: unknown;
        bodyFormat?: "raw" | "json" | "form" | undefined;
        captureResponse?: boolean | undefined;
    }, {
        type: "webhook";
        url: string;
        auth?: {
            type: "basic";
            username: string;
            password: string;
        } | {
            token: string;
            type: "bearer";
        } | undefined;
        headers?: Record<string, string> | undefined;
        method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
        body?: unknown;
        bodyFormat?: "raw" | "json" | "form" | undefined;
        captureResponse?: boolean | undefined;
    }>, z.ZodObject<{
        type: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>]>, "many">;
}, "strip", z.ZodTypeAny, {
    actions: ({
        type: "prompt";
        prompt: string;
        model?: string | undefined;
        llmConnection?: string | undefined;
    } | {
        type: "webhook";
        url: string;
        auth?: {
            type: "basic";
            username: string;
            password: string;
        } | {
            token: string;
            type: "bearer";
        } | undefined;
        headers?: Record<string, string> | undefined;
        method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
        body?: unknown;
        bodyFormat?: "raw" | "json" | "form" | undefined;
        captureResponse?: boolean | undefined;
    } | z.objectOutputType<{
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">)[];
    name?: string | undefined;
    enabled?: boolean | undefined;
    cron?: string | undefined;
    matcher?: string | undefined;
    id?: string | undefined;
    permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
    labels?: string[] | undefined;
    conditions?: any[] | undefined;
    timezone?: string | undefined;
}, {
    actions: ({
        type: "prompt";
        prompt: string;
        model?: string | undefined;
        llmConnection?: string | undefined;
    } | {
        type: "webhook";
        url: string;
        auth?: {
            type: "basic";
            username: string;
            password: string;
        } | {
            token: string;
            type: "bearer";
        } | undefined;
        headers?: Record<string, string> | undefined;
        method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
        body?: unknown;
        bodyFormat?: "raw" | "json" | "form" | undefined;
        captureResponse?: boolean | undefined;
    } | z.objectInputType<{
        type: z.ZodString;
    }, z.ZodTypeAny, "passthrough">)[];
    name?: string | undefined;
    enabled?: boolean | undefined;
    cron?: string | undefined;
    matcher?: string | undefined;
    id?: string | undefined;
    permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
    labels?: string[] | undefined;
    conditions?: any[] | undefined;
    timezone?: string | undefined;
}>;
/**
 * Deprecated event name aliases.
 * Old names are accepted during schema validation and silently rewritten to canonical names.
 * A console.warn() is emitted at runtime so users know to update their configs.
 */
export declare const DEPRECATED_EVENT_ALIASES: Record<string, string>;
/** All valid event names: canonical events + deprecated aliases. Derived from types.ts. */
export declare const VALID_EVENTS: readonly string[];
export declare const AutomationsConfigSchema: z.ZodEffects<z.ZodObject<{
    version: z.ZodOptional<z.ZodNumber>;
    automations: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        matcher: z.ZodOptional<z.ZodString>;
        cron: z.ZodOptional<z.ZodString>;
        timezone: z.ZodOptional<z.ZodString>;
        permissionMode: z.ZodOptional<z.ZodEnum<["allow-all", "safe", "ask", "auto-edit"]>>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        conditions: z.ZodOptional<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>;
        actions: z.ZodArray<z.ZodUnion<[z.ZodObject<{
            type: z.ZodLiteral<"prompt">;
            prompt: z.ZodString;
            llmConnection: z.ZodOptional<z.ZodString>;
            model: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        }, {
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"webhook">;
            url: z.ZodEffects<z.ZodString, string, string>;
            method: z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE"]>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            bodyFormat: z.ZodOptional<z.ZodEnum<["json", "form", "raw"]>>;
            body: z.ZodOptional<z.ZodUnknown>;
            captureResponse: z.ZodOptional<z.ZodBoolean>;
            auth: z.ZodOptional<z.ZodUnion<[z.ZodObject<{
                type: z.ZodLiteral<"basic">;
                username: z.ZodString;
                password: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type: "basic";
                username: string;
                password: string;
            }, {
                type: "basic";
                username: string;
                password: string;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"bearer">;
                token: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                token: string;
                type: "bearer";
            }, {
                token: string;
                type: "bearer";
            }>]>>;
        }, "strip", z.ZodTypeAny, {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        }, {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>]>, "many">;
    }, "strip", z.ZodTypeAny, {
        actions: ({
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        } | {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        } | z.objectOutputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">)[];
        name?: string | undefined;
        enabled?: boolean | undefined;
        cron?: string | undefined;
        matcher?: string | undefined;
        id?: string | undefined;
        permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
        labels?: string[] | undefined;
        conditions?: any[] | undefined;
        timezone?: string | undefined;
    }, {
        actions: ({
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        } | {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        } | z.objectInputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">)[];
        name?: string | undefined;
        enabled?: boolean | undefined;
        cron?: string | undefined;
        matcher?: string | undefined;
        id?: string | undefined;
        permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
        labels?: string[] | undefined;
        conditions?: any[] | undefined;
        timezone?: string | undefined;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    version?: number | undefined;
    automations?: Record<string, {
        actions: ({
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        } | {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        } | z.objectOutputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">)[];
        name?: string | undefined;
        enabled?: boolean | undefined;
        cron?: string | undefined;
        matcher?: string | undefined;
        id?: string | undefined;
        permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
        labels?: string[] | undefined;
        conditions?: any[] | undefined;
        timezone?: string | undefined;
    }[]> | undefined;
}, {
    version?: number | undefined;
    automations?: Record<string, {
        actions: ({
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        } | {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        } | z.objectInputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">)[];
        name?: string | undefined;
        enabled?: boolean | undefined;
        cron?: string | undefined;
        matcher?: string | undefined;
        id?: string | undefined;
        permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
        labels?: string[] | undefined;
        conditions?: any[] | undefined;
        timezone?: string | undefined;
    }[]> | undefined;
}>, {
    version: number | undefined;
    automations: Record<string, {
        actions: ({
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        } | {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        } | z.objectOutputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">)[];
        name?: string | undefined;
        enabled?: boolean | undefined;
        cron?: string | undefined;
        matcher?: string | undefined;
        id?: string | undefined;
        permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
        labels?: string[] | undefined;
        conditions?: any[] | undefined;
        timezone?: string | undefined;
    }[]>;
}, {
    version?: number | undefined;
    automations?: Record<string, {
        actions: ({
            type: "prompt";
            prompt: string;
            model?: string | undefined;
            llmConnection?: string | undefined;
        } | {
            type: "webhook";
            url: string;
            auth?: {
                type: "basic";
                username: string;
                password: string;
            } | {
                token: string;
                type: "bearer";
            } | undefined;
            headers?: Record<string, string> | undefined;
            method?: "POST" | "GET" | "DELETE" | "PATCH" | "PUT" | undefined;
            body?: unknown;
            bodyFormat?: "raw" | "json" | "form" | undefined;
            captureResponse?: boolean | undefined;
        } | z.objectInputType<{
            type: z.ZodString;
        }, z.ZodTypeAny, "passthrough">)[];
        name?: string | undefined;
        enabled?: boolean | undefined;
        cron?: string | undefined;
        matcher?: string | undefined;
        id?: string | undefined;
        permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
        labels?: string[] | undefined;
        conditions?: any[] | undefined;
        timezone?: string | undefined;
    }[]> | undefined;
}>;
/**
 * Convert Zod error to ValidationIssues (matches validators.ts pattern)
 */
export declare function zodErrorToIssues(error: z.ZodError, file: string): ValidationIssue[];
