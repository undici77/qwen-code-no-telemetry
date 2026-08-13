/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { type ChannelStartupProfileV1 } from '@qwen-code/acp-bridge/bridgeTypes';
export type AcpStartupMark = 'profilerReady' | 'geminiImportStart' | 'geminiImportEnd' | 'argsParseStart' | 'argsParseEnd' | 'settingsLoadStart' | 'settingsLoadEnd' | 'configConstructionStart' | 'configConstructionEnd' | 'appInitializationStart' | 'appInitializationEnd' | 'acpImportStart' | 'acpImportEnd' | 'bootstrapConfigInitializationStart' | 'bootstrapConfigInitializationEnd' | 'transportSetupStart' | 'transportSetupEnd' | 'initializeHandlerStart' | 'initializeHandlerEnd' | 'responseBuilt' | 'extensionsInitialStart' | 'extensionsInitialEnd' | 'hooksStart' | 'hooksEnd' | 'skillsStart' | 'skillsEnd' | 'extensionsFinalStart' | 'extensionsFinalEnd' | 'hierarchicalMemoryStart' | 'hierarchicalMemoryEnd' | 'toolRegistryStart' | 'toolRegistryEnd' | 'ripgrepProbeStart' | 'ripgrepProbeEnd' | 'toolWarmupStart' | 'toolWarmupEnd';
export declare function initializeAcpStartupProfiler(): void;
export declare function isAcpStartupProfilerEnabled(): boolean;
export declare function markAcpStartup(mark: AcpStartupMark): void;
export declare function beginAcpBootstrapConfigProfiling(): void;
export declare function endAcpBootstrapConfigProfiling(): void;
export declare function recordAcpConfigStartupEvent(name: string): void;
export declare function buildAndFreezeAcpStartupProfile(): ChannelStartupProfileV1 | undefined;
export declare function resetAcpStartupProfilerForTesting(): void;
