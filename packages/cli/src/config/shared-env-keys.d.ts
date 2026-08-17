export declare const DEFAULT_EXCLUDED_ENV_VARS: string[];
export declare const ENV_CORRUPTED_PATH = 'QWEN_CODE_SETTINGS_CORRUPTED_PATH';
export declare const ENV_WAS_RECOVERED = 'QWEN_CODE_SETTINGS_WAS_RECOVERED';
export declare const ENV_ACP_REPEATED_TOOL_FAILURE_GUARD =
  'QWEN_CODE_ACP_REPEATED_TOOL_FAILURE_GUARD';
export declare const PROJECT_ENV_HARDCODED_EXCLUSIONS: string[];
export declare function isHardcodedProjectEnvExclusion(key: string): boolean;
export declare const HOME_ENV_BOOTSTRAP_KEYS: readonly [
  'QWEN_HOME',
  'QWEN_RUNTIME_DIR',
  'QWEN_CODE_MCP_APPROVALS_PATH',
  'QWEN_CODE_TRUSTED_FOLDERS_PATH',
];
export declare const INHERITED_LOADER_ENV_KEYS: readonly [
  'NODE_OPTIONS',
  'npm_config_node_options',
  'npm_config_userconfig',
  'npm_config_globalconfig',
  'npm_config_script_shell',
  'npm_config_prefix',
  'NODE_PATH',
  'OPENSSL_CONF',
  'NODE_REPL_EXTERNAL_MODULE',
  'npm_config_node_gyp',
  'npm_config_init_module',
  'LD_PRELOAD',
  'LD_AUDIT',
  'DYLD_INSERT_LIBRARIES',
  'BASH_ENV',
  'ZDOTDIR',
];
export declare function isLoaderEnvKey(key: string): boolean;
export declare function scrubInheritedLoaderEnv(
  env: NodeJS.ProcessEnv,
  snapshotInto?: Map<string, string>,
): string[];
export declare function scrubAndReportInheritedLoaderEnv(
  env: NodeJS.ProcessEnv,
  commandLabel: string,
  processLabel: string,
  snapshotInto?: Map<string, string>,
): string[];
export interface InheritedLoaderEnvScrubHandle {
  /** Loader keys this acquire removed from the shared env (empty for a nested acquire whose env was already scrubbed). */
  readonly removedKeys: readonly string[];
  /** Idempotent; restores the snapshotted originals only when the last holder releases. */
  release(): void;
}
export declare function acquireInheritedLoaderEnvScrub(
  env: NodeJS.ProcessEnv,
  commandLabel: string,
  processLabel: string,
): InheritedLoaderEnvScrubHandle;
/** Test-only: reset the shared process-env scrub refcount/snapshot. */
export declare function resetInheritedLoaderEnvScrubForTesting(): void;
export type LoaderKeyRejectionReporter = (
  source: string,
  freshKeys: readonly string[],
) => void;
export declare function setLoaderKeyRejectionReporter(
  reporter: LoaderKeyRejectionReporter | undefined,
): void;
export declare function clearLoaderKeyRejectionReporterIfCurrent(
  reporter: LoaderKeyRejectionReporter,
): void;
export declare function reportRejectedLoaderKeys(
  source: string,
  candidateKeys: readonly string[],
): string[];
/** Test-only: forget already-reported loader-key rejections. */
export declare function resetLoaderKeyRejectionReportingForTesting(): void;
