/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Parse the `model` field from skill frontmatter.
 * Returns `undefined` for omitted, empty, or "inherit" values.
 */
export function parseModelField(frontmatter) {
    const raw = frontmatter['model'];
    if (raw === undefined) {
        return undefined;
    }
    if (typeof raw !== 'string') {
        throw new Error('"model" must be a string');
    }
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed === 'inherit') {
        return undefined;
    }
    return trimmed;
}
/**
 * Parse the `paths` field from skill frontmatter into normalized glob
 * patterns. Returns `undefined` when the field is omitted, explicitly
 * `null` (YAML `paths:` with no value), an empty array, or contains only
 * blank entries — those cases all mean "no path gating, treat as
 * unconditional". Throws only when `paths` is present with a clearly
 * wrong shape (e.g. a scalar string or an object).
 */
export function parsePathsField(frontmatter) {
    const raw = frontmatter['paths'];
    // YAML `paths:` with no value parses to `null`. Accept it the same way
    // we accept omission, matching the leniency of `argumentHint` and
    // `whenToUse`. Without this branch the whole skill is dropped via a
    // parse error rather than gracefully falling back to unconditional.
    if (raw === undefined || raw === null) {
        return undefined;
    }
    if (!Array.isArray(raw)) {
        throw new Error('"paths" must be an array of glob patterns');
    }
    const cleaned = raw.map((p) => String(p).trim()).filter((p) => p.length > 0);
    // Surface obvious silent-failures at parse time. Without these the
    // skill loads fine but its globs never match anything: the activation
    // registry resolves candidates against the project root, normalizes
    // backslashes to forward slashes, and rejects anything outside the
    // project. An author who writes `paths: ['/etc/passwd']`,
    // `['../*.ts']`, `['./../*.ts']`, `['src/../../**']`, or the
    // Windows-shaped `['C:\\repo\\src\\**']` would otherwise see the
    // skill in `/skills` and never understand why it never activates
    // from the model side. Use a normalize-then-segment-walk check so
    // every form of "absolute" or "escapes-root" gets caught at parse:
    //
    //   1. Normalize backslashes to forward slashes (so Windows-style
    //      `..\foo` collapses to `../foo` for analysis).
    //   2. Reject anything starting with `/` (POSIX absolute) or
    //      matching `^[A-Za-z]:` (Windows drive letter).
    //   3. Reject any path segment equal to `..` (catches `../`,
    //      `./../`, `src/../../**`, etc.). Segment-based — substring
    //      checks would false-positive on things like `..bar` (a real
    //      filename starting with two dots).
    for (const pattern of cleaned) {
        const normalized = pattern.replace(/\\/g, '/');
        if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized)) {
            throw new Error(`"paths" entry "${pattern}" looks absolute; patterns are project-root-relative — drop the leading slash / drive letter`);
        }
        const segments = normalized.split('/');
        if (segments.some((seg) => seg === '..')) {
            throw new Error(`"paths" entry "${pattern}" contains a ".." segment that escapes the project root; patterns must stay within the project`);
        }
    }
    return cleaned.length > 0 ? cleaned : undefined;
}
/**
 * Allowed-character set for skill names. Names flow into multiple
 * trust-relevant sinks: the `<available_skills>` description (consumed by
 * the model), the `<system-reminder>` emitted on path activation, the
 * SkillTool schema's enum, and various UI listings. Rejecting structurally
 * unsafe characters at parse time is more reliable than escaping at every
 * sink.
 *
 * Charset uses Unicode property classes so non-ASCII names (CJK, Cyrillic,
 * accented Latin, etc.) keep working — the original `[a-zA-Z0-9_:.-]+`
 * silently dropped any such skill on upgrade, which is a real
 * backwards-compat regression for the project's CJK userbase. The
 * structurally unsafe characters (`<>/\"'\n\r\t`, whitespace) are still
 * out, which is the actual injection vector this guards against.
 */
export const SKILL_NAME_PATTERN = /^[\p{L}\p{N}_:.-]+$/u;
/**
 * Validate that a skill `name` is safe to embed into prompts and reminders
 * verbatim. Throws with a descriptive message if not — the surrounding
 * parser converts this into a `parseErrors` entry and skips the skill,
 * matching the existing "missing field" / "wrong type" error behavior.
 */
export function validateSkillName(name) {
    if (!SKILL_NAME_PATTERN.test(name)) {
        throw new Error(`"name" must match ${SKILL_NAME_PATTERN} (letters, digits, _, :, ., -); got "${name}"`);
    }
}
/**
 * Error thrown when a skill operation fails.
 */
export class SkillError extends Error {
    code;
    skillName;
    constructor(message, code, skillName) {
        super(message);
        this.code = code;
        this.skillName = skillName;
        this.name = 'SkillError';
    }
}
/**
 * Error codes for skill operations.
 */
export const SkillErrorCode = {
    NOT_FOUND: 'NOT_FOUND',
    INVALID_CONFIG: 'INVALID_CONFIG',
    INVALID_NAME: 'INVALID_NAME',
    FILE_ERROR: 'FILE_ERROR',
    PARSE_ERROR: 'PARSE_ERROR',
};
//# sourceMappingURL=types.js.map