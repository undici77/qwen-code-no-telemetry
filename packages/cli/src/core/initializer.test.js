/**
 * @license
 * Copyright 2025 Qwen Code
 * SPDX-License-Identifier: Apache-2.0
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initializeApp } from './initializer.js';
const mockPerformInitialAuth = vi.fn();
const mockValidateTheme = vi.fn();
const mockInitializeI18n = vi.fn();
vi.mock('./auth.js', () => ({
    performInitialAuth: (...args) => mockPerformInitialAuth(...args),
}));
vi.mock('./theme.js', () => ({
    validateTheme: (...args) => mockValidateTheme(...args),
}));
vi.mock('../i18n/index.js', () => ({
    initializeI18n: (...args) => mockInitializeI18n(...args),
}));
const mockConnect = vi.fn();
const mockGetInstance = vi.fn().mockResolvedValue({ connect: mockConnect });
const mockLogIdeConnection = vi.fn();
vi.mock('@qwen-code/qwen-code-core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        IdeClient: { getInstance: () => mockGetInstance() },
        IdeConnectionEvent: vi.fn().mockImplementation((type) => ({ type })),
        IdeConnectionType: { START: 'start' },
        logIdeConnection: (...args) => mockLogIdeConnection(...args),
    };
});
describe('initializeApp', () => {
    let mockConfig;
    let mockSettings;
    beforeEach(() => {
        vi.clearAllMocks();
        mockConfig = {
            getModelsConfig: vi.fn().mockReturnValue({
                getCurrentAuthType: vi.fn().mockReturnValue('api_key'),
                wasAuthTypeExplicitlyProvided: vi.fn().mockReturnValue(false),
            }),
            getIdeMode: vi.fn().mockReturnValue(false),
            getGeminiMdFileCount: vi.fn().mockReturnValue(0),
        };
        mockSettings = {
            merged: { general: { language: 'en' } },
            setValue: vi.fn(),
        };
        mockPerformInitialAuth.mockResolvedValue(null);
        mockValidateTheme.mockReturnValue(null);
        mockInitializeI18n.mockResolvedValue(undefined);
    });
    it('should initialize i18n with language from settings', async () => {
        await initializeApp(mockConfig, mockSettings);
        expect(mockInitializeI18n).toHaveBeenCalledWith('en');
    });
    it('should initialize i18n with QWEN_CODE_LANG env var if set', async () => {
        vi.stubEnv('QWEN_CODE_LANG', 'zh');
        await initializeApp(mockConfig, mockSettings);
        expect(mockInitializeI18n).toHaveBeenCalledWith('zh');
        vi.unstubAllEnvs();
    });
    it('should return no errors on successful initialization', async () => {
        const result = await initializeApp(mockConfig, mockSettings);
        expect(result.authError).toBeNull();
        expect(result.themeError).toBeNull();
        expect(result.geminiMdFileCount).toBe(0);
    });
    it('should return authError when auth fails', async () => {
        mockPerformInitialAuth.mockResolvedValue('Auth failed');
        const result = await initializeApp(mockConfig, mockSettings);
        expect(result.authError).toBe('Auth failed');
        expect(result.shouldOpenAuthDialog).toBe(true);
        // initializeApp does not clear the selected auth type on failure
        expect(mockSettings.setValue).not.toHaveBeenCalled();
    });
    it('should return themeError when theme validation fails', async () => {
        mockValidateTheme.mockReturnValue('Theme not found');
        const result = await initializeApp(mockConfig, mockSettings);
        expect(result.themeError).toBe('Theme not found');
    });
    it('should set shouldOpenAuthDialog when auth was not explicitly provided', async () => {
        mockConfig
            .getModelsConfig()
            .wasAuthTypeExplicitlyProvided.mockReturnValue(false);
        const result = await initializeApp(mockConfig, mockSettings);
        expect(result.shouldOpenAuthDialog).toBe(true);
    });
    it('should set shouldOpenAuthDialog when auth error occurs', async () => {
        mockConfig
            .getModelsConfig()
            .wasAuthTypeExplicitlyProvided.mockReturnValue(true);
        mockPerformInitialAuth.mockResolvedValue('Auth failed');
        const result = await initializeApp(mockConfig, mockSettings);
        expect(result.shouldOpenAuthDialog).toBe(true);
    });
    it('should not open auth dialog when auth was explicitly provided and succeeds', async () => {
        mockConfig
            .getModelsConfig()
            .wasAuthTypeExplicitlyProvided.mockReturnValue(true);
        const result = await initializeApp(mockConfig, mockSettings);
        expect(result.shouldOpenAuthDialog).toBe(false);
    });
    it('should connect to IDE when in IDE mode', async () => {
        mockConfig.getIdeMode.mockReturnValue(true);
        await initializeApp(mockConfig, mockSettings);
        expect(mockGetInstance).toHaveBeenCalled();
        expect(mockConnect).toHaveBeenCalled();
        expect(mockLogIdeConnection).toHaveBeenCalled();
    });
    it('should not connect to IDE when not in IDE mode', async () => {
        mockConfig.getIdeMode.mockReturnValue(false);
        await initializeApp(mockConfig, mockSettings);
        expect(mockGetInstance).not.toHaveBeenCalled();
    });
    it('should default language to auto when no setting is provided', async () => {
        mockSettings.merged = {};
        await initializeApp(mockConfig, mockSettings);
        expect(mockInitializeI18n).toHaveBeenCalledWith('auto');
    });
});
//# sourceMappingURL=initializer.test.js.map