/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Redacts credentials from a single log line. Applied per-line by
 * `createStderrForwarder` before writing to the daemon's stderr and log
 * file. The patterns cover Bearer/QQBot tokens, Authorization headers,
 * common API key prefixes, secret env assignments, URL-embedded
 * credentials, and platform-specific headers (DingTalk).
 *
 * Patterns are applied sequentially — earlier, more-specific patterns
 * (Bearer, QQBot) run before the broader Authorization catch-all.
 */
export declare function redactLogCredentials(line: string): string;
