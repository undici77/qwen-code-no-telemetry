/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExtensionInstallMetadata } from '../config/config.js';
export type ExtensionSourceType = 'github' | 'git' | 'http' | 'local';
/**
 * A persisted marketplace source the user has added (Marketplaces tab).
 */
export interface ExtensionSource {
    /** Display name (from the marketplace config `name`, or derived). */
    name: string;
    /** Original input string used to add the source. */
    source: string;
    type: ExtensionSourceType;
    /** ISO timestamp recorded when the source was added. */
    addedAt?: string;
    /** ISO timestamp of the last successful (re)fetch / update. */
    lastUpdatedAt?: string;
}
/**
 * A single installable plugin surfaced by the Discover view.
 */
/** Components a plugin declares in its marketplace entry ("Will install"). */
export interface DiscoveredPluginComponents {
    skills?: string[];
    commands?: string[];
    agents?: string[];
    mcpServers?: string[];
}
export interface DiscoveredPlugin {
    /** Name of the marketplace this plugin came from. */
    marketplaceName: string;
    name: string;
    description?: string;
    version?: string;
    author?: string;
    homepage?: string;
    category?: string;
    /** Best-effort last-updated string when the marketplace entry provides one. */
    lastUpdated?: string;
    /** Best-effort install/download count when the marketplace entry provides one. */
    installs?: number;
    /** Components the plugin declares (for the "Will install" summary). */
    components?: DiscoveredPluginComponents;
    /** Source string suitable for `parseInstallSource`. */
    installSource: string;
    /** Whether an extension with this name is already installed. */
    installed: boolean;
}
/**
 * Classifies a marketplace source string into a {@link ExtensionSourceType}
 * using format heuristics only (no network / filesystem access required for a
 * confident answer, beyond an optional existence check the caller may do).
 */
export declare function parseExtensionSourceType(source: string): ExtensionSourceType;
/**
 * Persists the list of marketplace sources the user has added.
 */
export declare class SourceRegistryStore {
    private readonly filePath;
    constructor(filePath: string);
    read(): ExtensionSource[];
    private write;
    /**
     * Adds (or replaces, when name/source matches) a marketplace source.
     */
    add(source: ExtensionSource): void;
    /** Removes a marketplace by name. Returns true if anything was removed. */
    remove(name: string): boolean;
}
/**
 * Loads each configured marketplace and flattens their plugin lists into a
 * single de-duplicated {@link DiscoveredPlugin} array, tagging which entries are
 * already installed. Marketplaces that fail to load are skipped (and logged) so
 * one bad source does not break discovery.
 */
export declare function discoverPlugins(sources: readonly ExtensionSource[], installedNames: ReadonlySet<string>, networkPolicy?: ExtensionInstallMetadata['networkPolicy']): Promise<DiscoveredPlugin[]>;
