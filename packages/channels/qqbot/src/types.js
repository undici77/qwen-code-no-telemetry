/**
 * QQ Bot API protocol types.
 * Reference: https://bot.q.qq.com/wiki/develop/api-v2/
 */
export const OpCode = {
  DISPATCH: 0,
  HEARTBEAT: 1,
  IDENTIFY: 2,
  RESUME: 6,
  RECONNECT: 7,
  INVALID_SESSION: 9,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};
/** QQ Bot WebSocket intents. */
export const Intent = {
  C2C_MESSAGE: 1 << 12, // C2C 消息
  GROUP_AT_MESSAGE: 1 << 25, // 群聊 @ 消息事件
  GROUP_MESSAGE: 1 << 26, // 群聊全量消息事件 (GROUP_MESSAGE_CREATE)
};
//# sourceMappingURL=types.js.map
