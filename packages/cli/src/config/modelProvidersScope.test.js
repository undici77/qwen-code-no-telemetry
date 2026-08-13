/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { SettingScope } from './settings.js';
import { getOwnKeyScope, getPersistScopeForModelSelection, getWritableScopes, } from './modelProvidersScope.js';
// A LoadedSettings stub exposing forScope()/user/workspace/isTrusted — enough
// for the scope-resolution helpers, which only read those.
function makeLoaded({ isTrusted, user = {}, workspace = {}, }) {
    return {
        isTrusted,
        user: { settings: user },
        workspace: { settings: workspace },
        forScope: (scope) => scope === SettingScope.Workspace
            ? { settings: workspace }
            : { settings: user },
    };
}
function makeSettings({ isTrusted, userModelProviders, workspaceModelProviders, }) {
    const userSettings = {};
    const workspaceSettings = {};
    // When undefined, treat as "not present in this scope" (the key is omitted),
    // matching how LoadedSettings is shaped when a settings file doesn't define it.
    if (userModelProviders !== undefined) {
        userSettings['modelProviders'] = userModelProviders;
    }
    if (workspaceModelProviders !== undefined) {
        workspaceSettings['modelProviders'] = workspaceModelProviders;
    }
    return {
        isTrusted,
        user: { settings: userSettings },
        workspace: { settings: workspaceSettings },
    };
}
describe('getPersistScopeForModelSelection', () => {
    it('prefers workspace when trusted and workspace defines modelProviders', () => {
        const settings = makeSettings({
            isTrusted: true,
            workspaceModelProviders: {},
            userModelProviders: { anything: true },
        });
        expect(getPersistScopeForModelSelection(settings)).toBe(SettingScope.Workspace);
    });
    it('falls back to user when workspace does not define modelProviders', () => {
        const settings = makeSettings({
            isTrusted: true,
            workspaceModelProviders: undefined,
            userModelProviders: {},
        });
        expect(getPersistScopeForModelSelection(settings)).toBe(SettingScope.User);
    });
    it('ignores workspace modelProviders when workspace is untrusted', () => {
        const settings = makeSettings({
            isTrusted: false,
            workspaceModelProviders: {},
            userModelProviders: undefined,
        });
        expect(getPersistScopeForModelSelection(settings)).toBe(SettingScope.User);
    });
    it('falls back to legacy trust heuristic when neither scope defines modelProviders', () => {
        const trusted = makeSettings({
            isTrusted: true,
            userModelProviders: undefined,
            workspaceModelProviders: undefined,
        });
        expect(getPersistScopeForModelSelection(trusted)).toBe(SettingScope.User);
        const untrusted = makeSettings({
            isTrusted: false,
            userModelProviders: undefined,
            workspaceModelProviders: undefined,
        });
        expect(getPersistScopeForModelSelection(untrusted)).toBe(SettingScope.User);
    });
});
describe('getWritableScopes', () => {
    it('lists workspace then user when trusted', () => {
        expect(getWritableScopes(makeLoaded({ isTrusted: true }))).toEqual([
            SettingScope.Workspace,
            SettingScope.User,
        ]);
    });
    it('lists only user when untrusted (workspace is ignored on merge)', () => {
        expect(getWritableScopes(makeLoaded({ isTrusted: false }))).toEqual([
            SettingScope.User,
        ]);
    });
});
describe('getOwnKeyScope', () => {
    it('prefers workspace when trusted and workspace owns the key', () => {
        const loaded = makeLoaded({
            isTrusted: true,
            workspace: { modelFallbacks: 'a,b' },
            user: { modelFallbacks: 'c' },
        });
        expect(getOwnKeyScope(loaded, 'modelFallbacks')).toBe(SettingScope.Workspace);
    });
    it('falls back to user when only user owns the key', () => {
        const loaded = makeLoaded({
            isTrusted: true,
            workspace: {},
            user: { modelFallbacks: 'c' },
        });
        expect(getOwnKeyScope(loaded, 'modelFallbacks')).toBe(SettingScope.User);
    });
    it('ignores a workspace-owned key when untrusted', () => {
        const loaded = makeLoaded({
            isTrusted: false,
            workspace: { modelFallbacks: 'a,b' },
            user: {},
        });
        expect(getOwnKeyScope(loaded, 'modelFallbacks')).toBeUndefined();
    });
    it('returns undefined when no writable scope owns the key', () => {
        const loaded = makeLoaded({ isTrusted: true, workspace: {}, user: {} });
        expect(getOwnKeyScope(loaded, 'modelFallbacks')).toBeUndefined();
    });
    it('treats an explicitly-set falsy value as owned (hasOwnProperty, not truthiness)', () => {
        const loaded = makeLoaded({
            isTrusted: true,
            workspace: { modelFallbacks: '' },
            user: {},
        });
        expect(getOwnKeyScope(loaded, 'modelFallbacks')).toBe(SettingScope.Workspace);
    });
});
//# sourceMappingURL=modelProvidersScope.test.js.map