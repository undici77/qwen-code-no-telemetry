/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * URL validator for HTTP hooks with whitelist and SSRF protection.
 *
 * SSRF protection uses the authoritative ssrfGuard.ts module for IP blocking.
 * This module focuses on URL whitelist validation and hostname blocklist.
 */
export declare class UrlValidator {
    private readonly allowedPatterns;
    private readonly compiledPatterns;
    private readonly allowPrivateNetworkHosts;
    /**
     * Create a new URL validator
     * @param allowedPatterns - Array of allowed URL patterns (supports * wildcard)
     * @param allowPrivateNetworkHosts - When true, skip the private/link-local
     *   IP-range check (the metadata endpoint checks — BLOCKED_HOSTS and the
     *   metadata IPs — still apply). Only enable from trusted settings scopes.
     */
    constructor(allowedPatterns?: string[], allowPrivateNetworkHosts?: boolean);
    /**
     * Compile a URL pattern with wildcards into a RegExp.
     * Supports both pre-escaped patterns (e.g., 'https://api\\.example\\.com/*')
     * and unescaped patterns (e.g., 'https://api.example.com/*').
     */
    private compilePattern;
    /**
     * Check if a URL is allowed by the whitelist
     * @param url - The URL to check
     * @returns True if the URL matches any allowed pattern
     */
    isAllowed(url: string): boolean;
    /**
     * Check if a URL should be blocked for security reasons (SSRF protection).
     * Uses ssrfGuard.ts for IP address blocking (authoritative implementation).
     * @param url - The URL to check
     * @returns True if the URL should be blocked
     */
    isBlocked(url: string): boolean;
    /**
     * Validate a URL for use in HTTP hooks
     * @param url - The URL to validate
     * @returns Validation result with allowed status and reason
     */
    validate(url: string): {
        allowed: boolean;
        reason?: string;
    };
    /**
     * Check if a string is an IP address (IPv4 or IPv6)
     * Uses Node.js net module for accurate validation of all IP formats
     * including ::1, ::ffff:192.168.1.1, 2001:db8::1, etc.
     */
    private isIpAddress;
}
/**
 * Create a URL validator from configuration
 * @param allowedUrls - Array of allowed URL patterns from config
 * @returns Configured URL validator
 */
export declare function createUrlValidator(allowedUrls?: string[], allowPrivateNetworkHosts?: boolean): UrlValidator;
