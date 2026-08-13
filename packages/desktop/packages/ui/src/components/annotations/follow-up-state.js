export function asRecord(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : null;
}
export function normalizeFollowUpText(text) {
    return text.replace(/\s+/g, ' ').trim();
}
export function getAnnotationNoteText(annotation) {
    const noteBody = annotation.body.find((body) => body.type === 'note');
    const bodyText = noteBody?.text?.trim() ?? '';
    if (bodyText.length > 0)
        return bodyText;
    const followUpMeta = asRecord(asRecord(annotation.meta)?.followUp);
    const metaText = typeof followUpMeta?.text === 'string' ? followUpMeta.text.trim() : '';
    return metaText;
}
export function getAnnotationFollowUpState(annotation) {
    const noteText = getAnnotationNoteText(annotation);
    if (!noteText)
        return 'none';
    const followUpMeta = asRecord(asRecord(annotation.meta)?.followUp);
    if (!followUpMeta)
        return 'pending';
    const sentAt = typeof followUpMeta.lastSentAt === 'number'
        ? followUpMeta.lastSentAt
        : (typeof followUpMeta.sentAt === 'number' ? followUpMeta.sentAt : null);
    const sentTextRaw = typeof followUpMeta.lastSentText === 'string'
        ? followUpMeta.lastSentText
        : (typeof followUpMeta.sentText === 'string' ? followUpMeta.sentText : '');
    const sentText = sentTextRaw.trim();
    return sentAt != null && sentText.length > 0 && sentText === noteText.trim()
        ? 'sent'
        : 'pending';
}
export function isAnnotationFollowUpSent(annotation) {
    return getAnnotationFollowUpState(annotation) === 'sent';
}
export function formatAnnotationFollowUpTooltipText(annotation, maxLength = 180) {
    const note = normalizeFollowUpText(getAnnotationNoteText(annotation));
    if (!note)
        return '';
    return note.length > maxLength
        ? `${note.slice(0, maxLength - 1).trimEnd()}…`
        : note;
}
//# sourceMappingURL=follow-up-state.js.map