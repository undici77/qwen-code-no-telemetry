export const CHANNEL_PROMPT_DISPLAY_TEXT_META_KEY = 'qwen.daemon.promptDisplayText';
export const CHANNEL_PROMPT_AUTHORIZATION_META_KEY = 'qwen.daemon.channelPromptAuthorization';
// Client-supplied routing hint only; never use it as an authorization boundary.
export const CHANNEL_PROMPT_META_KEY = 'qwen.channel.prompt';
// Private-parent capability handshake with the spawned `qwen --acp` child
// (packages/core/src/utils/invocation-context.ts owns the same constants).
// channel-base keeps a minimal dependency footprint, so the wire contract is
// pinned by value in a cross-package test instead of imported.
export const ACP_PRIVATE_PARENT_CAPABILITY_META_KEY = 'qwen-code/private-parent-capability';
export const ACP_PRIVATE_PARENT_CAPABILITY_ENV = 'QWEN_CODE_PRIVATE_ACP_CAPABILITY';
//# sourceMappingURL=ChannelAgentBridge.js.map