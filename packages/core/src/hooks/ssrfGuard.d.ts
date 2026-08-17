/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * SSRF guard for HTTP hooks.
 *
 * Aligned with Claude Code's ssrfGuard.ts behavior.
 *
 * Blocks private, link-local, and other non-routable address ranges to prevent
 * project-configured HTTP hooks from reaching cloud metadata endpoints
 * (169.254.169.254) or internal infrastructure.
 *
 * Loopback (127.0.0.0/8, ::1) is intentionally ALLOWED — local dev policy
 * servers are a primary HTTP hook use case.
 *
 * NOTE: Node.js native `fetch` does not support a custom `lookup` option
 * (unlike axios). This module performs DNS validation before the request.
 * There is a small race window between validation and connection where a
 * sophisticated DNS rebinding attack could occur. For most threat models
 * this is acceptable. For higher security, use a proxy or switch to axios.
 */
/**
 * Returns true if the address is in a range that HTTP hooks should not reach.
 *
 * Blocked IPv4:
 *   0.0.0.0/8        "this" network
 *   10.0.0.0/8       private
 *   100.64.0.0/10    shared address space / CGNAT (some cloud metadata, e.g. Alibaba 100.100.100.200)
 *   169.254.0.0/16   link-local (cloud metadata)
 *   172.16.0.0/12    private
 *   192.168.0.0/16   private
 *
 * Blocked IPv6:
 *   ::               unspecified
 *   fc00::/7         unique local
 *   fe80::/10        link-local
 *   ::ffff:<v4>      mapped IPv4 in a blocked range
 *
 * Allowed (returns false):
 *   127.0.0.0/8      loopback (local dev hooks)
 *   ::1              loopback
 *   everything else
 */
export declare function isBlockedAddress(address: string): boolean;
/**
 * Returns true if the address is a cloud metadata endpoint IP, in any
 * serialized form — plain IPv4, or IPv4-mapped IPv6 such as
 * `::ffff:169.254.169.254` / `::ffff:a9fe:a9fe`. Unlike
 * `isBlockedAddress`, this check is never relaxed by opt-in settings.
 */
export declare function isMetadataAddress(address: string): boolean;
/**
 * A dns.lookup-compatible function that resolves a hostname and rejects
 * addresses in blocked ranges. Used as a custom lookup to validate the
 * resolved IP before connecting.
 */
export declare function ssrfGuardedLookup(
  hostname: string,
  options: {
    all?: boolean;
  },
  callback: (
    err: Error | null,
    address:
      | string
      | Array<{
          address: string;
          family: number;
        }>,
    family?: number,
  ) => void,
): void;
