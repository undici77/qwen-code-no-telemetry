/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const AGENT_PLUGIN_MANIFEST = 'plugin.json';
export declare const AGENT_PLUGIN_SCHEMA =
  'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json';
export declare const AGENT_PLUGIN_SCHEMA_PREFIX =
  'https://agent-plugins.org/schemas/';
export declare const DEFAULT_AGENT_PLUGIN_VERSION = '1.0.0';
export type AgentPluginSchemaStatus = 'supported' | 'unsupported' | 'unrelated';
export interface AgentPluginExtensionConfig {
  name: string;
  version: string;
  displayName: string;
  description?: string;
}
export declare function getAgentPluginSchemaStatus(
  pluginRoot: string,
): AgentPluginSchemaStatus;
export declare function loadAgentPluginManifest(
  pluginRoot: string,
): AgentPluginExtensionConfig;
