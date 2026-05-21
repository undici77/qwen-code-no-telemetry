import { z } from 'zod';
import type { CanUseTool } from './types.js';
import type { SubagentConfig } from './protocol.js';
/**
 * OAuth configuration for MCP servers
 */
export declare const McpOAuthConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    clientId: z.ZodOptional<z.ZodString>;
    clientSecret: z.ZodOptional<z.ZodString>;
    scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    redirectUri: z.ZodOptional<z.ZodString>;
    authorizationUrl: z.ZodOptional<z.ZodString>;
    tokenUrl: z.ZodOptional<z.ZodString>;
    audiences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tokenParamName: z.ZodOptional<z.ZodString>;
    registrationUrl: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    scopes?: string[] | undefined;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    redirectUri?: string | undefined;
    tokenUrl?: string | undefined;
    enabled?: boolean | undefined;
    authorizationUrl?: string | undefined;
    audiences?: string[] | undefined;
    tokenParamName?: string | undefined;
    registrationUrl?: string | undefined;
}, {
    scopes?: string[] | undefined;
    clientId?: string | undefined;
    clientSecret?: string | undefined;
    redirectUri?: string | undefined;
    tokenUrl?: string | undefined;
    enabled?: boolean | undefined;
    authorizationUrl?: string | undefined;
    audiences?: string[] | undefined;
    tokenParamName?: string | undefined;
    registrationUrl?: string | undefined;
}>;
/**
 * CLI MCP Server configuration schema
 *
 * Supports multiple transport types:
 * - stdio: command, args, env, cwd
 * - SSE: url
 * - Streamable HTTP: httpUrl, headers
 * - WebSocket: tcp
 */
export declare const CLIMcpServerConfigSchema: z.ZodObject<{
    command: z.ZodOptional<z.ZodString>;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    httpUrl: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    tcp: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    trust: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    includeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    extensionName: z.ZodOptional<z.ZodString>;
    oauth: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        clientId: z.ZodOptional<z.ZodString>;
        clientSecret: z.ZodOptional<z.ZodString>;
        scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        redirectUri: z.ZodOptional<z.ZodString>;
        authorizationUrl: z.ZodOptional<z.ZodString>;
        tokenUrl: z.ZodOptional<z.ZodString>;
        audiences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tokenParamName: z.ZodOptional<z.ZodString>;
        registrationUrl: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    }, {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    }>>;
    authProviderType: z.ZodOptional<z.ZodEnum<["dynamic_discovery", "google_credentials", "service_account_impersonation"]>>;
    targetAudience: z.ZodOptional<z.ZodString>;
    targetServiceAccount: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    command?: string | undefined;
    timeout?: number | undefined;
    env?: Record<string, string> | undefined;
    args?: string[] | undefined;
    url?: string | undefined;
    trust?: boolean | undefined;
    cwd?: string | undefined;
    httpUrl?: string | undefined;
    targetAudience?: string | undefined;
    headers?: Record<string, string> | undefined;
    includeTools?: string[] | undefined;
    excludeTools?: string[] | undefined;
    description?: string | undefined;
    extensionName?: string | undefined;
    tcp?: string | undefined;
    oauth?: {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    } | undefined;
    authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
    targetServiceAccount?: string | undefined;
}, {
    command?: string | undefined;
    timeout?: number | undefined;
    env?: Record<string, string> | undefined;
    args?: string[] | undefined;
    url?: string | undefined;
    trust?: boolean | undefined;
    cwd?: string | undefined;
    httpUrl?: string | undefined;
    targetAudience?: string | undefined;
    headers?: Record<string, string> | undefined;
    includeTools?: string[] | undefined;
    excludeTools?: string[] | undefined;
    description?: string | undefined;
    extensionName?: string | undefined;
    tcp?: string | undefined;
    oauth?: {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    } | undefined;
    authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
    targetServiceAccount?: string | undefined;
}>;
/**
 * SDK MCP Server configuration schema
 */
export declare const SdkMcpServerConfigSchema: z.ZodObject<{
    type: z.ZodLiteral<"sdk">;
    name: z.ZodString;
    instance: z.ZodType<{
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    }, z.ZodTypeDef, {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "sdk";
    instance: {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    };
}, {
    name: string;
    type: "sdk";
    instance: {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    };
}>;
/**
 * Unified MCP Server configuration schema
 */
export declare const McpServerConfigSchema: z.ZodUnion<[z.ZodObject<{
    command: z.ZodOptional<z.ZodString>;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    cwd: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    httpUrl: z.ZodOptional<z.ZodString>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    tcp: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodNumber>;
    trust: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    includeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    extensionName: z.ZodOptional<z.ZodString>;
    oauth: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        clientId: z.ZodOptional<z.ZodString>;
        clientSecret: z.ZodOptional<z.ZodString>;
        scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        redirectUri: z.ZodOptional<z.ZodString>;
        authorizationUrl: z.ZodOptional<z.ZodString>;
        tokenUrl: z.ZodOptional<z.ZodString>;
        audiences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tokenParamName: z.ZodOptional<z.ZodString>;
        registrationUrl: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    }, {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    }>>;
    authProviderType: z.ZodOptional<z.ZodEnum<["dynamic_discovery", "google_credentials", "service_account_impersonation"]>>;
    targetAudience: z.ZodOptional<z.ZodString>;
    targetServiceAccount: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    command?: string | undefined;
    timeout?: number | undefined;
    env?: Record<string, string> | undefined;
    args?: string[] | undefined;
    url?: string | undefined;
    trust?: boolean | undefined;
    cwd?: string | undefined;
    httpUrl?: string | undefined;
    targetAudience?: string | undefined;
    headers?: Record<string, string> | undefined;
    includeTools?: string[] | undefined;
    excludeTools?: string[] | undefined;
    description?: string | undefined;
    extensionName?: string | undefined;
    tcp?: string | undefined;
    oauth?: {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    } | undefined;
    authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
    targetServiceAccount?: string | undefined;
}, {
    command?: string | undefined;
    timeout?: number | undefined;
    env?: Record<string, string> | undefined;
    args?: string[] | undefined;
    url?: string | undefined;
    trust?: boolean | undefined;
    cwd?: string | undefined;
    httpUrl?: string | undefined;
    targetAudience?: string | undefined;
    headers?: Record<string, string> | undefined;
    includeTools?: string[] | undefined;
    excludeTools?: string[] | undefined;
    description?: string | undefined;
    extensionName?: string | undefined;
    tcp?: string | undefined;
    oauth?: {
        scopes?: string[] | undefined;
        clientId?: string | undefined;
        clientSecret?: string | undefined;
        redirectUri?: string | undefined;
        tokenUrl?: string | undefined;
        enabled?: boolean | undefined;
        authorizationUrl?: string | undefined;
        audiences?: string[] | undefined;
        tokenParamName?: string | undefined;
        registrationUrl?: string | undefined;
    } | undefined;
    authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
    targetServiceAccount?: string | undefined;
}>, z.ZodObject<{
    type: z.ZodLiteral<"sdk">;
    name: z.ZodString;
    instance: z.ZodType<{
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    }, z.ZodTypeDef, {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "sdk";
    instance: {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    };
}, {
    name: string;
    type: "sdk";
    instance: {
        connect(transport: unknown): Promise<void>;
        close(): Promise<void>;
    };
}>]>;
export declare const RunConfigSchema: z.ZodObject<{
    max_time_minutes: z.ZodOptional<z.ZodNumber>;
    max_turns: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    max_time_minutes?: number | undefined;
    max_turns?: number | undefined;
}, {
    max_time_minutes?: number | undefined;
    max_turns?: number | undefined;
}>;
export declare const SubagentConfigSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    systemPrompt: z.ZodString;
    model: z.ZodOptional<z.ZodString>;
    runConfig: z.ZodOptional<z.ZodObject<{
        max_time_minutes: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
        max_turns: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        max_time_minutes?: number | undefined;
        max_turns?: number | undefined;
    }, {
        max_time_minutes?: number | undefined;
        max_turns?: number | undefined;
    }>>;
    color: z.ZodOptional<z.ZodString>;
    isBuiltin: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    systemPrompt: string;
    tools?: string[] | undefined;
    model?: string | undefined;
    runConfig?: {
        max_time_minutes?: number | undefined;
        max_turns?: number | undefined;
    } | undefined;
    color?: string | undefined;
    isBuiltin?: boolean | undefined;
}, {
    name: string;
    description: string;
    systemPrompt: string;
    tools?: string[] | undefined;
    model?: string | undefined;
    runConfig?: {
        max_time_minutes?: number | undefined;
        max_turns?: number | undefined;
    } | undefined;
    color?: string | undefined;
    isBuiltin?: boolean | undefined;
}>;
export declare const TimeoutConfigSchema: z.ZodObject<{
    canUseTool: z.ZodOptional<z.ZodNumber>;
    mcpRequest: z.ZodOptional<z.ZodNumber>;
    controlRequest: z.ZodOptional<z.ZodNumber>;
    streamClose: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    canUseTool?: number | undefined;
    mcpRequest?: number | undefined;
    controlRequest?: number | undefined;
    streamClose?: number | undefined;
}, {
    canUseTool?: number | undefined;
    mcpRequest?: number | undefined;
    controlRequest?: number | undefined;
    streamClose?: number | undefined;
}>;
export declare const QueryOptionsSchema: z.ZodObject<{
    cwd: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    pathToQwenExecutable: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    systemPrompt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        type: z.ZodLiteral<"preset">;
        preset: z.ZodLiteral<"qwen_code">;
        append: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        type: "preset";
        preset: "qwen_code";
        append?: string | undefined;
    }, {
        type: "preset";
        preset: "qwen_code";
        append?: string | undefined;
    }>]>>;
    permissionMode: z.ZodOptional<z.ZodEnum<["default", "plan", "auto-edit", "auto", "yolo"]>>;
    canUseTool: z.ZodOptional<z.ZodType<CanUseTool, z.ZodTypeDef, CanUseTool>>;
    mcpServers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodObject<{
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        cwd: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        httpUrl: z.ZodOptional<z.ZodString>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        tcp: z.ZodOptional<z.ZodString>;
        timeout: z.ZodOptional<z.ZodNumber>;
        trust: z.ZodOptional<z.ZodBoolean>;
        description: z.ZodOptional<z.ZodString>;
        includeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        extensionName: z.ZodOptional<z.ZodString>;
        oauth: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            clientId: z.ZodOptional<z.ZodString>;
            clientSecret: z.ZodOptional<z.ZodString>;
            scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            redirectUri: z.ZodOptional<z.ZodString>;
            authorizationUrl: z.ZodOptional<z.ZodString>;
            tokenUrl: z.ZodOptional<z.ZodString>;
            audiences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            tokenParamName: z.ZodOptional<z.ZodString>;
            registrationUrl: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            scopes?: string[] | undefined;
            clientId?: string | undefined;
            clientSecret?: string | undefined;
            redirectUri?: string | undefined;
            tokenUrl?: string | undefined;
            enabled?: boolean | undefined;
            authorizationUrl?: string | undefined;
            audiences?: string[] | undefined;
            tokenParamName?: string | undefined;
            registrationUrl?: string | undefined;
        }, {
            scopes?: string[] | undefined;
            clientId?: string | undefined;
            clientSecret?: string | undefined;
            redirectUri?: string | undefined;
            tokenUrl?: string | undefined;
            enabled?: boolean | undefined;
            authorizationUrl?: string | undefined;
            audiences?: string[] | undefined;
            tokenParamName?: string | undefined;
            registrationUrl?: string | undefined;
        }>>;
        authProviderType: z.ZodOptional<z.ZodEnum<["dynamic_discovery", "google_credentials", "service_account_impersonation"]>>;
        targetAudience: z.ZodOptional<z.ZodString>;
        targetServiceAccount: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        command?: string | undefined;
        timeout?: number | undefined;
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
        url?: string | undefined;
        trust?: boolean | undefined;
        cwd?: string | undefined;
        httpUrl?: string | undefined;
        targetAudience?: string | undefined;
        headers?: Record<string, string> | undefined;
        includeTools?: string[] | undefined;
        excludeTools?: string[] | undefined;
        description?: string | undefined;
        extensionName?: string | undefined;
        tcp?: string | undefined;
        oauth?: {
            scopes?: string[] | undefined;
            clientId?: string | undefined;
            clientSecret?: string | undefined;
            redirectUri?: string | undefined;
            tokenUrl?: string | undefined;
            enabled?: boolean | undefined;
            authorizationUrl?: string | undefined;
            audiences?: string[] | undefined;
            tokenParamName?: string | undefined;
            registrationUrl?: string | undefined;
        } | undefined;
        authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
        targetServiceAccount?: string | undefined;
    }, {
        command?: string | undefined;
        timeout?: number | undefined;
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
        url?: string | undefined;
        trust?: boolean | undefined;
        cwd?: string | undefined;
        httpUrl?: string | undefined;
        targetAudience?: string | undefined;
        headers?: Record<string, string> | undefined;
        includeTools?: string[] | undefined;
        excludeTools?: string[] | undefined;
        description?: string | undefined;
        extensionName?: string | undefined;
        tcp?: string | undefined;
        oauth?: {
            scopes?: string[] | undefined;
            clientId?: string | undefined;
            clientSecret?: string | undefined;
            redirectUri?: string | undefined;
            tokenUrl?: string | undefined;
            enabled?: boolean | undefined;
            authorizationUrl?: string | undefined;
            audiences?: string[] | undefined;
            tokenParamName?: string | undefined;
            registrationUrl?: string | undefined;
        } | undefined;
        authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
        targetServiceAccount?: string | undefined;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"sdk">;
        name: z.ZodString;
        instance: z.ZodType<{
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
        }, z.ZodTypeDef, {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
        }>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        type: "sdk";
        instance: {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
        };
    }, {
        name: string;
        type: "sdk";
        instance: {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
        };
    }>]>>>;
    abortController: z.ZodOptional<z.ZodType<AbortController, z.ZodTypeDef, AbortController>>;
    debug: z.ZodOptional<z.ZodBoolean>;
    stderr: z.ZodOptional<z.ZodType<(message: string) => void, z.ZodTypeDef, (message: string) => void>>;
    logLevel: z.ZodOptional<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    maxSessionTurns: z.ZodOptional<z.ZodNumber>;
    coreTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludeTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allowedTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    authType: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "qwen-oauth", "gemini", "vertex-ai"]>>;
    agents: z.ZodOptional<z.ZodArray<z.ZodType<SubagentConfig, z.ZodTypeDef, SubagentConfig>, "many">>;
    includePartialMessages: z.ZodOptional<z.ZodBoolean>;
    resume: z.ZodOptional<z.ZodString>;
    sessionId: z.ZodOptional<z.ZodString>;
    timeout: z.ZodOptional<z.ZodObject<{
        canUseTool: z.ZodOptional<z.ZodNumber>;
        mcpRequest: z.ZodOptional<z.ZodNumber>;
        controlRequest: z.ZodOptional<z.ZodNumber>;
        streamClose: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        canUseTool?: number | undefined;
        mcpRequest?: number | undefined;
        controlRequest?: number | undefined;
        streamClose?: number | undefined;
    }, {
        canUseTool?: number | undefined;
        mcpRequest?: number | undefined;
        controlRequest?: number | undefined;
        streamClose?: number | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    resume?: string | undefined;
    timeout?: {
        canUseTool?: number | undefined;
        mcpRequest?: number | undefined;
        controlRequest?: number | undefined;
        streamClose?: number | undefined;
    } | undefined;
    env?: Record<string, string> | undefined;
    stderr?: ((message: string) => void) | undefined;
    debug?: boolean | undefined;
    cwd?: string | undefined;
    sessionId?: string | undefined;
    excludeTools?: string[] | undefined;
    model?: string | undefined;
    authType?: "openai" | "qwen-oauth" | "gemini" | "vertex-ai" | "anthropic" | undefined;
    systemPrompt?: string | {
        type: "preset";
        preset: "qwen_code";
        append?: string | undefined;
    } | undefined;
    agents?: SubagentConfig[] | undefined;
    abortController?: AbortController | undefined;
    allowedTools?: string[] | undefined;
    mcpServers?: Record<string, {
        command?: string | undefined;
        timeout?: number | undefined;
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
        url?: string | undefined;
        trust?: boolean | undefined;
        cwd?: string | undefined;
        httpUrl?: string | undefined;
        targetAudience?: string | undefined;
        headers?: Record<string, string> | undefined;
        includeTools?: string[] | undefined;
        excludeTools?: string[] | undefined;
        description?: string | undefined;
        extensionName?: string | undefined;
        tcp?: string | undefined;
        oauth?: {
            scopes?: string[] | undefined;
            clientId?: string | undefined;
            clientSecret?: string | undefined;
            redirectUri?: string | undefined;
            tokenUrl?: string | undefined;
            enabled?: boolean | undefined;
            authorizationUrl?: string | undefined;
            audiences?: string[] | undefined;
            tokenParamName?: string | undefined;
            registrationUrl?: string | undefined;
        } | undefined;
        authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
        targetServiceAccount?: string | undefined;
    } | {
        name: string;
        type: "sdk";
        instance: {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
        };
    }> | undefined;
    permissionMode?: "default" | "auto" | "plan" | "yolo" | "auto-edit" | undefined;
    includePartialMessages?: boolean | undefined;
    coreTools?: string[] | undefined;
    maxSessionTurns?: number | undefined;
    canUseTool?: CanUseTool | undefined;
    pathToQwenExecutable?: string | undefined;
    logLevel?: "error" | "info" | "debug" | "warn" | undefined;
}, {
    resume?: string | undefined;
    timeout?: {
        canUseTool?: number | undefined;
        mcpRequest?: number | undefined;
        controlRequest?: number | undefined;
        streamClose?: number | undefined;
    } | undefined;
    env?: Record<string, string> | undefined;
    stderr?: ((message: string) => void) | undefined;
    debug?: boolean | undefined;
    cwd?: string | undefined;
    sessionId?: string | undefined;
    excludeTools?: string[] | undefined;
    model?: string | undefined;
    authType?: "openai" | "qwen-oauth" | "gemini" | "vertex-ai" | "anthropic" | undefined;
    systemPrompt?: string | {
        type: "preset";
        preset: "qwen_code";
        append?: string | undefined;
    } | undefined;
    agents?: SubagentConfig[] | undefined;
    abortController?: AbortController | undefined;
    allowedTools?: string[] | undefined;
    mcpServers?: Record<string, {
        command?: string | undefined;
        timeout?: number | undefined;
        env?: Record<string, string> | undefined;
        args?: string[] | undefined;
        url?: string | undefined;
        trust?: boolean | undefined;
        cwd?: string | undefined;
        httpUrl?: string | undefined;
        targetAudience?: string | undefined;
        headers?: Record<string, string> | undefined;
        includeTools?: string[] | undefined;
        excludeTools?: string[] | undefined;
        description?: string | undefined;
        extensionName?: string | undefined;
        tcp?: string | undefined;
        oauth?: {
            scopes?: string[] | undefined;
            clientId?: string | undefined;
            clientSecret?: string | undefined;
            redirectUri?: string | undefined;
            tokenUrl?: string | undefined;
            enabled?: boolean | undefined;
            authorizationUrl?: string | undefined;
            audiences?: string[] | undefined;
            tokenParamName?: string | undefined;
            registrationUrl?: string | undefined;
        } | undefined;
        authProviderType?: "service_account_impersonation" | "dynamic_discovery" | "google_credentials" | undefined;
        targetServiceAccount?: string | undefined;
    } | {
        name: string;
        type: "sdk";
        instance: {
            connect(transport: unknown): Promise<void>;
            close(): Promise<void>;
        };
    }> | undefined;
    permissionMode?: "default" | "auto" | "plan" | "yolo" | "auto-edit" | undefined;
    includePartialMessages?: boolean | undefined;
    coreTools?: string[] | undefined;
    maxSessionTurns?: number | undefined;
    canUseTool?: CanUseTool | undefined;
    pathToQwenExecutable?: string | undefined;
    logLevel?: "error" | "info" | "debug" | "warn" | undefined;
}>;
