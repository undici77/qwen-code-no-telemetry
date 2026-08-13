/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Daemon-local workspace skills enumeration.
 *
 * `/workspace/skills` is normally answered by the ACP child (which owns the
 * live `SkillManager`). But the child is not always available before the
 * first prompt: session creation is deferred until then, and the startup
 * preheat can time out on a slow cold start — most visibly under
 * `npm run dev`, where the child is transpiled on demand and its
 * `initialize` handshake routinely exceeds the 10s preheat budget, so no
 * channel ever comes up. In that window the child cannot list skills, which
 * drops skill-backed slash commands (e.g. `/review`) from the Web Shell's
 * pre-first-prompt autocomplete even though the skills exist on disk.
 *
 * This provider enumerates skills directly from the filesystem via
 * `SkillManager`, with no child and no MCP initialization, so the daemon can
 * answer `/workspace/skills` instantly whenever the child is unavailable.
 * `SkillManager.listSkills()` only reads a handful of `Config` getters
 * (safe/bare mode, project root, active extensions), so a lightweight config
 * shim is sufficient — no full `Config` construction (and no `initialize()`
 * side effects) required. The live child, when present, stays authoritative:
 * the facade only falls back here after a real child answer and the cached
 * last answer are both unavailable, and this daemon-local view intentionally
 * omits extension-provided skills (there is no active-extension context
 * outside the child) — those still surface once a session exists.
 */
import { SkillManager, isSafeModeEnv } from '@qwen-code/qwen-code-core';
import { STATUS_SCHEMA_VERSION } from '@qwen-code/acp-bridge/status';
import { loadSettings } from '../config/settings.js';
import { writeStderrLine } from '../utils/stdioHelpers.js';
import { mapSkillConfigToStatus } from '../runtime/workspace-skills-mapping.js';
import { resolveSkillSettings } from '../config/skill-settings.js';
const VALID_SKILL_LEVELS = new Set([
    'project',
    'user',
    'extension',
    'bundled',
]);
export function createWorkspaceSkillsStatusProvider(options = {}) {
    // Reuse one SkillManager per workspace so repeat queries hit its in-memory
    // skills cache instead of re-scanning (and re-parsing frontmatter / compiling
    // globs for) every level on each call. This is a best-effort pre-child
    // fallback, so the slight staleness — a skill added on disk mid-run is not
    // picked up until the daemon restarts — is acceptable: the live child
    // re-lists authoritatively once a session exists.
    const managers = new Map();
    const provider = ((workspaceCwd) => buildWorkspaceSkillsStatus(workspaceCwd, managers, options.workspaceTrusted ?? true));
    provider.invalidate = (workspaceCwd) => managers.delete(workspaceCwd);
    return provider;
}
async function buildWorkspaceSkillsStatus(workspaceCwd, managers, workspaceTrusted) {
    try {
        const settings = loadSettings(workspaceCwd, {
            consumeCorruptionEnvVars: false,
            skipLoadEnvironment: !workspaceTrusted,
            skipWorkspaceSettings: !workspaceTrusted,
            workspaceTrusted,
        });
        let skillManager = managers.get(workspaceCwd);
        if (!skillManager) {
            // Mirror the CLI guard in loadCliConfig: safe mode nullifies
            // disabledSkillLevels so the child session loads all bundled skills.
            const rawLevels = !workspaceTrusted || isSafeModeEnv()
                ? undefined
                : settings.merged.skills?.disabledLevels;
            const disabledLevels = new Set(Array.isArray(rawLevels)
                ? rawLevels.filter((v) => typeof v === 'string' && VALID_SKILL_LEVELS.has(v))
                : []);
            const shim = {
                // Honor the safe-mode env the same way `Config` does when no explicit
                // flag is passed, so an operator running in safe mode gets the same
                // bundled-only listing the child would produce.
                isSafeMode: () => !workspaceTrusted || isSafeModeEnv(),
                // Bare mode is the interactive `--bare` CLI flag; the daemon never runs
                // bare, so it is always off here.
                getBareMode: () => false,
                getProjectRoot: () => workspaceCwd,
                // Extension skills need active-extension context that only the child
                // has; omit them here and let the session snapshot surface them.
                getActiveExtensions: () => [],
                getDisabledSkillLevels: () => disabledLevels,
            };
            skillManager = new SkillManager(shim);
            managers.set(workspaceCwd, skillManager);
        }
        const disablements = resolveSkillSettings(settings).disablements;
        const skills = await skillManager.listSkills();
        return {
            v: STATUS_SCHEMA_VERSION,
            workspaceCwd,
            initialized: true,
            skills: skills.map((skill) => mapSkillConfigToStatus(skill, disablements)),
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        writeStderrLine(`qwen serve: daemon-local skills enumeration failed for ${workspaceCwd}: ${message}`);
        return {
            v: STATUS_SCHEMA_VERSION,
            workspaceCwd,
            initialized: false,
            skills: [],
            errors: [
                {
                    kind: 'skills',
                    status: 'error',
                    error: message,
                },
            ],
        };
    }
}
//# sourceMappingURL=workspace-skills-status.js.map