/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Environment variable interpolation utilities for HTTP hooks.
 * Provides secure interpolation with whitelist-based access control.
 */
/**
 * Strip CR, LF, and NUL bytes from a header value to prevent HTTP header
 * injection (CRLF injection) via env var values or hook-configured header
 * templates. A malicious env var like "token\r\nX-Evil: 1" would otherwise
 * inject a second header into the request.
 *
 * Aligned with Claude Code's sanitizeHeaderValue behavior.
 */
export declare function sanitizeHeaderValue(value: string): string;
export declare function interpolateEnvVars(value: string, allowedVars: string[]): string;
/**
 * Interpolate environment variables in all header values.
 *
 * @param headers - Record of header name to value
 * @param allowedVars - List of allowed environment variable names
 * @returns New headers record with interpolated values
 */
export declare function interpolateHeaders(headers: Record<string, string>, allowedVars: string[]): Record<string, string>;
/**
 * Interpolate environment variables in a URL.
 *
 * @param url - The URL string containing environment variable references
 * @param allowedVars - List of allowed environment variable names
 * @returns The interpolated URL
 */
export declare function interpolateUrl(url: string, allowedVars: string[]): string;
/**
 * Check if a string contains environment variable references.
 *
 * @param value - The string to check
 * @returns True if the string contains env var references
 */
export declare function hasEnvVarReferences(value: string): boolean;
/**
 * Extract all environment variable names referenced in a string.
 *
 * @param value - The string to extract from
 * @returns Array of environment variable names
 */
export declare function extractEnvVarNames(value: string): string[];
