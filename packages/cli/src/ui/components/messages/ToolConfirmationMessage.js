import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Box, Text } from 'ink';
import wrapAnsi from 'wrap-ansi';
import { DiffRenderer } from './DiffRenderer.js';
import { RenderInline } from '../../utils/InlineMarkdownRenderer.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { IdeClient, ToolConfirmationOutcome, buildHumanReadableRuleLabel, } from '@qwen-code/qwen-code-core';
import { RadioButtonSelect } from '../shared/RadioButtonSelect.js';
import { MaxSizedBox, MINIMUM_MAX_HEIGHT } from '../shared/MaxSizedBox.js';
import { useKeypress } from '../../hooks/useKeypress.js';
import { useLaunchEditor } from '../../hooks/useLaunchEditor.js';
import { useSettings } from '../../contexts/SettingsContext.js';
import { theme } from '../../semantic-colors.js';
import { t } from '../../../i18n/index.js';
import { AskUserQuestionDialog } from './AskUserQuestionDialog.js';
// Cap the body height of inline subagent approval banners so a
// multi-line command can't dominate the screen. MaxSizedBox renders
// a "... N more lines" footer past this cap.
const COMPACT_BODY_MAX_LINES = 5;
export const ToolConfirmationMessage = ({ confirmationDetails, config, isFocused = true, availableTerminalHeight, contentWidth, compactMode = false, }) => {
    const { onConfirm } = confirmationDetails;
    const autoModeFallback = confirmationDetails.autoModeFallback;
    const settings = useSettings();
    const preferredEditor = settings.merged.general?.preferredEditor;
    const [ideClient, setIdeClient] = useState(null);
    const [isDiffingEnabled, setIsDiffingEnabled] = useState(false);
    useEffect(() => {
        let isMounted = true;
        if (config.getIdeMode()) {
            const getIdeClient = async () => {
                const client = await IdeClient.getInstance();
                if (isMounted) {
                    setIdeClient(client);
                    setIsDiffingEnabled(client?.isDiffingEnabled() ?? false);
                }
            };
            getIdeClient();
        }
        return () => {
            isMounted = false;
        };
    }, [config]);
    const handleConfirm = async (outcome) => {
        // Call onConfirm before resolving the IDE diff so that the CLI outcome
        // (e.g. ProceedAlways) is processed first.  resolveDiffFromCli would
        // otherwise trigger the scheduler's ideConfirmation .then() handler
        // with ProceedOnce, racing with the intended CLI outcome.
        onConfirm(outcome);
        if (confirmationDetails.type === 'edit' &&
            !confirmationDetails.skipIdeDiff) {
            if (config.getIdeMode() && isDiffingEnabled) {
                const cliOutcome = outcome === ToolConfirmationOutcome.Cancel ? 'rejected' : 'accepted';
                await ideClient?.resolveDiffFromCli(confirmationDetails.filePath, cliOutcome);
            }
        }
    };
    const isTrustedFolder = config.isTrustedFolder();
    const launchEditor = useLaunchEditor();
    const [planViewError, setPlanViewError] = useState(null);
    // #7001: a long plan can exceed the confirmation dialog's height budget and
    // get truncated (with a "... N more lines not shown ..." cue since #6882),
    // yet the user is asked to approve it. `o` writes the FULL plan to a temp
    // file and opens it in the configured editor so the decision is informed;
    // the dialog stays open (nothing is confirmed) while the user reads.
    const openFullPlanInEditor = () => {
        if (confirmationDetails.type !== 'plan')
            return;
        setPlanViewError(null);
        const openPlan = async () => {
            const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'qwen-plan-'));
            const planPath = path.join(dir, 'plan.md');
            await fs.writeFile(planPath, confirmationDetails.plan);
            await launchEditor(planPath);
        };
        void openPlan().catch((err) => {
            setPlanViewError(err instanceof Error ? err.message : String(err));
        });
    };
    useKeypress((key) => {
        if (!isFocused)
            return;
        if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
            handleConfirm(ToolConfirmationOutcome.Cancel);
            return;
        }
        if (key.name === 'o' &&
            !key.ctrl &&
            !key.meta &&
            confirmationDetails.type === 'plan') {
            openFullPlanInEditor();
        }
    }, { isActive: isFocused });
    const handleSelect = (item) => handleConfirm(item);
    let bodyContent = null; // Removed contextDisplay here
    let question;
    const options = new Array();
    // Body content is now the DiffRenderer, passing filename to it
    // The bordered box is removed from here and handled within DiffRenderer
    function availableBodyContentHeight() {
        if (options.length === 0) {
            // This should not happen in practice as options are always added before this is called.
            throw new Error('Options not provided for confirmation message');
        }
        if (availableTerminalHeight === undefined) {
            return undefined;
        }
        // Calculate the vertical space (in lines) consumed by UI elements
        // surrounding the main body content. Compact mode drops outer padding
        // and inter-section margins, and renders a fixed 3-option list rather
        // than the full options array.
        const PADDING_OUTER_Y = compactMode ? 0 : 2;
        const MARGIN_BODY_BOTTOM = compactMode ? 0 : 1;
        const HEIGHT_QUESTION = 1;
        const MARGIN_QUESTION_BOTTOM = compactMode ? 0 : 1;
        const HEIGHT_OPTIONS = compactMode
            ? 3
            : options.length + (autoModeFallback ? 1 : 0);
        const AUTO_MODE_FALLBACK_HEIGHT = autoModeFallback
            ? wrapAnsi(`⚠ ${autoModeFallback.message}`, warningContentWidth, {
                trim: false,
                hard: true,
            }).split('\n').length + 1
            : 0;
        const surroundingElementsHeight = PADDING_OUTER_Y +
            MARGIN_BODY_BOTTOM +
            HEIGHT_QUESTION +
            MARGIN_QUESTION_BOTTOM +
            HEIGHT_OPTIONS +
            AUTO_MODE_FALLBACK_HEIGHT;
        return Math.max(availableTerminalHeight - surroundingElementsHeight, 1);
    }
    // The warning box uses marginLeft={1} and paddingX={1}. Regular mode also
    // renders inside the outer box's padding={1}.
    const warningContentWidth = Math.max(contentWidth - 3 - (compactMode ? 0 : 2), 1);
    function warningsHeight(warnings) {
        if (warnings.length === 0)
            return 0;
        const wrappedRows = warnings.reduce((sum, warning) => sum +
            wrapAnsi(`⚠ ${warning}`, warningContentWidth, {
                trim: false,
                hard: true,
            }).split('\n').length, 0);
        return wrappedRows + 1;
    }
    if (confirmationDetails.type === 'edit') {
        if (confirmationDetails.isModifying) {
            return (_jsxs(Box, { minWidth: "90%", borderStyle: "round", borderColor: theme.border.default, justifyContent: "space-around", padding: 1, overflow: "hidden", children: [_jsxs(Text, { color: theme.text.primary, children: [t('Modify in progress:'), " "] }), _jsx(Text, { color: theme.status.success, children: t('Save and close external editor to continue') })] }));
        }
        question = t('Apply this change?');
        options.push({
            label: t('Yes, allow once'),
            value: ToolConfirmationOutcome.ProceedOnce,
            key: 'Yes, allow once',
        });
        if (isTrustedFolder && !confirmationDetails.hideAlwaysAllow) {
            options.push({
                label: t('Yes, allow always'),
                value: ToolConfirmationOutcome.ProceedAlways,
                key: 'Yes, allow always',
            });
        }
        if (!confirmationDetails.hideModify &&
            (!config.getIdeMode() || !isDiffingEnabled) &&
            preferredEditor) {
            options.push({
                label: t('Modify with external editor'),
                value: ToolConfirmationOutcome.ModifyWithEditor,
                key: 'Modify with external editor',
            });
        }
        options.push({
            label: t('No, suggest changes (esc)'),
            value: ToolConfirmationOutcome.Cancel,
            key: 'No, suggest changes (esc)',
        });
        const warnings = confirmationDetails.warnings ?? [];
        let bodyHeight = availableBodyContentHeight();
        if (compactMode) {
            bodyHeight = Math.min(bodyHeight ?? COMPACT_BODY_MAX_LINES, COMPACT_BODY_MAX_LINES);
        }
        const constrainWarnings = warnings.length > 0 &&
            bodyHeight !== undefined &&
            warningsHeight(warnings) + MINIMUM_MAX_HEIGHT > bodyHeight;
        let warningMaxHeight;
        let warningMarginBottom = warnings.length > 0 ? 1 : 0;
        let diffHeight = bodyHeight;
        if (constrainWarnings && bodyHeight !== undefined) {
            const desiredWarningHeight = Math.max(warnings.length, MINIMUM_MAX_HEIGHT);
            warningMarginBottom =
                bodyHeight >= desiredWarningHeight + MINIMUM_MAX_HEIGHT + 1 ? 1 : 0;
            warningMaxHeight = Math.min(desiredWarningHeight, Math.max(bodyHeight - MINIMUM_MAX_HEIGHT - warningMarginBottom, MINIMUM_MAX_HEIGHT), bodyHeight);
            diffHeight = bodyHeight - warningMaxHeight - warningMarginBottom;
        }
        else if (diffHeight !== undefined) {
            diffHeight = Math.max(diffHeight - warningsHeight(warnings), 1);
        }
        const renderedDiff = diffHeight === undefined || diffHeight >= MINIMUM_MAX_HEIGHT ? (_jsx(DiffRenderer, { diffContent: confirmationDetails.fileDiff, filename: confirmationDetails.fileName, availableTerminalHeight: diffHeight, contentWidth: contentWidth, settings: settings })) : diffHeight === 1 ? (_jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: "... diff hidden ..." })) : null;
        bodyContent = (_jsxs(Box, { flexDirection: "column", children: [warnings.length > 0 ? (_jsx(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, marginBottom: warningMarginBottom, children: constrainWarnings && warningMaxHeight === 1 ? (_jsxs(Text, { color: theme.status.warning, wrap: "truncate", children: ["\u26A0 ", warnings.at(-1)?.replace(/\r\n?|\n/g, ' ↵ ')] })) : constrainWarnings ? (_jsx(MaxSizedBox, { maxHeight: warningMaxHeight, maxWidth: warningContentWidth, overflowDirection: "bottom", children: warnings.map((warning, idx) => (_jsx(Box, { children: _jsxs(Text, { color: theme.status.warning, wrap: "truncate", children: ["\u26A0 ", warning.replace(/\r\n?|\n/g, ' ↵ ')] }) }, idx))) })) : (warnings.map((warning, idx) => (_jsxs(Text, { color: theme.status.warning, children: ["\u26A0 ", warning] }, idx)))) })) : null, renderedDiff] }));
    }
    else if (confirmationDetails.type === 'exec') {
        const executionProps = confirmationDetails;
        question = t("Allow execution of: '{{command}}'?", {
            command: executionProps.rootCommand,
        });
        options.push({
            label: t('Yes, allow once'),
            value: ToolConfirmationOutcome.ProceedOnce,
            key: 'Yes, allow once',
        });
        if (isTrustedFolder && !confirmationDetails.hideAlwaysAllow) {
            const friendlyLabel = executionProps.permissionRules?.length
                ? ` ${buildHumanReadableRuleLabel(executionProps.permissionRules)}`
                : '';
            options.push({
                label: friendlyLabel
                    ? t('Always allow {{action}} in this project', {
                        action: friendlyLabel.trim(),
                    })
                    : t('Always allow in this project'),
                value: ToolConfirmationOutcome.ProceedAlwaysProject,
                key: 'Always allow in this project',
            });
            options.push({
                label: friendlyLabel
                    ? t('Always allow {{action}} for this user', {
                        action: friendlyLabel.trim(),
                    })
                    : t('Always allow for this user'),
                value: ToolConfirmationOutcome.ProceedAlwaysUser,
                key: 'Always allow for this user',
            });
        }
        options.push({
            label: t('No, suggest changes (esc)'),
            value: ToolConfirmationOutcome.Cancel,
            key: 'No, suggest changes (esc)',
        });
        // Warnings render as a sibling Box *below* the MaxSizedBox-capped
        // command body, with marginTop={1}. They sit outside the MaxSizedBox
        // cap, so we have to reserve their footprint up-front; otherwise the
        // overall exec block can exceed availableTerminalHeight /
        // COMPACT_BODY_MAX_LINES on small terminals and push the options
        // list off-screen.
        //
        // Each warning may wrap across multiple visual rows on a narrow
        // terminal. Account for the warning container's effective content width
        // and use the same wrapping semantics as Ink's Text renderer.
        const warnings = executionProps.warnings ?? [];
        const warningsCount = warnings.length;
        const reservedWarningsHeight = warningsHeight(warnings);
        let bodyContentHeight = availableBodyContentHeight();
        if (bodyContentHeight !== undefined) {
            bodyContentHeight -= 2; // Account for padding;
        }
        if (compactMode) {
            bodyContentHeight = Math.min(bodyContentHeight ?? COMPACT_BODY_MAX_LINES, COMPACT_BODY_MAX_LINES);
        }
        // Subtract the warnings footprint last so it applies in both the
        // normal-height and compact-cap paths. Floor at 1 so a long warning
        // list never zeroes out the command body.
        if (bodyContentHeight !== undefined && reservedWarningsHeight > 0) {
            bodyContentHeight = Math.max(bodyContentHeight - reservedWarningsHeight, 1);
        }
        bodyContent = (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { paddingX: 1, marginLeft: 1, children: _jsx(MaxSizedBox, { maxHeight: bodyContentHeight, maxWidth: Math.max(contentWidth, 1), overflowDirection: "bottom", children: _jsx(Box, { children: _jsx(Text, { color: theme.text.link, children: executionProps.command }) }) }) }), warningsCount > 0 ? (_jsx(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, marginTop: 1, children: warnings.map((warning, idx) => (_jsxs(Text, { color: theme.status.warning, children: ["\u26A0 ", warning] }, idx))) })) : null] }));
    }
    else if (confirmationDetails.type === 'plan') {
        const planProps = confirmationDetails;
        question = planProps.title;
        options.push({
            key: 'restore-previous',
            label: t('Yes, restore previous mode ({{mode}})', {
                mode: planProps.prePlanMode ?? 'default',
            }),
            value: ToolConfirmationOutcome.RestorePrevious,
        });
        options.push({
            key: 'proceed-always',
            label: t('Yes, and auto-accept edits'),
            value: ToolConfirmationOutcome.ProceedAlways,
        });
        options.push({
            key: 'proceed-once',
            label: t('Yes, and manually approve edits'),
            value: ToolConfirmationOutcome.ProceedOnce,
        });
        options.push({
            key: 'cancel',
            label: t('No, keep planning (esc)'),
            value: ToolConfirmationOutcome.Cancel,
        });
        // Reserve one row for the "o open full plan" hint below the plan body.
        const rawPlanHeight = compactMode
            ? Math.min(availableBodyContentHeight() ?? COMPACT_BODY_MAX_LINES, COMPACT_BODY_MAX_LINES)
            : availableBodyContentHeight();
        const planHeight = rawPlanHeight === undefined ? undefined : Math.max(rawPlanHeight - 1, 1);
        bodyContent = (_jsxs(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, children: [_jsx(MarkdownDisplay, { text: planProps.plan, isPending: false, availableTerminalHeight: planHeight, contentWidth: contentWidth, 
                    // Live pending items render inside MainContent's maxHeight +
                    // overflow="hidden" wrapper, and Ink clips the BOTTOM. Without a
                    // height-aware pre-slice, a long plan silently loses its tail
                    // (including the option buttons below). Opt into the same pre-slice
                    // the streaming path uses so the body respects the viewport budget.
                    // See #6867.
                    enforceHeightBudget: true }), planViewError ? (_jsx(Text, { color: theme.status.error, wrap: "truncate", children: planViewError })) : (_jsx(Text, { color: theme.text.secondary, wrap: "truncate", children: t('o open full plan in editor') }))] }));
    }
    else if (confirmationDetails.type === 'info') {
        const infoProps = confirmationDetails;
        const displayUrls = infoProps.urls &&
            !(infoProps.urls.length === 1 && infoProps.urls[0] === infoProps.prompt);
        question = t('Do you want to proceed?');
        options.push({
            label: t('Yes, allow once'),
            value: ToolConfirmationOutcome.ProceedOnce,
            key: 'Yes, allow once',
        });
        if (isTrustedFolder && !confirmationDetails.hideAlwaysAllow) {
            const friendlyLabel = 'permissionRules' in infoProps &&
                infoProps.permissionRules?.length
                ? ` ${buildHumanReadableRuleLabel(infoProps.permissionRules)}`
                : '';
            options.push({
                label: friendlyLabel
                    ? t('Always allow {{action}} in this project', {
                        action: friendlyLabel.trim(),
                    })
                    : t('Always allow in this project'),
                value: ToolConfirmationOutcome.ProceedAlwaysProject,
                key: 'Always allow in this project',
            });
            options.push({
                label: friendlyLabel
                    ? t('Always allow {{action}} for this user', {
                        action: friendlyLabel.trim(),
                    })
                    : t('Always allow for this user'),
                value: ToolConfirmationOutcome.ProceedAlwaysUser,
                key: 'Always allow for this user',
            });
        }
        options.push({
            label: t('No, suggest changes (esc)'),
            value: ToolConfirmationOutcome.Cancel,
            key: 'No, suggest changes (esc)',
        });
        bodyContent = (_jsxs(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, children: [infoProps.renderPromptAsPlainText ? (_jsx(MaxSizedBox, { maxHeight: availableBodyContentHeight(), maxWidth: warningContentWidth, overflowDirection: "bottom", children: infoProps.prompt.split('\n').map((line, index) => (_jsx(Box, { children: _jsx(Text, { color: theme.text.link, wrap: "wrap", children: line }) }, index))) })) : (_jsx(Text, { color: theme.text.link, children: _jsx(RenderInline, { text: infoProps.prompt, textColor: theme.text.link }) })), displayUrls && infoProps.urls && infoProps.urls.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.primary, children: t('URLs to fetch:') }), infoProps.urls.map((url) => (_jsxs(Text, { children: [' ', "- ", _jsx(RenderInline, { text: url })] }, url)))] }))] }));
    }
    else if (confirmationDetails.type === 'ask_user_question') {
        // Use dedicated dialog for ask_user_question type
        return (_jsx(AskUserQuestionDialog, { confirmationDetails: confirmationDetails, isFocused: isFocused, availableWidth: contentWidth, onConfirm: onConfirm }));
    }
    else {
        // mcp tool confirmation
        const mcpProps = confirmationDetails;
        bodyContent = (_jsxs(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, children: [_jsx(Text, { color: theme.text.link, children: t('MCP Server: {{server}}', { server: mcpProps.serverName }) }), _jsx(Text, { color: theme.text.link, children: t('Tool: {{tool}}', { tool: mcpProps.toolName }) })] }));
        question = t('Allow execution of MCP tool "{{tool}}" from server "{{server}}"?', {
            tool: mcpProps.toolName,
            server: mcpProps.serverName,
        });
        options.push({
            label: t('Yes, allow once'),
            value: ToolConfirmationOutcome.ProceedOnce,
            key: 'Yes, allow once',
        });
        if (isTrustedFolder && !confirmationDetails.hideAlwaysAllow) {
            const friendlyLabel = mcpProps.permissionRules?.length
                ? ` ${buildHumanReadableRuleLabel(mcpProps.permissionRules)}`
                : '';
            options.push({
                label: friendlyLabel
                    ? t('Always allow {{action}} in this project', {
                        action: friendlyLabel.trim(),
                    })
                    : t('Always allow in this project'),
                value: ToolConfirmationOutcome.ProceedAlwaysProject,
                key: 'Always allow in this project',
            });
            options.push({
                label: friendlyLabel
                    ? t('Always allow {{action}} for this user', {
                        action: friendlyLabel.trim(),
                    })
                    : t('Always allow for this user'),
                value: ToolConfirmationOutcome.ProceedAlwaysUser,
                key: 'Always allow for this user',
            });
        }
        options.push({
            label: t('No, suggest changes (esc)'),
            value: ToolConfirmationOutcome.Cancel,
            key: 'No, suggest changes (esc)',
        });
    }
    if (autoModeFallback) {
        const cancelIndex = options.findIndex((option) => option.value === ToolConfirmationOutcome.Cancel);
        const switchOption = {
            key: 'switch-default-and-proceed-once',
            label: t('Switch to Default Mode and allow once (recommended)'),
            value: ToolConfirmationOutcome.ProceedOnceAndSwitchToDefault,
        };
        options.splice(cancelIndex === -1 ? options.length : cancelIndex, 0, switchOption);
        bodyContent = (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { paddingX: 1, marginLeft: 1, marginBottom: 1, children: _jsxs(Text, { color: theme.status.warning, children: ["\u26A0 ", autoModeFallback.message] }) }), bodyContent] }));
    }
    // For exec/mcp confirmations the type-specific question text would
    // restate what the body already shows (the full command, or the labeled
    // server + tool). Use the generic prompt so the question line acts as a
    // body→options transition without duplicating information.
    const renderedQuestion = compactMode &&
        (confirmationDetails.type === 'exec' || confirmationDetails.type === 'mcp')
        ? t('Do you want to proceed?')
        : question;
    // Compact mode trims the option list to a fixed 3-option set (the
    // project/user-scope "Always allow" variants would clutter the inline
    // subagent banner) but still shows the per-type body and question so the
    // parent knows what is being approved.
    const renderedOptions = compactMode
        ? [
            {
                key: 'proceed-once',
                label: t('Yes, allow once'),
                value: ToolConfirmationOutcome.ProceedOnce,
            },
            ...(autoModeFallback
                ? [
                    {
                        key: 'switch-default-and-proceed-once',
                        label: t('Switch to Default Mode and allow once (recommended)'),
                        value: ToolConfirmationOutcome.ProceedOnceAndSwitchToDefault,
                    },
                ]
                : []),
            ...(!confirmationDetails.hideAlwaysAllow
                ? [
                    {
                        key: 'proceed-always',
                        label: t('Allow always'),
                        value: ToolConfirmationOutcome.ProceedAlways,
                    },
                ]
                : []),
            {
                key: 'cancel',
                label: t('No'),
                value: ToolConfirmationOutcome.Cancel,
            },
        ]
        : options;
    // Compact mode strips outer padding, inter-section margins, and explicit
    // width — the parent (SubagentExecutionRenderer) already provides those.
    const outerPadding = compactMode ? 0 : 1;
    const sectionMargin = compactMode ? 0 : 1;
    const outerWidth = compactMode ? undefined : contentWidth;
    return (_jsxs(Box, { flexDirection: "column", padding: outerPadding, width: outerWidth, children: [_jsx(Box, { flexGrow: 1, flexShrink: 1, overflow: "hidden", marginBottom: sectionMargin, children: bodyContent }), _jsx(Box, { marginBottom: sectionMargin, flexShrink: 0, children: _jsx(Text, { color: theme.text.primary, wrap: "truncate", children: renderedQuestion }) }), _jsx(Box, { flexShrink: 0, children: _jsx(RadioButtonSelect, { items: renderedOptions, onSelect: handleSelect, isFocused: isFocused }) })] }));
};
//# sourceMappingURL=ToolConfirmationMessage.js.map