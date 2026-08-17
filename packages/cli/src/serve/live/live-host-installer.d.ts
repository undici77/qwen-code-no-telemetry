/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const LIVE_HOST_BUNDLE_ID = 'com.alibaba.qwen-code.live-host';
export declare const LIVE_HOST_TEAM_IDENTIFIER = 'NF4574S59H';
export declare const LIVE_HOST_APP_PATH = '/Applications/Qwen Live Host.app';
export declare const LIVE_HOST_OSS_BASE_URL =
  'https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/live-host';
export declare const LIVE_HOST_RELEASE_BASE_URL =
  'https://github.com/QwenLM/qwen-code/releases/download/live-host-latest';
export declare const LIVE_HOST_MANIFEST_NAME = 'Qwen-Live-Host-manifest.json';
export declare const LIVE_HOST_MANIFEST_FETCH_TIMEOUT_MS: number;
export declare const LIVE_HOST_DOWNLOAD_TIMEOUT_MS: number;
export type LiveHostArchitecture = 'arm64' | 'x64';
export type LiveHostInstallState =
  | 'missing'
  | 'checking'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'launching'
  | 'installed'
  | 'error';
export interface LiveHostInstallStatus {
  state: LiveHostInstallState;
  version?: string;
  progress?: number;
  message?: string;
  retryable?: boolean;
}
export interface LiveHostReleaseAsset {
  name: string;
  size: number;
  sha256: string;
}
export interface LiveHostReleaseManifest {
  schemaVersion: 1;
  version: string;
  protocolVersion: number;
  bundleId: string;
  assets: Record<LiveHostArchitecture, LiveHostReleaseAsset>;
}
interface InstalledLiveHost {
  version: string;
}
export interface LiveHostInstallerDeps {
  platform?: NodeJS.Platform;
  architecture?: string;
  inspectInstalled?: () => Promise<InstalledLiveHost | undefined>;
  installLatest?: (
    architecture: LiveHostArchitecture,
    onStatus: (status: LiveHostInstallStatus) => void,
  ) => Promise<InstalledLiveHost>;
  launch?: () => Promise<void>;
}
export declare function isExpectedLiveHostSignature(output: string): boolean;
export declare function parseLiveHostReleaseManifest(
  value: unknown,
): LiveHostReleaseManifest;
export declare function resolveLiveHostManifestUrls(): [string, string];
export declare function resolveLiveHostAssetUrls(
  version: string,
  assetName: string,
): [string, string];
export declare function downloadLiveHostRelease(
  currentArchitecture: LiveHostArchitecture,
  destination: string,
  onProgress: (progress: number) => void,
  fetchImpl?: typeof fetch,
): Promise<{
  manifest: LiveHostReleaseManifest;
  asset: LiveHostReleaseAsset;
}>;
export declare class LiveHostInstaller {
  private status;
  private operation;
  private readonly platform;
  private readonly currentArchitecture;
  private readonly inspectInstalled;
  private readonly installLatest;
  private readonly launchHost;
  constructor(deps?: LiveHostInstallerDeps);
  getStatus(): LiveHostInstallStatus;
  refresh(): Promise<LiveHostInstallStatus>;
  ensureInstalled(force?: boolean): Promise<LiveHostInstallStatus>;
  launch(): Promise<LiveHostInstallStatus>;
  private runInstall;
  private setError;
}
export {};
