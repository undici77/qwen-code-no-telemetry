/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AuthenticateUpdateNotification } from '../types/acpTypes.js';
/**
 * Handle authentication update notifications by showing a VS Code notification
 * with the authentication URI and action buttons.
 *
 * @param data - Authentication update notification data containing the auth URI
 */
export declare function handleAuthenticateUpdate(data: AuthenticateUpdateNotification): void;
