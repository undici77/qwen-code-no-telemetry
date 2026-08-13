import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useId, useState, } from 'react';
import { CheckCircle2Icon, KeyRoundIcon } from 'lucide-react';
import { useI18n } from '../../i18n';
import { extractErrorDetail } from '../../utils/errorDetail';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { Spinner } from '../ui/spinner';
import { Switch } from '../ui/switch';
import styles from './ChannelEditorDialog.module.css';
import { ChannelPairingRequests } from './ChannelPairingRequests';
import { buildChannelUpsertRequest, createChannelEditorDraft, hasDescriptorSenderPolicy, validateChannelEditorDraft, } from './channel-editor-state';
import { PLATFORM_MARKS } from './channel-platform';
const FIELD_LABEL_KEYS = {
    dingtalk: {
        clientId: 'channels.editor.field.dingtalk.clientId',
        clientSecret: 'channels.editor.field.dingtalk.clientSecret',
    },
    wecom: {
        botId: 'channels.editor.field.wecom.botId',
        secret: 'channels.editor.field.wecom.secret',
        wsUrl: 'channels.editor.field.wecom.wsUrl',
    },
    feishu: {
        clientId: 'channels.editor.field.feishu.clientId',
        clientSecret: 'channels.editor.field.feishu.clientSecret',
    },
    github: {
        token: 'channels.editor.field.github.token',
        useLocalGh: 'channels.editor.field.github.useLocalGh',
        baseUrl: 'channels.editor.field.github.baseUrl',
        groupPolicy: 'channels.editor.field.github.groupPolicy',
        senderPolicy: 'channels.editor.field.github.senderPolicy',
        allowedUsers: 'channels.editor.field.github.allowedUsers',
        reasonFilter: 'channels.editor.field.github.reasonFilter',
    },
    gitlab: {
        token: 'channels.editor.field.gitlab.token',
        baseUrl: 'channels.editor.field.gitlab.baseUrl',
        groupPolicy: 'channels.editor.field.gitlab.groupPolicy',
        senderPolicy: 'channels.editor.field.gitlab.senderPolicy',
        allowedUsers: 'channels.editor.field.gitlab.allowedUsers',
        action_prompt_template: 'channels.editor.field.gitlab.action_prompt_template',
    },
};
const COMMON_FIELD_LABEL_KEYS = {
    sessionScope: 'channels.editor.field.sessionScope',
};
function configuredAllowedUsers(instance) {
    const value = instance?.config['allowedUsers'];
    return Array.isArray(value)
        ? value.filter((item) => typeof item === 'string')
        : [];
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function FieldShell({ id, label, required, hint, description, error, children, }) {
    return (_jsxs("div", { className: styles.field, children: [_jsxs("div", { className: styles.fieldHeader, children: [_jsxs(Label, { htmlFor: id, children: [label, required ? (_jsx("span", { className: styles.required, "aria-hidden": "true", children: "*" })) : null] }), hint ? _jsx("span", { className: styles.hint, children: hint }) : null] }), children, description ? (_jsx("p", { className: styles.fieldDescription, children: description })) : null, error ? (_jsx("p", { role: "alert", className: "text-xs text-destructive", children: error })) : null] }));
}
export function ChannelEditorDialog({ open, descriptor, instance, expectedRevision, existingNames, onOpenChange, onSave, onReload, listPairingRequests, approvePairingRequest, listPairingApprovals, revokePairingApproval, }) {
    const { t } = useI18n();
    const formId = useId();
    const [draft, setDraft] = useState(() => createChannelEditorDraft(descriptor, instance));
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState();
    const [saving, setSaving] = useState(false);
    const [reloading, setReloading] = useState(false);
    useEffect(() => {
        if (!open)
            return;
        setDraft(createChannelEditorDraft(descriptor, instance));
        setErrors({});
        setSubmitError(undefined);
    }, [descriptor, instance, open]);
    const fieldLabelKey = (field) => FIELD_LABEL_KEYS[descriptor.type]?.[field.key] ??
        COMMON_FIELD_LABEL_KEYS[field.key];
    const fieldLabel = (field) => {
        const key = fieldLabelKey(field);
        return key ? t(key) : field.label;
    };
    const fieldDescription = (field) => {
        const labelKey = fieldLabelKey(field);
        if (labelKey) {
            const descKey = `${labelKey}.description`;
            const translated = t(descKey);
            if (translated !== descKey)
                return translated;
        }
        return field.description;
    };
    const fieldOptionLabel = (field, option) => {
        const labelKey = fieldLabelKey(field);
        if (labelKey) {
            const optionKey = `${labelKey}.option.${option.value}`;
            const translated = t(optionKey);
            if (translated !== optionKey)
                return translated;
        }
        return option.label;
    };
    const validationMessage = (field, code) => {
        if (code === 'duplicate')
            return t('channels.editor.validation.duplicate');
        if (code === 'credential')
            return t('channels.editor.validation.credential');
        if (code === 'invalid')
            return t('channels.editor.validation.invalidName');
        if (code === 'invalidOption')
            return t('channels.editor.validation.invalidOption');
        if (code === 'number')
            return t('channels.editor.validation.number');
        if (code === 'outOfRange') {
            return t('channels.editor.validation.outOfRange', {
                min: field && field.kind === 'number' ? (field.exclusiveMinimum ?? 0) : 0,
            });
        }
        if (code === 'policy')
            return t('channels.editor.validation.policy');
        return t('channels.editor.validation.required', {
            label: field ? fieldLabel(field) : t('channels.editor.instanceName'),
        });
    };
    const submit = async (event) => {
        event.preventDefault();
        const validation = validateChannelEditorDraft(descriptor, draft, existingNames);
        if (Object.keys(validation).length > 0) {
            setErrors(Object.fromEntries(Object.entries(validation).map(([key, code]) => [
                key,
                validationMessage(descriptor.fields.find((field) => field.key === key), code),
            ])));
            return;
        }
        setSaving(true);
        setSubmitError(undefined);
        try {
            await onSave(draft.name.trim(), buildChannelUpsertRequest(descriptor, draft, expectedRevision, instance));
            onOpenChange(false);
        }
        catch (error) {
            setSubmitError(extractErrorDetail(error));
        }
        finally {
            setSaving(false);
        }
    };
    const reloadLatest = async () => {
        setReloading(true);
        try {
            await onReload();
            onOpenChange(false);
        }
        catch (error) {
            setSubmitError(extractErrorDetail(error));
        }
        finally {
            setReloading(false);
        }
    };
    const renderSecret = (field) => {
        const id = `${formId}-${field.key}`;
        const stored = instance?.secrets[field.key];
        const secret = draft.secrets[field.key] ?? {
            operation: 'replace',
            value: '',
        };
        const error = errors[field.key];
        const showInput = secret.operation === 'replace';
        const operations = field.required
            ? ['preserve', 'replace']
            : ['preserve', 'replace', 'clear'];
        return (_jsxs(FieldShell, { id: id, label: fieldLabel(field), required: field.required, description: fieldDescription(field), hint: field.envResolvable
                ? t('channels.editor.environmentReference')
                : undefined, error: error, children: [stored?.present ? (_jsxs("div", { className: styles.secretState, children: [_jsxs("span", { className: styles.secretStatus, children: [_jsx(CheckCircle2Icon, { size: 15 }), stored.source === 'environment'
                                    ? t('channels.editor.secret.environment')
                                    : t('channels.editor.secret.stored')] }), _jsx("div", { className: styles.secretActions, children: operations.map((operation) => (_jsx(Button, { type: "button", size: "xs", variant: secret.operation === operation ? 'secondary' : 'ghost', "aria-pressed": secret.operation === operation, onClick: () => setDraft((current) => ({
                                    ...current,
                                    secrets: {
                                        ...current.secrets,
                                        [field.key]: operation === 'replace'
                                            ? { operation, value: '' }
                                            : { operation },
                                    },
                                })), children: t(`channels.editor.secret.${operation}`) }, operation))) })] })) : null, showInput ? (_jsx(Input, { id: id, type: "password", autoComplete: "new-password", value: secret.value ?? '', "aria-invalid": Boolean(error), "aria-required": field.required, placeholder: t('channels.editor.secret.placeholder', {
                        label: fieldLabel(field),
                    }), onChange: (event) => setDraft((current) => ({
                        ...current,
                        secrets: {
                            ...current.secrets,
                            [field.key]: {
                                operation: 'replace',
                                value: event.target.value,
                            },
                        },
                    })) })) : null, secret.operation === 'clear' ? (_jsx("p", { className: styles.hint, children: t('channels.editor.secret.clearHint') })) : null] }, field.key));
    };
    const renderField = (field) => {
        if (field.kind === 'object')
            return null;
        if (field.kind === 'secret')
            return renderSecret(field);
        const id = `${formId}-${field.key}`;
        const value = draft.values[field.key];
        const error = errors[field.key];
        const update = (next) => setDraft((current) => ({
            ...current,
            values: { ...current.values, [field.key]: next },
        }));
        if (field.kind === 'boolean') {
            return (_jsx(FieldShell, { id: id, label: fieldLabel(field), required: field.required, description: fieldDescription(field), error: error, children: _jsx(Switch, { id: id, checked: value === true, "aria-required": field.required, onCheckedChange: (checked) => update(checked) }) }, field.key));
        }
        if (field.kind === 'enum') {
            return (_jsx(FieldShell, { id: id, label: fieldLabel(field), required: field.required, description: fieldDescription(field), error: error, children: _jsxs(Select, { value: String(value ?? ''), onValueChange: update, children: [_jsx(SelectTrigger, { id: id, className: "w-full", "aria-required": field.required, children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: field.options?.map((option) => (_jsx(SelectItem, { value: option.value, children: fieldOptionLabel(field, option) }, option.value))) })] }) }, field.key));
        }
        if (field.kind === 'record') {
            let record = {};
            if (typeof value === 'string' && value) {
                try {
                    const parsed = JSON.parse(value);
                    if (isRecord(parsed)) {
                        record = parsed;
                    }
                }
                catch {
                    /* malformed — render empty */
                }
            }
            const updateRecord = (key, val) => {
                const next = { ...record, [key]: val };
                update(JSON.stringify(next));
            };
            return (_jsx(FieldShell, { id: id, label: fieldLabel(field), required: field.required, description: fieldDescription(field), error: error, children: _jsx("div", { className: styles.recordFields, children: field.options?.map((option) => {
                        const optKey = `${FIELD_LABEL_KEYS[descriptor.type]?.[field.key] ?? ''}.option.${option.value}`;
                        const translated = t(optKey);
                        const displayLabel = translated !== optKey ? translated : option.label;
                        return (_jsxs("div", { className: styles.recordRow, children: [_jsx(Label, { htmlFor: `${id}-${option.value}`, className: styles.recordLabel, children: displayLabel }), _jsx(Input, { id: `${id}-${option.value}`, value: record[option.value] ?? '', onChange: (event) => updateRecord(option.value, event.target.value) })] }, option.value));
                    }) }) }, field.key));
        }
        return (_jsx(FieldShell, { id: id, label: fieldLabel(field), required: field.required, description: fieldDescription(field), hint: field.envResolvable
                ? t('channels.editor.environmentReference')
                : undefined, error: error, children: _jsx(Input, { id: id, type: field.kind === 'number' ? 'number' : 'text', value: String(value ?? ''), "aria-invalid": Boolean(error), "aria-required": field.required, onChange: (event) => update(event.target.value) }) }, field.key));
    };
    const sessionScopeField = descriptor.fields.find((field) => field.key === 'sessionScope');
    const platformFields = descriptor.fields.filter((field) => field.key !== 'sessionScope' && field.kind !== 'object');
    return (_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-[calc(100%-2rem)] p-5 sm:max-w-xl", children: [_jsx(DialogHeader, { children: _jsxs("div", { className: styles.platformHeader, children: [_jsx("span", { className: styles.platformMark, "aria-hidden": "true", children: PLATFORM_MARKS[descriptor.type] ??
                                    descriptor.displayName[0]?.toUpperCase() ??
                                    '?' }), _jsxs("div", { children: [_jsx(DialogTitle, { children: t(instance
                                            ? 'channels.editor.editTitle'
                                            : 'channels.editor.addTitle', { platform: descriptor.displayName }) }), _jsx(DialogDescription, { className: "mt-1", children: t(instance
                                            ? 'channels.editor.editDescription'
                                            : 'channels.editor.addDescription') })] })] }) }), _jsxs("form", { className: styles.form, onSubmit: submit, children: [_jsxs("div", { className: styles.body, children: [submitError ? (_jsxs(Alert, { variant: "destructive", children: [_jsx(KeyRoundIcon, {}), _jsx(AlertTitle, { children: t('channels.editor.saveError') }), _jsx(AlertDescription, { children: submitError }), _jsxs(Button, { className: "mt-2 w-fit", type: "button", size: "sm", variant: "outline", disabled: reloading, onClick: () => void reloadLatest(), children: [reloading ? _jsx(Spinner, {}) : null, t('channels.editor.reloadLatest')] })] })) : null, _jsxs("section", { className: styles.section, children: [_jsx("h3", { className: styles.sectionHeading, children: t('channels.editor.section.identity') }), _jsx(FieldShell, { id: `${formId}-name`, label: t('channels.editor.instanceName'), required: true, error: errors['name'], children: _jsx(Input, { id: `${formId}-name`, value: draft.name, disabled: Boolean(instance), "aria-invalid": Boolean(errors['name']), "aria-required": true, placeholder: t('channels.editor.instanceNamePlaceholder'), onChange: (event) => setDraft((current) => ({
                                                    ...current,
                                                    name: event.target.value,
                                                })) }) })] }), platformFields.length > 0 ? (_jsxs("section", { className: styles.section, children: [_jsx("h3", { className: styles.sectionHeading, children: t('channels.editor.section.credentials') }), platformFields.map(renderField)] })) : null, sessionScopeField ? (_jsxs("section", { className: styles.section, children: [_jsx("h3", { className: styles.sectionHeading, children: t('channels.editor.section.session') }), renderField(sessionScopeField)] })) : null, (() => {
                                    const descriptorPolicy = hasDescriptorSenderPolicy(descriptor);
                                    const effectivePolicy = descriptorPolicy
                                        ? String(draft.values['senderPolicy'] ?? '')
                                        : draft.senderPolicy;
                                    const showRadioGroup = !descriptorPolicy;
                                    const descriptorGroupPolicy = descriptor.fields.some((field) => field.key === 'groupPolicy');
                                    const effectiveGroupPolicy = descriptorGroupPolicy
                                        ? String(draft.values['groupPolicy'] ?? '')
                                        : String(instance?.config.groupPolicy ?? '');
                                    const showPairing = effectivePolicy === 'pairing' ||
                                        effectiveGroupPolicy === 'pairing';
                                    if (!showRadioGroup && !showPairing)
                                        return null;
                                    return (_jsxs("section", { className: styles.section, children: [_jsx("h3", { className: styles.sectionHeading, children: t('channels.editor.section.access') }), showRadioGroup ? (_jsxs(_Fragment, { children: [_jsx(RadioGroup, { className: styles.policyGrid, value: draft.senderPolicy, "aria-invalid": Boolean(errors['senderPolicy']), onValueChange: (value) => setDraft((current) => ({
                                                            ...current,
                                                            senderPolicy: value === 'pairing' || value === 'open'
                                                                ? value
                                                                : '',
                                                        })), children: ['pairing', 'open'].map((policy) => (_jsxs(Label, { className: styles.policyCard, "data-selected": draft.senderPolicy === policy, children: [_jsx(RadioGroupItem, { value: policy }), _jsxs("span", { className: styles.policyCopy, children: [_jsx("span", { className: styles.policyTitle, children: t(`channels.editor.policy.${policy}.title`) }), _jsx("span", { className: styles.policyDescription, children: t(`channels.editor.policy.${policy}.description`) })] })] }, policy))) }), errors['senderPolicy'] ? (_jsx("p", { role: "alert", className: "text-xs text-destructive", children: errors['senderPolicy'] })) : null] })) : null, showPairing ? (instance?.config.senderPolicy === 'pairing' ||
                                                instance?.config.groupPolicy === 'pairing' ? (_jsx(ChannelPairingRequests, { channelName: instance.name, listRequests: listPairingRequests, approveRequest: approvePairingRequest, listApprovals: listPairingApprovals, revokeApproval: revokePairingApproval, staticAllowedUsers: configuredAllowedUsers(instance) })) : (_jsxs(Alert, { children: [_jsx(KeyRoundIcon, {}), _jsx(AlertTitle, { children: t('channels.editor.pairing.saveFirst.title') }), _jsx(AlertDescription, { children: t('channels.editor.pairing.saveFirst.description') })] }))) : null] }));
                                })()] }), _jsxs(DialogFooter, { className: "mt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), children: t('channels.editor.cancel') }), _jsxs(Button, { type: "submit", disabled: saving || reloading, children: [saving ? _jsx(Spinner, {}) : null, t('channels.editor.save')] })] })] })] }) }));
}
//# sourceMappingURL=ChannelEditorDialog.js.map