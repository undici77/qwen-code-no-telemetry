/**
 * QQ Bot API protocol types.
 * Reference: https://bot.q.qq.com/wiki/develop/api-v2/
 */
export declare const OpCode: {
    readonly DISPATCH: 0;
    readonly HEARTBEAT: 1;
    readonly IDENTIFY: 2;
    readonly RESUME: 6;
    readonly RECONNECT: 7;
    readonly INVALID_SESSION: 9;
    readonly HELLO: 10;
    readonly HEARTBEAT_ACK: 11;
};
/** QQ Bot WebSocket intents. */
export declare const Intent: {
    readonly C2C_MESSAGE: number;
    readonly GROUP_AT_MESSAGE: number;
    readonly GROUP_MESSAGE: number;
};
export interface QQMessageEvent {
    id: string;
    author: {
        /** C2C: user_openid (present). Group: member_openid (present). */
        user_openid?: string;
        /** Group messages (both @ and all): the member's openid. */
        member_openid?: string;
        /** Group: member role. */
        member_role?: string;
        /** Group: whether the author is a bot. */
        bot?: boolean;
        /** Legacy field — may not be present in all event types. */
        id?: string;
        /** Legacy field — may not be present in all event types. */
        username?: string;
    };
    content: string;
}
/** Extended fields available on group message events. */
export type QQGroupMessageEvent = QQMessageEvent & {
    group_openid: string;
    mentions?: Array<{
        id?: string;
        member_openid?: string;
        username?: string;
        is_you?: boolean;
        bot?: boolean;
        scope?: 'all' | 'single';
    }>;
};
export interface QQChannelConfig {
    appID?: string;
    appSecret?: string;
    sandbox?: boolean;
    /**
     * GROUP_MESSAGE_CREATE handling policy:
     * - 'log' (default): log only, no LLM
     * - 'keyword': trigger LLM when content includes any keywordTriggers entry
     * - 'all': trigger LLM on every group message
     */
    groupAllPolicy?: 'log' | 'keyword' | 'all';
    /** Case-insensitive keyword triggers. Only used when groupAllPolicy='keyword'. */
    keywordTriggers?: string[];
    /**
     * When true (default), raw `<@OPENID>` tags are preserved in group messages
     * sent to the LLM, allowing the model to @mention group members.
     * When false, `<@OPENID>` tags are stripped before reaching the LLM.
     */
    allowMention?: boolean;
    /** Route overrides for chat IDs that haven't been seen inbound yet.
     *  Key: chat openid (group_openid or user_openid).
     *  Value: 'group' or 'c2c'.
     *  Used by resolveRoute() as fallback when chatTypeMap has no entry.
     *  Essential for cron/scheduled messages to known groups.
     */
    chatTypes?: Record<string, 'c2c' | 'group'>;
    /** Enable experimental cron-msg features. Use at your own risk. */
    'cron-msg-experimental'?: boolean;
    /** Max buffer chars before forcing an immediate flush (stream+cron). Default 4096. */
    bufferFlushLength?: number;
    /** Max reconnect attempts before giving up. Default 20. 0 = unlimited. */
    maxReconnectAttempts?: number;
    /** Max flush retries for streaming message delivery. Default 3. 0 = unlimited. */
    maxFlushRetries?: number;
    /** Max gateway retries per reconnect cycle. Default 5. 0 = unlimited. */
    maxGwRetries?: number;
}
/** Robot added to a group. */
export interface GroupAddRobotEvent {
    group_openid: string;
    op_member_openid: string;
    timestamp: number;
}
/** Robot removed from a group. */
export interface GroupDelRobotEvent {
    group_openid: string;
    op_member_openid: string;
    timestamp: number;
}
/** Active message permission toggle. */
export interface GroupMsgToggleEvent {
    group_openid: string;
    op_member_openid: string;
    timestamp: number;
}
