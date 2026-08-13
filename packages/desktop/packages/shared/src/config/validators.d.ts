/**
 * Config Validators
 *
 * Zod schemas and validation utilities for config files.
 * Used by agents to validate config changes before they take effect.
 *
 * Validates:
 * - config.json: Main app configuration
 * - preferences.json: User preferences
 * - sources/{slug}/config.json: Workspace-scoped source configs
 * - permissions.json: Permission rules for Plan mode
 * - tool-icons/tool-icons.json: CLI tool icon mappings
 */
import { z } from 'zod';
export interface ValidationIssue {
    file: string;
    path: string;
    message: string;
    severity: 'error' | 'warning';
    suggestion?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    fixed?: string[];
}
export declare const StoredConfigSchema: z.ZodObject<{
    workspaces: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        slug: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodNumber;
        sessionId: z.ZodOptional<z.ZodString>;
        iconUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        createdAt: number;
        sessionId?: string | undefined;
        slug?: string | undefined;
        iconUrl?: string | undefined;
    }, {
        name: string;
        id: string;
        createdAt: number;
        sessionId?: string | undefined;
        slug?: string | undefined;
        iconUrl?: string | undefined;
    }>, "many">;
    activeWorkspaceId: z.ZodNullable<z.ZodString>;
    activeSessionId: z.ZodNullable<z.ZodString>;
    llmConnections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        name: z.ZodString;
        providerType: z.ZodEnum<["qwen"]>;
        authType: z.ZodEnum<["none"]>;
        baseUrl: z.ZodOptional<z.ZodString>;
        models: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>]>, "many">>;
        defaultModel: z.ZodOptional<z.ZodString>;
        modelSelectionMode: z.ZodOptional<z.ZodEnum<["automaticallySyncedFromProvider", "userDefined3Tier"]>>;
        customEndpoint: z.ZodOptional<z.ZodObject<{
            api: z.ZodNever;
            supportsImages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            api: never;
            supportsImages?: boolean | undefined;
        }, {
            api: never;
            supportsImages?: boolean | undefined;
        }>>;
        createdAt: z.ZodNumber;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        slug: z.ZodString;
        name: z.ZodString;
        providerType: z.ZodEnum<["qwen"]>;
        authType: z.ZodEnum<["none"]>;
        baseUrl: z.ZodOptional<z.ZodString>;
        models: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>]>, "many">>;
        defaultModel: z.ZodOptional<z.ZodString>;
        modelSelectionMode: z.ZodOptional<z.ZodEnum<["automaticallySyncedFromProvider", "userDefined3Tier"]>>;
        customEndpoint: z.ZodOptional<z.ZodObject<{
            api: z.ZodNever;
            supportsImages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            api: never;
            supportsImages?: boolean | undefined;
        }, {
            api: never;
            supportsImages?: boolean | undefined;
        }>>;
        createdAt: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        slug: z.ZodString;
        name: z.ZodString;
        providerType: z.ZodEnum<["qwen"]>;
        authType: z.ZodEnum<["none"]>;
        baseUrl: z.ZodOptional<z.ZodString>;
        models: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>]>, "many">>;
        defaultModel: z.ZodOptional<z.ZodString>;
        modelSelectionMode: z.ZodOptional<z.ZodEnum<["automaticallySyncedFromProvider", "userDefined3Tier"]>>;
        customEndpoint: z.ZodOptional<z.ZodObject<{
            api: z.ZodNever;
            supportsImages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            api: never;
            supportsImages?: boolean | undefined;
        }, {
            api: never;
            supportsImages?: boolean | undefined;
        }>>;
        createdAt: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">>, "many">>;
    defaultLlmConnection: z.ZodOptional<z.ZodString>;
    defaultThinkingLevel: z.ZodOptional<z.ZodEffects<z.ZodEnum<[string, ...string[]]>, string, string>>;
}, "strip", z.ZodTypeAny, {
    workspaces: {
        name: string;
        id: string;
        createdAt: number;
        sessionId?: string | undefined;
        slug?: string | undefined;
        iconUrl?: string | undefined;
    }[];
    activeWorkspaceId: string | null;
    activeSessionId: string | null;
    llmConnections?: z.objectOutputType<{
        slug: z.ZodString;
        name: z.ZodString;
        providerType: z.ZodEnum<["qwen"]>;
        authType: z.ZodEnum<["none"]>;
        baseUrl: z.ZodOptional<z.ZodString>;
        models: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>]>, "many">>;
        defaultModel: z.ZodOptional<z.ZodString>;
        modelSelectionMode: z.ZodOptional<z.ZodEnum<["automaticallySyncedFromProvider", "userDefined3Tier"]>>;
        customEndpoint: z.ZodOptional<z.ZodObject<{
            api: z.ZodNever;
            supportsImages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            api: never;
            supportsImages?: boolean | undefined;
        }, {
            api: never;
            supportsImages?: boolean | undefined;
        }>>;
        createdAt: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    defaultLlmConnection?: string | undefined;
    defaultThinkingLevel?: string | undefined;
}, {
    workspaces: {
        name: string;
        id: string;
        createdAt: number;
        sessionId?: string | undefined;
        slug?: string | undefined;
        iconUrl?: string | undefined;
    }[];
    activeWorkspaceId: string | null;
    activeSessionId: string | null;
    llmConnections?: z.objectInputType<{
        slug: z.ZodString;
        name: z.ZodString;
        providerType: z.ZodEnum<["qwen"]>;
        authType: z.ZodEnum<["none"]>;
        baseUrl: z.ZodOptional<z.ZodString>;
        models: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
            id: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>]>, "many">>;
        defaultModel: z.ZodOptional<z.ZodString>;
        modelSelectionMode: z.ZodOptional<z.ZodEnum<["automaticallySyncedFromProvider", "userDefined3Tier"]>>;
        customEndpoint: z.ZodOptional<z.ZodObject<{
            api: z.ZodNever;
            supportsImages: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            api: never;
            supportsImages?: boolean | undefined;
        }, {
            api: never;
            supportsImages?: boolean | undefined;
        }>>;
        createdAt: z.ZodNumber;
    }, z.ZodTypeAny, "passthrough">[] | undefined;
    defaultLlmConnection?: string | undefined;
    defaultThinkingLevel?: string | undefined;
}>;
export declare const UserPreferencesSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodObject<{
        city: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        region?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }, {
        region?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
    }>>;
    language: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    language?: string | undefined;
    updatedAt?: number | undefined;
    location?: {
        region?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    notes?: string | undefined;
    timezone?: string | undefined;
}, {
    name?: string | undefined;
    language?: string | undefined;
    updatedAt?: number | undefined;
    location?: {
        region?: string | undefined;
        city?: string | undefined;
        country?: string | undefined;
    } | undefined;
    notes?: string | undefined;
    timezone?: string | undefined;
}>;
/**
 * Validate config.json
 */
export declare function validateConfig(): ValidationResult;
/**
 * Validate preferences.json
 */
export declare function validatePreferences(): ValidationResult;
/**
 * Validate all config files
 * @param workspaceId - Optional workspace ID for source validation
 * @param workspaceRoot - Optional workspace root path for skill and status validation
 */
export declare function validateAll(workspaceId?: string, workspaceRoot?: string): ValidationResult;
export declare const SOURCE_SLUG_REGEX: RegExp;
export declare function assertValidSourceSlug(sourceSlug: string): void;
export declare const FolderSourceConfigSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    enabled: z.ZodBoolean;
    provider: z.ZodString;
    type: z.ZodEnum<["mcp", "api", "local"]>;
    mcp: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        transport: z.ZodOptional<z.ZodEnum<["http", "sse", "stdio"]>>;
        url: z.ZodOptional<z.ZodString>;
        authType: z.ZodOptional<z.ZodEnum<["oauth", "bearer", "none"]>>;
        clientId: z.ZodOptional<z.ZodString>;
        command: z.ZodOptional<z.ZodString>;
        args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        headerNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    }, {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    }>, {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    }, {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    }>>;
    api: z.ZodOptional<z.ZodObject<{
        baseUrl: z.ZodString;
        authType: z.ZodEnum<["bearer", "header", "query", "basic", "oauth", "none"]>;
        headerName: z.ZodOptional<z.ZodString>;
        headerNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        queryParam: z.ZodOptional<z.ZodString>;
        authScheme: z.ZodOptional<z.ZodString>;
        defaultHeaders: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        testEndpoint: z.ZodOptional<z.ZodObject<{
            method: z.ZodEnum<["GET", "POST"]>;
            path: z.ZodString;
            body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        }, {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        }>>;
        googleService: z.ZodOptional<z.ZodEnum<["gmail", "calendar", "drive", "docs", "sheets", "youtube", "searchconsole"]>>;
        googleScopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        googleOAuthClientId: z.ZodOptional<z.ZodString>;
        googleOAuthClientSecret: z.ZodOptional<z.ZodString>;
        slackService: z.ZodOptional<z.ZodEnum<["messaging", "channels", "users", "files", "full"]>>;
        slackUserScopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        microsoftService: z.ZodOptional<z.ZodEnum<["outlook", "microsoft-calendar", "onedrive", "teams", "sharepoint"]>>;
        microsoftScopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        oauth: z.ZodOptional<z.ZodObject<{
            authorizationUrl: z.ZodString;
            tokenUrl: z.ZodString;
            clientId: z.ZodString;
            clientSecret: z.ZodOptional<z.ZodString>;
            scopes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            audience: z.ZodOptional<z.ZodString>;
            extraParams: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        }, {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        baseUrl: string;
        authType: "none" | "query" | "bearer" | "header" | "oauth" | "basic";
        oauth?: {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        } | undefined;
        defaultHeaders?: Record<string, string> | undefined;
        headerNames?: string[] | undefined;
        testEndpoint?: {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        } | undefined;
        headerName?: string | undefined;
        googleOAuthClientId?: string | undefined;
        googleService?: "docs" | "youtube" | "drive" | "gmail" | "calendar" | "sheets" | "searchconsole" | undefined;
        slackService?: "channels" | "files" | "users" | "full" | "messaging" | undefined;
        microsoftService?: "teams" | "outlook" | "microsoft-calendar" | "onedrive" | "sharepoint" | undefined;
        queryParam?: string | undefined;
        authScheme?: string | undefined;
        googleScopes?: string[] | undefined;
        googleOAuthClientSecret?: string | undefined;
        slackUserScopes?: string[] | undefined;
        microsoftScopes?: string[] | undefined;
    }, {
        baseUrl: string;
        authType: "none" | "query" | "bearer" | "header" | "oauth" | "basic";
        oauth?: {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        } | undefined;
        defaultHeaders?: Record<string, string> | undefined;
        headerNames?: string[] | undefined;
        testEndpoint?: {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        } | undefined;
        headerName?: string | undefined;
        googleOAuthClientId?: string | undefined;
        googleService?: "docs" | "youtube" | "drive" | "gmail" | "calendar" | "sheets" | "searchconsole" | undefined;
        slackService?: "channels" | "files" | "users" | "full" | "messaging" | undefined;
        microsoftService?: "teams" | "outlook" | "microsoft-calendar" | "onedrive" | "sharepoint" | undefined;
        queryParam?: string | undefined;
        authScheme?: string | undefined;
        googleScopes?: string[] | undefined;
        googleOAuthClientSecret?: string | undefined;
        slackUserScopes?: string[] | undefined;
        microsoftScopes?: string[] | undefined;
    }>>;
    local: z.ZodOptional<z.ZodObject<{
        path: z.ZodString;
        format: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        format?: string | undefined;
    }, {
        path: string;
        format?: string | undefined;
    }>>;
    brand: z.ZodOptional<z.ZodObject<{
        color: z.ZodOptional<z.ZodEffects<z.ZodAny, any, any>>;
    }, "strip", z.ZodTypeAny, {
        color?: any;
    }, {
        color?: any;
    }>>;
    isAuthenticated: z.ZodOptional<z.ZodBoolean>;
    lastTestedAt: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "mcp" | "local" | "api";
    enabled: boolean;
    id: string;
    slug: string;
    provider: string;
    mcp?: {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    } | undefined;
    local?: {
        path: string;
        format?: string | undefined;
    } | undefined;
    createdAt?: number | undefined;
    updatedAt?: number | undefined;
    api?: {
        baseUrl: string;
        authType: "none" | "query" | "bearer" | "header" | "oauth" | "basic";
        oauth?: {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        } | undefined;
        defaultHeaders?: Record<string, string> | undefined;
        headerNames?: string[] | undefined;
        testEndpoint?: {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        } | undefined;
        headerName?: string | undefined;
        googleOAuthClientId?: string | undefined;
        googleService?: "docs" | "youtube" | "drive" | "gmail" | "calendar" | "sheets" | "searchconsole" | undefined;
        slackService?: "channels" | "files" | "users" | "full" | "messaging" | undefined;
        microsoftService?: "teams" | "outlook" | "microsoft-calendar" | "onedrive" | "sharepoint" | undefined;
        queryParam?: string | undefined;
        authScheme?: string | undefined;
        googleScopes?: string[] | undefined;
        googleOAuthClientSecret?: string | undefined;
        slackUserScopes?: string[] | undefined;
        microsoftScopes?: string[] | undefined;
    } | undefined;
    brand?: {
        color?: any;
    } | undefined;
    isAuthenticated?: boolean | undefined;
    lastTestedAt?: number | undefined;
}, {
    name: string;
    type: "mcp" | "local" | "api";
    enabled: boolean;
    id: string;
    slug: string;
    provider: string;
    mcp?: {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    } | undefined;
    local?: {
        path: string;
        format?: string | undefined;
    } | undefined;
    createdAt?: number | undefined;
    updatedAt?: number | undefined;
    api?: {
        baseUrl: string;
        authType: "none" | "query" | "bearer" | "header" | "oauth" | "basic";
        oauth?: {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        } | undefined;
        defaultHeaders?: Record<string, string> | undefined;
        headerNames?: string[] | undefined;
        testEndpoint?: {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        } | undefined;
        headerName?: string | undefined;
        googleOAuthClientId?: string | undefined;
        googleService?: "docs" | "youtube" | "drive" | "gmail" | "calendar" | "sheets" | "searchconsole" | undefined;
        slackService?: "channels" | "files" | "users" | "full" | "messaging" | undefined;
        microsoftService?: "teams" | "outlook" | "microsoft-calendar" | "onedrive" | "sharepoint" | undefined;
        queryParam?: string | undefined;
        authScheme?: string | undefined;
        googleScopes?: string[] | undefined;
        googleOAuthClientSecret?: string | undefined;
        slackUserScopes?: string[] | undefined;
        microsoftScopes?: string[] | undefined;
    } | undefined;
    brand?: {
        color?: any;
    } | undefined;
    isAuthenticated?: boolean | undefined;
    lastTestedAt?: number | undefined;
}>, {
    name: string;
    type: "mcp" | "local" | "api";
    enabled: boolean;
    id: string;
    slug: string;
    provider: string;
    mcp?: {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    } | undefined;
    local?: {
        path: string;
        format?: string | undefined;
    } | undefined;
    createdAt?: number | undefined;
    updatedAt?: number | undefined;
    api?: {
        baseUrl: string;
        authType: "none" | "query" | "bearer" | "header" | "oauth" | "basic";
        oauth?: {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        } | undefined;
        defaultHeaders?: Record<string, string> | undefined;
        headerNames?: string[] | undefined;
        testEndpoint?: {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        } | undefined;
        headerName?: string | undefined;
        googleOAuthClientId?: string | undefined;
        googleService?: "docs" | "youtube" | "drive" | "gmail" | "calendar" | "sheets" | "searchconsole" | undefined;
        slackService?: "channels" | "files" | "users" | "full" | "messaging" | undefined;
        microsoftService?: "teams" | "outlook" | "microsoft-calendar" | "onedrive" | "sharepoint" | undefined;
        queryParam?: string | undefined;
        authScheme?: string | undefined;
        googleScopes?: string[] | undefined;
        googleOAuthClientSecret?: string | undefined;
        slackUserScopes?: string[] | undefined;
        microsoftScopes?: string[] | undefined;
    } | undefined;
    brand?: {
        color?: any;
    } | undefined;
    isAuthenticated?: boolean | undefined;
    lastTestedAt?: number | undefined;
}, {
    name: string;
    type: "mcp" | "local" | "api";
    enabled: boolean;
    id: string;
    slug: string;
    provider: string;
    mcp?: {
        env?: Record<string, string> | undefined;
        command?: string | undefined;
        url?: string | undefined;
        headers?: Record<string, string> | undefined;
        transport?: "http" | "sse" | "stdio" | undefined;
        authType?: "none" | "bearer" | "oauth" | undefined;
        clientId?: string | undefined;
        args?: string[] | undefined;
        headerNames?: string[] | undefined;
    } | undefined;
    local?: {
        path: string;
        format?: string | undefined;
    } | undefined;
    createdAt?: number | undefined;
    updatedAt?: number | undefined;
    api?: {
        baseUrl: string;
        authType: "none" | "query" | "bearer" | "header" | "oauth" | "basic";
        oauth?: {
            clientId: string;
            authorizationUrl: string;
            tokenUrl: string;
            scopes?: string[] | undefined;
            clientSecret?: string | undefined;
            audience?: string | undefined;
            extraParams?: Record<string, string> | undefined;
        } | undefined;
        defaultHeaders?: Record<string, string> | undefined;
        headerNames?: string[] | undefined;
        testEndpoint?: {
            path: string;
            method: "POST" | "GET";
            headers?: Record<string, string> | undefined;
            body?: Record<string, unknown> | undefined;
        } | undefined;
        headerName?: string | undefined;
        googleOAuthClientId?: string | undefined;
        googleService?: "docs" | "youtube" | "drive" | "gmail" | "calendar" | "sheets" | "searchconsole" | undefined;
        slackService?: "channels" | "files" | "users" | "full" | "messaging" | undefined;
        microsoftService?: "teams" | "outlook" | "microsoft-calendar" | "onedrive" | "sharepoint" | undefined;
        queryParam?: string | undefined;
        authScheme?: string | undefined;
        googleScopes?: string[] | undefined;
        googleOAuthClientSecret?: string | undefined;
        slackUserScopes?: string[] | undefined;
        microsoftScopes?: string[] | undefined;
    } | undefined;
    brand?: {
        color?: any;
    } | undefined;
    isAuthenticated?: boolean | undefined;
    lastTestedAt?: number | undefined;
}>;
/**
 * Validate a source config object (in-memory, no disk reads)
 */
export declare function validateSourceConfig(config: unknown): ValidationResult;
/**
 * Validate source config from a JSON string.
 * Used by PreToolUse hook to validate before writing to disk.
 */
export declare function validateSourceConfigContent(jsonString: string): ValidationResult;
/**
 * Validate a source folder (workspace-scoped)
 */
export declare function validateSource(workspaceId: string, slug: string): ValidationResult;
/**
 * Validate all sources in a workspace
 */
export declare function validateAllSources(workspaceId: string): ValidationResult;
/**
 * Schema for skill metadata (SKILL.md frontmatter)
 */
export declare const SkillMetadataSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    globs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    alwaysAllow: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    globs?: string[] | undefined;
    alwaysAllow?: string[] | undefined;
}, {
    name: string;
    description: string;
    globs?: string[] | undefined;
    alwaysAllow?: string[] | undefined;
}>;
/**
 * Validate a skill folder
 * @param workspaceRoot - Absolute path to workspace root folder
 * @param slug - Skill directory name
 */
export declare function validateSkill(workspaceRoot: string, slug: string): ValidationResult;
/**
 * Validate skill SKILL.md content from a string (no disk reads).
 * Used by PreToolUse hook to validate before writing to disk.
 * Checks frontmatter schema and non-empty body. Skips icon/folder checks.
 *
 * @param markdownContent - The full SKILL.md file content
 * @param slug - The skill slug (folder name), used for slug format validation
 */
export declare function validateSkillContent(markdownContent: string, slug: string): ValidationResult;
/**
 * Validate all skills in a workspace
 * @param workspaceRoot - Absolute path to workspace root folder
 */
export declare function validateAllSkills(workspaceRoot: string): ValidationResult;
/**
 * Validate statuses configuration for a workspace
 * @param workspaceRoot - Absolute path to workspace root folder
 */
export declare function validateStatuses(workspaceRoot: string): ValidationResult;
/**
 * Validate statuses config from a JSON string (no disk reads).
 * Used by PreToolUse hook to validate before writing to disk.
 * Runs schema validation and semantic checks. Skips icon file existence checks.
 */
export declare function validateStatusesContent(jsonString: string): ValidationResult;
/**
 * Validate labels configuration for a workspace (reads from disk)
 * @param workspaceRoot - Absolute path to workspace root folder
 */
export declare function validateLabels(workspaceRoot: string): ValidationResult;
/**
 * Validate labels config from a JSON string (no disk reads).
 * Used by PreToolUse hook to validate before writing to disk.
 * Checks schema validation and semantic rules (unique IDs, max depth).
 */
export declare function validateLabelsContent(jsonString: string): ValidationResult;
/**
 * Validate permissions config from a JSON string (no disk reads).
 * Used by PreToolUse hook to validate before writing to disk.
 * Runs Zod schema validation and regex pattern compilation checks.
 *
 * @param jsonString - The raw JSON content of the permissions file
 * @param displayFile - File name for error messages (e.g., 'permissions.json' or 'sources/github/permissions.json')
 */
export declare function validatePermissionsContent(jsonString: string, displayFile?: string): ValidationResult;
/**
 * Validate workspace-level permissions.json
 * @param workspaceRoot - Absolute path to workspace root folder
 */
export declare function validateWorkspacePermissions(workspaceRoot: string): ValidationResult;
/**
 * Validate source-level permissions.json
 * @param workspaceRoot - Absolute path to workspace root folder
 * @param sourceSlug - Source slug
 */
export declare function validateSourcePermissions(workspaceRoot: string, sourceSlug: string): ValidationResult;
/**
 * Validate app-level default permissions
 */
export declare function validateDefaultPermissions(): ValidationResult;
/**
 * Validate all permissions files in a workspace
 * Includes: app-level default, workspace-level, and all source-level permissions
 */
export declare function validateAllPermissions(workspaceRoot: string): ValidationResult;
/**
 * Check if a permissions file at the given path is valid.
 * Returns true if the file exists and passes schema validation.
 */
export declare function isValidPermissionsFile(filePath: string): boolean;
/**
 * Zod schema for app-level theme override files (~/.craft-agent/theme.json).
 * Allows partial overrides but rejects unknown keys.
 */
export declare const ThemeOverrideSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    background: z.ZodOptional<z.ZodString>;
    foreground: z.ZodOptional<z.ZodString>;
    accent: z.ZodOptional<z.ZodString>;
    info: z.ZodOptional<z.ZodString>;
    success: z.ZodOptional<z.ZodString>;
    destructive: z.ZodOptional<z.ZodString>;
    paper: z.ZodOptional<z.ZodString>;
    navigator: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodString>;
    popover: z.ZodOptional<z.ZodString>;
    popoverSolid: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["solid", "scenic"]>>;
    backgroundImage: z.ZodOptional<z.ZodString>;
    dark: z.ZodOptional<z.ZodObject<{
        background: z.ZodOptional<z.ZodString>;
        foreground: z.ZodOptional<z.ZodString>;
        accent: z.ZodOptional<z.ZodString>;
        info: z.ZodOptional<z.ZodString>;
        success: z.ZodOptional<z.ZodString>;
        destructive: z.ZodOptional<z.ZodString>;
        paper: z.ZodOptional<z.ZodString>;
        navigator: z.ZodOptional<z.ZodString>;
        input: z.ZodOptional<z.ZodString>;
        popover: z.ZodOptional<z.ZodString>;
        popoverSolid: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    }, {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    dark?: {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    } | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}, {
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    dark?: {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    } | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}>, {
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    dark?: {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    } | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}, {
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    dark?: {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    } | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}>, {
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    dark?: {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    } | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}, {
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    dark?: {
        input?: string | undefined;
        background?: string | undefined;
        info?: string | undefined;
        success?: string | undefined;
        destructive?: string | undefined;
        navigator?: string | undefined;
        accent?: string | undefined;
        foreground?: string | undefined;
        popover?: string | undefined;
        paper?: string | undefined;
        popoverSolid?: string | undefined;
    } | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}>;
/**
 * Zod schema for preset theme files.
 * Validates theme structure and requires at least one color property.
 */
export declare const PresetThemeSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    license: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    supportedModes: z.ZodOptional<z.ZodArray<z.ZodEnum<["light", "dark"]>, "many">>;
    background: z.ZodOptional<z.ZodString>;
    foreground: z.ZodOptional<z.ZodString>;
    accent: z.ZodOptional<z.ZodString>;
    info: z.ZodOptional<z.ZodString>;
    success: z.ZodOptional<z.ZodString>;
    destructive: z.ZodOptional<z.ZodString>;
    paper: z.ZodOptional<z.ZodString>;
    navigator: z.ZodOptional<z.ZodString>;
    input: z.ZodOptional<z.ZodString>;
    popover: z.ZodOptional<z.ZodString>;
    popoverSolid: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["solid", "scenic"]>>;
    backgroundImage: z.ZodOptional<z.ZodString>;
    dark: z.ZodOptional<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>>;
    shikiTheme: z.ZodOptional<z.ZodObject<{
        light: z.ZodOptional<z.ZodString>;
        dark: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dark?: string | undefined;
        light?: string | undefined;
    }, {
        dark?: string | undefined;
        light?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    description?: string | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    source?: string | undefined;
    dark?: z.objectOutputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
    supportedModes?: ("dark" | "light")[] | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
    shikiTheme?: {
        dark?: string | undefined;
        light?: string | undefined;
    } | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}, {
    name: string;
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    description?: string | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    source?: string | undefined;
    dark?: z.objectInputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
    supportedModes?: ("dark" | "light")[] | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
    shikiTheme?: {
        dark?: string | undefined;
        light?: string | undefined;
    } | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}>, {
    name: string;
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    description?: string | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    source?: string | undefined;
    dark?: z.objectOutputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
    supportedModes?: ("dark" | "light")[] | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
    shikiTheme?: {
        dark?: string | undefined;
        light?: string | undefined;
    } | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}, {
    name: string;
    input?: string | undefined;
    mode?: "solid" | "scenic" | undefined;
    description?: string | undefined;
    background?: string | undefined;
    info?: string | undefined;
    success?: string | undefined;
    source?: string | undefined;
    dark?: z.objectInputType<{}, z.ZodTypeAny, "passthrough"> | undefined;
    supportedModes?: ("dark" | "light")[] | undefined;
    destructive?: string | undefined;
    navigator?: string | undefined;
    accent?: string | undefined;
    foreground?: string | undefined;
    author?: string | undefined;
    license?: string | undefined;
    shikiTheme?: {
        dark?: string | undefined;
        light?: string | undefined;
    } | undefined;
    popover?: string | undefined;
    backgroundImage?: string | undefined;
    paper?: string | undefined;
    popoverSolid?: string | undefined;
}>;
/**
 * Validate theme content from a JSON string (no disk reads).
 * Used to check if an existing theme file is valid before deciding to overwrite.
 */
export declare function validateThemeContent(jsonString: string, displayFile?: string): ValidationResult;
/**
 * Validate app-level theme override content from a JSON string (no disk reads).
 * Unlike preset validation, this accepts partial ThemeOverrides objects and rejects unknown keys.
 */
export declare function validateThemeOverrideContent(jsonString: string, displayFile?: string): ValidationResult;
/**
 * Check if a theme file at the given path is valid.
 * Returns true if the file exists and passes schema validation.
 */
export declare function isValidThemeFile(filePath: string): boolean;
/**
 * Validate tool-icons config from a JSON string (no disk reads).
 * Used by PreToolUse hook to validate before writing to disk.
 * Checks JSON syntax, Zod schema, duplicate IDs, and duplicate commands.
 */
export declare function validateToolIconsContent(jsonString: string): ValidationResult;
/**
 * Validate tool-icons/tool-icons.json from disk.
 * Reads the file, runs content validation, and also checks that referenced icon files exist.
 */
export declare function validateToolIcons(): ValidationResult;
/**
 * Format validation result as text for agent response
 */
export declare function formatValidationResult(result: ValidationResult): string;
/**
 * Result of detecting what type of config file a path corresponds to.
 */
export interface ConfigFileDetection {
    type: 'source' | 'skill' | 'statuses' | 'labels' | 'permissions' | 'tool-icons' | 'automations';
    /** Slug of the source or skill (if applicable) */
    slug?: string;
    /** Display file path for error messages */
    displayFile: string;
}
/**
 * Detect if a file path corresponds to a known config file type within a workspace.
 * Returns null if the path is not a recognized config file.
 *
 * Matches patterns:
 * - .../sources/{slug}/config.json → source config
 * - .../skills/{slug}/SKILL.md → skill definition
 * - .../statuses/config.json → status workflow config
 * - .../labels/config.json → label config
 * - .../permissions.json (workspace or source-level) → permission rules
 */
export declare function detectConfigFileType(filePath: string, workspaceRootPath: string): ConfigFileDetection | null;
/**
 * Detect if a file path corresponds to an app-level config file (outside workspace scope).
 * Checks paths relative to CONFIG_DIR (~/.craft-agent/).
 * Returns null if the path is not a recognized app-level config file.
 *
 * Matches patterns:
 * - ~/.craft-agent/tool-icons/tool-icons.json → tool icon mappings
 */
export declare function detectAppConfigFileType(filePath: string): ConfigFileDetection | null;
/**
 * Validate config file content based on its detected type.
 * Dispatches to the appropriate content-based validator.
 * Returns null if the detection type is unrecognized.
 */
export declare function validateConfigFileContent(detection: ConfigFileDetection, content: string): ValidationResult | null;
