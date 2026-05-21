/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Escape text so it is safe to interpolate into an XML element body OR
 * an attribute value. Covers all five XML metacharacters (`&`, `<`, `>`,
 * `"`, `'`) so callers can't pick a context-incomplete subset by
 * accident — a future caller using `attr="${escapeXml(input)}"` would
 * otherwise be vulnerable to attribute injection through unescaped `"`.
 *
 * Used wherever model-facing prompts wrap user / extension / MCP-
 * supplied strings in tags (`<available_skills>`, `<task-notification>`,
 * `<system-reminder>`, etc.) — without escaping, a value containing
 * one of the metacharacters could close the envelope early and forge
 * sibling tags that the model would treat as trusted metadata.
 *
 * Pure: no I/O, no allocation beyond the string replacement chain.
 */
export declare function escapeXml(text: string): string;
/**
 * Escape `<system-reminder>` tag variants in model-facing reminder bodies
 * without XML-escaping the whole body. This keeps markdown/code blocks readable
 * while preventing untrusted content, including visually hidden format/control
 * characters inside the tag, from ending or spoofing the reminder envelope.
 */
export declare function escapeSystemReminderTags(text: string): string;
