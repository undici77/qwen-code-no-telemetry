/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { Config, FileDiscoveryService, type LoadServerHierarchicalMemoryResponse } from '@qwen-code/qwen-code-core';
import type { Settings } from './settings.js';
/**
 * Validates if a string is a valid session ID format.
 * Accepts a standard UUID, or a UUID followed by `-agent-{suffix}`
 * (used by Arena to give each agent a deterministic session ID).
 */
export declare function isValidSessionId(value: string): boolean;
export interface CliArgs {
    query: string | undefined;
    model: string | undefined;
    sandbox: boolean | string | undefined;
    sandboxImage: string | undefined;
    debug: boolean | undefined;
    prompt: string | undefined;
    promptInteractive: string | undefined;
    systemPrompt: string | undefined;
    appendSystemPrompt: string | undefined;
    yolo: boolean | undefined;
    bare: boolean | undefined;
    approvalMode: string | undefined;
    telemetry: boolean | undefined;
    checkpointing: boolean | undefined;
    telemetryTarget: string | undefined;
    telemetryOtlpEndpoint: string | undefined;
    telemetryOtlpProtocol: string | undefined;
    telemetryLogPrompts: boolean | undefined;
    telemetryOutfile: string | undefined;
    allowedMcpServerNames: string[] | undefined;
    mcpConfig: string | undefined;
    allowedTools: string[] | undefined;
    acp: boolean | undefined;
    experimentalAcp: boolean | undefined;
    experimentalLsp: boolean | undefined;
    extensions: string[] | undefined;
    listExtensions: boolean | undefined;
    openaiLogging: boolean | undefined;
    openaiApiKey: string | undefined;
    openaiBaseUrl: string | undefined;
    openaiLoggingDir: string | undefined;
    proxy: string | undefined;
    includeDirectories: string[] | undefined;
    screenReader: boolean | undefined;
    inputFormat?: string | undefined;
    outputFormat: string | undefined;
    includePartialMessages?: boolean;
    /**
     * If chat recording is disabled, the chat history would not be recorded,
     * so --continue and --resume would not take effect.
     */
    chatRecording: boolean | undefined;
    /** Resume the most recent session for the current project */
    continue: boolean | undefined;
    /** Resume a specific session by its ID */
    resume: string | undefined;
    /** Specify a session ID without session resumption */
    sessionId: string | undefined;
    /**
     * Create a new forked session from the resumed session. Must be used with
     * --resume or --continue.
     */
    forkSession?: boolean | undefined;
    /** Internal: preserve the outer session ID when relaunching in a sandbox */
    sandboxSessionId?: string | undefined;
    maxSessionTurns: number | undefined;
    coreTools: string[] | undefined;
    excludeTools: string[] | undefined;
    disabledSlashCommands: string[] | undefined;
    authType: string | undefined;
    channel: string | undefined;
    jsonFd?: number | undefined;
    jsonFile?: string | undefined;
    jsonSchema?: string | undefined;
    inputFile?: string | undefined;
}
/**
 * Resolves the `--json-schema` argument into a parsed JSON Schema object.
 *
 * Accepts either a JSON literal or `@path/to/schema.json`. Fails fast with a
 * FatalConfigError if the input can't be read/parsed/compiled — invalid
 * schemas should not silently skip validation at runtime.
 */
export declare function resolveJsonSchemaArg(raw: string | undefined): Record<string, unknown> | undefined;
export declare function parseArguments(): Promise<CliArgs>;
export declare function loadHierarchicalGeminiMemory(currentWorkingDirectory: string, includeDirectoriesToReadGemini: readonly string[] | undefined, fileService: FileDiscoveryService, extensionContextFilePaths: string[] | undefined, folderTrust: boolean, memoryImportFormat?: 'flat' | 'tree', contextRuleExcludes?: string[]): Promise<LoadServerHierarchicalMemoryResponse>;
export declare function isDebugMode(argv: CliArgs): boolean;
export declare function loadCliConfig(settings: Settings, argv: CliArgs, cwd?: string, overrideExtensions?: string[], 
/**
 * Optional separated hooks for proper source attribution.
 * If provided, these override settings.hooks for hook loading.
 */
hooksConfig?: {
    userHooks?: Record<string, unknown>;
    projectHooks?: Record<string, unknown>;
}): Promise<Config>;
