/* eslint-disable @typescript-eslint/no-explicit-any */
export var AuthProviderType;
(function (AuthProviderType) {
  AuthProviderType['DYNAMIC_DISCOVERY'] = 'dynamic_discovery';
  AuthProviderType['GOOGLE_CREDENTIALS'] = 'google_credentials';
  AuthProviderType['SERVICE_ACCOUNT_IMPERSONATION'] =
    'service_account_impersonation';
})(AuthProviderType || (AuthProviderType = {}));
export function isSDKUserMessage(msg) {
  return (
    msg && typeof msg === 'object' && msg.type === 'user' && 'message' in msg
  );
}
export function isSDKAssistantMessage(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'assistant' &&
    'uuid' in msg &&
    'message' in msg &&
    'session_id' in msg &&
    'parent_tool_use_id' in msg
  );
}
export function isSDKSystemMessage(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'system' &&
    'subtype' in msg &&
    'uuid' in msg &&
    'session_id' in msg
  );
}
export function isSDKResultMessage(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'result' &&
    'subtype' in msg &&
    'duration_ms' in msg &&
    'is_error' in msg &&
    'uuid' in msg &&
    'session_id' in msg
  );
}
export function isSDKPartialAssistantMessage(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'stream_event' &&
    'uuid' in msg &&
    'session_id' in msg &&
    'event' in msg &&
    'parent_tool_use_id' in msg
  );
}
export function isControlRequest(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'control_request' &&
    'request_id' in msg &&
    'request' in msg
  );
}
export function isControlResponse(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'control_response' &&
    'response' in msg
  );
}
export function isControlCancel(msg) {
  return (
    msg &&
    typeof msg === 'object' &&
    msg.type === 'control_cancel_request' &&
    'request_id' in msg
  );
}
export function isTextBlock(block) {
  return block && typeof block === 'object' && block.type === 'text';
}
export function isThinkingBlock(block) {
  return block && typeof block === 'object' && block.type === 'thinking';
}
export function isToolUseBlock(block) {
  return block && typeof block === 'object' && block.type === 'tool_use';
}
export function isToolResultBlock(block) {
  return block && typeof block === 'object' && block.type === 'tool_result';
}
/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Control Request Types
 *
 * Centralized enum for all control request subtypes supported by the CLI.
 * This enum should be kept in sync with the controllers in:
 * - packages/cli/src/services/control/controllers/systemController.ts
 * - packages/cli/src/services/control/controllers/permissionController.ts
 * - packages/cli/src/services/control/controllers/mcpController.ts
 * - packages/cli/src/services/control/controllers/hookController.ts
 */
export var ControlRequestType;
(function (ControlRequestType) {
  // SystemController requests
  ControlRequestType['INITIALIZE'] = 'initialize';
  ControlRequestType['INTERRUPT'] = 'interrupt';
  ControlRequestType['SET_MODEL'] = 'set_model';
  ControlRequestType['SUPPORTED_COMMANDS'] = 'supported_commands';
  ControlRequestType['GET_CONTEXT_USAGE'] = 'get_context_usage';
  // PermissionController requests
  ControlRequestType['CAN_USE_TOOL'] = 'can_use_tool';
  ControlRequestType['SET_PERMISSION_MODE'] = 'set_permission_mode';
  // MCPController requests
  ControlRequestType['MCP_MESSAGE'] = 'mcp_message';
  ControlRequestType['MCP_SERVER_STATUS'] = 'mcp_server_status';
  // HookController requests
  ControlRequestType['HOOK_CALLBACK'] = 'hook_callback';
})(ControlRequestType || (ControlRequestType = {}));
//# sourceMappingURL=protocol.js.map
