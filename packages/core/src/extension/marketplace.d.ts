/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ExtensionConfig } from './extensionManager.js';
import type { ExtensionInstallMetadata } from '../config/config.js';
import type { ClaudeMarketplaceConfig } from './claude-converter.js';
export interface MarketplaceInstallOptions {
    marketplaceUrl: string;
    pluginName: string;
    tempDir: string;
    requestConsent: (consent: string) => Promise<boolean>;
}
export interface MarketplaceInstallResult {
    config: ExtensionConfig;
    sourcePath: string;
    installMetadata: ExtensionInstallMetadata;
}
/**
 * Loads a Claude-format marketplace config (`.claude-plugin/marketplace.json`)
 * from any supported source string, without installing anything. Used by the
 * marketplace registry / Discover view to enumerate installable plugins.
 *
 * Supported sources:
 * - Local directory containing `.claude-plugin/marketplace.json`
 * - Local path directly to a `marketplace.json` file
 * - `owner/repo`, `https://github.com/owner/repo`, `git@github.com:owner/repo.git`
 * - Arbitrary `http(s)://host/.../marketplace.json` returning the JSON document
 *
 * Returns `null` when no marketplace config can be resolved.
 */
export declare function loadMarketplaceConfigFromSource(source: string, networkPolicy?: ExtensionInstallMetadata['networkPolicy']): Promise<ClaudeMarketplaceConfig | null>;
export declare function parseInstallSource(source: string, options?: {
    networkPolicy?: ExtensionInstallMetadata['networkPolicy'];
}): Promise<ExtensionInstallMetadata>;
