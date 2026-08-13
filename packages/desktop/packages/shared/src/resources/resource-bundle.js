/**
 * Resource Bundle — Export/Import Logic
 *
 * Exports workspace resources (sources, skills, automations) to a portable
 * ResourceBundle, and imports bundles into a target workspace.
 *
 * Key behaviors:
 * - Source configs are sanitized (secrets stripped, auth state reset)
 * - All non-hidden files are included per resource (not just known file types)
 * - Import uses staging + atomic rename per resource (single watcher event)
 * - Source overwrite clears stored credentials
 * - Automations overwrite clears history + retry queue
 * - Relies on existing ConfigWatcher for change notifications (no manual events)
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, renameSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import { MAX_BUNDLE_SIZE_BYTES, collectDirectoryFiles, restoreFiles, validateBundleFile, } from '../utils/bundle-files.ts';
import { getWorkspaceSourcesPath, getWorkspaceSkillsPath } from '../workspaces/storage.ts';
import { loadSourceConfig, getSourcePath } from '../sources/storage.ts';
import { isBuiltinSource } from '../sources/builtin-sources.ts';
import { validateSourceConfig } from '../config/validators.ts';
import { AUTOMATIONS_CONFIG_FILE, AUTOMATIONS_HISTORY_FILE, AUTOMATIONS_RETRY_QUEUE_FILE } from '../automations/constants.ts';
import { validateAutomationsConfig } from '../automations/validation.ts';
import { generateShortId } from '../automations/resolve-config-path.ts';
import { VALID_EVENTS } from '../automations/schemas.ts';
import { debug } from '../utils/debug.ts';
// ============================================================
// Source Config Sanitization
// ============================================================
/**
 * Fields to strip from source configs on export.
 *
 * Runtime state fields are always removed.
 * Known secret-bearing fields are removed with warnings.
 */
/** Strip runtime auth/status state from a source config */
function sanitizeSourceConfig(config) {
    const warnings = [];
    // Deep clone to avoid mutating the original
    const sanitized = JSON.parse(JSON.stringify(config));
    // --- Runtime state: always remove ---
    sanitized.isAuthenticated = false;
    delete sanitized.connectionError;
    delete sanitized.lastTestedAt;
    // Determine if source requires auth
    const authType = sanitized.mcp?.authType || sanitized.api?.authType;
    if (authType && authType !== 'none') {
        sanitized.connectionStatus = 'needs_auth';
    }
    else {
        sanitized.connectionStatus = undefined;
    }
    // --- Known secret fields: always remove ---
    if (sanitized.api?.googleOAuthClientSecret) {
        delete sanitized.api.googleOAuthClientSecret;
        warnings.push(`Source '${config.slug}': stripped googleOAuthClientSecret`);
    }
    // --- MCP env vars: may contain tokens ---
    if (sanitized.mcp?.env && Object.keys(sanitized.mcp.env).length > 0) {
        delete sanitized.mcp.env;
        warnings.push(`Source '${config.slug}': stripped mcp.env (may contain secrets)`);
    }
    // --- Headers: potentially secret, remove with warning ---
    if (sanitized.mcp?.headers && Object.keys(sanitized.mcp.headers).length > 0) {
        delete sanitized.mcp.headers;
        warnings.push(`Source '${config.slug}': stripped mcp.headers (may contain auth tokens)`);
    }
    if (sanitized.api?.defaultHeaders && Object.keys(sanitized.api.defaultHeaders).length > 0) {
        delete sanitized.api.defaultHeaders;
        warnings.push(`Source '${config.slug}': stripped api.defaultHeaders (may contain auth tokens)`);
    }
    return { config: sanitized, warnings };
}
// ============================================================
// Export
// ============================================================
/**
 * Export workspace resources to a portable ResourceBundle.
 *
 * @param workspaceRootPath - Absolute path to workspace root
 * @param options - Which resources to export
 * @returns Bundle + export warnings
 */
export function exportResources(workspaceRootPath, options) {
    const warnings = [];
    const bundle = {
        version: 1,
        exportedAt: Date.now(),
        resources: {},
    };
    // Try to read workspace name for informational purposes
    try {
        const wsConfigPath = join(workspaceRootPath, 'config.json');
        if (existsSync(wsConfigPath)) {
            const wsConfig = JSON.parse(readFileSync(wsConfigPath, 'utf-8'));
            if (wsConfig.name) {
                bundle.sourceWorkspace = wsConfig.name;
            }
        }
    }
    catch {
        // Non-fatal: sourceWorkspace is informational
    }
    // --- Export sources ---
    if (options.sources) {
        bundle.resources.sources = exportSources(workspaceRootPath, options.sources, warnings);
    }
    // --- Export skills ---
    if (options.skills) {
        bundle.resources.skills = exportSkills(workspaceRootPath, options.skills, warnings);
    }
    // --- Export automations ---
    // Normalize: true → 'all', false/undefined → skip
    const automationSelection = options.automations === true ? 'all' : options.automations;
    if (automationSelection) {
        bundle.resources.automations = exportAutomations(workspaceRootPath, automationSelection, warnings);
    }
    // Validate total size
    const bundleJson = JSON.stringify(bundle);
    if (Buffer.byteLength(bundleJson) > MAX_BUNDLE_SIZE_BYTES) {
        warnings.push(`Bundle exceeds ${MAX_BUNDLE_SIZE_BYTES / 1024 / 1024}MB size limit`);
    }
    return { bundle, warnings };
}
function exportSources(workspaceRootPath, selection, warnings) {
    const entries = [];
    const sourcesDir = getWorkspaceSourcesPath(workspaceRootPath);
    if (!existsSync(sourcesDir))
        return entries;
    // Determine which slugs to export
    let slugs;
    if (selection === 'all') {
        slugs = readdirSync(sourcesDir, { withFileTypes: true })
            .filter(d => d.isDirectory() && !d.name.startsWith('.'))
            .map(d => d.name);
    }
    else {
        slugs = selection;
    }
    for (const slug of slugs) {
        let sourcePath;
        try {
            sourcePath = getSourcePath(workspaceRootPath, slug);
        }
        catch {
            warnings.push(`Source '${slug}' has invalid slug format, skipping`);
            continue;
        }
        if (!existsSync(sourcePath)) {
            warnings.push(`Source '${slug}' not found, skipping`);
            continue;
        }
        const config = loadSourceConfig(workspaceRootPath, slug);
        if (!config) {
            warnings.push(`Source '${slug}' has invalid config, skipping`);
            continue;
        }
        // Sanitize config
        const { config: sanitizedConfig, warnings: sanitizeWarnings } = sanitizeSourceConfig(config);
        warnings.push(...sanitizeWarnings);
        // Collect all files except config.json (which travels as structured data)
        const files = collectDirectoryFiles(sourcePath, {
            skipFiles: new Set(['config.json']),
        });
        entries.push({
            slug,
            config: sanitizedConfig,
            files,
        });
    }
    return entries;
}
function exportSkills(workspaceRootPath, selection, warnings) {
    const entries = [];
    const skillsDir = getWorkspaceSkillsPath(workspaceRootPath);
    if (!existsSync(skillsDir))
        return entries;
    // Determine which slugs to export
    let slugs;
    if (selection === 'all') {
        slugs = readdirSync(skillsDir, { withFileTypes: true })
            .filter(d => d.isDirectory() && !d.name.startsWith('.'))
            .map(d => d.name);
    }
    else {
        slugs = selection;
    }
    for (const slug of slugs) {
        const skillDir = join(skillsDir, slug);
        if (!existsSync(skillDir)) {
            warnings.push(`Skill '${slug}' not found, skipping`);
            continue;
        }
        // Collect all files in the skill directory
        const files = collectDirectoryFiles(skillDir);
        // Validate that SKILL.md is present
        const hasSkillMd = files.some(f => f.relativePath === 'SKILL.md');
        if (!hasSkillMd) {
            warnings.push(`Skill '${slug}' missing SKILL.md, skipping`);
            continue;
        }
        entries.push({ slug, files });
    }
    return entries;
}
// ============================================================
// Export: Automations
// ============================================================
/** Header keys that are known to carry secrets (case-insensitive match) */
const SECRET_HEADER_PATTERNS = [
    /^authorization$/i,
    /^proxy-authorization$/i,
    /api[-_]?key/i,
];
function isSecretHeader(key) {
    return SECRET_HEADER_PATTERNS.some(p => p.test(key));
}
/** Returns true if the value references an env var template like $VAR_NAME or ${VAR} (safe to keep) */
function isTemplatedValue(value) {
    return /\$[A-Z_]|\$\{/.test(value);
}
/**
 * Sanitize a single automation matcher for export.
 * Strips webhook auth credentials and known auth headers.
 */
function sanitizeAutomationMatcher(matcher, label, warnings) {
    // Deep clone to avoid mutating the original
    const sanitized = JSON.parse(JSON.stringify(matcher));
    if (!sanitized.actions)
        return sanitized;
    for (const action of sanitized.actions) {
        if (action.type !== 'webhook')
            continue;
        // Strip auth field entirely (bearer tokens, basic auth passwords)
        if (action.auth) {
            delete action.auth;
            warnings.push(`Automation '${label}': stripped webhook auth credentials`);
        }
        // Strip known auth headers (unless templated)
        if (action.headers) {
            const keysToStrip = Object.keys(action.headers).filter(key => isSecretHeader(key) && !isTemplatedValue(action.headers[key]));
            for (const key of keysToStrip) {
                delete action.headers[key];
                warnings.push(`Automation '${label}': stripped webhook header '${key}'`);
            }
            // Clean up empty headers object
            if (Object.keys(action.headers).length === 0) {
                delete action.headers;
            }
        }
    }
    return sanitized;
}
function exportAutomations(workspaceRootPath, selection, warnings) {
    const automationsPath = join(workspaceRootPath, AUTOMATIONS_CONFIG_FILE);
    if (!existsSync(automationsPath)) {
        warnings.push('No automations.json found in workspace');
        return [];
    }
    // Read and validate via the full validation pipeline
    let raw;
    try {
        raw = JSON.parse(readFileSync(automationsPath, 'utf-8'));
    }
    catch (err) {
        warnings.push(`Failed to read automations.json: ${err}`);
        return [];
    }
    const validation = validateAutomationsConfig(raw);
    if (!validation.valid || !validation.config) {
        warnings.push(`automations.json is invalid: ${validation.errors.join('; ')}`);
        return [];
    }
    // Flatten { event: matchers[] } into individual entries
    const allEntries = [];
    for (const [event, matchers] of Object.entries(validation.config.automations)) {
        if (!matchers)
            continue;
        for (const matcher of matchers) {
            // Ensure every matcher has an ID (backfill if missing)
            const id = matcher.id || generateShortId();
            allEntries.push({
                id,
                name: matcher.name,
                event,
                matcher: { ...matcher, id },
            });
        }
    }
    // Apply selection filter
    let selected;
    if (selection === 'all') {
        selected = allEntries;
    }
    else {
        const matched = new Set();
        selected = [];
        for (const selector of selection) {
            const matches = allEntries.filter(e => e.id === selector || (e.name !== undefined && e.name === selector));
            if (matches.length === 0) {
                warnings.push(`Automation selector '${selector}' did not match any automation`);
            }
            else if (matches.length > 1 && matches.every(m => m.id !== selector)) {
                // Name matched multiple — warn about ambiguity but include all
                warnings.push(`Automation name '${selector}' matched ${matches.length} automations`);
            }
            for (const m of matches) {
                if (!matched.has(m.id)) {
                    matched.add(m.id);
                    selected.push(m);
                }
            }
        }
    }
    // Sanitize each entry
    return selected.map(entry => ({
        ...entry,
        matcher: sanitizeAutomationMatcher(entry.matcher, entry.name ?? entry.id, warnings),
    }));
}
// ============================================================
// Validation
// ============================================================
/**
 * Validate a ResourceBundle structure.
 * Returns { valid, errors } rather than a type guard, so callers get diagnostics.
 */
export function validateResourceBundle(bundle) {
    const errors = [];
    if (!bundle || typeof bundle !== 'object') {
        return { valid: false, errors: ['Bundle is not an object'] };
    }
    const b = bundle;
    if (b.version !== 1) {
        errors.push(`Unsupported bundle version: ${b.version}`);
    }
    if (typeof b.exportedAt !== 'number') {
        errors.push('Missing or invalid exportedAt');
    }
    if (!b.resources || typeof b.resources !== 'object') {
        errors.push('Missing or invalid resources');
        return { valid: false, errors };
    }
    const res = b.resources;
    // Validate sources
    if (res.sources !== undefined) {
        if (!Array.isArray(res.sources)) {
            errors.push('resources.sources must be an array');
        }
        else {
            const slugs = new Set();
            for (let i = 0; i < res.sources.length; i++) {
                const entry = res.sources[i];
                const prefix = `sources[${i}]`;
                if (!entry || typeof entry !== 'object') {
                    errors.push(`${prefix}: not an object`);
                    continue;
                }
                const e = entry;
                if (typeof e.slug !== 'string' || !e.slug) {
                    errors.push(`${prefix}: missing or invalid slug`);
                    continue;
                }
                if (slugs.has(e.slug)) {
                    errors.push(`${prefix}: duplicate slug '${e.slug}'`);
                }
                slugs.add(e.slug);
                // Check for builtin/reserved slugs
                if (isBuiltinSource(e.slug)) {
                    errors.push(`${prefix}: '${e.slug}' is a reserved builtin source slug`);
                }
                if (!e.config || typeof e.config !== 'object') {
                    errors.push(`${prefix}: missing or invalid config`);
                }
                else {
                    const cfg = e.config;
                    if (typeof cfg.slug === 'string' && cfg.slug !== e.slug) {
                        errors.push(`${prefix}: config.slug '${cfg.slug}' does not match entry slug '${e.slug}'`);
                    }
                }
                if (!Array.isArray(e.files)) {
                    errors.push(`${prefix}: files must be an array`);
                }
                else {
                    validateFileEntries(e.files, prefix, errors);
                }
            }
        }
    }
    // Validate skills
    if (res.skills !== undefined) {
        if (!Array.isArray(res.skills)) {
            errors.push('resources.skills must be an array');
        }
        else {
            const slugs = new Set();
            for (let i = 0; i < res.skills.length; i++) {
                const entry = res.skills[i];
                const prefix = `skills[${i}]`;
                if (!entry || typeof entry !== 'object') {
                    errors.push(`${prefix}: not an object`);
                    continue;
                }
                const e = entry;
                if (typeof e.slug !== 'string' || !e.slug) {
                    errors.push(`${prefix}: missing or invalid slug`);
                    continue;
                }
                if (slugs.has(e.slug)) {
                    errors.push(`${prefix}: duplicate slug '${e.slug}'`);
                }
                slugs.add(e.slug);
                if (!Array.isArray(e.files)) {
                    errors.push(`${prefix}: files must be an array`);
                }
                else {
                    // Validate SKILL.md is present
                    const hasSkillMd = e.files.some(f => typeof f === 'object' && f && f.relativePath === 'SKILL.md');
                    if (!hasSkillMd) {
                        errors.push(`${prefix}: missing SKILL.md`);
                    }
                    validateFileEntries(e.files, prefix, errors);
                }
            }
        }
    }
    // Validate automations
    if (res.automations !== undefined) {
        if (!Array.isArray(res.automations)) {
            errors.push('resources.automations must be an array');
        }
        else {
            const ids = new Set();
            for (let i = 0; i < res.automations.length; i++) {
                const entry = res.automations[i];
                const prefix = `automations[${i}]`;
                if (!entry || typeof entry !== 'object') {
                    errors.push(`${prefix}: not an object`);
                    continue;
                }
                const e = entry;
                if (typeof e.id !== 'string' || !e.id) {
                    errors.push(`${prefix}: missing or invalid id`);
                    continue;
                }
                if (ids.has(e.id)) {
                    errors.push(`${prefix}: duplicate id '${e.id}'`);
                }
                ids.add(e.id);
                if (typeof e.event !== 'string' || !e.event) {
                    errors.push(`${prefix}: missing or invalid event`);
                }
                else if (!VALID_EVENTS.includes(e.event)) {
                    errors.push(`${prefix}: unknown event type '${e.event}'`);
                }
                if (!e.matcher || typeof e.matcher !== 'object') {
                    errors.push(`${prefix}: missing or invalid matcher`);
                }
                else {
                    const m = e.matcher;
                    if (!Array.isArray(m.actions) || m.actions.length === 0) {
                        errors.push(`${prefix}: matcher must have at least one action`);
                    }
                }
            }
        }
    }
    // Validate total bundle size
    try {
        const size = Buffer.byteLength(JSON.stringify(bundle));
        if (size > MAX_BUNDLE_SIZE_BYTES) {
            errors.push(`Bundle size ${size} exceeds max ${MAX_BUNDLE_SIZE_BYTES}`);
        }
    }
    catch {
        errors.push('Bundle is not serializable');
    }
    return { valid: errors.length === 0, errors };
}
function validateFileEntries(files, prefix, errors) {
    const paths = new Set();
    for (let j = 0; j < files.length; j++) {
        const file = files[j];
        if (!file || typeof file !== 'object') {
            errors.push(`${prefix}.files[${j}]: not an object`);
            continue;
        }
        // Check for duplicate paths
        if (paths.has(file.relativePath)) {
            errors.push(`${prefix}.files[${j}]: duplicate path '${file.relativePath}'`);
        }
        paths.add(file.relativePath);
        const fileError = validateBundleFile(file);
        if (fileError) {
            errors.push(`${prefix}.files[${j}]: ${fileError}`);
        }
    }
}
// ============================================================
// Import
// ============================================================
/**
 * Import a ResourceBundle into a target workspace.
 *
 * Uses staging + atomic rename per resource to minimize watcher churn
 * and ensure true replacement on overwrite.
 *
 * @param workspaceRootPath - Absolute path to target workspace
 * @param bundle - The validated ResourceBundle to import
 * @param mode - 'skip' (keep existing) or 'overwrite' (replace)
 * @param deps - Injected dependencies for credential cleanup
 */
export async function importResources(workspaceRootPath, bundle, mode, deps) {
    // Validate bundle first
    const validation = validateResourceBundle(bundle);
    if (!validation.valid) {
        const errorMsg = `Invalid bundle: ${validation.errors.join('; ')}`;
        const failedBucket = { imported: [], skipped: [], failed: [{ id: '*', error: errorMsg }], warnings: [] };
        return {
            sources: { ...failedBucket },
            skills: { ...failedBucket },
            automations: { ...failedBucket },
        };
    }
    const workspaceId = basename(workspaceRootPath);
    // Import each resource type
    const sourcesResult = bundle.resources.sources
        ? await importSources(workspaceRootPath, workspaceId, bundle.resources.sources, mode, deps)
        : emptyBucketResult();
    const skillsResult = bundle.resources.skills
        ? importSkills(workspaceRootPath, bundle.resources.skills, mode)
        : emptyBucketResult();
    const automationsResult = bundle.resources.automations?.length
        ? importAutomations(workspaceRootPath, bundle.resources.automations, mode)
        : emptyBucketResult();
    return {
        sources: sourcesResult,
        skills: skillsResult,
        automations: automationsResult,
    };
}
function emptyBucketResult() {
    return { imported: [], skipped: [], failed: [], warnings: [] };
}
// ============================================================
// Import: Sources
// ============================================================
async function importSources(workspaceRootPath, workspaceId, entries, mode, deps) {
    const result = emptyBucketResult();
    const sourcesDir = getWorkspaceSourcesPath(workspaceRootPath);
    if (!existsSync(sourcesDir)) {
        mkdirSync(sourcesDir, { recursive: true });
    }
    for (const entry of entries) {
        try {
            // Check for reserved slugs
            if (isBuiltinSource(entry.slug)) {
                result.failed.push({ id: entry.slug, error: 'Cannot import builtin source slug' });
                continue;
            }
            const targetDir = getSourcePath(workspaceRootPath, entry.slug);
            const exists = existsSync(targetDir);
            if (exists && mode === 'skip') {
                result.skipped.push(entry.slug);
                continue;
            }
            // Stage: build in temp dir
            const tmpDir = join(sourcesDir, `.tmp-${entry.slug}-${randomUUID().slice(0, 8)}`);
            mkdirSync(tmpDir, { recursive: true });
            try {
                // Write sanitized config.json
                writeFileSync(join(tmpDir, 'config.json'), JSON.stringify(entry.config, null, 2));
                // Restore all other files
                restoreFiles(tmpDir, entry.files);
                // Validate: config should load correctly
                const validation = validateSourceConfig(entry.config);
                if (!validation.valid) {
                    const msgs = validation.errors.map(e => `${e.path}: ${e.message}`).join(', ');
                    result.failed.push({ id: entry.slug, error: `Invalid source config: ${msgs}` });
                    rmSync(tmpDir, { recursive: true });
                    continue;
                }
                // On overwrite: clear credentials + remove old dir
                if (exists) {
                    // Clear all credential types for this slug
                    try {
                        await deps.clearSourceCredentials(workspaceId, entry.slug);
                    }
                    catch (err) {
                        result.warnings.push(`Source '${entry.slug}': failed to clear credentials: ${err}`);
                    }
                    rmSync(targetDir, { recursive: true });
                }
                // Atomic replace: rename temp → target
                renameSync(tmpDir, targetDir);
                result.imported.push(entry.slug);
            }
            catch (err) {
                // Clean up temp dir on failure
                if (existsSync(tmpDir)) {
                    rmSync(tmpDir, { recursive: true });
                }
                throw err;
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            result.failed.push({ id: entry.slug, error: message });
        }
    }
    return result;
}
// ============================================================
// Import: Skills
// ============================================================
function importSkills(workspaceRootPath, entries, mode) {
    const result = emptyBucketResult();
    const skillsDir = getWorkspaceSkillsPath(workspaceRootPath);
    if (!existsSync(skillsDir)) {
        mkdirSync(skillsDir, { recursive: true });
    }
    for (const entry of entries) {
        try {
            const targetDir = join(skillsDir, entry.slug);
            const exists = existsSync(targetDir);
            if (exists && mode === 'skip') {
                result.skipped.push(entry.slug);
                continue;
            }
            // Stage: build in temp dir
            const tmpDir = join(skillsDir, `.tmp-${entry.slug}-${randomUUID().slice(0, 8)}`);
            mkdirSync(tmpDir, { recursive: true });
            try {
                // Restore all files
                restoreFiles(tmpDir, entry.files);
                // Validate: SKILL.md should exist
                if (!existsSync(join(tmpDir, 'SKILL.md'))) {
                    result.failed.push({ id: entry.slug, error: 'SKILL.md missing after restore' });
                    rmSync(tmpDir, { recursive: true });
                    continue;
                }
                // On overwrite: remove old dir
                if (exists) {
                    rmSync(targetDir, { recursive: true });
                }
                // Atomic replace: rename temp → target
                renameSync(tmpDir, targetDir);
                result.imported.push(entry.slug);
            }
            catch (err) {
                // Clean up temp dir on failure
                if (existsSync(tmpDir)) {
                    rmSync(tmpDir, { recursive: true });
                }
                throw err;
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            result.failed.push({ id: entry.slug, error: message });
        }
    }
    return result;
}
// ============================================================
// Import: Automations
// ============================================================
/** Display label for an automation entry (name if available, otherwise ID) */
function automationLabel(entry) {
    return entry.name ?? entry.id;
}
/**
 * Find a matcher by ID across all event arrays.
 * Returns { event, index } if found, undefined otherwise.
 */
function findMatcherById(automations, id) {
    for (const [event, matchers] of Object.entries(automations)) {
        for (let i = 0; i < matchers.length; i++) {
            if (matchers[i]?.id === id)
                return { event, index: i };
        }
    }
    return undefined;
}
/**
 * Filter JSONL file to remove entries matching a set of matcher IDs.
 * Used for selective history/retry-queue cleanup on overwrite.
 */
function filterJsonlByMatcherIds(filePath, idsToRemove) {
    if (!existsSync(filePath) || idsToRemove.size === 0)
        return;
    try {
        const raw = readFileSync(filePath, 'utf-8');
        const lines = raw.split('\n');
        const kept = [];
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const entry = JSON.parse(line);
                if (entry.matcherId && idsToRemove.has(entry.matcherId))
                    continue;
                // History entries use automationId
                if (entry.automationId && idsToRemove.has(entry.automationId))
                    continue;
                kept.push(line);
            }
            catch {
                // Keep unparseable lines (don't silently drop data)
                kept.push(line);
            }
        }
        writeFileSync(filePath, kept.length > 0 ? kept.join('\n') + '\n' : '', 'utf-8');
    }
    catch {
        // Non-critical: cleanup failure doesn't block import
    }
}
function importAutomations(workspaceRootPath, entries, mode) {
    const result = emptyBucketResult();
    const configPath = join(workspaceRootPath, AUTOMATIONS_CONFIG_FILE);
    // Read existing config (if present)
    let existingConfig;
    if (existsSync(configPath)) {
        try {
            const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
            const validation = validateAutomationsConfig(raw);
            if (validation.valid && validation.config) {
                existingConfig = {
                    version: raw.version,
                    automations: validation.config.automations,
                };
            }
            else if (mode === 'overwrite') {
                // Existing config is invalid but we're overwriting — start fresh
                result.warnings.push('Existing automations.json is invalid, starting fresh in overwrite mode');
                existingConfig = { version: 2, automations: {} };
            }
            else {
                // Skip mode + invalid existing config — can't safely merge
                const errorMsg = `Cannot merge into invalid existing automations.json: ${validation.errors.join('; ')}`;
                for (const entry of entries) {
                    result.failed.push({ id: automationLabel(entry), error: errorMsg });
                }
                return result;
            }
        }
        catch (err) {
            if (mode === 'overwrite') {
                result.warnings.push(`Existing automations.json is unreadable (${err}), starting fresh in overwrite mode`);
                existingConfig = { version: 2, automations: {} };
            }
            else {
                const errorMsg = `Cannot read existing automations.json: ${err}`;
                for (const entry of entries) {
                    result.failed.push({ id: automationLabel(entry), error: errorMsg });
                }
                return result;
            }
        }
    }
    else {
        // No existing file — create new
        existingConfig = { version: 2, automations: {} };
    }
    const overwrittenIds = new Set();
    // Merge entries
    for (const entry of entries) {
        // Backfill ID if missing
        const id = entry.id || generateShortId();
        const matcher = { ...entry.matcher, id };
        const label = entry.name ?? id;
        // Check if automation with this ID already exists
        const existing = findMatcherById(existingConfig.automations, id);
        if (existing) {
            if (mode === 'skip') {
                result.skipped.push(label);
                continue;
            }
            // Overwrite: remove old, insert new at same position
            existingConfig.automations[existing.event].splice(existing.index, 1);
            // Clean up empty event arrays
            if (existingConfig.automations[existing.event].length === 0) {
                delete existingConfig.automations[existing.event];
            }
            overwrittenIds.add(id);
        }
        // Insert into the target event's matcher array
        if (!existingConfig.automations[entry.event]) {
            existingConfig.automations[entry.event] = [];
        }
        existingConfig.automations[entry.event].push(matcher);
        result.imported.push(label);
    }
    // Validate the merged full config (schema + semantic: regex, cron, timezone, conditions)
    const mergedValidation = validateAutomationsConfig({
        version: existingConfig.version,
        automations: existingConfig.automations,
    });
    if (!mergedValidation.valid) {
        // Reject the entire import — merged config is invalid
        const errorMsg = `Merged automations config is invalid: ${mergedValidation.errors.join('; ')}`;
        result.imported = [];
        result.skipped = [];
        for (const entry of entries) {
            result.failed.push({ id: automationLabel(entry), error: errorMsg });
        }
        return result;
    }
    // Write atomically: temp file + rename
    try {
        const configObj = {
            version: existingConfig.version ?? 2,
            automations: existingConfig.automations,
        };
        const tmpPath = configPath + `.tmp-${randomUUID().slice(0, 8)}`;
        writeFileSync(tmpPath, JSON.stringify(configObj, null, 2) + '\n', 'utf-8');
        renameSync(tmpPath, configPath);
    }
    catch (err) {
        const errorMsg = `Failed to write automations.json: ${err}`;
        result.imported = [];
        for (const entry of entries) {
            result.failed.push({ id: automationLabel(entry), error: errorMsg });
        }
        return result;
    }
    // Selectively clear history + retry queue for overwritten matcher IDs
    if (overwrittenIds.size > 0) {
        const historyPath = join(workspaceRootPath, AUTOMATIONS_HISTORY_FILE);
        const retryPath = join(workspaceRootPath, AUTOMATIONS_RETRY_QUEUE_FILE);
        filterJsonlByMatcherIds(historyPath, overwrittenIds);
        filterJsonlByMatcherIds(retryPath, overwrittenIds);
        result.warnings.push(`Cleared history/retry entries for ${overwrittenIds.size} overwritten automation(s)`);
    }
    return result;
}
//# sourceMappingURL=resource-bundle.js.map