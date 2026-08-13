import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * InputSettingsPage
 *
 * Input behavior settings that control how the chat input works.
 *
 * Settings:
 * - Auto Capitalisation (on/off)
 * - Spell Check (on/off)
 * - Send Message Key (Enter or ⌘+Enter)
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelHeader } from '@/components/app-shell/PanelHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HeaderMenu } from '@/components/ui/HeaderMenu';
import { routes } from '@/lib/navigate';
import { isMac } from '@/lib/platform';
import { SettingsSection, SettingsCard, SettingsToggle, SettingsMenuSelectRow, } from '@/components/settings';
import { VOICE_MODELS, DEFAULT_VOICE_MODEL, } from '@/components/app-shell/input/voice/voiceModels';
export const meta = {
    navigator: 'settings',
    slug: 'input',
};
// ============================================
// Main Component
// ============================================
export default function InputSettingsPage() {
    const { t } = useTranslation();
    // Auto-capitalisation state
    const [autoCapitalisation, setAutoCapitalisation] = useState(true);
    // Spell check state (default off)
    const [spellCheck, setSpellCheck] = useState(false);
    // Send message key state
    const [sendMessageKey, setSendMessageKey] = useState('enter');
    // Voice dictation state
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [voiceModel, setVoiceModel] = useState(DEFAULT_VOICE_MODEL);
    // Load settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            if (!window.electronAPI)
                return;
            try {
                const [autoCapEnabled, spellCheckEnabled, sendKey, vEnabled, vModel] = await Promise.all([
                    window.electronAPI.getAutoCapitalisation(),
                    window.electronAPI.getSpellCheck(),
                    window.electronAPI.getSendMessageKey(),
                    window.electronAPI.getVoiceEnabled(),
                    window.electronAPI.getVoiceModel(),
                ]);
                setAutoCapitalisation(autoCapEnabled);
                setSpellCheck(spellCheckEnabled);
                setSendMessageKey(sendKey);
                setVoiceEnabled(vEnabled);
                setVoiceModel(vModel);
            }
            catch (error) {
                console.error('Failed to load input settings:', error);
            }
        };
        loadSettings();
    }, []);
    const handleAutoCapitalisationChange = useCallback(async (enabled) => {
        setAutoCapitalisation(enabled);
        await window.electronAPI.setAutoCapitalisation(enabled);
    }, []);
    const handleSpellCheckChange = useCallback(async (enabled) => {
        setSpellCheck(enabled);
        await window.electronAPI.setSpellCheck(enabled);
    }, []);
    const handleSendMessageKeyChange = useCallback((value) => {
        const key = value;
        setSendMessageKey(key);
        window.electronAPI.setSendMessageKey(key);
    }, []);
    const handleVoiceEnabledChange = useCallback(async (enabled) => {
        // Optimistic update; revert if the IPC write fails so the UI never lies
        // about the persisted value.
        const prev = voiceEnabled;
        setVoiceEnabled(enabled);
        try {
            await window.electronAPI.setVoiceEnabled(enabled);
        }
        catch (error) {
            setVoiceEnabled(prev);
            console.error('Failed to update voice enabled:', error);
        }
    }, [voiceEnabled]);
    const handleVoiceModelChange = useCallback(async (value) => {
        const prev = voiceModel;
        setVoiceModel(value);
        try {
            await window.electronAPI.setVoiceModel(value);
        }
        catch (error) {
            setVoiceModel(prev);
            console.error('Failed to update voice model:', error);
        }
    }, [voiceModel]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsx(PanelHeader, { title: t("settings.input.title"), actions: _jsx(HeaderMenu, { route: routes.view.settings('input') }) }), _jsx("div", { className: "flex-1 min-h-0 mask-fade-y", children: _jsx(ScrollArea, { className: "h-full", children: _jsx("div", { className: "px-5 py-7 max-w-3xl mx-auto", children: _jsxs("div", { className: "space-y-8", children: [_jsx(SettingsSection, { title: t("settings.input.typing"), description: t("settings.input.typingDesc"), children: _jsxs(SettingsCard, { children: [_jsx(SettingsToggle, { label: t("settings.input.autoCapitalisation"), description: t("settings.input.autoCapitalisationDesc"), checked: autoCapitalisation, onCheckedChange: handleAutoCapitalisationChange }), _jsx(SettingsToggle, { label: t("settings.input.spellCheck"), description: t("settings.input.spellCheckDesc"), checked: spellCheck, onCheckedChange: handleSpellCheckChange })] }) }), _jsx(SettingsSection, { title: t("settings.input.sending"), description: t("settings.input.sendingDesc"), children: _jsx(SettingsCard, { children: _jsx(SettingsMenuSelectRow, { label: t("settings.input.sendMessageWith"), description: t("settings.input.sendMessageWithDesc"), value: sendMessageKey, onValueChange: handleSendMessageKeyChange, options: [
                                                { value: 'enter', label: t("settings.input.enterKey"), description: t("settings.input.enterKeyDesc") },
                                                { value: 'cmd-enter', label: isMac ? t("settings.input.cmdEnterKey") : t("settings.input.ctrlEnterKey"), description: t("settings.input.cmdEnterKeyDesc") },
                                            ] }) }) }), _jsx(SettingsSection, { title: t('settings.input.voice'), description: t('settings.input.voiceDesc'), children: _jsxs(SettingsCard, { children: [_jsx(SettingsToggle, { label: t('settings.input.voiceEnabled'), description: t('settings.input.voiceEnabledDesc'), checked: voiceEnabled, onCheckedChange: handleVoiceEnabledChange }), voiceEnabled && (_jsx(SettingsMenuSelectRow, { label: t('settings.input.voiceModel'), description: t('settings.input.voiceModelDesc'), value: voiceModel, onValueChange: handleVoiceModelChange, options: VOICE_MODELS.map((vm) => ({
                                                    value: vm.id,
                                                    label: vm.label,
                                                    description: vm.description,
                                                })) }))] }) })] }) }) }) })] }));
}
//# sourceMappingURL=InputSettingsPage.js.map