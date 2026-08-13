import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment } from 'react';
import deleteIconUrl from '../assets/icons/delete.svg';
import editIconUrl from '../assets/icons/edit.svg';
import queueIconUrl from '../assets/icons/queue.svg';
import { useWebShellCustomization, } from '../customization';
import { parseUserMessageContentSafely, splitComposerTagContentByAnnotations, } from '../utils/composerTag';
import { cssUrlVar } from '../utils/cssUrlVar';
import { ReadonlyComposerTag } from './messages/UserMessage';
import styles from '../App.module.css';
const MAX_QUEUED_PROMPT_PREVIEW_CHARS = 240;
function getTagDisplayText(tag) {
    return tag.value?.trim() || tag.label?.trim() || tag.id;
}
function getQueuedPromptParts(prompt, parser) {
    if (prompt.inputAnnotations && prompt.inputAnnotations.length > 0) {
        return splitComposerTagContentByAnnotations(prompt.text, prompt.inputAnnotations).map((segment) => segment.type === 'text'
            ? segment
            : {
                type: 'tag',
                tag: segment.tag,
                preserveCustomKindLabel: true,
            });
    }
    const parsed = parseUserMessageContentSafely(prompt.text, parser, '[WebShell] failed to parse queued prompt content', { requireSourcePreservation: true });
    if (!parsed)
        return [{ type: 'text', text: prompt.text }];
    return parsed.map((part) => part.type === 'text'
        ? part
        : { type: 'tag', tag: part.tag, preserveCustomKindLabel: false });
}
function truncateQueuedPromptParts(parts) {
    const preview = [];
    let remaining = MAX_QUEUED_PROMPT_PREVIEW_CHARS;
    let truncated = false;
    for (const part of parts) {
        if (part.type === 'tag') {
            if (remaining <= 0) {
                truncated = true;
                break;
            }
            const visibleLength = getTagDisplayText(part.tag).length;
            if (visibleLength > remaining) {
                truncated = true;
                break;
            }
            preview.push(part);
            remaining -= visibleLength;
            continue;
        }
        let text = part.text.replace(/\s+/g, ' ');
        if (preview.length === 0)
            text = text.trimStart();
        if (!text)
            continue;
        if (text.length > remaining) {
            if (remaining > 0)
                preview.push({ type: 'text', text: text.slice(0, remaining) });
            truncated = true;
            break;
        }
        preview.push({ type: 'text', text });
        remaining -= text.length;
    }
    const last = preview[preview.length - 1];
    if (last?.type === 'text') {
        const text = last.text.trimEnd();
        if (text)
            last.text = text;
        else
            preview.pop();
    }
    return { parts: preview, truncated };
}
export function QueuedPromptDisplay({ prompts, t, canMutateMidTurn = false, onDelete, onEdit, onRestoreUnknown, onDiscardUnknown, }) {
    const { parseUserMessageContent, composerTagIcons, renderComposerTag, renderComposerTagTooltip, onComposerTagClick, } = useWebShellCustomization();
    if (prompts.length === 0)
        return null;
    const latestPrompt = prompts[prompts.length - 1];
    const showQueueShortcuts = latestPrompt !== undefined &&
        latestPrompt.midTurnState === undefined &&
        latestPrompt.serverState !== 'submitting' &&
        latestPrompt.serverState !== 'running' &&
        !latestPrompt.isEditing &&
        !latestPrompt.isRemoving &&
        latestPrompt.payloadCompleteness !== 'summary-only' &&
        latestPrompt.admissionOutcome !== 'unknown';
    const mayContainDuplicateAdmission = prompts.some((prompt) => prompt.admissionOutcome === 'unknown') &&
        prompts.some((prompt) => prompt.payloadCompleteness === 'summary-only' &&
            prompt.serverPromptId !== undefined);
    return (_jsxs("div", { className: styles.queuedPrompts, children: [mayContainDuplicateAdmission ? (_jsx("div", { className: styles.queuedPromptAmbiguity, role: "status", children: t('queue.mayCorrespond') })) : null, prompts.map((prompt) => {
                const preview = truncateQueuedPromptParts(getQueuedPromptParts(prompt, parseUserMessageContent));
                const imageCount = prompt.images?.length ?? 0;
                const isSubmitting = prompt.serverState === 'submitting';
                const isQueued = prompt.serverState === 'queued';
                const isRunning = prompt.serverState === 'running';
                const isMidTurnPending = prompt.midTurnState !== undefined;
                const isMidTurnLocked = prompt.midTurnState === 'submitting' ||
                    (prompt.midTurnState === 'queued' && !prompt.midTurnMessageId);
                const isSummaryOnly = prompt.payloadCompleteness === 'summary-only';
                const isAdmissionUnknown = prompt.admissionOutcome === 'unknown';
                const hasUnknownPayload = isAdmissionUnknown && prompt.payloadAvailable !== false;
                const showActions = !isMidTurnPending || canMutateMidTurn;
                const isRemoving = prompt.isRemoving === true;
                const hasStateSpinner = isSubmitting ||
                    prompt.midTurnState === 'submitting' ||
                    prompt.isEditing === true ||
                    isRemoving;
                const isBusy = isSubmitting ||
                    isRunning ||
                    isMidTurnLocked ||
                    isAdmissionUnknown ||
                    prompt.isEditing === true ||
                    isRemoving;
                const isEditDisabled = isBusy || isSummaryOnly;
                let editTitle = t('queue.editTip');
                if (isEditDisabled) {
                    editTitle = isSummaryOnly
                        ? t('queue.summaryEditDisabled')
                        : isAdmissionUnknown
                            ? t('queue.admissionUnknown')
                            : t('queue.submittingDisabled');
                }
                const deleteTitle = isBusy
                    ? t('queue.submittingDisabled')
                    : t('queue.deleteTip');
                return (_jsxs("div", { className: styles.queuedPrompt, children: [_jsx("span", { className: styles.queuedPromptIcon, "aria-hidden": "true", children: _jsx("span", { className: styles.queuedPromptMaskIcon, style: cssUrlVar('--queued-icon-url', queueIconUrl) }) }), _jsxs("span", { className: styles.queuedPromptText, children: [preview.parts.map((part, index) => part.type === 'text' ? (_jsx(Fragment, { children: part.text }, index)) : (_jsx(ReadonlyComposerTag, { tag: part.tag, composerTagIcons: composerTagIcons, renderComposerTag: renderComposerTag, renderComposerTagTooltip: renderComposerTagTooltip, onComposerTagClick: onComposerTagClick, preserveCustomKindLabel: part.preserveCustomKindLabel }, `${part.tag.id}:${index}`))), preview.truncated ? '...' : null, imageCount > 0
                                    ? ` ${t('queue.imageCount', { count: imageCount })}`
                                    : '', isAdmissionUnknown && !hasUnknownPayload
                                    ? ` ${t('queue.localCopyDiscarded')}`
                                    : ''] }), isSubmitting ||
                            isQueued ||
                            isMidTurnPending ||
                            isAdmissionUnknown ||
                            prompt.isEditing ||
                            isRemoving ? (_jsxs("span", { className: `${styles.queuedPromptState}${hasStateSpinner ? ` ${styles.queuedPromptStateLoading}` : ''}`, role: "status", children: [hasStateSpinner && (_jsx("span", { className: styles.queuedPromptSpinner })), _jsx("span", { className: styles.queuedPromptStateLabel, children: isRemoving
                                        ? t('queue.removing')
                                        : prompt.isEditing
                                            ? t('queue.editing')
                                            : isMidTurnPending
                                                ? t('queue.midTurnQueued')
                                                : isAdmissionUnknown
                                                    ? t('queue.admissionUnknown')
                                                    : isQueued
                                                        ? t('queue.serverQueued')
                                                        : t('queue.submitting') })] })) : null, _jsx("span", { className: styles.queuedPromptActions, children: hasUnknownPayload ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: styles.queuedPromptAction, onClick: () => {
                                            if (window.confirm(t('queue.continueEditingConfirm'))) {
                                                onRestoreUnknown?.(prompt.id);
                                            }
                                        }, "aria-label": t('queue.restoreUnknown'), title: t('queue.restoreUnknown'), children: t('queue.restoreUnknown') }), _jsx("button", { type: "button", className: styles.queuedPromptAction, onClick: () => onDiscardUnknown?.(prompt.id), "aria-label": t('queue.discardUnknown'), title: t('queue.discardUnknown'), children: t('queue.discardUnknown') })] })) : showActions && !isAdmissionUnknown ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", className: styles.queuedPromptAction, onClick: () => onDelete(prompt.id), disabled: isBusy, "aria-label": t('queue.delete'), title: deleteTitle, children: _jsx("span", { className: styles.queuedPromptActionIcon, style: cssUrlVar('--queued-icon-url', deleteIconUrl), "aria-hidden": "true" }) }), _jsx("button", { type: "button", className: styles.queuedPromptAction, onClick: () => onEdit(prompt.id), disabled: isEditDisabled, "aria-label": t('queue.edit'), title: editTitle, children: _jsx("span", { className: styles.queuedPromptActionIcon, style: cssUrlVar('--queued-icon-url', editIconUrl), "aria-hidden": "true" }) })] })) : null })] }, prompt.id));
            }), showQueueShortcuts ? (_jsx("div", { className: styles.queuedHint, children: t('queue.footer') })) : null] }));
}
//# sourceMappingURL=QueuedPromptDisplay.js.map