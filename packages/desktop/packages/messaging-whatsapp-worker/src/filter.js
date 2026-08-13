/**
 * Pure filter helpers used by the WA worker's `messages.upsert` handler.
 *
 * Extracted from `worker.ts` so the classification logic can be unit
 * tested without importing the worker entry (which installs stdin and
 * signal handlers on module load).
 */
/**
 * Normalize a Baileys JID so `sock.user.id` (which may carry a device
 * suffix like `num:10@s.whatsapp.net`) compares equal to the plain
 * `num@s.whatsapp.net` form used in `key.remoteJid` for the self-chat.
 */
export function bareJid(jid) {
    if (!jid)
        return null;
    const at = jid.indexOf('@');
    if (at === -1)
        return jid;
    const localPart = jid.slice(0, at);
    const colon = localPart.indexOf(':');
    if (colon === -1)
        return jid;
    return localPart.slice(0, colon) + jid.slice(at);
}
/**
 * Extract the visible text from a Baileys message. Covers the subset of
 * content types we care about: plain conversation, extended text,
 * captions on image/doc/video.
 */
export function extractText(msg) {
    const m = msg.message;
    if (!m)
        return '';
    const conv = m.conversation;
    if (conv)
        return conv;
    const ext = m.extendedTextMessage;
    if (typeof ext?.text === 'string')
        return ext.text;
    const img = m.imageMessage;
    if (typeof img?.caption === 'string')
        return img.caption;
    const doc = m.documentMessage;
    if (typeof doc?.caption === 'string')
        return doc.caption;
    const vid = m.videoMessage;
    if (typeof vid?.caption === 'string')
        return vid.caption;
    return '';
}
/**
 * True when `remoteJid` is the account's self-chat (compared against the
 * phone-number JID and the LID form, both stripped of device suffix).
 */
function isSelfChatJid(remoteJid, selfJid, selfLid) {
    const bareRemote = bareJid(remoteJid);
    if (bareRemote === null)
        return false;
    if (selfJid !== null && bareRemote === selfJid)
        return true;
    if (selfLid !== null && bareRemote === selfLid)
        return true;
    return false;
}
/**
 * Decide what to do with a single upsert message.
 *
 * Semantics of `selfChatMode`: "only operate in the account's self-chat."
 * Both directions are gated symmetrically — outbound from other devices AND
 * inbound from contacts are dropped when they are not in the self-chat.
 *
 * Precedence for `fromMe=true`:
 *   1. id in sentIds         → skip (our own echo, primary defence)
 *   2. not self-chat          → skip (user's outbound in normal chats)
 *   3. prefix match           → skip (echo backup defence)
 *   4. empty                  → skip
 *   5. otherwise              → emit (phone/desktop typing in self-chat)
 *
 * For `fromMe=false`:
 *   1. selfChatMode on AND not self-chat → skip (contacts/groups DMing us)
 *   2. empty                              → skip
 *   3. otherwise                          → emit
 */
export function classifyInbound(msg, ctx) {
    const key = msg.key;
    if (!key || !key.remoteJid || !key.id)
        return { action: 'skip', reason: 'malformed' };
    const text = extractText(msg);
    const inSelfChat = isSelfChatJid(key.remoteJid, ctx.selfJid, ctx.selfLid);
    if (key.fromMe) {
        if (ctx.sentIds.has(key.id))
            return { action: 'skip', reason: 'own_echo_id' };
        if (!ctx.selfChatMode || !inSelfChat)
            return { action: 'skip', reason: 'own_outbound' };
        if (ctx.responsePrefix && text.startsWith(ctx.responsePrefix)) {
            return { action: 'skip', reason: 'own_echo_prefix' };
        }
        if (!text)
            return { action: 'skip', reason: 'empty' };
        return { action: 'emit', text };
    }
    if (ctx.selfChatMode && !inSelfChat) {
        return { action: 'skip', reason: 'non_self_chat_inbound' };
    }
    if (!text)
        return { action: 'skip', reason: 'empty' };
    return { action: 'emit', text };
}
/** Cap the sent-ID set so long-running sessions don't leak memory. */
export const MAX_SENT_IDS = 500;
/**
 * Insert `id` into the bounded sent-ID set. `Set` preserves insertion order
 * so the oldest entry is `values().next().value` — evict it when we
 * overflow.
 */
export function rememberSentId(sentIds, id) {
    sentIds.add(id);
    if (sentIds.size > MAX_SENT_IDS) {
        const oldest = sentIds.values().next().value;
        if (oldest !== undefined)
            sentIds.delete(oldest);
    }
}
//# sourceMappingURL=filter.js.map