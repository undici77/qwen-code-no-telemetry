import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * AutomationInfoPage
 *
 * Detail view for a selected automation, using the Info_Page compound component system.
 * Follows SourceInfoPage pattern: Hero → Sections (When, Then, Settings, History, JSON).
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { PauseCircle, AlertCircle } from 'lucide-react';
import { Info_Page, Info_Section, Info_Table, Info_Alert, Info_Badge, Info_Markdown, } from '@/components/info';
import { EditPopover, EditButton, getEditConfig, } from '@/components/ui/EditPopover';
import { useActiveWorkspace } from '@/context/AppShellContext';
import { AutomationAvatar } from './AutomationAvatar';
import { AutomationMenu } from './AutomationMenu';
import { AutomationActionRow } from './AutomationActionRow';
import { AutomationTestPanel } from './AutomationTestPanel';
import { AutomationEventTimeline } from './AutomationEventTimeline';
import { PhaseBadge } from './PhaseBadge';
import { getEventDisplayName, getPermissionDisplayName, flattenConditions, } from './types';
import { describeCron, computeNextRuns } from './utils';
import { FEATURE_FLAGS } from '@craft-agent/shared/feature-flags';
export function AutomationInfoPage({ automation, executions = [], testResult, onToggleEnabled, onTest, onDuplicate, onDelete, onReplay, className, }) {
    const { t } = useTranslation();
    const workspace = useActiveWorkspace();
    const nextRuns = automation.cron ? computeNextRuns(automation.cron) : [];
    const editActions = workspace?.rootPath ? (_jsx(EditPopover, { trigger: _jsx(EditButton, {}), ...getEditConfig('automation-config', workspace.rootPath), secondaryAction: {
            label: t('automations.editFile'),
            filePath: `${workspace.rootPath}/automations.json`,
        } })) : undefined;
    return (_jsxs(Info_Page, { className: className, children: [_jsx(Info_Page.Header, { title: automation.name, titleMenu: _jsx(AutomationMenu, { automationId: automation.id, automationName: automation.name, enabled: automation.enabled, onToggleEnabled: onToggleEnabled, onTest: onTest, onDuplicate: onDuplicate, onDelete: onDelete }) }), _jsxs(Info_Page.Content, { children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx(Info_Page.Hero, { avatar: _jsx(AutomationAvatar, { event: automation.event, fluid: true }), title: automation.name, tagline: automation.summary }), editActions] }), !automation.enabled && (_jsxs(Info_Alert, { variant: "warning", icon: _jsx(PauseCircle, { className: "h-4 w-4" }), children: [_jsx(Info_Alert.Title, { children: t('automations.pausedTitle') }), _jsx(Info_Alert.Description, { children: t('automations.pausedDescription') })] })), _jsx(Info_Section, { title: t('automations.sectionWhen'), description: t('automations.sectionWhenDescription'), actions: editActions, children: _jsxs(Info_Table, { children: [_jsx(Info_Table.Row, { label: t('automations.labelEvent'), children: _jsx(Info_Badge, { color: "default", children: getEventDisplayName(automation.event) }) }), _jsx(Info_Table.Row, { label: t('automations.labelTiming'), children: _jsx(PhaseBadge, { event: automation.event }) }), automation.matcher && (_jsx(Info_Table.Row, { label: t('automations.labelOnlyWhenMatching'), children: _jsx("code", { className: "text-xs font-mono bg-foreground/5 px-1.5 py-0.5 rounded", children: automation.matcher }) })), automation.cron && (_jsxs(_Fragment, { children: [_jsx(Info_Table.Row, { label: t('automations.labelRepeats'), value: describeCron(automation.cron) }), _jsx(Info_Table.Row, { label: t('automations.labelScheduleExpression'), children: _jsx("code", { className: "text-xs font-mono bg-foreground/5 px-1.5 py-0.5 rounded", children: automation.cron }) }), nextRuns.length > 0 && (_jsx(Info_Table.Row, { label: t('automations.labelNextRuns'), children: _jsx("div", { className: "flex flex-col gap-0.5", children: (() => {
                                                    const spansYears = nextRuns.length > 1 &&
                                                        nextRuns[0].getFullYear() !==
                                                            nextRuns[nextRuns.length - 1].getFullYear();
                                                    return nextRuns.map((date, i) => (_jsxs("span", { className: "text-sm text-foreground/70", children: [date.toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                ...(spansYears && { year: 'numeric' }),
                                                            }), ' ', date.toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: false,
                                                            })] }, i)));
                                                })() }) })), _jsx(Info_Table.Row, { label: t('automations.labelTimezone'), value: automation.timezone || t('automations.systemDefault') })] }))] }) }), automation.conditions && automation.conditions.length > 0 && (_jsx(Info_Section, { title: t('automations.sectionIf'), description: t('automations.sectionIfDescription'), actions: editActions, children: _jsx(Info_Table, { children: flattenConditions(automation.conditions).map((row, i) => (_jsx(Info_Table.Row, { label: row.label, children: _jsx("span", { className: "text-sm text-foreground/70", children: row.description }) }, i))) }) })), _jsx(Info_Section, { title: t('automations.sectionThen'), description: t('automations.sectionThenDescription', {
                            count: automation.actions.length,
                        }), actions: editActions, children: _jsx("div", { className: "divide-y divide-border/30", children: automation.actions.map((action, i) => (_jsx(AutomationActionRow, { action: action, index: i }, i))) }) }), testResult && testResult.state !== 'idle' && (_jsx(AutomationTestPanel, { result: testResult })), _jsx(Info_Section, { title: t('automations.sectionSettings'), actions: editActions, children: _jsxs(Info_Table, { children: [_jsx(Info_Table.Row, { label: t('automations.labelAccessLevel'), value: getPermissionDisplayName(automation.permissionMode) }), _jsx(Info_Table.Row, { label: t('automations.labelStatus'), children: _jsx(Info_Badge, { color: automation.enabled ? 'success' : 'muted', children: automation.enabled
                                            ? t('automations.statusActive')
                                            : t('automations.statusDisabled') }) }), FEATURE_FLAGS.sessionLabelsUi &&
                                    automation.labels &&
                                    automation.labels.length > 0 && (_jsx(Info_Table.Row, { label: t('automations.labelLabels'), children: _jsx("div", { className: "flex gap-1.5 flex-wrap", children: automation.labels.map((l) => (_jsx(Info_Badge, { color: "muted", children: l }, l))) }) }))] }) }), _jsx(Info_Section, { title: t('automations.sectionRecentActivity'), description: executions.length > 0
                            ? t('automations.lastNRuns', { count: executions.length })
                            : undefined, children: _jsx(AutomationEventTimeline, { entries: executions, onReplay: onReplay }) }), _jsx(Info_Section, { title: t('automations.sectionRawConfig'), children: _jsx("div", { className: "rounded-[8px] shadow-minimal overflow-hidden [&_pre]:!bg-transparent [&_.relative]:!bg-transparent [&_.relative]:!border-0 [&_.relative>div:first-child]:!bg-transparent [&_.relative>div:first-child]:!border-0", children: _jsx(Info_Markdown, { maxHeight: 300, fullscreen: true, children: `\`\`\`json\n${JSON.stringify({
                                    event: automation.event,
                                    matcher: automation.matcher,
                                    conditions: automation.conditions,
                                    cron: automation.cron,
                                    timezone: automation.timezone,
                                    permissionMode: automation.permissionMode,
                                    ...(FEATURE_FLAGS.sessionLabelsUi
                                        ? { labels: automation.labels }
                                        : {}),
                                    enabled: automation.enabled,
                                    actions: automation.actions,
                                }, null, 2)}\n\`\`\`` }) }) })] })] }));
}
//# sourceMappingURL=AutomationInfoPage.js.map