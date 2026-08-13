import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { act } from 'react';
import { render } from 'ink-testing-library';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { SourcesTab } from './SourcesTab.js';
const mockUseKeypress = vi.hoisted(() => vi.fn());
const mockTextInput = vi.hoisted(() => vi.fn((_props) => null));
const mockParseInstallSource = vi.hoisted(() => vi.fn(async (source) => ({ type: 'git', source })));
vi.mock('../../../hooks/useKeypress.js', () => ({
    useKeypress: mockUseKeypress,
}));
vi.mock('../../shared/TextInput.js', () => ({ TextInput: mockTextInput }));
vi.mock('../../shared/RadioButtonSelect.js', () => ({
    RadioButtonSelect: vi.fn((_props) => null),
}));
vi.mock('@qwen-code/qwen-code-core', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, parseInstallSource: mockParseInstallSource };
});
function activeKeypress() {
    const call = mockUseKeypress.mock.calls.findLast((args) => args[1].isActive);
    return call?.[0];
}
function committedWarning() {
    return Object.assign(new Error('committed with warnings'), {
        code: 'extension_committed_with_warnings',
        committed: true,
        identity: { id: 'demo-id', name: 'demo' },
        warnings: [
            { code: 'extension_runtime_refresh_failed', error: 'refresh failed' },
        ],
    });
}
describe('SourcesTab', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('reports a committed install warning without treating it as failure', async () => {
        const manager = {
            refreshCache: vi.fn().mockResolvedValue(undefined),
            getLoadedExtensions: vi.fn(() => []),
            getSources: vi.fn(() => []),
            installExtension: vi.fn().mockRejectedValue(committedWarning()),
        };
        const config = {
            getExtensionManager: () => manager,
        };
        const statuses = [];
        const onChanged = vi.fn();
        render(_jsx(SourcesTab, { config: config, isActive: true, onLockChange: vi.fn(), onStatus: (status) => statuses.push(status), onChanged: onChanged, onBrowse: vi.fn(), onFooter: vi.fn(), reloadSignal: 0 }));
        await waitFor(() => expect(manager.refreshCache).toHaveBeenCalled());
        await act(async () => {
            activeKeypress()({ name: 'return' });
        });
        let input = mockTextInput.mock.calls.at(-1)?.[0];
        await act(async () => {
            input?.onChange('owner/demo');
        });
        input = mockTextInput.mock.calls.at(-1)?.[0];
        await act(async () => {
            input?.onSubmit();
        });
        await waitFor(() => expect(statuses).toContainEqual({
            type: 'warning',
            text: 'committed with warnings',
        }));
        expect(manager.installExtension).toHaveBeenCalledWith({
            type: 'git',
            source: 'owner/demo',
        });
        expect(onChanged).toHaveBeenCalledOnce();
        expect(manager.refreshCache).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=SourcesTab.test.js.map