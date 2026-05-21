import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { DiffRenderer } from './DiffRenderer.js';
import { RenderInline } from '../../utils/InlineMarkdownRenderer.js';
import { MarkdownDisplay } from '../../utils/MarkdownDisplay.js';
import { IdeClient, ToolConfirmationOutcome, buildHumanReadableRuleLabel, } from '@qwen-code/qwen-code-core';
import { RadioButtonSelect } from '../shared/RadioButtonSelect.js';
import { MaxSizedBox } from '../shared/MaxSizedBox.js';
import { useKeypress } from '../../hooks/useKeypress.js';
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
        if (confirmationDetails.type === 'edit') {
            if (config.getIdeMode() && isDiffingEnabled) {
                const cliOutcome = outcome === ToolConfirmationOutcome.Cancel ? 'rejected' : 'accepted';
                await ideClient?.resolveDiffFromCli(confirmationDetails.filePath, cliOutcome);
            }
        }
    };
    const isTrustedFolder = config.isTrustedFolder();
    useKeypress((key) => {
        if (!isFocused)
            return;
        if (key.name === 'escape' || (key.ctrl && key.name === 'c')) {
            handleConfirm(ToolConfirmationOutcome.Cancel);
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
        const HEIGHT_OPTIONS = compactMode ? 3 : options.length;
        const surroundingElementsHeight = PADDING_OUTER_Y +
            MARGIN_BODY_BOTTOM +
            HEIGHT_QUESTION +
            MARGIN_QUESTION_BOTTOM +
            HEIGHT_OPTIONS;
        return Math.max(availableTerminalHeight - surroundingElementsHeight, 1);
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
        if (isTrustedFolder) {
            options.push({
                label: t('Yes, allow always'),
                value: ToolConfirmationOutcome.ProceedAlways,
                key: 'Yes, allow always',
            });
        }
        if ((!config.getIdeMode() || !isDiffingEnabled) && preferredEditor) {
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
        bodyContent = (_jsx(DiffRenderer, { diffContent: confirmationDetails.fileDiff, filename: confirmationDetails.fileName, availableTerminalHeight: availableBodyContentHeight(), contentWidth: contentWidth, settings: settings }));
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
        let bodyContentHeight = availableBodyContentHeight();
        if (bodyContentHeight !== undefined) {
            bodyContentHeight -= 2; // Account for padding;
        }
        if (compactMode) {
            bodyContentHeight = Math.min(bodyContentHeight ?? COMPACT_BODY_MAX_LINES, COMPACT_BODY_MAX_LINES);
        }
        bodyContent = (_jsx(Box, { flexDirection: "column", children: _jsx(Box, { paddingX: 1, marginLeft: 1, children: _jsx(MaxSizedBox, { maxHeight: bodyContentHeight, maxWidth: Math.max(contentWidth, 1), overflowDirection: "bottom", children: _jsx(Box, { children: _jsx(Text, { color: theme.text.link, children: executionProps.command }) }) }) }) }));
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
        const planHeight = compactMode
            ? Math.min(availableBodyContentHeight() ?? COMPACT_BODY_MAX_LINES, COMPACT_BODY_MAX_LINES)
            : availableBodyContentHeight();
        bodyContent = (_jsx(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, children: _jsx(MarkdownDisplay, { text: planProps.plan, isPending: false, availableTerminalHeight: planHeight, contentWidth: contentWidth }) }));
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
        bodyContent = (_jsxs(Box, { flexDirection: "column", paddingX: 1, marginLeft: 1, children: [_jsx(Text, { color: theme.text.link, children: _jsx(RenderInline, { text: infoProps.prompt, textColor: theme.text.link }) }), displayUrls && infoProps.urls && infoProps.urls.length > 0 && (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.primary, children: t('URLs to fetch:') }), infoProps.urls.map((url) => (_jsxs(Text, { children: [' ', "- ", _jsx(RenderInline, { text: url })] }, url)))] }))] }));
    }
    else if (confirmationDetails.type === 'ask_user_question') {
        // Use dedicated dialog for ask_user_question type
        return (_jsx(AskUserQuestionDialog, { confirmationDetails: confirmationDetails, isFocused: isFocused, onConfirm: onConfirm }));
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
            {
                key: 'proceed-always',
                label: t('Allow always'),
                value: ToolConfirmationOutcome.ProceedAlways,
            },
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