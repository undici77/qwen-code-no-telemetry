/**
 * Mode Types and Constants
 *
 * Pure types and UI configuration for permission modes.
 * This file has NO runtime dependencies - safe for browser bundling.
 *
 * For runtime mode management functions, use './mode-manager.ts'
 */
import { z } from 'zod';
/**
 * Available permission modes (internal storage keys).
 *
 * Qwen Code / ACP mode mapping:
 * - yolo              -> allow-all
 * - plan              -> safe
 * - default           -> ask
 * - auto-edit         -> auto-edit
 */
export type PermissionMode = 'allow-all' | 'safe' | 'ask' | 'auto-edit';
/**
 * Canonical mode names used in user-facing/session-state surfaces.
 */
export type PermissionModeCanonical = 'explore' | 'ask' | 'execute' | 'auto-edit';
/**
 * Order of modes for cycling with SHIFT+TAB
 */
export declare const PERMISSION_MODE_ORDER: PermissionMode[];
/**
 * Internal -> canonical mapping.
 */
export declare const PERMISSION_MODE_TO_CANONICAL: Record<PermissionMode, PermissionModeCanonical>;
/**
 * Canonical -> internal mapping.
 */
export declare const CANONICAL_TO_PERMISSION_MODE: Record<PermissionModeCanonical, PermissionMode>;
/**
 * Convert internal mode key to canonical user-facing mode name.
 */
export declare function toCanonicalPermissionMode(mode: PermissionMode): PermissionModeCanonical;
/**
 * Parse user-facing mode names into internal mode keys.
 *
 * Accepts canonical values (explore/ask/execute) and legacy aliases
 * (safe/allow-all, ask-to-edit) for backward compatibility.
 */
export declare function parsePermissionMode(mode: string): PermissionMode | null;
export declare function normalizeCyclablePermissionModes(modes: readonly unknown[] | undefined): PermissionMode[];
/**
 * API endpoint rule - method + path pattern
 */
declare const ApiEndpointRuleSchema: z.ZodObject<{
    method: z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]>;
    path: z.ZodString;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    method: "HEAD" | "POST" | "GET" | "DELETE" | "PATCH" | "OPTIONS" | "PUT";
    comment?: string | undefined;
}, {
    path: string;
    method: "HEAD" | "POST" | "GET" | "DELETE" | "PATCH" | "OPTIONS" | "PUT";
    comment?: string | undefined;
}>;
export type ApiEndpointRule = z.infer<typeof ApiEndpointRuleSchema>;
/**
 * Command-specific block hint for clearer Plan-mode rejection messages.
 */
declare const BlockedCommandHintSchema: z.ZodObject<{
    /** Command name (normalized lowercase base command, e.g. "printf") */
    command: z.ZodString;
    /** Primary reason shown when command is blocked */
    reason: z.ZodString;
    /** Additional policy/risk context */
    context: z.ZodOptional<z.ZodString>;
    /** Suggested alternatives or next actions */
    tryInstead: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Concrete example command */
    example: z.ZodOptional<z.ZodString>;
    /** Apply this hint only when the command does NOT match this regex */
    whenNotMatching: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    command: string;
    reason: string;
    context?: string | undefined;
    example?: string | undefined;
    tryInstead?: string[] | undefined;
    whenNotMatching?: string | undefined;
}, {
    command: string;
    reason: string;
    context?: string | undefined;
    example?: string | undefined;
    tryInstead?: string[] | undefined;
    whenNotMatching?: string | undefined;
}>;
export type BlockedCommandHintRule = z.infer<typeof BlockedCommandHintSchema>;
/**
 * Permissions JSON configuration schema
 *
 * Note: Core write tools (Write, Edit, MultiEdit, NotebookEdit) are hardcoded in
 * SAFE_MODE_CONFIG and always blocked in Plan mode. The blockedTools field
 * allows users to block additional tools beyond these defaults.
 */
export declare const PermissionsConfigSchema: z.ZodObject<{
    /** Version date for migration (ISO format: "2026-02-07") */
    version: z.ZodOptional<z.ZodString>;
    /** Bash command patterns to allow (regex strings) */
    allowedBashPatterns: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        pattern: z.ZodString;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        comment?: string | undefined;
    }, {
        pattern: string;
        comment?: string | undefined;
    }>]>, "many">>;
    /** MCP tool patterns to allow (regex strings) */
    allowedMcpPatterns: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        pattern: z.ZodString;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        comment?: string | undefined;
    }, {
        pattern: string;
        comment?: string | undefined;
    }>]>, "many">>;
    /** API endpoint rules - method + path pattern */
    allowedApiEndpoints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        method: z.ZodEnum<["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]>;
        path: z.ZodString;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        method: "HEAD" | "POST" | "GET" | "DELETE" | "PATCH" | "OPTIONS" | "PUT";
        comment?: string | undefined;
    }, {
        path: string;
        method: "HEAD" | "POST" | "GET" | "DELETE" | "PATCH" | "OPTIONS" | "PUT";
        comment?: string | undefined;
    }>, "many">>;
    /** File paths to allow writes in Plan mode (glob patterns) */
    allowedWritePaths: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        pattern: z.ZodString;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        comment?: string | undefined;
    }, {
        pattern: string;
        comment?: string | undefined;
    }>]>, "many">>;
    /** Additional tools to block (extends the hardcoded defaults) */
    blockedTools: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        pattern: z.ZodString;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        pattern: string;
        comment?: string | undefined;
    }, {
        pattern: string;
        comment?: string | undefined;
    }>]>, "many">>;
    /** Command-specific hint messages for blocked Bash commands */
    blockedCommandHints: z.ZodOptional<z.ZodArray<z.ZodObject<{
        /** Command name (normalized lowercase base command, e.g. "printf") */
        command: z.ZodString;
        /** Primary reason shown when command is blocked */
        reason: z.ZodString;
        /** Additional policy/risk context */
        context: z.ZodOptional<z.ZodString>;
        /** Suggested alternatives or next actions */
        tryInstead: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        /** Concrete example command */
        example: z.ZodOptional<z.ZodString>;
        /** Apply this hint only when the command does NOT match this regex */
        whenNotMatching: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        command: string;
        reason: string;
        context?: string | undefined;
        example?: string | undefined;
        tryInstead?: string[] | undefined;
        whenNotMatching?: string | undefined;
    }, {
        command: string;
        reason: string;
        context?: string | undefined;
        example?: string | undefined;
        tryInstead?: string[] | undefined;
        whenNotMatching?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    version?: string | undefined;
    allowedBashPatterns?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    allowedMcpPatterns?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    allowedApiEndpoints?: {
        path: string;
        method: "HEAD" | "POST" | "GET" | "DELETE" | "PATCH" | "OPTIONS" | "PUT";
        comment?: string | undefined;
    }[] | undefined;
    allowedWritePaths?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    blockedTools?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    blockedCommandHints?: {
        command: string;
        reason: string;
        context?: string | undefined;
        example?: string | undefined;
        tryInstead?: string[] | undefined;
        whenNotMatching?: string | undefined;
    }[] | undefined;
}, {
    version?: string | undefined;
    allowedBashPatterns?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    allowedMcpPatterns?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    allowedApiEndpoints?: {
        path: string;
        method: "HEAD" | "POST" | "GET" | "DELETE" | "PATCH" | "OPTIONS" | "PUT";
        comment?: string | undefined;
    }[] | undefined;
    allowedWritePaths?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    blockedTools?: (string | {
        pattern: string;
        comment?: string | undefined;
    })[] | undefined;
    blockedCommandHints?: {
        command: string;
        reason: string;
        context?: string | undefined;
        example?: string | undefined;
        tryInstead?: string[] | undefined;
        whenNotMatching?: string | undefined;
    }[] | undefined;
}>;
export type PermissionsConfigFile = z.infer<typeof PermissionsConfigSchema>;
/**
 * Compiled API endpoint rule for runtime checking
 */
export interface CompiledApiEndpointRule {
    method: string;
    pathPattern: RegExp;
}
/**
 * Compiled bash pattern with metadata for error messages.
 * Stores the original pattern string and comment alongside the compiled RegExp
 * so we can provide helpful error messages when commands don't match.
 */
export interface CompiledBashPattern {
    /** Compiled regex for matching */
    regex: RegExp;
    /** Original pattern string (for error messages) */
    source: string;
    /** Human-readable comment explaining what this pattern allows */
    comment?: string;
}
/**
 * Runtime command-specific hint for blocked Bash commands.
 */
export interface CompiledBlockedCommandHint {
    /** Base command token (lowercase), e.g. "printf" */
    command: string;
    reason: string;
    context?: string;
    tryInstead?: string[];
    example?: string;
    /** Optional condition: hint applies only when command does NOT match this regex */
    whenNotMatching?: string;
    whenNotMatchingRegex?: RegExp;
}
/**
 * Analysis of why a command didn't match a pattern.
 * Used by incr-regex-package to provide detailed diagnostics showing
 * exactly WHERE matching failed and what was expected.
 */
export interface MismatchAnalysis {
    /** How much of the command matched before failure */
    matchedPrefix: string;
    /** Character position where matching stopped */
    failedAtPosition: number;
    /** The token/word that caused the mismatch */
    failedToken: string;
    /** The pattern that got closest to matching */
    bestMatchPattern?: {
        source: string;
        comment?: string;
    };
    /** Actionable suggestion for the user/agent */
    suggestion?: string;
}
/**
 * Paths to permissions configuration files.
 * Used in error messages to guide the agent on how to customize permissions.
 */
export interface PermissionPaths {
    /** Path to workspace-level permissions.json */
    workspacePath: string;
    /** Path to app-level default.json */
    appDefaultPath: string;
    /** Path to permissions documentation */
    docsPath: string;
}
/**
 * Safe mode configuration - defines behavior for read-only mode
 */
export interface ModeConfig {
    /** Tools that are always blocked in safe mode (Write, Edit, etc.) - hardcoded, not configurable */
    blockedTools: Set<string>;
    /** Read-only Bash command patterns with metadata for helpful error messages */
    readOnlyBashPatterns: CompiledBashPattern[];
    /** Command-specific hints shown when blocked Bash commands are rejected */
    blockedCommandHints?: CompiledBlockedCommandHint[];
    /** Read-only MCP patterns (tools matching these are allowed) */
    readOnlyMcpPatterns: RegExp[];
    /** Fine-grained API endpoint rules (method + path pattern) */
    allowedApiEndpoints: CompiledApiEndpointRule[];
    /** File paths allowed for writes in Plan mode (glob patterns) */
    allowedWritePaths?: string[];
    /** User-friendly name */
    displayName: string;
    /** Keyboard shortcut hint */
    shortcutHint: string;
    /** Paths to permission files for actionable error messages */
    permissionPaths?: PermissionPaths;
}
/**
 * Minimal fallback configuration for safe mode.
 *
 * The actual patterns are loaded from ~/.craft-agent/permissions/default.json
 * at runtime by PermissionsConfigCache. This fallback ensures the app works
 * even if the JSON file is missing or invalid.
 *
 * To customize allowed commands, edit ~/.craft-agent/permissions/default.json
 */
export declare const SAFE_MODE_CONFIG: ModeConfig;
/**
 * Display configuration for each mode
 */
export declare const PERMISSION_MODE_CONFIG: Record<PermissionMode, {
    displayName: string;
    shortName: string;
    description: string;
    /** SVG path data for the icon (viewBox 0 0 24 24, stroke-based) */
    svgPath: string;
    /** Tailwind color classes for consistent theming */
    colorClass: {
        /** Text color class (e.g., 'text-info') */
        text: string;
        /** Background color class (e.g., 'bg-info') */
        bg: string;
        /** Border color class (e.g., 'border-info') */
        border: string;
    };
}>;
export {};
