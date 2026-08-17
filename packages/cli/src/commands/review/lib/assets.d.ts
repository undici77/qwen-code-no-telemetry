/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/** The four admitted image formats — the values `EXTENSION_FORMAT` maps to
 * and `sniffImageFormat` returns. */
export type ImageFormat = 'png' | 'jpeg' | 'gif' | 'webp';
/** The extensions an evidence image may carry. */
export declare const ASSET_EXTENSIONS: Set<string>;
/** How many leading bytes `sniffImageFormat` needs to rule — the longest
 * admitted signature (WEBP's fourcc ends at byte 15) fits inside. Admitting a
 * format with a longer signature means raising this, or every real file of it
 * false-refuses at publish time while full-header unit tests stay green. */
export declare const ASSET_HEADER_BYTES = 16;
/**
 * Detect the image format from a file's first bytes.
 *
 * The allowlist above is extension-based, and an extension is a claim anyone
 * can make: without content sniffing, a shell script renamed `evidence.png`
 * publishes through a review's evidence push. This check binds the CLAIMED
 * type to the leading bytes — it does not stop a prefixed payload (arbitrary
 * bytes riding behind a genuine signature still pass; closing that needs
 * decode-and-reencode, out of scope here). The signatures vary in strength:
 * WEBP is checked across 16 bytes, PNG across 8, GIF across 6, and JPEG
 * across only 3.
 *
 * A sibling signature table lives in core: `sniffFileKind` in
 * `packages/core/src/utils/binary-content.ts` (best-effort kind detection for
 * fetched web content, deliberately looser) and the dimension extractors in
 * `packages/core/src/utils/request-tokenizer/imageTokenizer.ts`. Admitting or
 * correcting a format here means checking those sites too.
 */
export declare function sniffImageFormat(
  header: Uint8Array,
): ImageFormat | null;
/**
 * Rule on a file's CONTENT against the format its extension claims. Pure —
 * the caller hands over the first bytes — and fail-closed: an unrecognized
 * signature refuses even when the extension is allowed.
 */
export declare function validateAssetContent(
  basename: string,
  header: Uint8Array,
):
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };
/** Per-file and per-run size caps. Evidence screenshots are hundreds of
 * kilobytes; a cap far above that catches the accidental screen-recording or
 * bundled binary without ever bothering a legitimate run. */
export declare const MAX_ASSET_BYTES: number;
export declare const MAX_TOTAL_ASSET_BYTES: number;
/** The branch all of one PR's review evidence lands on. Mirrors the manual
 * convention this feature grew from (`pr-assets/<PR>-verify`), with a
 * `-review` suffix so hand-published and review-published evidence never
 * collide. */
export declare function assetsBranch(pr: number): string;
/**
 * The path a file takes inside the assets repo.
 *
 * Content-hash prefixed, for two properties a bare basename lacks: two
 * different files that happen to share a name (`before.png` from two findings)
 * cannot collide, and the same file published twice lands on the same path —
 * a natural dedupe that makes re-runs idempotent instead of accumulative.
 */
export declare function remoteAssetPath(
  pr: number,
  basename: string,
  sha256Hex: string,
): string;
/**
 * The URL a published asset is referenced by in a PR comment.
 *
 * Pinned to the COMMIT, not the branch, for two reasons. Immutability: a
 * comment's evidence must keep meaning what it meant when posted, and a
 * branch-addressed URL re-resolves on every push. And unambiguity: the branch
 * name contains a slash, and slash-named refs in raw URLs are resolved by
 * greedy matching that a same-prefix ref can break.
 *
 * The web-host `/raw/` redirect form rather than `raw.githubusercontent.com`,
 * because it is the one shape that works unchanged on GitHub Enterprise hosts
 * (which have no `raw.` subdomain by default) — and on github.com it is a
 * redirect GitHub's own image proxy follows.
 */
export declare function rawAssetUrl(opts: {
  host?: string;
  repo: string;
  commitSha: string;
  remotePath: string;
}): string;
/** `owner/repo`, structurally — the same charset GitHub itself enforces, so a
 * value that parses here is safe to interpolate into an API path. */
export declare function parseAssetsRepo(value: string | undefined):
  | {
      repo: string;
    }
  | {
      error: string;
    };
/** One file's admission ruling. `bytes` comes from the command layer's stat. */
export declare function validateAssetFile(
  basename: string,
  bytes: number,
):
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };
/**
 * The whole batch's admission ruling — per-file rules plus the aggregate cap.
 *
 * Pure, so the 40MB total cap is testable without writing 40MB of fixtures:
 * the command stats the files and hands the sizes here.
 */
export declare function validateAssetBatch(
  files: ReadonlyArray<{
    basename: string;
    bytes: number;
  }>,
):
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: string;
    };
/** One published file, as the manifest records it. */
export interface PublishedAsset {
  /** The local path the file was read from. */
  file: string;
  /** The path inside the assets repo. */
  remotePath: string;
  /** The commit-pinned URL a PR comment references. */
  url: string;
  bytes: number;
  sha256: string;
}
/** The manifest `publish-assets` writes — the auditable record of the one
 * write this command performed, mirroring how `submit` records what it posted. */
export interface AssetsManifest {
  repo: string;
  branch: string;
  /** The branch head after the last upload; every URL is pinned to it. */
  commitSha: string;
  pr: number;
  published: PublishedAsset[];
}
