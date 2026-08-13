/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach, } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { emitAutoModeEntryNotices, useAutoAcceptIndicator, } from './useAutoAcceptIndicator.js';
import { Config, ApprovalMode } from '@qwen-code/qwen-code-core';
import { useKeypress } from './useKeypress.js';
import { MessageType } from '../types.js';
import { setLanguage, setLanguageAsync } from '../../i18n/index.js';
import { SettingScope } from '../../config/settings.js';
vi.mock('./useKeypress.js');
vi.mock('@qwen-code/qwen-code-core', async () => {
    const actualServerModule = (await vi.importActual('@qwen-code/qwen-code-core'));
    return {
        ...actualServerModule,
        Config: vi.fn(),
    };
});
function createMockSettings(autoModeAcknowledged) {
    return {
        merged: { ui: { autoModeAcknowledged } },
        setValue: vi.fn(),
    };
}
describe('useAutoAcceptIndicator', () => {
    let mockConfigInstance;
    let capturedUseKeypressHandler;
    let mockedUseKeypress;
    beforeEach(() => {
        vi.resetAllMocks();
        Config.mockImplementation(() => {
            const instanceGetApprovalModeMock = vi.fn();
            const instanceSetApprovalModeMock = vi.fn();
            const instance = {
                getApprovalMode: instanceGetApprovalModeMock,
                setApprovalMode: instanceSetApprovalModeMock,
                isTrustedFolder: vi.fn().mockReturnValue(true),
                getCoreTools: vi.fn().mockReturnValue([]),
                getToolDiscoveryCommand: vi.fn().mockReturnValue(undefined),
                getTargetDir: vi.fn().mockReturnValue('.'),
                getApiKey: vi.fn().mockReturnValue('test-api-key'),
                getModel: vi.fn().mockReturnValue('test-model'),
                getSandbox: vi.fn().mockReturnValue(false),
                getDebugMode: vi.fn().mockReturnValue(false),
                getQuestion: vi.fn().mockReturnValue(undefined),
                getFullContext: vi.fn().mockReturnValue(false),
                getUserAgent: vi.fn().mockReturnValue('test-user-agent'),
                getUserMemory: vi.fn().mockReturnValue(''),
                getGeminiMdFileCount: vi.fn().mockReturnValue(0),
                getToolRegistry: vi
                    .fn()
                    .mockReturnValue({ discoverTools: vi.fn() }),
            };
            instanceSetApprovalModeMock.mockImplementation((value) => {
                instanceGetApprovalModeMock.mockReturnValue(value);
            });
            return instance;
        });
        mockedUseKeypress = useKeypress;
        mockedUseKeypress.mockImplementation((handler, _options) => {
            capturedUseKeypressHandler = handler;
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockConfigInstance = new Config();
    });
    it('should initialize with ApprovalMode.AUTO_EDIT if config.getApprovalMode returns ApprovalMode.AUTO_EDIT', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.AUTO_EDIT);
        const { result } = renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        expect(result.current).toBe(ApprovalMode.AUTO_EDIT);
        expect(mockConfigInstance.getApprovalMode).toHaveBeenCalledTimes(1);
    });
    it('should initialize with ApprovalMode.DEFAULT if config.getApprovalMode returns ApprovalMode.DEFAULT', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const { result } = renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        expect(result.current).toBe(ApprovalMode.DEFAULT);
        expect(mockConfigInstance.getApprovalMode).toHaveBeenCalledTimes(1);
    });
    it('should initialize with ApprovalMode.YOLO if config.getApprovalMode returns ApprovalMode.YOLO', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.YOLO);
        const { result } = renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        expect(result.current).toBe(ApprovalMode.YOLO);
        expect(mockConfigInstance.getApprovalMode).toHaveBeenCalledTimes(1);
    });
    it('should initialize with ApprovalMode.PLAN if config.getApprovalMode returns ApprovalMode.PLAN', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.PLAN);
        const { result } = renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        expect(result.current).toBe(ApprovalMode.PLAN);
        expect(mockConfigInstance.getApprovalMode).toHaveBeenCalledTimes(1);
    });
    it('should cycle approval modes when Shift+Tab is pressed', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const { result } = renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        expect(result.current).toBe(ApprovalMode.DEFAULT);
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO_EDIT);
        expect(result.current).toBe(ApprovalMode.AUTO_EDIT);
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO);
        expect(result.current).toBe(ApprovalMode.AUTO);
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.YOLO);
        expect(result.current).toBe(ApprovalMode.YOLO);
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.PLAN);
        expect(result.current).toBe(ApprovalMode.PLAN);
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.DEFAULT);
        expect(result.current).toBe(ApprovalMode.DEFAULT);
    });
    it('should not cycle approval modes when Ctrl+Shift+Tab is pressed', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const { result } = renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        // Ctrl+Shift+Tab is a completion-category navigation binding (#8069); it
        // must not also cycle the approval mode in Kitty-protocol terminals that
        // report the ctrl modifier on Shift+Tab.
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: true,
                ctrl: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        expect(result.current).toBe(ApprovalMode.DEFAULT);
    });
    it('should not toggle if only one key or other keys combinations are pressed', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
        }));
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: false,
            });
        });
        if (process.platform === 'win32') {
            // On Windows, Tab alone toggles approval mode
            expect(mockConfigInstance.setApprovalMode).toHaveBeenCalled();
            mockConfigInstance.setApprovalMode.mockClear();
        }
        else {
            expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        }
        act(() => {
            capturedUseKeypressHandler({
                name: 'unknown',
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        act(() => {
            capturedUseKeypressHandler({
                name: 'a',
                shift: false,
                ctrl: false,
            });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        act(() => {
            capturedUseKeypressHandler({ name: 'y', ctrl: false });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        act(() => {
            capturedUseKeypressHandler({ name: 'a', ctrl: true });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        act(() => {
            capturedUseKeypressHandler({ name: 'y', shift: true });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        act(() => {
            capturedUseKeypressHandler({
                name: 'a',
                ctrl: true,
                shift: true,
            });
        });
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
    });
    it('should update indicator when config value changes externally (useEffect dependency)', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const { result, rerender } = renderHook((props) => useAutoAcceptIndicator(props), {
            initialProps: {
                config: mockConfigInstance,
                addItem: vi.fn(),
            },
        });
        expect(result.current).toBe(ApprovalMode.DEFAULT);
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.AUTO_EDIT);
        rerender({
            config: mockConfigInstance,
            addItem: vi.fn(),
        });
        expect(result.current).toBe(ApprovalMode.AUTO_EDIT);
        expect(mockConfigInstance.getApprovalMode).toHaveBeenCalledTimes(3);
    });
    describe('in untrusted folders', () => {
        beforeEach(() => {
            mockConfigInstance.isTrustedFolder.mockReturnValue(false);
        });
        it('should show a warning when cycling from DEFAULT to AUTO_EDIT', () => {
            const errorMessage = 'Cannot enable privileged approval modes in an untrusted folder.';
            mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
            mockConfigInstance.setApprovalMode.mockImplementation(() => {
                throw new Error(errorMessage);
            });
            const mockAddItem = vi.fn();
            renderHook(() => useAutoAcceptIndicator({
                config: mockConfigInstance,
                addItem: mockAddItem,
            }));
            act(() => {
                capturedUseKeypressHandler({ name: 'tab', shift: true });
            });
            expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO_EDIT);
            expect(mockAddItem).toHaveBeenCalledWith({
                type: MessageType.INFO,
                text: errorMessage,
            }, expect.any(Number));
        });
        it('should show a warning when cycling from AUTO_EDIT to AUTO', () => {
            const errorMessage = 'Cannot enable privileged approval modes in an untrusted folder.';
            mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.AUTO_EDIT);
            mockConfigInstance.setApprovalMode.mockImplementation(() => {
                throw new Error(errorMessage);
            });
            const mockAddItem = vi.fn();
            renderHook(() => useAutoAcceptIndicator({
                config: mockConfigInstance,
                addItem: mockAddItem,
            }));
            act(() => {
                capturedUseKeypressHandler({ name: 'tab', shift: true });
            });
            expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO);
            expect(mockAddItem).toHaveBeenCalledWith({
                type: MessageType.INFO,
                text: errorMessage,
            }, expect.any(Number));
        });
        it('should cycle from YOLO to PLAN when Shift+Tab is pressed', () => {
            mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.YOLO);
            const mockAddItem = vi.fn();
            renderHook(() => useAutoAcceptIndicator({
                config: mockConfigInstance,
                addItem: mockAddItem,
            }));
            act(() => {
                capturedUseKeypressHandler({ name: 'tab', shift: true });
            });
            expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.PLAN);
            expect(mockConfigInstance.getApprovalMode()).toBe(ApprovalMode.PLAN);
            expect(mockAddItem).not.toHaveBeenCalled();
        });
    });
    it('should call onApprovalModeChange when switching to AUTO_EDIT mode', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const mockOnApprovalModeChange = vi.fn();
        renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            onApprovalModeChange: mockOnApprovalModeChange,
        }));
        act(() => {
            capturedUseKeypressHandler({ name: 'tab', shift: true });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO_EDIT);
        expect(mockOnApprovalModeChange).toHaveBeenCalledWith(ApprovalMode.AUTO_EDIT);
    });
    it('should not call onApprovalModeChange when callback is not provided', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
        }));
        act(() => {
            capturedUseKeypressHandler({ name: 'tab', shift: true });
        });
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO_EDIT);
        // Should not throw an error when callback is not provided
    });
    it('should handle multiple mode changes correctly', () => {
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const mockOnApprovalModeChange = vi.fn();
        renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            onApprovalModeChange: mockOnApprovalModeChange,
        }));
        // Switch to AUTO_EDIT
        act(() => {
            capturedUseKeypressHandler({ name: 'tab', shift: true });
        });
        // Switch to AUTO
        act(() => {
            capturedUseKeypressHandler({ name: 'tab', shift: true });
        });
        expect(mockOnApprovalModeChange).toHaveBeenCalledTimes(2);
        expect(mockOnApprovalModeChange).toHaveBeenNthCalledWith(1, ApprovalMode.AUTO_EDIT);
        expect(mockOnApprovalModeChange).toHaveBeenNthCalledWith(2, ApprovalMode.AUTO);
    });
    it('should emit the localizable AUTO mode entry notice', async () => {
        await setLanguageAsync('en');
        const mockAddItem = vi.fn();
        emitAutoModeEntryNotices({
            config: mockConfigInstance,
            addItem: mockAddItem,
        });
        expect(mockAddItem).toHaveBeenCalledWith({
            type: MessageType.INFO,
            text: 'Auto mode enabled.\n' +
                '   An LLM classifier evaluates each tool call — safe actions auto-approve,\n' +
                '   risky ones are blocked. Exit: Shift+Tab or /approval-mode default.',
        }, expect.any(Number));
    });
    it('should fall back to readable English when the entry notice key is not loaded', async () => {
        const stderrWrite = vi
            .spyOn(process.stderr, 'write')
            .mockImplementation(() => true);
        setLanguage('ca');
        try {
            const mockAddItem = vi.fn();
            emitAutoModeEntryNotices({
                config: mockConfigInstance,
                addItem: mockAddItem,
            });
            expect(mockAddItem).toHaveBeenCalledWith({
                type: MessageType.INFO,
                text: 'Auto mode enabled.\n' +
                    '   An LLM classifier evaluates each tool call — safe actions auto-approve,\n' +
                    '   risky ones are blocked. Exit: Shift+Tab or /approval-mode default.',
            }, expect.any(Number));
        }
        finally {
            stderrWrite.mockRestore();
            await setLanguageAsync('en');
        }
    });
    it('should persist acknowledgement after emitting the AUTO mode entry notice', async () => {
        await setLanguageAsync('en');
        const mockAddItem = vi.fn();
        const mockSettings = createMockSettings(false);
        emitAutoModeEntryNotices({
            config: mockConfigInstance,
            settings: mockSettings,
            addItem: mockAddItem,
        });
        expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining({
            type: MessageType.INFO,
            text: expect.stringContaining('Auto mode enabled.'),
        }), expect.any(Number));
        expect(mockSettings.setValue).toHaveBeenCalledWith(SettingScope.User, 'ui.autoModeAcknowledged', true);
    });
    it('should skip the AUTO mode entry notice after acknowledgement', async () => {
        await setLanguageAsync('en');
        const mockAddItem = vi.fn();
        const mockSettings = createMockSettings(true);
        emitAutoModeEntryNotices({
            config: mockConfigInstance,
            settings: mockSettings,
            addItem: mockAddItem,
        });
        expect(mockAddItem).not.toHaveBeenCalledWith(expect.objectContaining({
            text: expect.stringContaining('Auto mode enabled.'),
        }), expect.any(Number));
        expect(mockSettings.setValue).not.toHaveBeenCalled();
    });
    it('should emit the AUTO mode entry notice with the active locale', async () => {
        await setLanguageAsync('zh');
        try {
            const mockAddItem = vi.fn();
            emitAutoModeEntryNotices({
                config: mockConfigInstance,
                addItem: mockAddItem,
            });
            expect(mockAddItem).toHaveBeenCalledWith({
                type: MessageType.INFO,
                text: '已启用自动模式。\n' +
                    '   LLM 分类器会评估每次工具调用 — 安全操作将自动批准，\n' +
                    '   有风险的操作将被阻止。退出：Shift+Tab 或 /approval-mode default。',
            }, expect.any(Number));
        }
        finally {
            await setLanguageAsync('en');
        }
    });
    it('should not cycle approval mode on Windows when shouldBlockTab returns true', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'win32',
        });
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const mockShouldBlockTab = vi.fn(() => true);
        renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
            shouldBlockTab: mockShouldBlockTab,
        }));
        // Simulate Tab key press on Windows
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: false,
                ctrl: false,
                meta: false,
            });
        });
        // Should call shouldBlockTab to check if autocomplete is active
        expect(mockShouldBlockTab).toHaveBeenCalled();
        // Should NOT cycle approval mode when shouldBlockTab returns true
        expect(mockConfigInstance.setApprovalMode).not.toHaveBeenCalled();
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
        });
    });
    it('should cycle approval mode on Windows when shouldBlockTab returns false', () => {
        const originalPlatform = process.platform;
        Object.defineProperty(process, 'platform', {
            value: 'win32',
        });
        mockConfigInstance.getApprovalMode.mockReturnValue(ApprovalMode.DEFAULT);
        const mockShouldBlockTab = vi.fn(() => false);
        renderHook(() => useAutoAcceptIndicator({
            config: mockConfigInstance,
            addItem: vi.fn(),
            shouldBlockTab: mockShouldBlockTab,
        }));
        // Simulate Tab key press on Windows
        act(() => {
            capturedUseKeypressHandler({
                name: 'tab',
                shift: false,
                ctrl: false,
                meta: false,
            });
        });
        // Should call shouldBlockTab to check if autocomplete is active
        expect(mockShouldBlockTab).toHaveBeenCalled();
        // Should cycle approval mode when shouldBlockTab returns false
        expect(mockConfigInstance.setApprovalMode).toHaveBeenCalledWith(ApprovalMode.AUTO_EDIT);
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
        });
    });
});
//# sourceMappingURL=useAutoAcceptIndicator.test.js.map