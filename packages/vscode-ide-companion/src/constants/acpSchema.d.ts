/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export { AGENT_METHODS, CLIENT_METHODS, PROTOCOL_VERSION, } from '@agentclientprotocol/sdk';
export { RequestError } from '@agentclientprotocol/sdk';
export declare const EXT_CLIENT_METHODS: {
    readonly authenticate_update: "authenticate/update";
};
export declare const ACP_ERROR_CODES: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly REQUEST_CANCELLED: -32800;
    readonly AUTH_REQUIRED: -32000;
    readonly RESOURCE_NOT_FOUND: -32002;
};
export type AcpErrorCode = (typeof ACP_ERROR_CODES)[keyof typeof ACP_ERROR_CODES];
