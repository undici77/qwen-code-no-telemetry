/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Control Dispatcher
 *
 * Layer 2 of the control plane architecture. Routes control requests between
 * SDK and CLI to appropriate controllers, manages pending request registries,
 * and handles cancellation/cleanup. Application code MUST NOT depend on
 * controller instances exposed by this class; instead, use ControlService,
 * which wraps these controllers with a stable programmatic API.
 *
 * Controllers:
 * - SystemController: initialize, interrupt, set_model, set_effort, supported_commands, get_context_usage, get_available_models, get_usage_info
 * - PermissionController: can_use_tool, set_permission_mode
 * - SdkMcpController: mcp_server_status (mcp_message handled via callback)
 *
 * Note: mcp_message requests are NOT routed through the dispatcher. CLI MCP
 * clients send messages via SdkMcpController.createSendSdkMcpMessage() callback.
 *
 * Note: Control request types are centrally defined in the ControlRequestType
 * enum in packages/sdk/typescript/src/types/controlRequests.ts
 */
import type { IControlContext } from './ControlContext.js';
import type { IPendingRequestRegistry } from './controllers/baseController.js';
import { SystemController } from './controllers/systemController.js';
import { PermissionController } from './controllers/permissionController.js';
import { SdkMcpController } from './controllers/sdkMcpController.js';
import type {
  CLIControlRequest,
  CLIControlResponse,
  ControlResponse,
  ControlRequestPayload,
} from '../types.js';
/**
 * Central coordinator for control plane communication.
 * Routes requests to controllers and manages request lifecycle.
 */
export declare class ControlDispatcher implements IPendingRequestRegistry {
  private context;
  readonly systemController: SystemController;
  readonly permissionController: PermissionController;
  readonly sdkMcpController: SdkMcpController;
  private pendingIncomingRequests;
  private pendingOutgoingRequests;
  private abortHandler;
  private isShutdown;
  constructor(context: IControlContext);
  /**
   * Routes an incoming request to the appropriate controller and sends response
   */
  dispatch(request: CLIControlRequest): Promise<void>;
  /**
   * Processes response from SDK for an outgoing request
   */
  handleControlResponse(response: CLIControlResponse): void;
  /**
   * Sends a control request to SDK and waits for response
   */
  sendControlRequest(
    payload: ControlRequestPayload,
    timeoutMs?: number,
  ): Promise<ControlResponse>;
  /**
   * Cancels a specific request or all pending requests
   */
  handleCancel(requestId?: string): void;
  /**
   * Marks stdin as closed and rejects all pending outgoing requests.
   * After this is called, new outgoing requests will be rejected immediately.
   * This should be called when stdin closes to avoid waiting for responses.
   */
  markInputClosed(): void;
  /**
   * Stops all pending requests and cleans up all controllers
   */
  shutdown(): void;
  /**
   * Registers an incoming request in the pending registry.
   */
  registerIncomingRequest(
    requestId: string,
    controller: string,
    abortController: AbortController,
    timeoutId: NodeJS.Timeout,
  ): void;
  /**
   * Removes an incoming request from the pending registry
   */
  deregisterIncomingRequest(requestId: string): void;
  /**
   * Registers an outgoing request in the pending registry
   */
  registerOutgoingRequest(
    requestId: string,
    controller: string,
    resolve: (response: ControlResponse) => void,
    reject: (error: Error) => void,
    timeoutId: NodeJS.Timeout,
  ): void;
  /**
   * Removes an outgoing request from the pending registry
   */
  deregisterOutgoingRequest(requestId: string): void;
  /**
   * Get count of pending incoming requests (for debugging)
   */
  getPendingIncomingRequestCount(): number;
  /**
   * Wait for all incoming request handlers to complete.
   *
   * Uses polling since we don't have direct Promise references to handlers.
   * The pendingIncomingRequests map is managed by BaseController:
   * - Registered when handler starts (in handleRequest)
   * - Deregistered when handler completes (success or error)
   *
   * @param pollIntervalMs - How often to check (default 50ms)
   * @param timeoutMs - Maximum wait time (default 30s)
   */
  waitForPendingIncomingRequests(
    pollIntervalMs?: number,
    timeoutMs?: number,
  ): Promise<void>;
  /**
   * Returns the controller that handles the given request subtype
   */
  private getControllerForRequest;
  /**
   * Sends a success response back to SDK
   */
  private sendSuccessResponse;
  /**
   * Sends an error response back to SDK
   */
  private sendErrorResponse;
}
