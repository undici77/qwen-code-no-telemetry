import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Command as CommandPrimitive } from 'cmdk';
// eslint-disable-next-line import/no-internal-modules
import { AnimatePresence, motion } from 'motion/react';
import { Paperclip, ArrowUp, Square, Check, ChevronDown, AlertCircle, CornerDownRight, GitBranch, X, } from 'lucide-react';
import { Icon_Home, Icon_Folder } from '@craft-agent/ui';
import { useDirectoryPicker } from '@/hooks/useDirectoryPicker';
import { ServerDirectoryBrowser } from '@/components/ServerDirectoryBrowser';
import { Button } from '@/components/ui/button';
import { InlineSlashCommand, useInlineSlashCommand, } from '@/components/ui/slash-command-menu';
import { InlineMentionMenu, useInlineMention, } from '@/components/ui/mention-menu';
import { InlineLabelMenu, useInlineLabelMenu, } from '@/components/ui/label-menu';
import { parseMentions } from '@/lib/mentions';
import { RichTextInput, } from '@/components/ui/rich-text-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui';
import { DropdownMenu, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { StyledDropdownMenuContent, StyledDropdownMenuItem, } from '@/components/ui/styled-dropdown';
import { Popover, PopoverTrigger, PopoverContent, } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useVoiceDictation } from './voice/useVoiceDictation';
import { VoiceMicControl } from './voice/VoiceMicControl';
import { VoiceRecordingBar } from './voice/VoiceRecordingBar';
import { VOICE_MODELS, DEFAULT_VOICE_MODEL } from './voice/voiceModels';
import { coerceInputText } from '@/lib/input-text';
import { getNextPermissionMode } from '@/lib/permission-mode-cycle';
import { isMac, PATH_SEP, getPathBasename } from '@/lib/platform';
import { applySmartTypography } from '@/lib/smart-typography';
import { AttachmentPreview } from '../AttachmentPreview';
import { QWEN_MODELS, getModelShortName, getModelDisplayName, getModelContextWindow, } from '@config/models';
import { resolveEffectiveConnectionSlug } from '@config/llm-connections';
import { useOptionalAppShellContext } from '@/context/AppShellContext';
import { EditPopover, getEditConfig } from '@/components/ui/EditPopover';
import { FreeFormInputContextBadge } from './FreeFormInputContextBadge';
import { PERMISSION_MODE_ORDER, } from '@craft-agent/shared/agent/modes';
import {} from '@craft-agent/shared/agent/thinking-levels';
import { useEscapeInterrupt } from '@/context/EscapeInterruptContext';
import { hasOpenOverlay } from '@/lib/overlay-detection';
import { ToolbarStatusSlot } from './ToolbarStatusSlot';
import { buildPlanApprovalMessage } from '../plan-approval-message';
import { shouldHandleScopedInputEvent } from './input-event-guards';
import { clearPendingFocusForSession, consumePendingFocusForSession, } from './focus-input-events';
import { getRecentWorkingDirs, addRecentWorkingDir, removeRecentWorkingDir, } from './working-directory-history';
import { CompactPermissionModeSelector } from './CompactPermissionModeSelector';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
import { inferFileAttachmentMetadata } from './file-attachment-metadata';
import { sortFilesForAttachmentInput } from './file-attachment-order';
/**
 * Format token count for display (e.g., 1500 -> "1.5k", 200000 -> "200k")
 */
function formatTokenCount(tokens) {
    if (tokens >= 1000000) {
        return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`;
    }
    return tokens.toString();
}
function clampUsagePercent(percent) {
    return Math.max(0, Math.min(100, percent));
}
function formatUsagePercent(percent) {
    return Number.isInteger(percent) ? percent.toString() : percent.toFixed(1);
}
function getModelContextWindowFromList(models, modelId) {
    const model = models?.find((item) => typeof item !== 'string' && item.id === modelId);
    return typeof model === 'string' ? undefined : model?.contextWindow;
}
function formatFollowUpChipText(text, fallback, maxLength = 50) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized)
        return fallback;
    return normalized.length > maxLength
        ? `${normalized.slice(0, maxLength - 1).trimEnd()}…`
        : normalized;
}
function logInputError(message, error) {
    if (typeof window === 'undefined')
        return;
    window.electronAPI?.debugLog?.(message, error);
}
function ContextUsageIndicator({ usedTokens, totalTokens, isCompacting = false, usagePercent, usedDisplay, totalDisplay, }) {
    const { t } = useTranslation();
    const percent = usagePercent != null
        ? clampUsagePercent(usagePercent)
        : totalTokens && totalTokens > 0
            ? clampUsagePercent(Math.round((usedTokens / totalTokens) * 100))
            : null;
    const ringPercent = percent ?? 0;
    const percentDisplay = percent !== null ? formatUsagePercent(percent) : null;
    const usedLabel = usedDisplay ?? formatTokenCount(usedTokens);
    const totalLabel = totalDisplay ??
        (totalTokens ? formatTokenCount(totalTokens) : t('common.unknown'));
    const percentLabel = percent !== null
        ? t('chat.contextUsage.percentUsed', { percent: percentDisplay })
        : t('chat.contextUsage.percentUnknown');
    const ariaLabel = percent !== null
        ? t('chat.contextUsage.ariaLabel', {
            percent: percentDisplay,
            used: usedLabel,
            total: totalLabel,
        })
        : t('chat.contextUsage.ariaLabelUnknown', {
            used: usedLabel,
            total: totalLabel,
        });
    const toneClass = percent === null
        ? 'text-foreground/45'
        : percent >= 95
            ? 'text-destructive'
            : percent >= 80
                ? 'text-info'
                : 'text-foreground/60';
    return (_jsxs(Tooltip, { delayDuration: 150, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { role: "meter", tabIndex: 0, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percent ?? undefined, "aria-label": ariaLabel, className: cn('mr-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-foreground/60 outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-1 focus-visible:ring-ring', toneClass), children: _jsxs("svg", { className: "h-[18px] w-[18px]", viewBox: "0 0 18 18", "aria-hidden": "true", children: [_jsx("circle", { cx: "9", cy: "9", r: "6.5", fill: "none", strokeWidth: "3", className: "stroke-foreground/15" }), _jsx("circle", { cx: "9", cy: "9", r: "6.5", fill: "none", pathLength: "100", strokeWidth: "3", strokeLinecap: "round", strokeDasharray: `${ringPercent} 100`, className: cn('origin-center -rotate-90 stroke-current transition-all duration-300', isCompacting && 'animate-pulse') })] }) }) }), _jsxs(TooltipContent, { side: "top", sideOffset: 8, className: "w-[240px] px-4 py-3 text-center", children: [_jsx("div", { className: "text-[13px] font-semibold text-muted-foreground", children: t('chat.contextUsage.title') }), _jsx("div", { className: "mt-1 text-[13px] font-semibold text-foreground", children: percentLabel }), _jsx("div", { className: "mt-3 text-[13px] font-semibold text-foreground", children: t('chat.contextUsage.usedOfTotal', {
                            used: usedLabel,
                            total: totalLabel,
                        }) }), _jsx("div", { className: "mt-3 text-[12px] font-medium text-muted-foreground", children: isCompacting
                            ? t('chat.contextUsage.compacting')
                            : t('chat.contextUsage.autoCompact') })] })] }));
}
/** Platform-specific modifier key for keyboard shortcuts */
const cmdKey = isMac ? '⌘' : 'Ctrl';
const EMPTY_AVAILABLE_COMMANDS = [];
const EMPTY_AVAILABLE_SKILLS = [];
/** Default rotating placeholders are now generated inside FreeFormInput via useMemo + t() */
/** Fisher-Yates shuffle — returns a new array in random order */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
/**
 * FreeFormInput - Self-contained textarea input with attachments and controls
 *
 * Features:
 * - Auto-growing textarea
 * - File attachments via button or drag-drop
 * - Slash commands menu
 * - Model selector
 * - Active option badges
 */
export function FreeFormInput({ placeholder, disabled = false, isProcessing = false, onSubmit, onStop, inputRef: externalInputRef, currentModel, onModelChange, thinkingLevel = 'medium', permissionMode = 'ask', onPermissionModeChange, enabledModes = [...PERMISSION_MODE_ORDER], inputValue, onInputChange, queuedInputMessages = [], attachmentsValue, onAttachmentsChange, unstyled = false, onHeightChange, onFocusChange, sources = [], enabledSourceSlugs = [], onSourcesChange, skills = [], labels = [], sessionLabels = [], onLabelAdd, workspaceId, workingDirectory, onWorkingDirectoryChange, sessionFolderPath, sessionId, currentSessionStatus, disableSend = false, isEmptySession = false, contextStatus, followUpItems = [], onFollowUpClick, onFollowUpIndexClick, compactMode = false, currentConnection, connectionUnavailable = false, availableCommands, availableSkills, }) {
    const { t } = useTranslation();
    const showSessionLabelsUi = FEATURE_FLAGS.sessionLabelsUi;
    const visibleLabels = showSessionLabelsUi ? labels : [];
    const visibleSessionLabels = showSessionLabelsUi ? sessionLabels : [];
    const onSubmitRef = React.useRef(onSubmit);
    onSubmitRef.current = onSubmit;
    // Default rotating placeholders for onboarding/empty state (i18n-aware)
    const defaultPlaceholders = React.useMemo(() => {
        const placeholders = [
            t('chatInput.placeholder.workOn'),
            t('chatInput.placeholder.shiftTab'),
            t('chatInput.placeholder.mention'),
        ];
        if (showSessionLabelsUi) {
            placeholders.push(t('chatInput.placeholder.labels'));
        }
        placeholders.push(t('chatInput.placeholder.newLine'), t('chatInput.placeholder.sidebar', { key: cmdKey }), t('chatInput.placeholder.focusMode', { key: cmdKey }));
        return placeholders;
    }, [showSessionLabelsUi, t]);
    const effectivePlaceholderProp = placeholder ?? defaultPlaceholders;
    // Read Qwen Code model metadata from context.
    // Uses optional variant so playground (no provider) doesn't crash.
    const appShellCtx = useOptionalAppShellContext();
    const llmConnections = React.useMemo(() => appShellCtx?.llmConnections ?? [], [appShellCtx?.llmConnections]);
    const qwenConnection = React.useMemo(() => llmConnections.find((c) => c.providerType === 'qwen') ??
        llmConnections[0], [llmConnections]);
    const effectiveConnectionSlug = React.useMemo(() => resolveEffectiveConnectionSlug(currentConnection, appShellCtx?.workspaceDefaultLlmConnection, llmConnections), [
        appShellCtx?.workspaceDefaultLlmConnection,
        currentConnection,
        llmConnections,
    ]);
    const currentLlmConnection = React.useMemo(() => {
        if (effectiveConnectionSlug) {
            return (llmConnections.find((c) => c.slug === effectiveConnectionSlug) ?? null);
        }
        return qwenConnection ?? null;
    }, [effectiveConnectionSlug, llmConnections, qwenConnection]);
    const [refreshedAvailableCommands, setRefreshedAvailableCommands] = React.useState(EMPTY_AVAILABLE_COMMANDS);
    const [refreshedAvailableSkills, setRefreshedAvailableSkills] = React.useState(EMPTY_AVAILABLE_SKILLS);
    const effectiveAvailableCommands = availableCommands !== undefined
        ? availableCommands
        : refreshedAvailableCommands;
    const effectiveAvailableSkills = availableSkills !== undefined ? availableSkills : refreshedAvailableSkills;
    const hasProvidedQwenCapabilities = availableCommands !== undefined || availableSkills !== undefined;
    const useQwenAcpSkillMentions = !connectionUnavailable &&
        (currentLlmConnection?.providerType === 'qwen' ||
            effectiveAvailableSkills.length > 0);
    const disabledMentionSkillSlugs = React.useMemo(() => new Set(skills
        .filter((skill) => skill.enabled === false)
        .map((skill) => skill.slug.toLowerCase())), [skills]);
    const qwenAcpMentionSkills = React.useMemo(() => effectiveAvailableSkills
        .filter((skillName) => !disabledMentionSkillSlugs.has(skillName.toLowerCase()))
        .map((skillName) => ({
        slug: skillName,
        metadata: {
            name: skillName,
            description: '',
        },
        content: '',
        path: '',
        source: 'provider',
    })), [disabledMentionSkillSlugs, effectiveAvailableSkills]);
    const enabledMentionSkills = React.useMemo(() => skills.filter((skill) => skill.enabled !== false), [skills]);
    const mentionSkills = useQwenAcpSkillMentions
        ? qwenAcpMentionSkills
        : enabledMentionSkills;
    const enableQwenSlashCommands = !connectionUnavailable &&
        (currentLlmConnection?.providerType === 'qwen' ||
            effectiveAvailableCommands.length > 0 ||
            effectiveAvailableSkills.length > 0);
    // Compute available models from Qwen Code. In the real app this list is
    // populated from ACP session/new models.availableModels; playground keeps
    // the Qwen seed list so local component demos remain useful.
    const availableModels = React.useMemo(() => {
        if (connectionUnavailable)
            return [];
        if (!appShellCtx)
            return QWEN_MODELS;
        return qwenConnection?.models ?? [];
    }, [appShellCtx, qwenConnection, connectionUnavailable]);
    // Get display name for current model (full name, not short name)
    const currentModelDisplayName = React.useMemo(() => {
        const model = availableModels.find((m) => typeof m === 'string' ? m === currentModel : m.id === currentModel);
        if (!model) {
            if (!currentModel)
                return t('common.model');
            // Fallback: use helper function to format unknown model IDs nicely
            return getModelDisplayName(currentModel);
        }
        return typeof model === 'string' ? model : model.name;
    }, [availableModels, currentModel, t]);
    const currentModelContextWindow = React.useMemo(() => {
        if (contextStatus?.contextWindow && contextStatus.contextWindow > 0) {
            return contextStatus.contextWindow;
        }
        return (getModelContextWindowFromList(currentLlmConnection?.models, currentModel) ??
            getModelContextWindowFromList(availableModels, currentModel) ??
            getModelContextWindow(currentModel));
    }, [
        availableModels,
        contextStatus?.contextWindow,
        currentLlmConnection?.models,
        currentModel,
    ]);
    const contextUsageIndicator = React.useMemo(() => {
        if (isEmptySession)
            return null;
        const usedTokens = Math.max(0, contextStatus?.inputTokens ?? 0);
        if (!currentModelContextWindow && usedTokens === 0)
            return null;
        return {
            usedTokens,
            totalTokens: currentModelContextWindow,
            isCompacting: contextStatus?.isCompacting,
            usagePercent: contextStatus?.usagePercent,
            usedDisplay: contextStatus?.inputTokensDisplay,
            totalDisplay: contextStatus?.contextWindowDisplay,
        };
    }, [
        contextStatus?.inputTokens,
        contextStatus?.isCompacting,
        contextStatus?.usagePercent,
        contextStatus?.inputTokensDisplay,
        contextStatus?.contextWindowDisplay,
        currentModelContextWindow,
        isEmptySession,
    ]);
    // Access sessionStatuses and onSessionStatusChange from context for the # menu state picker
    const sessionStatuses = appShellCtx?.sessionStatuses ?? [];
    const onSessionStatusChange = appShellCtx?.onSessionStatusChange;
    // Resolve workspace rootPath for "Add New Label" deep link
    const workspaceRootPath = React.useMemo(() => {
        if (!appShellCtx || !workspaceId)
            return null;
        return (appShellCtx.workspaces.find((w) => w.id === workspaceId)?.rootPath ?? null);
    }, [appShellCtx, workspaceId]);
    // Workspace slug for SDK skill qualification (server-computed)
    // SDK expects "workspaceSlug:skillSlug" format, NOT UUID
    const workspaceSlug = React.useMemo(() => {
        if (!appShellCtx || !workspaceId)
            return workspaceId;
        return (appShellCtx.workspaces.find((w) => w.id === workspaceId)?.slug ??
            workspaceId);
    }, [appShellCtx, workspaceId]);
    // Read panel focus state from context (for multi-panel unfocused styling)
    const appShellContext = useOptionalAppShellContext();
    const isFocusedPanel = appShellContext?.isFocusedPanel ?? true;
    const [isInputFocused, setIsInputFocused] = React.useState(false);
    // Shuffle placeholder order when the source text changes so draft/new-session
    // screens do not stay stuck with an initial empty value.
    // In compact mode, suppress desktop-keyboard guidance that is noisy or misleading
    // on narrow/mobile-like layouts.
    const placeholderOptions = React.useMemo(() => {
        if (!Array.isArray(effectivePlaceholderProp)) {
            return effectivePlaceholderProp;
        }
        const nonEmptyOptions = effectivePlaceholderProp.filter((entry) => entry.trim().length > 0);
        if (!compactMode)
            return nonEmptyOptions;
        const compactOptions = nonEmptyOptions.filter((entry) => {
            const lower = entry.toLowerCase();
            return (!lower.includes('shift + tab') &&
                !lower.includes('shift + return') &&
                !lower.includes('toggle the sidebar') &&
                !lower.includes('focus mode') &&
                !lower.includes('⌘') &&
                !lower.includes('ctrl'));
        });
        return compactOptions.length > 0 ? compactOptions : nonEmptyOptions;
    }, [effectivePlaceholderProp, compactMode]);
    // Hide placeholder entirely when panel is unfocused in multi-panel layout,
    // unless the input itself has DOM focus. The draft composer can receive focus
    // before panel focus state catches up.
    const shuffledPlaceholder = React.useMemo(() => Array.isArray(placeholderOptions)
        ? shuffleArray(placeholderOptions)
        : placeholderOptions, [placeholderOptions]);
    const effectivePlaceholder = isFocusedPanel || isInputFocused ? shuffledPlaceholder : '';
    // Performance optimization: Always use internal state for typing to avoid parent re-renders
    // Sync FROM parent on mount/change (for restoring drafts)
    // Sync TO parent on blur/submit (debounced persistence)
    const [input, setInput] = React.useState(() => coerceInputText(inputValue));
    const [attachments, setAttachments] = React.useState(attachmentsValue ?? []);
    // Ref to track current attachments for use in event handlers (avoids stale closure issues)
    const attachmentsRef = React.useRef([]);
    React.useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);
    // Seed from parent when `attachmentsValue` changes (e.g., switching sessions).
    // `skipPersistRef` tells the save effect below that the next `attachments` change
    // is a prop-driven seed, not user intent — otherwise we'd echo the seed back to
    // the parent and risk persisting A's attachments under B's sessionId.
    const attachmentsRefsKey = React.useMemo(() => {
        if (!attachmentsValue)
            return '';
        return attachmentsValue.map((a) => a.path).join('|');
    }, [attachmentsValue]);
    const prevAttachmentsRefsKey = React.useRef(attachmentsRefsKey);
    const skipPersistRef = React.useRef(true); // treat initial mount as a prop-seed
    React.useEffect(() => {
        if (attachmentsValue === undefined)
            return;
        if (attachmentsRefsKey === prevAttachmentsRefsKey.current)
            return;
        prevAttachmentsRefsKey.current = attachmentsRefsKey;
        skipPersistRef.current = true;
        setAttachments(attachmentsValue);
    }, [attachmentsValue, attachmentsRefsKey]);
    // Persist user-initiated attachment changes back to the parent. The parent stores
    // refs (path + name) and debounces the disk write, so we fire eagerly on every
    // change — add/remove/send-clear.
    const onAttachmentsChangeRef = React.useRef(onAttachmentsChange);
    onAttachmentsChangeRef.current = onAttachmentsChange;
    React.useEffect(() => {
        if (skipPersistRef.current) {
            skipPersistRef.current = false;
            return;
        }
        onAttachmentsChangeRef.current?.(attachments);
    }, [attachments]);
    // Optimistic state for source selection - updates UI immediately before IPC round-trip completes
    const [optimisticSourceSlugs, setOptimisticSourceSlugs] = React.useState(enabledSourceSlugs);
    // Sync from prop when server state changes (reconciles after IPC or on external updates)
    // Use content comparison (not reference) to avoid infinite loops with empty arrays
    const prevEnabledSourceSlugsRef = React.useRef(enabledSourceSlugs);
    React.useEffect(() => {
        const prev = prevEnabledSourceSlugsRef.current;
        const changed = enabledSourceSlugs.length !== prev.length ||
            enabledSourceSlugs.some((slug, i) => slug !== prev[i]);
        if (changed) {
            setOptimisticSourceSlugs(enabledSourceSlugs);
            prevEnabledSourceSlugsRef.current = enabledSourceSlugs;
        }
    }, [enabledSourceSlugs]);
    // Sync from parent when inputValue changes externally (e.g., switching sessions)
    const prevInputValueRef = React.useRef(coerceInputText(inputValue));
    React.useEffect(() => {
        if (inputValue === undefined)
            return;
        const nextInputValue = coerceInputText(inputValue);
        if (nextInputValue !== prevInputValueRef.current) {
            setInput(nextInputValue);
            prevInputValueRef.current = nextInputValue;
        }
    }, [inputValue]);
    // Debounced sync to parent (saves draft without blocking typing)
    const syncTimeoutRef = React.useRef(null);
    const syncToParent = React.useCallback((value) => {
        if (!onInputChange)
            return;
        if (syncTimeoutRef.current)
            clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = setTimeout(() => {
            onInputChange(value);
            prevInputValueRef.current = value;
        }, 300); // Debounce 300ms
    }, [onInputChange]);
    // Sync immediately on unmount to preserve input across mode switches
    // Also cleanup any pending debounced sync
    const inputRef = React.useRef(input);
    inputRef.current = input; // Keep ref in sync with state
    React.useEffect(() => () => {
        // Cancel pending debounced sync
        if (syncTimeoutRef.current)
            clearTimeout(syncTimeoutRef.current);
        // Immediately sync current value to parent on unmount
        // This preserves input when switching to structured input (e.g., permission request)
        if (onInputChange && inputRef.current !== prevInputValueRef.current) {
            onInputChange(inputRef.current);
        }
    }, [onInputChange]);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);
    const [loadingCount, setLoadingCount] = React.useState(0);
    const [inputMaxHeight, setInputMaxHeight] = React.useState(540);
    const [modelDropdownOpen, setModelDropdownOpen] = React.useState(false);
    // Input settings (loaded from config)
    const [autoCapitalisation, setAutoCapitalisation] = React.useState(true);
    const [sendMessageKey, setSendMessageKey] = React.useState('enter');
    const [spellCheck, setSpellCheck] = React.useState(false);
    const [voiceModel, setVoiceModel] = React.useState(DEFAULT_VOICE_MODEL);
    const [voiceEnabled, setVoiceEnabled] = React.useState(true);
    const voiceActiveRef = React.useRef(false);
    // Load input settings on mount
    React.useEffect(() => {
        const loadInputSettings = async () => {
            if (!window.electronAPI)
                return;
            try {
                const [autoCapEnabled, sendKey, spellCheckEnabled, voiceModelId, voiceOn] = await Promise.all([
                    window.electronAPI.getAutoCapitalisation(),
                    window.electronAPI.getSendMessageKey(),
                    window.electronAPI.getSpellCheck(),
                    window.electronAPI.getVoiceModel(),
                    window.electronAPI.getVoiceEnabled(),
                ]);
                setAutoCapitalisation(autoCapEnabled);
                setSendMessageKey(sendKey ?? 'enter');
                setSpellCheck(spellCheckEnabled);
                setVoiceModel(voiceModelId ?? DEFAULT_VOICE_MODEL);
                setVoiceEnabled(voiceOn);
            }
            catch (error) {
                logInputError('Failed to load input settings:', error);
            }
        };
        loadInputSettings();
    }, []);
    // Persist the selected voice (ASR) model; the voice server reads it per
    // recording. Optimistic update, but roll back if the IPC write fails so the
    // dropdown never diverges from the persisted model the server actually uses.
    const handleVoiceModelChange = React.useCallback(async (modelId) => {
        const prev = voiceModel;
        setVoiceModel(modelId);
        try {
            await window.electronAPI?.setVoiceModel?.(modelId);
        }
        catch (error) {
            setVoiceModel(prev);
            logInputError('Failed to update voice model:', error);
        }
    }, [voiceModel]);
    // Double-Esc interrupt: show warning overlay on first Esc, interrupt on second
    const { showEscapeOverlay } = useEscapeInterrupt();
    // Calculate max height: min(66% of window height, 540px)
    React.useEffect(() => {
        const updateMaxHeight = () => {
            const maxFromWindow = Math.floor(window.innerHeight * 0.66);
            setInputMaxHeight(Math.min(maxFromWindow, 540));
        };
        updateMaxHeight();
        window.addEventListener('resize', updateMaxHeight);
        return () => window.removeEventListener('resize', updateMaxHeight);
    }, []);
    const dragCounterRef = React.useRef(0);
    const containerRef = React.useRef(null);
    const fileInputRef = React.useRef(null);
    // Merge refs for RichTextInput
    const internalInputRef = React.useRef(null);
    const richInputRef = externalInputRef || internalInputRef;
    // Track last caret position for focus restoration (e.g., after permission mode popover closes)
    const lastCaretPositionRef = React.useRef(null);
    // Listen for craft:insert-text events (generic mechanism for inserting text into input)
    // Used by components that want to pre-fill the input with text
    React.useEffect(() => {
        const handleInsertText = (e) => {
            const targetSessionId = e.detail?.sessionId;
            if (!shouldHandleScopedInputEvent({
                sessionId,
                isFocusedPanel,
                targetSessionId,
            }))
                return;
            const text = coerceInputText(e.detail?.text);
            setInput(text);
            syncToParent(text);
            // Focus the input after inserting
            setTimeout(() => {
                richInputRef.current?.focus();
                // Move cursor to end
                richInputRef.current?.setSelectionRange(text.length, text.length);
            }, 0);
        };
        window.addEventListener('craft:insert-text', handleInsertText);
        return () => window.removeEventListener('craft:insert-text', handleInsertText);
    }, [sessionId, isFocusedPanel, syncToParent, richInputRef]);
    const clearInputDraft = React.useCallback(() => {
        setInput('');
        if (syncTimeoutRef.current)
            clearTimeout(syncTimeoutRef.current);
        onInputChange?.('');
        prevInputValueRef.current = '';
    }, [onInputChange]);
    const consumeInputDraftSnapshot = React.useCallback(() => {
        const snapshot = input.trim();
        clearInputDraft();
        return snapshot;
    }, [input, clearInputDraft]);
    // Listen for craft:approve-plan events (used by ResponseCard's Accept Plan button)
    // This disables safe mode AND submits the message in one action
    // Only process events for this session (sessionId must match)
    React.useEffect(() => {
        const handleApprovePlan = (e) => {
            // Only handle if this event is for our session
            if (e.detail?.sessionId && e.detail.sessionId !== sessionId) {
                return;
            }
            const shouldIncludeDraft = e.detail?.includeDraftInput !== false;
            const draftInput = shouldIncludeDraft ? consumeInputDraftSnapshot() : '';
            const text = buildPlanApprovalMessage({
                planPath: e.detail?.planPath,
                draftInput,
            });
            // Switch to YOLO mode if in Plan mode (allow execution without prompts)
            // Only switch if currently in safe mode - if user is in 'ask' mode, respect their choice
            if (permissionMode === 'safe') {
                onPermissionModeChange?.('allow-all');
            }
            onSubmit(text, undefined);
        };
        window.addEventListener('craft:approve-plan', handleApprovePlan);
        return () => window.removeEventListener('craft:approve-plan', handleApprovePlan);
    }, [
        sessionId,
        permissionMode,
        onPermissionModeChange,
        onSubmit,
        consumeInputDraftSnapshot,
    ]);
    // Listen for craft:approve-plan-with-compact events (Accept & Compact option)
    // This compacts the conversation first, then executes the plan.
    // The pending state is persisted to survive page reloads (CMD+R).
    React.useEffect(() => {
        const handleApprovePlanWithCompact = async (e) => {
            // Only handle if this event is for our session
            if (e.detail?.sessionId && e.detail.sessionId !== sessionId) {
                return;
            }
            const planPath = e.detail?.planPath;
            const shouldIncludeDraft = e.detail?.includeDraftInput !== false;
            const draftInputSnapshot = shouldIncludeDraft
                ? consumeInputDraftSnapshot()
                : '';
            // Switch to YOLO mode if in Plan mode
            if (permissionMode === 'safe') {
                onPermissionModeChange?.('allow-all');
            }
            // Persist the pending plan execution state BEFORE sending /compact.
            // This allows reload recovery if CMD+R happens during compaction.
            if (sessionId) {
                await window.electronAPI.sessionCommand(sessionId, {
                    type: 'setPendingPlanExecution',
                    planPath: planPath ?? '',
                    draftInputSnapshot,
                });
            }
            // Send /compact to trigger compaction
            onSubmit('/compact', undefined);
            // Set up a one-time listener for compaction complete.
            // This handles the normal case (no reload during compaction).
            const handleCompactionComplete = async (compactEvent) => {
                // Only handle if this is for our session
                if (compactEvent.detail?.sessionId !== sessionId) {
                    return;
                }
                // Remove the listener (one-time use)
                window.removeEventListener('craft:compaction-complete', handleCompactionComplete);
                const executionMessage = buildPlanApprovalMessage({
                    planPath,
                    draftInput: draftInputSnapshot,
                });
                onSubmit(executionMessage, undefined);
                // Clear the pending state since we just sent the execution message
                if (sessionId) {
                    await window.electronAPI.sessionCommand(sessionId, {
                        type: 'clearPendingPlanExecution',
                    });
                }
            };
            window.addEventListener('craft:compaction-complete', handleCompactionComplete);
        };
        window.addEventListener('craft:approve-plan-with-compact', handleApprovePlanWithCompact);
        return () => window.removeEventListener('craft:approve-plan-with-compact', handleApprovePlanWithCompact);
    }, [
        sessionId,
        permissionMode,
        onPermissionModeChange,
        onSubmit,
        consumeInputDraftSnapshot,
    ]);
    // Reload recovery: Check for pending plan execution on mount.
    // If the page reloaded after compaction completed (awaitingCompaction = false),
    // we need to send the plan execution message that was interrupted by the reload.
    // Also listen for compaction-complete in case CMD+R happened during compaction.
    React.useEffect(() => {
        if (!sessionId)
            return;
        let hasExecuted = false;
        const isExpectedReconnectError = (error) => {
            const message = error instanceof Error ? error.message : String(error);
            return (message.includes('Connection closed') ||
                message.includes('Client disconnected') ||
                message.includes('transport') ||
                message.includes('socket'));
        };
        const executePendingPlan = async () => {
            if (hasExecuted)
                return;
            try {
                const pending = await window.electronAPI.getPendingPlanExecution(sessionId);
                if (!pending ||
                    pending.awaitingCompaction ||
                    pending.executionDispatched)
                    return;
                // Mark dispatched before sending so reload recovery does not double-submit
                // the same plan if onSubmit succeeds but cleanup fails during a reconnect.
                await window.electronAPI.sessionCommand(sessionId, {
                    type: 'markPendingPlanExecutionDispatched',
                });
                // Compaction completed but we never sent the execution message (page reloaded).
                // Send it now and clear the pending state.
                hasExecuted = true;
                const executionMessage = buildPlanApprovalMessage({
                    planPath: pending.planPath,
                    draftInput: pending.draftInputSnapshot,
                });
                onSubmitRef.current(executionMessage, undefined);
                await window.electronAPI.sessionCommand(sessionId, {
                    type: 'clearPendingPlanExecution',
                });
            }
            catch (error) {
                if (!isExpectedReconnectError(error)) {
                    logInputError('[FreeFormInput] Failed to resume pending plan execution:', error);
                }
            }
        };
        // Check immediately on mount (handles case where compaction already completed)
        executePendingPlan();
        // Also listen for compaction-complete in case CMD+R happened during compaction.
        // When compaction finishes after reload, this listener will trigger execution.
        const handleCompactionComplete = async (e) => {
            if (e.detail?.sessionId !== sessionId)
                return;
            // Small delay to ensure markCompactionComplete has been called
            await new Promise((resolve) => setTimeout(resolve, 100));
            executePendingPlan();
        };
        window.addEventListener('craft:compaction-complete', handleCompactionComplete);
        return () => {
            window.removeEventListener('craft:compaction-complete', handleCompactionComplete);
        };
    }, [sessionId]);
    // Listen for craft:focus-input events (restore focus after popover/dropdown closes)
    React.useEffect(() => {
        const handleFocusInput = (e) => {
            const detail = e.detail;
            const targetSessionId = detail?.sessionId;
            if (!shouldHandleScopedInputEvent({
                sessionId,
                isFocusedPanel,
                targetSessionId,
            }))
                return;
            if (targetSessionId) {
                clearPendingFocusForSession(targetSessionId);
            }
            richInputRef.current?.focus();
            // Restore caret position if saved, then clear it (one-shot)
            if (lastCaretPositionRef.current !== null) {
                richInputRef.current?.setSelectionRange(lastCaretPositionRef.current, lastCaretPositionRef.current);
                lastCaretPositionRef.current = null;
            }
        };
        window.addEventListener('craft:focus-input', handleFocusInput);
        return () => window.removeEventListener('craft:focus-input', handleFocusInput);
    }, [sessionId, isFocusedPanel, richInputRef]);
    // Recover queued focus requests after session switch/mount races.
    React.useEffect(() => {
        if (!consumePendingFocusForSession(sessionId))
            return;
        setTimeout(() => {
            richInputRef.current?.focus();
        }, 0);
    }, [sessionId, richInputRef]);
    // Get the next available number for a pasted file prefix (e.g., pasted-image-1, pasted-image-2)
    const getNextPastedNumber = (prefix, existingAttachments) => {
        const pattern = new RegExp(`^pasted-${prefix}-(\\d+)\\.`);
        let maxNum = 0;
        for (const att of existingAttachments) {
            const match = att.name.match(pattern);
            if (match) {
                maxNum = Math.max(maxNum, parseInt(match[1], 10));
            }
        }
        return maxNum + 1;
    };
    // Listen for craft:paste-files events (for global paste when input not focused)
    React.useEffect(() => {
        const handlePasteFiles = async (e) => {
            if (disabled)
                return;
            const targetSessionId = e.detail?.sessionId;
            if (!shouldHandleScopedInputEvent({
                sessionId,
                isFocusedPanel,
                targetSessionId,
            }))
                return;
            const files = sortFilesForAttachmentInput(e.detail.files ?? []);
            if (files.length === 0)
                return;
            setLoadingCount((prev) => prev + files.length);
            // Pre-assign sequential names using ref to avoid race conditions
            let nextImageNum = getNextPastedNumber('image', attachmentsRef.current);
            const fileNames = files.map((file) => {
                if (!file.name ||
                    file.name === 'image.png' ||
                    file.name === 'image.jpg' ||
                    file.name === 'blob') {
                    const ext = file.type.split('/')[1] || 'png';
                    return `pasted-image-${nextImageNum++}.${ext}`;
                }
                return file.name;
            });
            for (let i = 0; i < files.length; i++) {
                try {
                    const attachment = await readFileAsAttachment(files[i], fileNames[i]);
                    if (attachment) {
                        setAttachments((prev) => [...prev, attachment]);
                    }
                }
                catch (error) {
                    logInputError('[FreeFormInput] Failed to process pasted file:', error);
                }
                setLoadingCount((prev) => prev - 1);
            }
            // Focus the input after adding attachments
            richInputRef.current?.focus();
        };
        window.addEventListener('craft:paste-files', handlePasteFiles);
        return () => window.removeEventListener('craft:paste-files', handlePasteFiles);
    }, [disabled, sessionId, isFocusedPanel, richInputRef]); // eslint-disable-line react-hooks/exhaustive-deps -- readFileAsAttachment is stable for the lifetime of this component instance.
    // Build active commands list for slash command menu
    const activeCommands = React.useMemo(() => {
        const active = [];
        // Add the currently active permission mode
        if (PERMISSION_MODE_ORDER.includes(permissionMode))
            active.push(permissionMode);
        return active;
    }, [permissionMode]);
    const qwenCommandRefreshKeyRef = React.useRef(null);
    React.useEffect(() => {
        setRefreshedAvailableCommands(EMPTY_AVAILABLE_COMMANDS);
        setRefreshedAvailableSkills(EMPTY_AVAILABLE_SKILLS);
        qwenCommandRefreshKeyRef.current = null;
    }, [currentLlmConnection?.slug, sessionId, workingDirectory]);
    React.useEffect(() => {
        if (!enableQwenSlashCommands ||
            !sessionId ||
            hasProvidedQwenCapabilities ||
            effectiveAvailableCommands.length > 0 ||
            effectiveAvailableSkills.length > 0)
            return;
        const refreshKey = `${sessionId}:${currentLlmConnection?.slug ?? ''}:${workingDirectory ?? ''}`;
        if (qwenCommandRefreshKeyRef.current === refreshKey)
            return;
        qwenCommandRefreshKeyRef.current = refreshKey;
        const api = window.electronAPI;
        if (!api?.sessionCommand)
            return;
        api.debugLog?.('[qwen] Requesting ACP slash command refresh', {
            sessionId,
            connection: currentLlmConnection?.slug,
            workingDirectory,
        });
        api
            .sessionCommand(sessionId, {
            type: 'refreshAvailableCommands',
            workspaceId,
            workingDirectory,
            llmConnection: currentLlmConnection?.slug,
            model: currentModel,
            permissionMode,
            thinkingLevel,
            enabledSourceSlugs,
        })
            .then((result) => {
            const payload = result;
            const nextCommands = payload?.availableCommands ?? [];
            const nextSkills = payload?.availableSkills ?? [];
            if (payload?.success &&
                (nextCommands.length > 0 || nextSkills.length > 0)) {
                setRefreshedAvailableCommands(nextCommands);
                setRefreshedAvailableSkills(nextSkills);
            }
            api.debugLog?.('[qwen] ACP slash command refresh result', {
                sessionId,
                success: payload?.success,
                commandCount: nextCommands.length,
                skillCount: nextSkills.length,
                commandNames: nextCommands.map((command) => command.name),
                error: payload?.error,
            });
        })
            .catch((error) => {
            api.debugLog?.('[qwen] Failed to refresh slash commands:', String(error));
        });
    }, [
        currentLlmConnection?.slug,
        enableQwenSlashCommands,
        effectiveAvailableCommands.length,
        effectiveAvailableSkills.length,
        hasProvidedQwenCapabilities,
        enabledSourceSlugs,
        currentModel,
        permissionMode,
        sessionId,
        thinkingLevel,
        workingDirectory,
        workspaceId,
    ]);
    // Handle slash command selection (mode/feature commands)
    const handleSlashCommand = React.useCallback((commandId) => {
        if (PERMISSION_MODE_ORDER.includes(commandId))
            onPermissionModeChange?.(commandId);
        else if (commandId === 'compact' && !isProcessing)
            onSubmit('/compact', undefined);
    }, [onPermissionModeChange, isProcessing, onSubmit]);
    // Handle folder selection from slash command menu
    const handleSlashFolderSelect = React.useCallback((path) => {
        if (onWorkingDirectoryChange) {
            setRecentFolders(addRecentWorkingDir(path, workspaceId));
            onWorkingDirectoryChange(path);
        }
    }, [onWorkingDirectoryChange, workspaceId]);
    // Get recent folders and home directory for slash menu and mention menu
    const [recentFolders, setRecentFolders] = React.useState([]);
    const [homeDir, setHomeDir] = React.useState('');
    React.useEffect(() => {
        setRecentFolders(getRecentWorkingDirs(workspaceId));
        window.electronAPI?.getHomeDir?.().then((dir) => {
            if (dir)
                setHomeDir(dir);
        });
    }, [workspaceId]);
    // Inline slash command hook (modes, features, and folders)
    const inlineSlash = useInlineSlashCommand({
        inputRef: richInputRef,
        onSelectCommand: handleSlashCommand,
        onSelectFolder: handleSlashFolderSelect,
        activeCommands,
        recentFolders,
        homeDir,
        availableCommands: effectiveAvailableCommands,
        availableSkills: effectiveAvailableSkills,
        enableQwenCommands: enableQwenSlashCommands,
    });
    const richInputSlashCommandNames = React.useMemo(() => {
        const names = new Set(['compact']);
        for (const section of inlineSlash.sections) {
            for (const item of section.items) {
                if ('type' in item && item.type === 'folder')
                    continue;
                const commandText = 'insertText' in item ? item.insertText?.trim() : undefined;
                if (!commandText?.startsWith('/'))
                    continue;
                const commandName = commandText.slice(1).split(/\s+/)[0];
                if (commandName)
                    names.add(commandName);
            }
        }
        return [...names];
    }, [inlineSlash.sections]);
    // Handle mention selection (sources, skills, files)
    const handleMentionSelect = React.useCallback((item) => {
        // For sources: enable the source immediately
        if (item.type === 'source' && item.source && onSourcesChange) {
            const slug = item.source.config.slug;
            if (!optimisticSourceSlugs.includes(slug)) {
                const newSlugs = [...optimisticSourceSlugs, slug];
                setOptimisticSourceSlugs(newSlugs);
                onSourcesChange(newSlugs);
            }
        }
        // Files via @ mention in text are sufficient context for the agent.
        // Skills also don't need special handling beyond text insertion.
    }, [optimisticSourceSlugs, onSourcesChange]);
    // Inline mention hook (for skills, sources, and files)
    const inlineMention = useInlineMention({
        inputRef: richInputRef,
        skills: mentionSkills,
        sources,
        basePath: workingDirectory,
        onSelect: handleMentionSelect,
        // Use workspace slug (not UUID) for SDK skill qualification
        workspaceId: workspaceSlug,
    });
    // Inline label menu hook (for #labels)
    const handleLabelSelect = React.useCallback((labelId) => {
        onLabelAdd?.(labelId);
    }, [onLabelAdd]);
    const inlineLabel = useInlineLabelMenu({
        inputRef: richInputRef,
        labels: visibleLabels,
        sessionLabels: visibleSessionLabels,
        onSelect: handleLabelSelect,
        sessionStatuses,
        activeStateId: currentSessionStatus,
    });
    // "Add New Label" handler: cleans up the #trigger text and opens a controlled
    // EditPopover so the user can describe the label before the agent creates it.
    const [addLabelPopoverOpen, setAddLabelPopoverOpen] = React.useState(false);
    const [addLabelPrefill, setAddLabelPrefill] = React.useState('');
    const handleAddLabel = React.useCallback((prefill) => {
        if (!workspaceRootPath)
            return;
        // Remove the #trigger text from input
        const cleaned = inlineLabel.handleSelect('');
        setInput(cleaned);
        syncToParent(cleaned);
        inlineLabel.close();
        // Store the prefill text (e.g., "Test" from "#Test") to pre-fill the popover
        // Format: "Add new label {prefill}" so user can just press enter or modify
        setAddLabelPrefill(prefill ? t('labels.addNewLabel', { prefill }) : '');
        // Open the EditPopover for label creation
        setAddLabelPopoverOpen(true);
    }, [workspaceRootPath, inlineLabel, syncToParent, t]);
    // Memoize the add-label config so the EditPopover doesn't recreate on every render
    const addLabelEditConfig = React.useMemo(() => {
        if (!workspaceRootPath)
            return null;
        return getEditConfig('add-label', workspaceRootPath);
    }, [workspaceRootPath]);
    // Report height changes to parent (for external animation sync)
    React.useLayoutEffect(() => {
        if (!onHeightChange || !containerRef.current)
            return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                onHeightChange(entry.contentRect.height);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [onHeightChange]);
    // In compact mode, immediately report collapsed height when processing state changes
    // This ensures smooth animation timing when input collapses/expands
    React.useEffect(() => {
        if (!onHeightChange || !compactMode)
            return;
        if (isProcessing) {
            // Collapsed state - only bottom bar visible (~44px)
            onHeightChange(44);
        }
        // When not processing, ResizeObserver will report the full height
    }, [compactMode, isProcessing, onHeightChange]);
    // Check if running in Electron environment (has electronAPI)
    const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI;
    // Shared helper: read a File, add as attachment, decrement loading count
    const processFileAttachment = async (file, overrideName) => {
        try {
            const attachment = await readFileAsAttachment(file, overrideName);
            if (attachment) {
                setAttachments((prev) => [...prev, attachment]);
            }
        }
        catch (error) {
            logInputError('[FreeFormInput] Failed to read file:', error);
        }
        setLoadingCount((prev) => prev - 1);
    };
    // File attachment handlers
    const handleAttachClick = () => {
        if (disabled)
            return;
        fileInputRef.current?.click();
    };
    const handleFileInputChange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        const fileList = Array.from(files);
        setLoadingCount((prev) => prev + fileList.length);
        for (const file of fileList) {
            await processFileAttachment(file);
        }
        // Reset input so re-selecting the same file triggers onChange again
        e.target.value = '';
    };
    const handleRemoveAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    };
    // Drag and drop handlers
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (e.dataTransfer.types.includes('Files')) {
            setIsDraggingOver(true);
        }
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDraggingOver(false);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    // Helper to read a File using FileReader API
    const readFileAsAttachment = async (file, overrideName) => {
        // Capture the absolute OS path at attach time. Works for <input type="file"> and
        // OS drag-drop; returns null for clipboard paste and web-drag (no disk origin).
        // When null, the draft layer falls back to persisting content inline (Track C).
        const realPath = hasElectronAPI
            ? (window.electronAPI.getFilePath?.(file) ?? null)
            : null;
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async () => {
                const result = reader.result;
                // Chunked base64 encoding — btoa + reduce fails on large files (>1MB)
                // due to O(n²) string concatenation and browser string-length limits
                const bytes = new Uint8Array(result);
                let binary = '';
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunkSize, bytes.length)));
                }
                const base64 = btoa(binary);
                const fileName = overrideName || file.name;
                const { type, mimeType } = inferFileAttachmentMetadata(fileName, file.type);
                // For text files, decode the ArrayBuffer as UTF-8 text
                let text;
                if (type === 'text') {
                    text = new TextDecoder('utf-8').decode(new Uint8Array(result));
                }
                let thumbnailBase64;
                if (hasElectronAPI) {
                    try {
                        const thumb = await window.electronAPI.generateThumbnail(base64, mimeType);
                        if (thumb)
                            thumbnailBase64 = thumb;
                    }
                    catch {
                        // Thumbnail generation is optional, continue without it
                    }
                }
                resolve({
                    type,
                    path: realPath ?? fileName,
                    name: fileName,
                    mimeType,
                    base64,
                    text,
                    size: file.size,
                    thumbnailBase64,
                });
            };
            reader.onerror = () => resolve(null);
            reader.readAsArrayBuffer(file);
        });
    };
    // Clipboard paste handler for files/images
    const handlePaste = async (e) => {
        if (disabled)
            return;
        const clipboardItems = e.clipboardData?.files;
        if (!clipboardItems || clipboardItems.length === 0)
            return;
        // We have files to process - prevent default text paste behavior
        e.preventDefault();
        const files = sortFilesForAttachmentInput(Array.from(clipboardItems));
        setLoadingCount((prev) => prev + files.length);
        // Pre-assign sequential names using ref to avoid race conditions
        let nextImageNum = getNextPastedNumber('image', attachmentsRef.current);
        const fileNames = files.map((file) => {
            if (!file.name ||
                file.name === 'image.png' ||
                file.name === 'image.jpg' ||
                file.name === 'blob') {
                const ext = file.type.split('/')[1] || 'png';
                return `pasted-image-${nextImageNum++}.${ext}`;
            }
            return file.name;
        });
        for (let i = 0; i < files.length; i++) {
            await processFileAttachment(files[i], fileNames[i]);
        }
    };
    // Handle long text paste - convert to file attachment
    const handleLongTextPaste = React.useCallback((text) => {
        const nextNum = getNextPastedNumber('text', attachmentsRef.current);
        const fileName = `pasted-text-${nextNum}.txt`;
        const attachment = {
            type: 'text',
            path: fileName,
            name: fileName,
            mimeType: 'text/plain',
            text,
            size: new Blob([text]).size,
        };
        setAttachments((prev) => [...prev, attachment]);
        // Focus input after adding attachment
        richInputRef.current?.focus();
    }, [richInputRef]);
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDraggingOver(false);
        if (disabled)
            return;
        const files = Array.from(e.dataTransfer.files);
        setLoadingCount(files.length);
        for (const file of files) {
            await processFileAttachment(file);
        }
    };
    // Submit message - backend handles queueing and interruption
    const submitMessage = React.useCallback(() => {
        if (voiceActiveRef.current)
            return false;
        const hasContent = input.trim() || attachments.length > 0 || followUpItems.length > 0;
        if (!hasContent || disabled)
            return false;
        // Tutorial may disable sending to guide user through specific steps
        if (disableSend)
            return false;
        // Parse all @mentions (skills, sources, folders)
        const skillSlugs = mentionSkills.map((s) => s.slug);
        const sourceSlugs = sources.map((s) => s.config.slug);
        const mentions = parseMentions(input, skillSlugs, sourceSlugs);
        // Enable any mentioned sources that aren't already enabled
        if (mentions.sources.length > 0 && onSourcesChange) {
            const newSlugs = [
                ...new Set([...optimisticSourceSlugs, ...mentions.sources]),
            ];
            if (newSlugs.length > optimisticSourceSlugs.length) {
                setOptimisticSourceSlugs(newSlugs);
                onSourcesChange(newSlugs);
            }
        }
        onSubmit(input.trim(), attachments.length > 0 ? attachments : undefined, mentions.skills.length > 0 ? mentions.skills : undefined);
        setInput('');
        setAttachments([]);
        // Clear draft immediately (cancel any pending debounced sync)
        if (syncTimeoutRef.current)
            clearTimeout(syncTimeoutRef.current);
        onInputChange?.('');
        prevInputValueRef.current = '';
        // Restore focus after state updates
        requestAnimationFrame(() => {
            richInputRef.current?.focus();
        });
        return true;
    }, [
        input,
        attachments,
        followUpItems,
        disabled,
        disableSend,
        onInputChange,
        onSubmit,
        mentionSkills,
        sources,
        optimisticSourceSlugs,
        onSourcesChange,
        richInputRef,
    ]);
    // Listen for craft:submit-input events (simulate pressing the Send button)
    React.useEffect(() => {
        const handleSubmitInput = (e) => {
            const targetSessionId = e.detail?.sessionId;
            if (!shouldHandleScopedInputEvent({
                sessionId,
                isFocusedPanel,
                targetSessionId,
            }))
                return;
            submitMessage();
        };
        window.addEventListener('craft:submit-input', handleSubmitInput);
        return () => window.removeEventListener('craft:submit-input', handleSubmitInput);
    }, [sessionId, isFocusedPanel, submitMessage]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        submitMessage();
    };
    const handleStop = (silent = false) => {
        onStop?.(silent);
    };
    const handleKeyDown = (e) => {
        // During IME composition, ESC should cancel composition, not trigger app/menu ESC behavior.
        if (e.key === 'Escape' && e.nativeEvent.isComposing) {
            return;
        }
        // Don't submit when mention menu is open AND has visible content
        if (inlineMention.isOpen) {
            // Only intercept navigation/selection keys if menu actually shows items or is loading
            const hasVisibleContent = inlineMention.sections.some((s) => s.items.length > 0) ||
                inlineMention.isSearching;
            if (hasVisibleContent &&
                (e.key === 'Enter' ||
                    e.key === 'Tab' ||
                    e.key === 'ArrowUp' ||
                    e.key === 'ArrowDown')) {
                // These keys are handled by the InlineMentionMenu component
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                inlineMention.close();
                return;
            }
        }
        // Don't submit when slash command menu is open - let it handle the Enter key
        if (inlineSlash.isOpen) {
            if (e.key === 'Enter' ||
                e.key === 'Tab' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown') {
                // These keys are handled by the InlineSlashCommand component
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                inlineSlash.close();
                return;
            }
        }
        // Don't submit when label menu is open - let it handle navigation keys
        if (inlineLabel.isOpen) {
            if (e.key === 'Enter' ||
                e.key === 'Tab' ||
                e.key === 'ArrowUp' ||
                e.key === 'ArrowDown') {
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                inlineLabel.close();
                return;
            }
        }
        if (e.key === 'Tab' &&
            e.shiftKey &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.altKey &&
            onPermissionModeChange) {
            e.preventDefault();
            e.stopPropagation();
            onPermissionModeChange(getNextPermissionMode(permissionMode, enabledModes));
            return;
        }
        // Skip submission during IME composition - user is confirming composed characters, not sending
        // Handle send key based on user preference:
        // - 'enter': Enter sends (Shift+Enter for newline)
        // - 'cmd-enter': ⌘/Ctrl+Enter sends (Enter for newline)
        if (sendMessageKey === 'enter') {
            // Enter sends, Shift+Enter adds newline
            if (e.key === 'Enter' &&
                !e.shiftKey &&
                !e.metaKey &&
                !e.ctrlKey &&
                !e.nativeEvent.isComposing) {
                e.preventDefault();
                submitMessage();
            }
            // Also allow Cmd/Ctrl+Enter to send (power user shortcut)
            if (e.key === 'Enter' &&
                (e.metaKey || e.ctrlKey) &&
                !e.nativeEvent.isComposing) {
                e.preventDefault();
                submitMessage();
            }
        }
        else {
            // cmd-enter mode: ⌘/Ctrl+Enter sends, plain Enter adds newline
            if (e.key === 'Enter' &&
                (e.metaKey || e.ctrlKey) &&
                !e.nativeEvent.isComposing) {
                e.preventDefault();
                submitMessage();
            }
            // Plain Enter is allowed to pass through (adds newline)
        }
        if (e.key === 'Escape') {
            // Skip blur if a popover/overlay is open — let the overlay handle ESC instead.
            // This prevents the input from consuming ESC when focus gets pulled back here
            // while a popover is still visible (portal DOM isolation means the event won't
            // reach the popover's DismissableLayer otherwise).
            if (!hasOpenOverlay()) {
                richInputRef.current?.blur();
            }
        }
    };
    // Handle input changes from RichTextInput
    const handleInputChange = React.useCallback((value) => {
        const nextValue = coerceInputText(value);
        // Get previous input value before updating state
        const prevValue = inputRef.current;
        setInput(nextValue);
        syncToParent(nextValue); // Debounced sync to parent for draft persistence
        // Sync source selection when mentions are removed from input
        if (onSourcesChange) {
            const sourceSlugs = sources.map((s) => s.config.slug);
            // Parse mentions from previous and current input
            const prevMentions = parseMentions(prevValue, [], sourceSlugs);
            const currMentions = parseMentions(nextValue, [], sourceSlugs);
            // Remove sources that were mentioned before but not anymore
            const removedSources = prevMentions.sources.filter((slug) => !currMentions.sources.includes(slug));
            if (removedSources.length > 0) {
                const newSlugs = optimisticSourceSlugs.filter((slug) => !removedSources.includes(slug));
                setOptimisticSourceSlugs(newSlugs);
                onSourcesChange(newSlugs);
            }
        }
    }, [syncToParent, sources, optimisticSourceSlugs, onSourcesChange]);
    // Append a voice transcript to the composer (user reviews before sending).
    const insertTranscript = React.useCallback((text) => {
        const trimmed = text.trim();
        if (!trimmed)
            return;
        const current = coerceInputText(inputRef.current ?? '');
        const needsSpace = current.length > 0 && !/\s$/.test(current);
        const next = current + (needsSpace ? ' ' : '') + trimmed;
        // Set the cursor before the value update so the rich-input sync places it.
        richInputRef.current?.setSelectionRange(next.length, next.length);
        handleInputChange(next);
        richInputRef.current?.focus();
    }, [handleInputChange, richInputRef]);
    const voice = useVoiceDictation({ onInsert: insertTranscript });
    voiceActiveRef.current = voice.isActive;
    // Handle input with cursor position (for menu detection)
    const handleRichInput = React.useCallback((value, cursorPosition) => {
        const nextValue = coerceInputText(value);
        // Update inline slash command state
        inlineSlash.handleInputChange(nextValue, cursorPosition);
        // Update inline mention state (for @mentions - skills, sources, folders)
        inlineMention.handleInputChange(nextValue, cursorPosition);
        // Update inline label state (for #labels)
        inlineLabel.handleInputChange(nextValue, cursorPosition);
        // Auto-capitalize first letter (but not for slash commands, @mentions, or #labels)
        // Only if autoCapitalisation setting is enabled
        let newValue = nextValue;
        if (autoCapitalisation &&
            nextValue.length > 0 &&
            nextValue.charAt(0) !== '/' &&
            nextValue.charAt(0) !== '@' &&
            nextValue.charAt(0) !== '#') {
            const capitalizedFirst = nextValue.charAt(0).toUpperCase();
            if (capitalizedFirst !== nextValue.charAt(0)) {
                newValue = capitalizedFirst + nextValue.slice(1);
                // Set cursor position BEFORE state update so it's used when useEffect syncs the value
                richInputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
                setInput(newValue);
                syncToParent(newValue);
                return;
            }
        }
        // Apply smart typography (-> to →, etc.)
        const typography = applySmartTypography(nextValue, cursorPosition);
        if (typography.replaced) {
            newValue = typography.text;
            // Set cursor position BEFORE state update so it's used when useEffect syncs the value
            richInputRef.current?.setSelectionRange(typography.cursor, typography.cursor);
            setInput(newValue);
            syncToParent(newValue);
        }
    }, [
        inlineSlash,
        inlineMention,
        inlineLabel,
        syncToParent,
        autoCapitalisation,
        richInputRef,
    ]);
    // Handle inline slash command selection (removes the /command text)
    const handleInlineSlashCommandSelect = React.useCallback((commandId) => {
        const { value: newValue, cursorPosition } = inlineSlash.handleSelectCommand(commandId);
        setInput(newValue);
        syncToParent(newValue);
        setTimeout(() => {
            richInputRef.current?.focus();
            if (cursorPosition !== undefined) {
                richInputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
            }
        }, 0);
    }, [inlineSlash, syncToParent, richInputRef]);
    // Handle inline slash folder selection (inserts a directory badge)
    const handleInlineSlashFolderSelect = React.useCallback((path) => {
        const newValue = inlineSlash.handleSelectFolder(path);
        setInput(newValue);
        syncToParent(newValue);
        richInputRef.current?.focus();
    }, [inlineSlash, syncToParent, richInputRef]);
    // Handle inline mention selection (inserts appropriate mention text)
    const handleInlineMentionSelect = React.useCallback((item) => {
        const { value: newValue, cursorPosition } = inlineMention.handleSelect(item);
        setInput(newValue);
        syncToParent(newValue);
        // Focus input and restore cursor position after badge renders
        setTimeout(() => {
            richInputRef.current?.focus();
            richInputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
        }, 0);
    }, [inlineMention, syncToParent, richInputRef]);
    // Handle inline label selection (removes the #label text from input)
    const handleInlineLabelSelect = React.useCallback((labelId) => {
        const newValue = inlineLabel.handleSelect(labelId);
        setInput(newValue);
        syncToParent(newValue);
        richInputRef.current?.focus();
    }, [inlineLabel, syncToParent, richInputRef]);
    // Handle inline state selection from # menu (removes #text, changes session state)
    const handleInlineStateSelect = React.useCallback((stateId) => {
        const newValue = inlineLabel.handleSelect('');
        setInput(newValue);
        syncToParent(newValue);
        if (sessionId) {
            onSessionStatusChange?.(sessionId, stateId);
        }
        richInputRef.current?.focus();
    }, [inlineLabel, syncToParent, sessionId, onSessionStatusChange, richInputRef]);
    const followUpLayoutKey = React.useMemo(() => followUpItems
        .map((item) => [
        item.id,
        item.index ?? '',
        item.noteLabel,
        item.selectedText,
        item.color ?? '',
    ].join('::'))
        .join('|'), [followUpItems]);
    const previousFollowUpLayoutKeyRef = React.useRef(null);
    const [animateFollowUpLayout, setAnimateFollowUpLayout] = React.useState(false);
    React.useEffect(() => {
        const previous = previousFollowUpLayoutKeyRef.current;
        previousFollowUpLayoutKeyRef.current = followUpLayoutKey;
        if (previous == null || previous === followUpLayoutKey)
            return;
        setAnimateFollowUpLayout(true);
        const timer = window.setTimeout(() => {
            setAnimateFollowUpLayout(false);
        }, 220);
        return () => window.clearTimeout(timer);
    }, [followUpLayoutKey]);
    const hasContent = input.trim() || attachments.length > 0 || followUpItems.length > 0;
    return (_jsx("form", { onSubmit: handleSubmit, children: _jsxs("div", { ref: containerRef, className: cn('overflow-hidden transition-all', 
            // Container styling - only when not wrapped by InputContainer
            !unstyled && 'rounded-[16px] shadow-middle', !unstyled && 'bg-background', isDraggingOver &&
                'ring-2 ring-foreground ring-offset-2 ring-offset-background bg-foreground/5'), onDragEnter: handleDragEnter, onDragLeave: handleDragLeave, onDragOver: handleDragOver, onDrop: handleDrop, children: [_jsx(InlineSlashCommand, { open: inlineSlash.isOpen, onOpenChange: (open) => !open && inlineSlash.close(), sections: inlineSlash.sections, activeCommands: activeCommands, onSelectCommand: handleInlineSlashCommandSelect, onSelectFolder: handleInlineSlashFolderSelect, filter: inlineSlash.filter, position: inlineSlash.position }), _jsx(InlineMentionMenu, { open: inlineMention.isOpen, onOpenChange: (open) => !open && inlineMention.close(), sections: inlineMention.sections, onSelect: handleInlineMentionSelect, filter: inlineMention.filter, position: inlineMention.position, workspaceId: workspaceId, maxWidth: 280, isSearching: inlineMention.isSearching }), _jsx(InlineLabelMenu, { open: inlineLabel.isOpen, onOpenChange: (open) => !open && inlineLabel.close(), items: inlineLabel.items, onSelect: handleInlineLabelSelect, onAddLabel: showSessionLabelsUi ? handleAddLabel : undefined, filter: inlineLabel.filter, position: inlineLabel.position, states: inlineLabel.states, activeStateId: inlineLabel.activeStateId, onSelectState: handleInlineStateSelect }), showSessionLabelsUi && addLabelEditConfig && (_jsx(EditPopover, { trigger: _jsx("span", { className: "absolute top-0 left-0 w-0 h-0 overflow-hidden" }), open: addLabelPopoverOpen, onOpenChange: setAddLabelPopoverOpen, ...addLabelEditConfig, defaultValue: addLabelPrefill, secondaryAction: workspaceRootPath
                        ? {
                            label: 'Edit File',
                            filePath: `${workspaceRootPath}/labels/config.json`,
                        }
                        : undefined, side: "top", align: "start" })), _jsx(AttachmentPreview, { attachments: attachments, onRemove: handleRemoveAttachment, disabled: disabled, loadingCount: loadingCount }), _jsx(AnimatePresence, { initial: false, children: followUpItems.length > 0 && (_jsx(motion.div, { layout: animateFollowUpLayout, initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.18, ease: [0.2, 0, 0.2, 1] }, className: "overflow-hidden", children: _jsx(motion.div, { layout: animateFollowUpLayout, className: "px-3 pt-3.5 pb-0", children: _jsx(motion.div, { layout: animateFollowUpLayout, className: "flex flex-wrap gap-1", children: _jsx(AnimatePresence, { initial: false, children: followUpItems.map((item, idx) => {
                                        const chipIndex = item.index ?? idx + 1;
                                        const tooltipText = item.selectedText.trim() || t('chat.selectedText');
                                        const selectedExcerpt = formatFollowUpChipText(item.selectedText, t('chat.selectedText'), 50);
                                        const noteExcerpt = formatFollowUpChipText(item.noteLabel, t('chat.followUp'), 50);
                                        return (_jsxs(motion.button, { type: "button", layout: animateFollowUpLayout, initial: { opacity: 0, y: 6, scale: 0.98 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -4, scale: 0.98 }, transition: {
                                                duration: 0.16,
                                                ease: [0.2, 0, 0.2, 1],
                                            }, className: "inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-[6px] bg-foreground/2 pl-1.5 pr-2 py-1 text-[13px] text-foreground/80 select-none transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", onClick: (event) => {
                                                const rect = event.currentTarget.getBoundingClientRect();
                                                onFollowUpClick?.(item, {
                                                    x: rect.left + rect.width / 2,
                                                    y: rect.top - 8,
                                                });
                                            }, children: [_jsxs(Tooltip, { delayDuration: 250, children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("span", { role: "button", tabIndex: 0, className: "inline-flex h-4 min-w-4 cursor-pointer items-center justify-center rounded-[4px] bg-background px-0.5 text-[10px] font-medium text-foreground shadow-minimal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring", onMouseDown: (event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                }, onClick: (event) => {
                                                                    event.preventDefault();
                                                                    event.stopPropagation();
                                                                    onFollowUpIndexClick?.(item);
                                                                }, onKeyDown: (event) => {
                                                                    if (event.key === 'Enter' ||
                                                                        event.key === ' ') {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        onFollowUpIndexClick?.(item);
                                                                    }
                                                                }, children: chipIndex }) }), _jsx(TooltipContent, { side: "top", className: "max-w-[420px] break-words text-xs", children: tooltipText })] }), _jsxs("span", { className: "min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap pr-0.5 text-left", children: [_jsx("span", { className: "italic text-foreground/60", children: selectedExcerpt }), _jsx("span", { className: "mx-1 text-foreground/40", children: "\u00B7" }), _jsx("span", { children: noteExcerpt })] })] }, item.id));
                                    }) }) }) }) }, "follow-up-chips")) }), _jsx(AnimatePresence, { initial: false, children: queuedInputMessages.length > 0 && (_jsx(motion.div, { initial: { opacity: 0, y: 6, height: 0 }, animate: { opacity: 1, y: 0, height: 'auto' }, exit: { opacity: 0, y: -4, height: 0 }, transition: { duration: 0.16, ease: [0.2, 0, 0.2, 1] }, className: "overflow-hidden border-b border-border/40", children: _jsx("div", { className: "flex flex-col", children: queuedInputMessages.map((message) => (_jsxs("div", { className: "flex min-h-10 items-center gap-2 px-5 py-2 text-[13px] text-foreground/60", children: [_jsx(CornerDownRight, { className: "h-4 w-4 shrink-0 text-foreground/35" }), _jsx("span", { className: "min-w-0 flex-1 truncate", children: message.content })] }, message.id))) }) }, "queued-input-messages")) }), !(compactMode && isProcessing) && (_jsx(RichTextInput, { ref: richInputRef, value: input, onChange: handleInputChange, onInput: handleRichInput, onKeyDown: handleKeyDown, onPaste: handlePaste, onLongTextPaste: handleLongTextPaste, onFocus: () => {
                        setIsInputFocused(true);
                        onFocusChange?.(true);
                    }, onBlur: () => {
                        setIsInputFocused(false);
                        // Save caret position before losing focus (for restoration via craft:focus-input)
                        lastCaretPositionRef.current =
                            richInputRef.current?.selectionStart ?? null;
                        onFocusChange?.(false);
                    }, placeholder: effectivePlaceholder, disabled: disabled, skills: mentionSkills, sources: sources, workspaceId: workspaceSlug, slashCommandNames: richInputSlashCommandNames, className: "pl-5 pr-4 pt-4 pb-3 overflow-y-auto min-h-[88px]", style: { maxHeight: inputMaxHeight }, "data-tutorial": "chat-input", spellCheck: spellCheck })), _jsxs("div", { className: "relative", children: [_jsx(ToolbarStatusSlot, { showEscapeOverlay: isProcessing && showEscapeOverlay, sessionId: sessionId }), _jsxs("div", { className: cn('flex items-center gap-1 px-2 py-2', !compactMode && 'border-t border-border/50'), children: [_jsx("input", { ref: fileInputRef, type: "file", multiple: true, className: "hidden", onChange: handleFileInputChange }), compactMode && !voice.isActive && (_jsxs(_Fragment, { children: [onPermissionModeChange && (_jsx(CompactPermissionModeSelector, { permissionMode: permissionMode, onPermissionModeChange: onPermissionModeChange })), _jsx(FreeFormInputContextBadge, { icon: _jsx(Paperclip, { className: "h-4 w-4" }), label: attachments.length > 0
                                                ? t('chat.filesCount', { count: attachments.length })
                                                : t('chat.attach'), isExpanded: false, hasSelection: attachments.length > 0, showChevron: false, onClick: handleAttachClick, tooltip: t('chat.attachFilesTooltip'), disabled: disabled }), onWorkingDirectoryChange && (_jsx(WorkingDirectoryBadge, { workingDirectory: workingDirectory, onWorkingDirectoryChange: onWorkingDirectoryChange, sessionFolderPath: sessionFolderPath, isEmptySession: false, workspaceId: workspaceId }))] })), !compactMode && !voice.isActive && (_jsxs("div", { className: "flex items-center gap-1 min-w-32 shrink overflow-hidden", children: [_jsx(FreeFormInputContextBadge, { icon: _jsx(Paperclip, { className: "h-4 w-4" }), label: attachments.length > 0
                                                ? t('chat.filesCount', { count: attachments.length })
                                                : t('chat.attachFiles'), isExpanded: isEmptySession, hasSelection: attachments.length > 0, showChevron: false, onClick: handleAttachClick, tooltip: t('chat.attachFilesTooltip'), disabled: disabled }), onWorkingDirectoryChange && (_jsx(WorkingDirectoryBadge, { workingDirectory: workingDirectory, onWorkingDirectoryChange: onWorkingDirectoryChange, sessionFolderPath: sessionFolderPath, isEmptySession: isEmptySession, workspaceId: workspaceId }))] })), voice.isActive ? (_jsx(VoiceRecordingBar, { levels: voice.levels, elapsedMs: voice.elapsedMs, interimText: voice.interimText })) : (_jsx("div", { className: "flex-1" })), _jsxs("div", { className: "flex items-center shrink-0", children: [!compactMode && !voice.isActive && contextUsageIndicator && (_jsx(ContextUsageIndicator, { usedTokens: contextUsageIndicator.usedTokens, totalTokens: contextUsageIndicator.totalTokens, isCompacting: contextUsageIndicator.isCompacting, usagePercent: contextUsageIndicator.usagePercent, usedDisplay: contextUsageIndicator.usedDisplay, totalDisplay: contextUsageIndicator.totalDisplay })), !compactMode && !voice.isActive && (_jsxs(DropdownMenu, { open: modelDropdownOpen, onOpenChange: setModelDropdownOpen, children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { type: "button", className: cn('input-toolbar-btn inline-flex items-center h-7 px-1.5 gap-0.5 text-[13px] shrink-0 rounded-[6px] hover:bg-foreground/5 transition-colors select-none', modelDropdownOpen && 'bg-foreground/5', connectionUnavailable && 'text-destructive'), children: connectionUnavailable ? (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "h-3.5 w-3.5 shrink-0" }), t('common.unavailable')] })) : (_jsxs(_Fragment, { children: [currentModelDisplayName, _jsx(ChevronDown, { className: "h-3 w-3 opacity-50 shrink-0" })] })) }) }) }), _jsx(TooltipContent, { side: "top", children: t('common.model') })] }), _jsxs(StyledDropdownMenuContent, { side: "top", align: "end", sideOffset: 8, className: "min-w-[260px]", children: [connectionUnavailable ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-6 px-4 text-center", children: [_jsx(AlertCircle, { className: "h-8 w-8 text-destructive mb-2" }), _jsx("div", { className: "font-medium text-sm mb-1", children: t('chat.connectionUnavailable') }), _jsx("div", { className: "text-xs text-muted-foreground", children: t('chat.connectionUnavailableDescription') })] })) : availableModels.length === 0 ? (_jsx(StyledDropdownMenuItem, { disabled: true, className: "flex items-center justify-between px-2 py-2 rounded-lg", children: _jsx("div", { className: "text-left", children: _jsx("div", { className: "font-medium text-sm", children: t('common.loading') }) }) })) : (_jsx(_Fragment, { children: availableModels.map((model) => {
                                                                const modelId = typeof model === 'string' ? model : model.id;
                                                                const modelName = typeof model === 'string'
                                                                    ? getModelShortName(model)
                                                                    : model.name;
                                                                const isSelected = currentModel === modelId;
                                                                const descriptionKey = typeof model !== 'string' &&
                                                                    'descriptionKey' in model
                                                                    ? model.descriptionKey
                                                                    : undefined;
                                                                const description = descriptionKey
                                                                    ? t(descriptionKey)
                                                                    : typeof model !== 'string' &&
                                                                        'description' in model
                                                                        ? model.description
                                                                        : '';
                                                                return (_jsxs(StyledDropdownMenuItem, { onSelect: () => onModelChange(modelId, qwenConnection?.slug), className: "flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer", children: [_jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium text-sm", children: modelName }), description && (_jsx("div", { className: "text-xs text-muted-foreground", children: description }))] }), isSelected && (_jsx(Check, { className: "h-3 w-3 text-foreground shrink-0 ml-3" }))] }, modelId));
                                                            }) })), voiceEnabled && (_jsxs(_Fragment, { children: [_jsx("div", { className: "my-1 border-t border-border/50" }), _jsx("div", { className: "px-2 py-1 text-[11px] font-medium text-muted-foreground", children: "Voice model" }), VOICE_MODELS.map((vm) => {
                                                                    const isSelected = voiceModel === vm.id;
                                                                    return (_jsxs(StyledDropdownMenuItem, { onSelect: () => handleVoiceModelChange(vm.id), className: "flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer", children: [_jsxs("div", { className: "text-left", children: [_jsx("div", { className: "font-medium text-sm", children: vm.label }), _jsx("div", { className: "text-xs text-muted-foreground", children: vm.description })] }), isSelected && (_jsx(Check, { className: "h-3 w-3 text-foreground shrink-0 ml-3" }))] }, vm.id));
                                                                })] }))] })] })), voiceEnabled && voice.available && (_jsx(VoiceMicControl, { voice: voice, disabled: disabled })), isProcessing ? (_jsx(Button, { type: "button", size: "icon", variant: "secondary", "aria-label": t('chat.stopResponse'), className: "send-btn h-7 w-7 rounded-full shrink-0 hover:bg-foreground/15 active:bg-foreground/20 ml-2", onClick: () => handleStop(false), children: _jsx(Square, { className: "h-3 w-3 fill-current" }) })) : (_jsx(Button, { type: "submit", size: "icon", "aria-label": t('shortcuts.sendMessage'), className: "send-btn h-7 w-7 rounded-full shrink-0 ml-2", disabled: !hasContent || disabled || disableSend || voice.isActive, "data-tutorial": "send-button", children: _jsx(ArrowUp, { className: "h-4 w-4" }) }))] })] })] })] }) }));
}
/**
 * Format path for display, with home directory shortened
 */
function formatPathForDisplay(path, homeDir) {
    let displayPath = path;
    if (homeDir && path.startsWith(homeDir)) {
        const relativePath = path.slice(homeDir.length);
        // Remove leading separator if present, show root separator if empty
        displayPath = relativePath.startsWith(PATH_SEP)
            ? relativePath.slice(1)
            : relativePath || PATH_SEP;
    }
    return `in ${displayPath}`;
}
/**
 * WorkingDirectoryBadge - Context badge for selecting working directory
 * Uses cmdk for filterable folder list when there are more than 5 recent folders.
 */
function WorkingDirectoryBadge({ workingDirectory, onWorkingDirectoryChange, sessionFolderPath, isEmptySession = false, workspaceId, }) {
    const { t } = useTranslation();
    const [recentDirs, setRecentDirs] = React.useState([]);
    const [popoverOpen, setPopoverOpen] = React.useState(false);
    const [homeDir, setHomeDir] = React.useState('');
    const [gitBranch, setGitBranch] = React.useState(null);
    const [filter, setFilter] = React.useState('');
    const inputRef = React.useRef(null);
    // Load home directory and recent directories on mount
    React.useEffect(() => {
        setRecentDirs(getRecentWorkingDirs(workspaceId));
        window.electronAPI?.getHomeDir?.().then((dir) => {
            if (dir)
                setHomeDir(dir);
        });
    }, [workspaceId]);
    // Fetch git branch when working directory changes
    React.useEffect(() => {
        let cancelled = false;
        setGitBranch(null);
        if (!workingDirectory || workingDirectory === sessionFolderPath) {
            return;
        }
        window.electronAPI
            ?.getGitBranch?.(workingDirectory)
            .then((branch) => {
            if (!cancelled) {
                setGitBranch(branch);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [workingDirectory, sessionFolderPath]);
    // Reset filter, refresh history, and focus input when popover opens
    React.useEffect(() => {
        if (popoverOpen) {
            setFilter('');
            setRecentDirs(getRecentWorkingDirs(workspaceId));
            // Focus input after popover animation completes (only if filter is shown)
            const timer = setTimeout(() => {
                inputRef.current?.focus();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [popoverOpen, workspaceId]);
    const handleFolderSelected = React.useCallback((selectedPath) => {
        setRecentDirs(addRecentWorkingDir(selectedPath, workspaceId));
        onWorkingDirectoryChange(selectedPath);
    }, [onWorkingDirectoryChange, workspaceId]);
    const { pickDirectory, showServerBrowser, serverBrowserMode, cancelServerBrowser, confirmServerBrowser, } = useDirectoryPicker(handleFolderSelected);
    const handleChooseFolder = () => {
        setPopoverOpen(false);
        pickDirectory();
    };
    const handleSelectRecent = (path) => {
        setRecentDirs(addRecentWorkingDir(path, workspaceId)); // Move to top of recent list
        onWorkingDirectoryChange(path);
        setPopoverOpen(false);
    };
    const handleReset = () => {
        if (sessionFolderPath) {
            onWorkingDirectoryChange(sessionFolderPath);
            setPopoverOpen(false);
        }
    };
    const handleRemoveRecent = (e, path) => {
        e.stopPropagation(); // Don't trigger the item's onSelect
        setRecentDirs(removeRecentWorkingDir(path, workspaceId));
    };
    // Filter out current directory from recent list and sort alphabetically by folder name
    const filteredRecent = recentDirs
        .filter((p) => p !== workingDirectory)
        .sort((a, b) => {
        const nameA = getPathBasename(a).toLowerCase();
        const nameB = getPathBasename(b).toLowerCase();
        return nameA.localeCompare(nameB);
    });
    // Show filter input only when more than 5 recent folders
    const showFilter = filteredRecent.length > 5;
    // Determine label - "Work in Folder" if not set or at session root, otherwise folder name
    const hasFolder = !!workingDirectory && workingDirectory !== sessionFolderPath;
    const folderName = hasFolder
        ? getPathBasename(workingDirectory) || 'Folder'
        : 'Work in Folder';
    const visibleGitBranch = hasFolder ? gitBranch : null;
    // Show reset option when a folder is selected and it differs from session folder
    const showReset = hasFolder && sessionFolderPath && sessionFolderPath !== workingDirectory;
    // Styles matching todo-filter-menu.tsx for consistency
    const MENU_CONTAINER_STYLE = 'min-w-[200px] max-w-[400px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small p-0';
    const MENU_LIST_STYLE = 'max-h-[200px] overflow-y-auto p-1 [&_[cmdk-list-sizer]]:space-y-px';
    const MENU_ITEM_STYLE = 'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-1.5 text-[13px] outline-none';
    return (_jsxs(_Fragment, { children: [_jsxs(Popover, { open: popoverOpen, onOpenChange: setPopoverOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("span", { className: "shrink min-w-0 overflow-hidden", children: _jsx(FreeFormInputContextBadge, { icon: _jsx(Icon_Home, { className: "h-4 w-4" }), label: folderName, ariaLabel: visibleGitBranch
                                    ? `${folderName}, ${t('chat.onBranch', {
                                        branch: visibleGitBranch,
                                    })}`
                                    : folderName, trailingContent: visibleGitBranch ? (_jsxs("span", { className: "inline-flex min-w-0 max-w-[120px] shrink items-center gap-1 text-muted-foreground", children: [_jsx(GitBranch, { className: "h-3 w-3 shrink-0" }), _jsx("span", { className: "truncate", children: visibleGitBranch })] })) : undefined, isExpanded: isEmptySession, hasSelection: hasFolder, showChevron: true, isOpen: popoverOpen, tooltip: hasFolder ? (_jsxs("span", { className: "flex flex-col gap-0.5", children: [_jsx("span", { className: "font-medium", children: t('chat.workingDirectory') }), _jsx("span", { className: "text-xs opacity-70", children: formatPathForDisplay(workingDirectory, homeDir) }), gitBranch && (_jsx("span", { className: "text-xs opacity-70", children: t('chat.onBranch', { branch: gitBranch }) }))] })) : (t('chat.chooseWorkingDirectory')) }) }) }), _jsx(PopoverContent, { side: "top", align: "start", sideOffset: 8, className: MENU_CONTAINER_STYLE, children: _jsxs(CommandPrimitive, { shouldFilter: showFilter, children: [showFilter && (_jsx("div", { className: "border-b border-border/50 px-3 py-2", children: _jsx(CommandPrimitive.Input, { ref: inputRef, value: filter, onValueChange: setFilter, placeholder: t('chat.filterFolders'), className: "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 placeholder:select-none" }) })), _jsxs(CommandPrimitive.List, { className: MENU_LIST_STYLE, children: [hasFolder && (_jsxs(CommandPrimitive.Item, { value: `current-${workingDirectory}`, className: cn(MENU_ITEM_STYLE, 'pointer-events-none bg-foreground/5'), disabled: true, children: [_jsx(Icon_Folder, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("span", { className: "flex-1 min-w-0 truncate", children: [_jsx("span", { children: folderName }), _jsx("span", { className: "text-muted-foreground ml-1.5", children: formatPathForDisplay(workingDirectory, homeDir) })] }), _jsx(Check, { className: "h-4 w-4 shrink-0" })] })), hasFolder && filteredRecent.length > 0 && (_jsx("div", { className: "h-px bg-border my-1 mx-1" })), filteredRecent.map((path) => {
                                            const recentFolderName = getPathBasename(path) || 'Folder';
                                            return (_jsxs(CommandPrimitive.Item, { value: `${recentFolderName} ${path}`, onSelect: () => handleSelectRecent(path), className: cn(MENU_ITEM_STYLE, 'group/item data-[selected=true]:bg-foreground/5'), children: [_jsx(Icon_Folder, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("span", { className: "flex-1 min-w-0 truncate", children: [_jsx("span", { children: recentFolderName }), _jsx("span", { className: "text-muted-foreground ml-1.5", children: formatPathForDisplay(path, homeDir) })] }), _jsx("button", { type: "button", onClick: (e) => handleRemoveRecent(e, path), className: "shrink-0 h-3 w-3 rounded-[3px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all", children: _jsx(X, { className: "h-3 w-3" }) })] }, path));
                                        }), showFilter && (_jsx(CommandPrimitive.Empty, { className: "py-3 text-center text-sm text-muted-foreground", children: t('chat.noFoldersFound') }))] }), _jsxs("div", { className: "border-t border-border/50 p-1", children: [_jsx("button", { type: "button", onClick: handleChooseFolder, className: cn(MENU_ITEM_STYLE, 'w-full hover:bg-foreground/5'), children: t('chat.chooseFolder') }), showReset && (_jsx("button", { type: "button", onClick: handleReset, className: cn(MENU_ITEM_STYLE, 'w-full hover:bg-foreground/5'), children: t('common.reset') }))] })] }) })] }), _jsx(ServerDirectoryBrowser, { open: showServerBrowser, mode: serverBrowserMode, onSelect: confirmServerBrowser, onCancel: cancelServerBrowser, initialPath: workingDirectory })] }));
}
//# sourceMappingURL=FreeFormInput.js.map