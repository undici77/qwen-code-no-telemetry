/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type {
  MCPServerConfig,
  ExtensionInstallMetadata,
  SkillConfig,
  SubagentConfig,
  ClaudeMarketplaceConfig,
} from '../index.js';
import type { HookEventName, HookDefinition } from '../hooks/types.js';
import { Config } from '../index.js';
import type { LoadExtensionContext } from './variableSchema.js';
import { type ExtensionScope } from './extensionPreferences.js';
import {
  type ExtensionSource,
  type DiscoveredPlugin,
} from './sourceRegistry.js';
import { type LocalizableString } from './i18n.js';
import type {
  ExtensionSetting,
  ResolvedExtensionSetting,
} from './extensionSettings.js';
import type {
  ExtensionOriginSource,
  TelemetrySettings,
} from '../config/config.js';
import {
  ExtensionStore,
  type ExtensionActivation,
  type ExtensionActivationResult,
  type ExtensionStoreSnapshot,
  type InitialExtensionActivation,
} from './extension-store.js';
export type ExtensionPackageFormat = 'qwen' | 'agent-plugins-v1';
export declare enum SettingScope {
  User = 'User',
  Workspace = 'Workspace',
  System = 'System',
  SystemDefaults = 'SystemDefaults',
}
export interface ExtensionChannelConfig {
  /** Relative path to JS entry point (must export `plugin: ChannelPlugin`) */
  entry: string;
  /** Human-readable name for CLI output */
  displayName?: string;
  /** Extra config fields required beyond the shared ChannelConfig fields */
  requiredConfigFields?: string[];
}
export interface Extension {
  id: string;
  name: string;
  displayName?: string;
  version: string;
  isActive: boolean;
  path: string;
  config: ExtensionConfig;
  format?: ExtensionPackageFormat;
  installMetadata?: ExtensionInstallMetadata;
  mcpServers?: Record<string, MCPServerConfig>;
  contextFiles: string[];
  settings?: ExtensionSetting[];
  resolvedSettings?: ResolvedExtensionSetting[];
  commands?: string[];
  skills?: SkillConfig[];
  agents?: SubagentConfig[];
  hooks?: {
    [K in HookEventName]?: HookDefinition[];
  };
  channels?: Record<string, ExtensionChannelConfig>;
}
export interface ExtensionConfig {
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  /** Original localizable values before resolution, for runtime re-resolution on language change. */
  _rawLocalizable?: {
    displayName?: LocalizableString;
    description?: LocalizableString;
  };
  mcpServers?: Record<string, MCPServerConfig>;
  lspServers?: string | Record<string, unknown>;
  contextFileName?: string | string[];
  commands?: string | string[];
  skills?: string | string[];
  agents?: string | string[];
  settings?: ExtensionSetting[];
  hooks?: {
    [K in HookEventName]?: HookDefinition[];
  };
  channels?: Record<string, ExtensionChannelConfig>;
}
export interface ExtensionUpdateInfo {
  name: string;
  originalVersion: string;
  updatedVersion: string;
  warnings?: Array<{
    code: string;
    error: string;
  }>;
}
export interface ExtensionCommittedWithWarningsError extends Error {
  code: 'extension_committed_with_warnings';
  committed: true;
  identity: {
    id: string;
    name: string;
  };
  warnings: ReadonlyArray<{
    code: string;
    error: string;
  }>;
}
export declare function isExtensionCommittedWithWarningsError(
  error: unknown,
): error is ExtensionCommittedWithWarningsError;
export interface ExtensionUpdateStatus {
  status: ExtensionUpdateState;
  processed: boolean;
}
export declare enum ExtensionUpdateState {
  CHECKING_FOR_UPDATES = 'checking for updates',
  UPDATED_NEEDS_RESTART = 'updated, needs restart',
  UPDATED_WITH_WARNINGS = 'updated with warnings',
  UPDATING = 'updating',
  UPDATED = 'updated',
  UPDATE_AVAILABLE = 'update available',
  UP_TO_DATE = 'up to date',
  ERROR = 'error',
  NOT_UPDATABLE = 'not updatable',
  UNKNOWN = 'unknown',
}
export type ExtensionRequestOptions = {
  extensionConfig: ExtensionConfig;
  originSource: ExtensionOriginSource;
  commands?: string[];
  skills?: SkillConfig[];
  subagents?: SubagentConfig[];
  previousExtensionConfig?: ExtensionConfig;
  previousCommands?: string[];
  previousSkills?: SkillConfig[];
  previousSubagents?: SubagentConfig[];
};
export interface ExtensionManagerOptions {
  /** Working directory for project-level extensions */
  workspaceDir?: string;
  /** Override list of enabled extension names (from CLI -e flag) */
  enabledExtensionOverrides?: string[];
  isWorkspaceTrusted: boolean;
  /** Locale code for resolving localizable fields (e.g., 'en', 'zh'). Defaults to 'en'. */
  locale?: string;
  telemetrySettings?: TelemetrySettings;
  config?: Config;
  requestConsent?: (options?: ExtensionRequestOptions) => Promise<void>;
  requestSetting?: (setting: ExtensionSetting) => Promise<string>;
  requestChoicePlugin?: (
    marketplace: ClaudeMarketplaceConfig,
  ) => Promise<string>;
  extensionStore?: ExtensionStore;
  networkPolicy?: ExtensionInstallMetadata['networkPolicy'];
}
export interface PrepareExtensionInstallOptions {
  installMetadata: ExtensionInstallMetadata;
  initialActivation: InitialExtensionActivation;
  localSourcePath?: string;
  requestConsent?: (options?: ExtensionRequestOptions) => Promise<void>;
  requestSetting?: (setting: ExtensionSetting) => Promise<string>;
  cwd?: string;
  signal?: AbortSignal;
}
export interface PrepareExtensionUpdateOptions {
  extension: Extension;
  signal?: AbortSignal;
}
export interface PreparedExtensionMutation {
  readonly operation: 'install' | 'update';
  readonly identity: {
    id: string;
    name: string;
  };
  readonly version: string;
  readonly expectedArtifactGeneration?: number;
  /** @internal */
  readonly installMetadata: ExtensionInstallMetadata;
  /** @internal */
  readonly config: ExtensionConfig;
  /** @internal */
  readonly previousConfig?: ExtensionConfig;
  /** @internal */
  readonly initialActivation: InitialExtensionActivation;
  /** @internal */
  readonly stagingDirectory: string;
  /** @internal */
  readonly destinationDirectory: string;
  /** @internal */
  readonly currentDir: string;
  /** @internal */
  readonly cleanupPaths: readonly string[];
  /** @internal */
  readonly commitSettings?: () => Promise<void>;
  /** @internal */
  readonly discardSettings?: () => Promise<void>;
  /** @internal */
  settingsActivated: boolean;
  /** @internal */
  consumed: boolean;
  /** @internal */
  disposed: boolean;
}
export interface CommittedExtensionMutation {
  identity: {
    id: string;
    name: string;
  };
  version: string;
  generation: number;
  extension?: Extension;
  warnings?: Array<{
    code: string;
    error: string;
  }>;
}
export interface ExtensionStoreMutationResult extends ExtensionStoreSnapshot {
  warnings?: Array<{
    code: string;
    error: string;
  }>;
}
export type ExtensionCommitCallback = (generation: number) => void;
export declare class PreparedExtensionConsumedError extends Error {
  readonly code = 'prepared_extension_consumed';
  constructor();
}
export declare class InvalidPreparedExtensionError extends Error {
  readonly code = 'invalid_prepared_extension';
  constructor();
}
export interface ExtensionMutationEvent {
  id: number;
  phase: 'start' | 'end';
  operation: string;
}
export type ExtensionMutationListener = (event: ExtensionMutationEvent) => void;
export declare class ExtensionManager {
  private extensionCache;
  private readonly mutationListeners;
  private nextMutationId;
  private readonly configDir;
  private readonly configFilePath;
  private readonly enabledExtensionNamesOverride;
  private readonly workspaceDir;
  private readonly preferencesStore;
  private readonly sourceRegistryStore;
  private readonly extensionStore;
  private readonly networkPolicy?;
  private readonly preparedMutations;
  private discoverCache;
  /** See `sourceFingerprint`. `undefined` until the first refresh commits. */
  private lastSourceFingerprint;
  private inFlightSourceRevalidation;
  private withNetworkPolicy;
  private config?;
  private telemetrySettings?;
  private isWorkspaceTrusted;
  private readonly locale;
  private requestConsent;
  private requestSetting?;
  private requestChoicePlugin;
  constructor(options: ExtensionManagerOptions);
  setConfig(config: Config): void;
  setRequestConsent(
    requestConsent: (options?: ExtensionRequestOptions) => Promise<void>,
  ): void;
  setRequestSetting(
    requestSetting?: (setting: ExtensionSetting) => Promise<string>,
  ): void;
  setRequestChoicePlugin(
    requestChoicePlugin: (
      marketplace: ClaudeMarketplaceConfig,
    ) => Promise<string>,
  ): void;
  addMutationListener(listener: ExtensionMutationListener): () => void;
  private beginMutation;
  private emitMutation;
  /**
   * Validates that override extension names exist in the extensions list.
   */
  validateExtensionOverrides(extensions: Extension[]): void;
  /**
   * Determines if an extension is enabled based on its name and the current path.
   */
  isEnabled(extensionName: string, currentPath?: string): boolean;
  /**
   * Enables an extension at the specified scope.
   */
  enableExtension(
    name: string,
    scope: SettingScope,
    cwd?: string,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  /**
   * Disables an extension at the specified scope.
   */
  disableExtension(
    name: string,
    scope: SettingScope,
    cwd?: string,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  getExtensionStoreSnapshot(): Promise<ExtensionStoreSnapshot>;
  getExtensionActivation(
    extensionId: string,
    workspacePath?: string,
  ): Promise<ExtensionActivationResult>;
  getExtensionActivationFromSnapshot(
    extensionId: string,
    snapshot: ExtensionStoreSnapshot,
    workspacePath?: string,
  ): ExtensionActivationResult;
  setExtensionDefaultActivation(
    extensionId: string,
    activation: ExtensionActivation,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  setExtensionActivationScope(
    extensionId: string,
    activation: InitialExtensionActivation,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  setExtensionWorkspaceActivation(
    extensionId: string,
    workspacePath: string,
    activation: ExtensionActivation,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  clearExtensionWorkspaceActivation(
    extensionId: string,
    workspacePath: string,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  private findExtensionById;
  private applyStoreActivation;
  private refreshToolsAfterActivation;
  isFavorite(name: string): boolean;
  getFavorites(): string[];
  /** Toggles favorite state for an extension/MCP server; returns new state. */
  toggleFavorite(name: string): boolean;
  getExtensionScope(name: string): ExtensionScope | undefined;
  getExtensionScopes(): Record<string, ExtensionScope>;
  setExtensionScope(name: string, scope: ExtensionScope): void;
  /** MCP servers individually disabled inside the given extension. */
  getDisabledMcpServers(extensionName: string): string[];
  setMcpServerDisabled(
    extensionName: string,
    serverName: string,
    disabled: boolean,
  ): void;
  getSources(): ExtensionSource[];
  /**
   * Adds a marketplace source. Loads the marketplace config to resolve a
   * human-readable name (falling back to the raw source). Throws if no
   * marketplace config can be resolved from the source.
   */
  addSource(source: string): Promise<ExtensionSource>;
  removeSource(name: string): boolean;
  /**
   * Records a fresh "last updated" timestamp for a marketplace and invalidates
   * the discovery cache so the next discover re-fetches it.
   */
  markSourceUpdated(name: string): ExtensionSource | undefined;
  loadSource(source: string): Promise<ClaudeMarketplaceConfig | null>;
  /**
   * Discovers all installable plugins across configured sources, marking
   * which are already installed. The fetched listing is cached for the session;
   * pass `{ refresh: true }` to force a re-fetch. The cheap `installed` flags are
   * always recomputed against the current install state.
   */
  discoverPlugins(options?: { refresh?: boolean }): Promise<DiscoveredPlugin[]>;
  private readEnablementConfig;
  /**
   * Refreshes the extension cache from disk.
   */
  refreshCache(options?: { names?: string[] }): Promise<void>;
  refreshCacheWithSnapshot(options?: {
    names?: string[];
  }): Promise<ExtensionStoreSnapshot>;
  private static stampPath;
  /**
   * Fingerprints which extension directories exist (install / uninstall) and
   * each manifest's mtime and size (in-place edits).
   *
   * A pure function of on-disk state, deliberately independent of the current
   * cache, so the same disk yields the same value before and after a refresh.
   * A refresh never writes these paths, which is what makes it safe to commit
   * the pre-load value — see `refreshCacheWithSnapshot`.
   *
   * Deliberately cheap: one `readdir`, one manifest `stat` per entry, and a
   * sidecar read for linked entries, where `refreshCache()` parses every
   * manifest and re-lists every extension skill directory. That difference is
   * what lets a status read stay self-healing without becoming a directory
   * scan.
   *
   * mtime-and-size is the usual stat-based approximation, so an edit that
   * preserves both is not detected. That is acceptable here: this is only the
   * out-of-band safety net — mutations made through the daemon invalidate
   * explicitly and never rely on it.
   */
  private extensionDirFingerprint;
  /**
   * Fingerprints the enablement file and the store's activation state — where
   * `enable` / `disable` land.
   *
   * Unlike the directory part this is stamped *after* a refresh, because a
   * refresh writes the store itself. That is safe: store mutations hold the
   * store lock, so no external write can interleave with the refresh and be
   * masked by the post-load stamp.
   */
  private extensionStoreFingerprint;
  private sourceFingerprint;
  /**
   * Refreshes the cache only when the on-disk extension sources moved since the
   * last refresh. Returns whether a refresh actually ran.
   *
   * Extension sources have no watcher (skills do — see
   * `SkillManager.startWatching`), so read-only consumers that must not scan on
   * every call use this to stay eventually consistent with `qwen extensions
   * install` / `enable` / `disable` run outside the process.
   *
   * Concurrent callers share one refresh, so a caller can join a refresh that
   * started just before the change it cares about. That is bounded rather than
   * lost: the committed baseline is the pre-load fingerprint, so the change is
   * still visible to the next call.
   */
  refreshCacheIfSourcesChanged(): Promise<boolean>;
  getLoadedExtensions(): Extension[];
  /**
   * Loads an extension by name.
   */
  loadExtensionByName(
    name: string,
    workspaceDir?: string,
  ): Promise<Extension | null>;
  loadExtensionsFromDir(dir: string): Promise<Extension[]>;
  private loadExtensionsFromExtensionsDir;
  loadExtension(
    context: LoadExtensionContext,
    options?: {
      throwOnError?: boolean;
    },
  ): Promise<Extension | null>;
  /**
   * Substitute variables in hook configurations, particularly ${CLAUDE_PLUGIN_ROOT}
   */
  private substituteHookVariables;
  loadInstallMetadata(
    extensionDir: string,
  ): ExtensionInstallMetadata | undefined;
  loadExtensionConfig(context: LoadExtensionContext): ExtensionConfig;
  private loadExtensionManifest;
  /**
   * Installs an extension.
   */
  installExtension(
    installMetadata: ExtensionInstallMetadata,
    requestConsent?: (options?: ExtensionRequestOptions) => Promise<void>,
    requestSetting?: (setting: ExtensionSetting) => Promise<string>,
    cwd?: string,
    previousExtensionConfig?: ExtensionConfig,
    initialActivation?: InitialExtensionActivation,
    signal?: AbortSignal,
  ): Promise<Extension>;
  prepareExtensionInstall(
    options: PrepareExtensionInstallOptions,
  ): Promise<PreparedExtensionMutation>;
  private prepareExtensionUpdateFromState;
  prepareExtensionUpdate(options: PrepareExtensionUpdateOptions): Promise<
    | {
        upToDate: true;
        extension: Extension;
      }
    | {
        upToDate: false;
        prepared: PreparedExtensionMutation;
      }
  >;
  private installExtensionInternal;
  commitPreparedExtension(
    prepared: PreparedExtensionMutation,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<CommittedExtensionMutation>;
  private commitPreparedExtensionInternal;
  disposePreparedExtension(prepared: PreparedExtensionMutation): Promise<void>;
  private cleanupPreparedExtension;
  /**
   * Uninstalls an extension.
   */
  uninstallExtension(
    extensionIdentifier: string,
    isUpdate: boolean,
    cwd?: string,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  uninstallExtensionById(
    extensionId: string,
    isUpdate: boolean,
    cwd?: string,
    onCommitted?: ExtensionCommitCallback,
  ): Promise<ExtensionStoreMutationResult>;
  private uninstallExtensionPolicy;
  performWorkspaceExtensionMigration(
    extensions: Extension[],
    requestConsent: (options?: ExtensionRequestOptions) => Promise<void>,
    requestSetting?: (setting: ExtensionSetting) => Promise<string>,
  ): Promise<string[]>;
  checkForAllExtensionUpdates(
    callback: (extensionName: string, state: ExtensionUpdateState) => void,
    signal?: AbortSignal,
    schedule?: <T>(task: () => Promise<T>) => Promise<T>,
  ): Promise<void>;
  updateExtension(
    extension: Extension,
    currentState: ExtensionUpdateState,
    callback: (extensionName: string, state: ExtensionUpdateState) => void,
    enableExtensionReloading?: boolean,
    signal?: AbortSignal,
  ): Promise<ExtensionUpdateInfo | undefined>;
  updateAllUpdatableExtensions(
    extensionsState: Map<string, ExtensionUpdateStatus>,
    callback: (extensionName: string, state: ExtensionUpdateState) => void,
    enableExtensionReloading?: boolean,
  ): Promise<ExtensionUpdateInfo[]>;
  refreshTools(): Promise<void>;
}
export declare function copyExtension(
  source: string,
  destination: string,
  options?: {
    skipSymlinks?: boolean;
  },
): Promise<void>;
export declare function getExtensionId(
  config: ExtensionConfig,
  installMetadata?: ExtensionInstallMetadata,
): string;
export declare function hashValue(value: string): string;
export declare function validateName(name: string): void;
