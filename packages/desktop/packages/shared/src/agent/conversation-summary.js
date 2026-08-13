const MAX_MESSAGE_CHARS = 500;
const MAX_TRANSCRIPT_CHARS = 12_000;
export function buildConversationSummaryTranscript(messages, options) {
    const maxMessageChars = options?.maxMessageChars ?? MAX_MESSAGE_CHARS;
    const maxTranscriptChars = options?.maxTranscriptChars ?? MAX_TRANSCRIPT_CHARS;
    const transcript = messages
        .map((message) => `${message.type === 'user' ? 'User' : 'Assistant'}: ${message.content.slice(0, maxMessageChars)}`)
        .join('\n\n');
    return transcript.slice(0, maxTranscriptChars);
}
export function buildConversationSummaryPrompt(messages) {
    if (messages.length === 0)
        return null;
    const transcript = buildConversationSummaryTranscript(messages);
    if (!transcript)
        return null;
    return ('Summarize this conversation concisely. Preserve: key decisions, ongoing tasks, ' +
        `technical context, and the user's current goal. Be specific, not generic.\n\n${transcript}`);
}
export async function generateConversationSummary(messages, runMiniCompletion) {
    const prompt = buildConversationSummaryPrompt(messages);
    if (!prompt)
        return null;
    return runMiniCompletion(prompt);
}
export function buildTransferredSessionContext(summary) {
    return `<session_transfer_summary>\nThis session was transferred from another workspace. The original conversation was summarized before transfer.\nUse the summary below as prior context for the next turn.\n\n${summary}\n</session_transfer_summary>`;
}
//# sourceMappingURL=conversation-summary.js.map