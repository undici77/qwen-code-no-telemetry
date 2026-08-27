/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export class InstallationManager {
  /**
   * Retrieves the installation ID.
   * Returns a static non-unique ID for the no-telemetry version.
   * @returns A static UUID string.
   */
  getInstallationId(): string {
    return '00000000-0000-0000-0000-000000000000';
  }
}
