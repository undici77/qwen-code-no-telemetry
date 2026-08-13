/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * The exact `cua-driver-rs` release this build of qwen-code is pinned to.
 * Hardcoded `schemas.ts` is generated against this version.
 *
 * Exact pin (NOT a range) is deliberate: cua-driver is pre-1.0 and ships
 * multiple releases per day, some schema-affecting. Locking the version
 * means users get the exact surface we tested; a new upstream release
 * can't silently drift our hardcoded schemas or break the download.
 *
 * To bump: update this and re-run `scripts/sync-computer-use-schemas.ts`
 * against the new binary, then sync the new assets to OSS via
 * `scripts/sync-cua-driver-to-oss.ts`, then smoke-test on macOS.
 */
export declare const CUA_DRIVER_VERSION = "0.5.2";
/**
 * qwen-code-owned OSS mirror base (primary download source — reliable in CN
 * where GitHub release downloads are slow/blocked). Assets live under
 * `<base>/cua-driver-rs/v<version>/<asset>`, mirrored from the upstream
 * trycua/cua release by the "Sync cua-driver to Aliyun OSS" workflow
 * (.github/workflows/sync-cua-driver-to-oss.yml), which auto-triggers on pushes
 * to main that touch this file — a CUA_DRIVER_VERSION bump auto-mirrors the new
 * release (a checksums.txt guard no-ops when already mirrored); manual
 * workflow_dispatch covers first-time / forced re-mirror. Until a version is
 * mirrored there, the GitHub fallback (GITHUB_RELEASE_BASE) serves it
 * transparently.
 *
 * Hosted on the shared `qwen-code-assets` bucket (same one the CLI's own
 * release/installation assets use), under a `computer-use` namespace.
 */
export declare const OSS_MIRROR_BASE = "https://qwen-code-assets.oss-cn-hangzhou.aliyuncs.com/computer-use";
/** GitHub release download base for the pinned tag (fallback source). */
export declare const GITHUB_RELEASE_BASE = "https://github.com/trycua/cua/releases/download";
export interface AssetTarget {
    /** Release asset filename. */
    asset: string;
    /** Directory the tarball/zip extracts into. */
    extractDir: string;
    /** Path to the spawnable driver binary, relative to the extract dir. */
    binaryRelPath: string;
    /** Whether this asset bundles `CuaDriver.app` (macOS TCC onboarding). */
    hasApp: boolean;
}
/**
 * Map a Node platform/arch to the cua-driver release asset.
 * Throws for unsupported targets so callers fail loudly rather than
 * spawning a missing binary.
 */
export declare function resolveAssetTarget(platform?: NodeJS.Platform, arch?: string, version?: string): AssetTarget;
/**
 * Ordered list of full download URLs for an asset: env override (if set),
 * then OSS mirror, then GitHub. The downloader tries each in order until
 * one succeeds.
 *
 * `QWEN_COMPUTER_USE_DOWNLOAD_HOST` lets enterprises / power users point at
 * an internal mirror laid out like OSS (`<host>/cua-driver-rs/v<ver>/<asset>`).
 */
export declare function resolveAssetUrls(asset: string, env?: NodeJS.ProcessEnv, version?: string): string[];
/** URL for the release `checksums.txt` (same source order as assets). */
export declare function resolveChecksumUrls(env?: NodeJS.ProcessEnv, version?: string): string[];
/** Env var name for overriding the screenshot longest-edge cap. */
export declare const MAX_IMAGE_DIMENSION_ENV = "QWEN_COMPUTER_USE_MAX_IMAGE_DIMENSION";
/**
 * Resolve the screenshot longest-edge cap (px) to apply to cua-driver via the
 * `set_config` `max_image_dimension` knob. Precedence:
 *
 *   1. `QWEN_COMPUTER_USE_MAX_IMAGE_DIMENSION` env var (if a valid override)
 *   2. the `tools.computerUse.maxImageDimension` setting
 *   3. `undefined` → no override; cua-driver keeps its built-in default (1568)
 *
 * A valid override is a non-negative integer (`0` disables resizing). Negative
 * values (incl. the `-1` setting default), non-integers, and blanks mean "no
 * override at this layer" — an invalid env value falls through to the setting
 * rather than forcing a default.
 */
export declare function resolveMaxImageDimension(settingValue?: number, env?: NodeJS.ProcessEnv): number | undefined;
/** Install root for all Computer Use artifacts. Footprint stays here. */
export declare function computerUseRoot(home?: string): string;
/** Directory a given version's assets extract into. */
export declare function versionDir(home?: string, version?: string): string;
/**
 * Absolute path to the spawnable `cua-driver` binary for this host.
 * `bootstrap` ensures it has been downloaded before `client` spawns it.
 */
export declare function binaryPath(home?: string, platform?: NodeJS.Platform, arch?: string, version?: string): string;
/**
 * Stable identity recorded in install-state for first-use approval.
 * Bumping the pinned version produces a new key, forcing re-approval +
 * re-download of the new binary.
 */
export declare function approvalKey(version?: string): string;
