/**
 * Renderer — converts SessionManager events into chat messages.
 *
 * Three modes selected per binding via `BindingConfig.responseMode`:
 *
 *   - `streaming` (legacy): on Telegram, posts on first `text_delta` and
 *     edits every ~editIntervalMs as tokens arrive; each `text_complete`
 *     finalises the current message, so one agent run with multiple turns
 *     produces multiple messages. On platforms without editing, accumulates
 *     per turn and sends on each `text_complete`.
 *
 *   - `progress` (default): one evolving message per run. Posts
 *     "💭 thinking…" on first activity, edits to "🔧 <tool>…" on each
 *     `tool_start`, back to "💭 thinking…" on `tool_result`, and replaces
 *     the whole bubble with the final text on `complete`. Intermediate
 *     assistant text (`text_complete` with `isIntermediate`) is dropped.
 *     On adapters without `messageEditing`, degrades to a single
 *     send-on-complete (identical to `final_only`).
 *
 *   - `final_only`: silent until `complete`, then sends one message with
 *     the accumulated final text. Nothing is sent for empty completions.
 *
 * Permissions and errors are orthogonal: when the session requests a
 * permission or an error fires, the renderer flushes current mode state
 * and emits the prompt/error as a distinct message regardless of mode.
 */
const DEFAULT_EDIT_INTERVAL_MS = 3500;
const BACKOFF_RESET_MS = 30_000;
const THINKING_LABEL = '💭 thinking…';
/**
 * Max characters rendered inline with the buttons before we spill the full
 * plan into an attached file. Telegram's hard cap is 4096 — leaving margin
 * for the header, buttons, and formatting.
 */
const PLAN_INLINE_LIMIT = 3500;
export class Renderer {
    /** Per-binding render state. Keyed by binding.id */
    states = new Map();
    planTokens;
    recordPlanMessage;
    constructor(deps) {
        this.planTokens = deps?.planTokens;
        this.recordPlanMessage = deps?.recordPlanMessage;
    }
    getState(bindingId) {
        let state = this.states.get(bindingId);
        if (!state) {
            state = {
                textBuffer: '',
                processing: false,
                streamingMessageId: null,
                editTimer: null,
                lastEditedLength: 0,
                currentEditIntervalMs: DEFAULT_EDIT_INTERVAL_MS,
                finalBuffer: '',
                progressMessageId: null,
                progressStatus: null,
            };
            this.states.set(bindingId, state);
        }
        return state;
    }
    /** Handle an outbound session event for a specific binding. */
    async handle(event, binding, adapter) {
        // Permission / error prompts are mode-agnostic — handle first so they
        // can't be swallowed by mode state.
        if (event.type === 'permission_request') {
            await this.handlePermissionRequest(event, binding, adapter, this.getState(binding.id));
            return;
        }
        if (event.type === 'credential_request') {
            await this.handleCredentialRequest(binding, adapter);
            return;
        }
        if (event.type === 'plan_submitted') {
            await this.handlePlanSubmitted(event, binding, adapter);
            return;
        }
        if (event.type === 'error' || event.type === 'typed_error') {
            await this.handleError(event, binding, adapter, this.getState(binding.id));
            return;
        }
        const mode = resolveResponseMode(binding.config.responseMode, binding.config.streamResponses);
        switch (mode) {
            case 'streaming':
                return this.handleStreaming(event, binding, adapter);
            case 'progress':
                return this.handleProgress(event, binding, adapter);
            case 'final_only':
                return this.handleFinalOnly(event, binding, adapter);
        }
    }
    // ---------------------------------------------------------------------------
    // Mode: streaming (legacy behaviour — unchanged)
    // ---------------------------------------------------------------------------
    async handleStreaming(event, binding, adapter) {
        const state = this.getState(binding.id);
        switch (event.type) {
            case 'text_delta': {
                const delta = typeof event.delta === 'string' ? event.delta : '';
                if (!delta)
                    break;
                state.textBuffer += delta;
                state.processing = true;
                if (adapter.capabilities.messageEditing) {
                    await this.handleStreamingDelta(state, binding, adapter);
                }
                break;
            }
            case 'text_complete': {
                const text = typeof event.text === 'string' ? event.text : state.textBuffer;
                this.cancelEditTimer(state);
                if (state.streamingMessageId && adapter.capabilities.messageEditing) {
                    if (text.trim()) {
                        await this.tryEditMessage(adapter, binding.channelId, state.streamingMessageId, text.trim(), state);
                    }
                }
                else if (text.trim()) {
                    await this.sendText(adapter, binding, text.trim());
                }
                state.textBuffer = '';
                state.streamingMessageId = null;
                state.lastEditedLength = 0;
                break;
            }
            case 'complete': {
                this.cancelEditTimer(state);
                if (state.textBuffer.trim() && !state.streamingMessageId) {
                    await this.sendText(adapter, binding, state.textBuffer.trim());
                }
                this.resetRun(state);
                break;
            }
            case 'tool_start': {
                if (binding.config.showToolActivity) {
                    const toolName = typeof event.toolName === 'string' ? event.toolName : 'tool';
                    const displayName = typeof event.toolDisplayName === 'string' ? event.toolDisplayName : toolName;
                    if (state.streamingMessageId && state.textBuffer.trim()) {
                        this.cancelEditTimer(state);
                        await this.tryEditMessage(adapter, binding.channelId, state.streamingMessageId, state.textBuffer.trim(), state);
                        state.streamingMessageId = null;
                        state.textBuffer = '';
                        state.lastEditedLength = 0;
                    }
                    await adapter.sendText(binding.channelId, `🔧 ${displayName}...`);
                }
                else {
                    await adapter.sendTyping(binding.channelId).catch(() => { });
                }
                break;
            }
        }
    }
    async handleStreamingDelta(state, binding, adapter) {
        if (!state.streamingMessageId && state.textBuffer.length > 0) {
            try {
                const sent = await adapter.sendText(binding.channelId, state.textBuffer);
                state.streamingMessageId = sent.messageId;
                state.lastEditedLength = state.textBuffer.length;
                this.scheduleEdit(state, binding, adapter);
            }
            catch {
                // If posting fails, accumulate and try on complete
            }
            return;
        }
        // Subsequent chunks: edit timer handles batched updates
    }
    scheduleEdit(state, binding, adapter) {
        if (state.editTimer)
            return;
        const intervalMs = Math.max(binding.config.editIntervalMs, state.currentEditIntervalMs);
        state.editTimer = setTimeout(async () => {
            state.editTimer = null;
            if (!state.streamingMessageId)
                return;
            if (state.textBuffer.length <= state.lastEditedLength)
                return;
            const text = state.textBuffer.trim();
            if (!text)
                return;
            await this.tryEditMessage(adapter, binding.channelId, state.streamingMessageId, text, state);
            state.lastEditedLength = state.textBuffer.length;
            if (state.processing) {
                this.scheduleEdit(state, binding, adapter);
            }
        }, intervalMs);
    }
    // ---------------------------------------------------------------------------
    // Mode: progress (new default — single evolving message per run)
    // ---------------------------------------------------------------------------
    async handleProgress(event, binding, adapter) {
        const state = this.getState(binding.id);
        switch (event.type) {
            case 'text_delta':
                // Tokens are not shown in progress mode — we wait for text_complete.
                return;
            case 'text_complete': {
                const isIntermediate = Boolean(event.isIntermediate);
                const text = typeof event.text === 'string' ? event.text : '';
                if (!isIntermediate && text.trim()) {
                    // Last assistant text of the run — keep it for the final edit.
                    state.finalBuffer = appendFinal(state.finalBuffer, text);
                }
                // Intermediate text is dropped. Make sure the bubble exists and shows
                // thinking status so the user knows the run is alive.
                await this.ensureProgressBubble(state, binding, adapter, THINKING_LABEL);
                return;
            }
            case 'tool_start': {
                const toolName = typeof event.toolName === 'string' ? event.toolName : 'tool';
                const displayName = typeof event.toolDisplayName === 'string' && event.toolDisplayName.length > 0
                    ? event.toolDisplayName
                    : toolName;
                await this.ensureProgressBubble(state, binding, adapter, `🔧 ${displayName}…`);
                return;
            }
            case 'tool_result': {
                // Tool finished — revert the indicator to thinking until the next
                // tool_start or text_complete. Skip if we haven't posted yet (unlikely).
                if (state.progressMessageId) {
                    await this.ensureProgressBubble(state, binding, adapter, THINKING_LABEL);
                }
                return;
            }
            case 'complete': {
                const finalText = state.finalBuffer.trim();
                if (state.progressMessageId && adapter.capabilities.messageEditing) {
                    if (finalText) {
                        await this.tryEditMessage(adapter, binding.channelId, state.progressMessageId, truncateForAdapter(finalText, adapter), state);
                    }
                    // If the run ended with no final text, leave the last status in
                    // place rather than deleting/editing to an empty string — avoids
                    // Telegram "message is not modified" errors and keeps a trace.
                }
                else if (finalText) {
                    // Adapter can't edit (WhatsApp) — send one message at the end.
                    await this.sendText(adapter, binding, finalText);
                }
                this.resetRun(state);
                return;
            }
        }
    }
    /**
     * Post the progress bubble if needed, and edit it to `status` if the
     * status has changed since the last write. Collapses redundant edits so
     * we stay under Telegram's per-chat edit budget.
     */
    async ensureProgressBubble(state, binding, adapter, status) {
        if (!state.progressMessageId) {
            try {
                const sent = await adapter.sendText(binding.channelId, status);
                state.progressMessageId = sent.messageId;
                state.progressStatus = status;
            }
            catch {
                // If posting fails, we'll try again on the next event.
            }
            return;
        }
        if (!adapter.capabilities.messageEditing)
            return;
        if (state.progressStatus === status)
            return;
        await this.tryEditMessage(adapter, binding.channelId, state.progressMessageId, status, state);
        state.progressStatus = status;
    }
    // ---------------------------------------------------------------------------
    // Mode: final_only (silent → single send on complete)
    // ---------------------------------------------------------------------------
    async handleFinalOnly(event, binding, adapter) {
        const state = this.getState(binding.id);
        switch (event.type) {
            case 'text_complete': {
                // Only keep non-intermediate text. `isIntermediate` is a hint; when
                // absent (older events or other backends), we include the text
                // because it's the only thing we might ever see.
                const isIntermediate = Boolean(event.isIntermediate);
                const text = typeof event.text === 'string' ? event.text : '';
                if (!isIntermediate && text.trim()) {
                    state.finalBuffer = appendFinal(state.finalBuffer, text);
                }
                return;
            }
            case 'complete': {
                const finalText = state.finalBuffer.trim();
                if (finalText) {
                    await this.sendText(adapter, binding, finalText);
                }
                this.resetRun(state);
                return;
            }
        }
        // text_delta, tool_start, tool_result — all deliberately ignored.
    }
    // ---------------------------------------------------------------------------
    // Permissions / errors (shared across modes)
    // ---------------------------------------------------------------------------
    async handlePermissionRequest(event, binding, adapter, state) {
        const request = event.request;
        if (!request?.requestId)
            return;
        // Flush any streaming state first so the prompt lands as a distinct
        // message (progress-mode bubble stays in place as a separate message).
        if (state.streamingMessageId && state.textBuffer.trim()) {
            this.cancelEditTimer(state);
            await this.tryEditMessage(adapter, binding.channelId, state.streamingMessageId, state.textBuffer.trim(), state);
            state.streamingMessageId = null;
            state.textBuffer = '';
            state.lastEditedLength = 0;
        }
        if (binding.platform === 'whatsapp') {
            await adapter.sendText(binding.channelId, `⏸ Permission required: ${request.description}
Approve it in the desktop app to continue.`);
            return;
        }
        if (binding.config.approvalChannel === 'chat' && adapter.capabilities.inlineButtons) {
            const text = formatPermissionText(request);
            const buttons = [
                { id: `perm:allow:${request.requestId}`, label: '✅ Allow' },
                { id: `perm:deny:${request.requestId}`, label: '❌ Deny' },
            ];
            await adapter.sendButtons(binding.channelId, text, buttons);
        }
        else {
            await adapter.sendText(binding.channelId, `⏸ Permission required: ${request.description}
Approve in the desktop app to continue.`);
        }
    }
    async handleCredentialRequest(binding, adapter) {
        if (binding.platform !== 'whatsapp')
            return;
        await adapter.sendText(binding.channelId, '🔐 Credentials are required to continue. Open the desktop app to review and submit them securely.');
    }
    async handlePlanSubmitted(event, binding, adapter) {
        // WhatsApp: no interactive buttons yet — keep the generic pointer.
        if (binding.platform === 'whatsapp') {
            await adapter.sendText(binding.channelId, '📝 A plan is ready for review. Open the desktop app to inspect and approve it.');
            return;
        }
        if (binding.platform !== 'telegram')
            return;
        // Token registry is optional for backwards compatibility; without it we
        // degrade to the generic pointer so Telegram still sees *something*.
        if (!this.planTokens) {
            await adapter.sendText(binding.channelId, '📝 A plan is ready for review. Open the desktop app to inspect and approve it.');
            return;
        }
        const planMessage = event.message;
        const planPath = planMessage?.planPath ?? '';
        const planContent = planMessage?.content ?? '';
        const token = this.planTokens.issue(binding.id, binding.sessionId, planPath);
        const buttons = [
            { id: `plan:accept:${token}`, label: '✅ Accept plan' },
            { id: `plan:compact:${token}`, label: '♻️ Accept & compact' },
        ];
        const header = '📝 *Plan ready for review*';
        const fitsInline = planContent.length > 0 && planContent.length <= PLAN_INLINE_LIMIT;
        const bodyText = fitsInline
            ? `${header}\n\n${planContent}`
            : planContent.length === 0
                ? `${header}\n\nOpen the desktop app to see the plan, or use the buttons below to accept.`
                : `${header}\n\n${firstLines(planContent, 15)}\n\n…full plan attached below.`;
        try {
            const sent = await adapter.sendButtons(binding.channelId, bodyText, buttons);
            this.recordPlanMessage?.(binding, token, sent.messageId);
            if (!fitsInline && planContent.length > 0) {
                await adapter.sendFile(binding.channelId, Buffer.from(planContent, 'utf-8'), 'plan.md', 'Full plan');
            }
        }
        catch (err) {
            // Fall back to a plain text notice so the user at least knows.
            await adapter.sendText(binding.channelId, `📝 A plan is ready for review (couldn't render inline: ${err instanceof Error ? err.message : 'unknown error'}). Open the desktop app to approve it.`);
        }
    }
    async handleError(event, binding, adapter, state) {
        const errorMsg = extractErrorMessage(event.error);
        this.cancelEditTimer(state);
        await adapter.sendText(binding.channelId, `❌ ${errorMsg}`);
        this.resetRun(state);
    }
    // ---------------------------------------------------------------------------
    // Adapter helpers
    // ---------------------------------------------------------------------------
    async tryEditMessage(adapter, channelId, messageId, text, state) {
        const truncated = truncateForAdapter(text, adapter);
        try {
            await adapter.editMessage(channelId, messageId, truncated);
            state.currentEditIntervalMs = DEFAULT_EDIT_INTERVAL_MS;
        }
        catch (err) {
            const is429 = err instanceof Error &&
                (err.message.includes('429') || err.message.includes('Too Many Requests'));
            if (is429) {
                state.currentEditIntervalMs = Math.min(state.currentEditIntervalMs * 2, 15_000);
                setTimeout(() => {
                    state.currentEditIntervalMs = DEFAULT_EDIT_INTERVAL_MS;
                }, BACKOFF_RESET_MS);
            }
            // Other errors: silently skip — text_complete / complete will retry.
        }
    }
    cancelEditTimer(state) {
        if (state.editTimer) {
            clearTimeout(state.editTimer);
            state.editTimer = null;
        }
    }
    /** Reset per-run state (called on `complete`, `error`, etc.). */
    resetRun(state) {
        this.cancelEditTimer(state);
        state.textBuffer = '';
        state.streamingMessageId = null;
        state.lastEditedLength = 0;
        state.processing = false;
        state.finalBuffer = '';
        state.progressMessageId = null;
        state.progressStatus = null;
    }
    /** Send text, splitting if it exceeds platform limits. */
    async sendText(adapter, binding, text) {
        const maxLen = adapter.capabilities.maxMessageLength;
        if (text.length <= maxLen) {
            return adapter.sendText(binding.channelId, text);
        }
        const chunks = splitText(text, maxLen);
        let last;
        for (const chunk of chunks) {
            last = await adapter.sendText(binding.channelId, chunk);
        }
        return last;
    }
    /** Clean up state for a removed binding. */
    removeBinding(bindingId) {
        const state = this.states.get(bindingId);
        if (state) {
            this.cancelEditTimer(state);
            this.states.delete(bindingId);
        }
    }
}
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resolveResponseMode(responseMode, streamResponses) {
    if (responseMode)
        return responseMode;
    // Legacy configs (pre-responseMode field): honour explicit streamResponses.
    return streamResponses === false ? 'final_only' : 'streaming';
}
function appendFinal(existing, next) {
    if (!existing)
        return next;
    return existing.endsWith('\n') ? existing + next : existing + '\n\n' + next;
}
function truncateForAdapter(text, adapter) {
    const maxLen = adapter.capabilities.maxMessageLength;
    if (text.length <= maxLen)
        return text;
    return text.slice(0, maxLen - 4) + ' ...';
}
function splitText(text, maxLen) {
    const chunks = [];
    let remaining = text;
    while (remaining.length > maxLen) {
        let splitAt = remaining.lastIndexOf('\n\n', maxLen);
        if (splitAt <= 0)
            splitAt = remaining.lastIndexOf('\n', maxLen);
        if (splitAt <= 0)
            splitAt = remaining.lastIndexOf(' ', maxLen);
        if (splitAt <= 0)
            splitAt = maxLen;
        chunks.push(remaining.slice(0, splitAt).trimEnd());
        remaining = remaining.slice(splitAt).trimStart();
    }
    if (remaining.trim()) {
        chunks.push(remaining.trim());
    }
    return chunks;
}
function extractErrorMessage(err) {
    if (typeof err === 'string')
        return err;
    if (err && typeof err === 'object' && 'message' in err) {
        const msg = err.message;
        if (typeof msg === 'string')
            return msg;
    }
    return 'An error occurred';
}
function formatPermissionText(request) {
    const lines = ['⚡ Permission required'];
    lines.push(`Tool: ${request.toolName}`);
    if (request.command)
        lines.push(`Command: ${request.command}`);
    if (request.description)
        lines.push(request.description);
    return lines.join('\n');
}
function firstLines(text, n) {
    const lines = text.split('\n');
    if (lines.length <= n)
        return text;
    return lines.slice(0, n).join('\n');
}
//# sourceMappingURL=renderer.js.map