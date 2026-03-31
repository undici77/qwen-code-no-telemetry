/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InstallationManager } from './installationManager.js';

describe('InstallationManager', () => {
  let installationManager: InstallationManager;

  beforeEach(() => {
    installationManager = new InstallationManager();
  });

  describe('getInstallationId', () => {
    it('should return a static non-unique ID for no-telemetry policy', () => {
      const installationId = installationManager.getInstallationId();
      // Static UUID as per no-telemetry policy - no tracking
      expect(installationId).toBe('00000000-0000-0000-0000-000000000000');
    });

    it('should return the same static ID on subsequent calls', () => {
      const firstId = installationManager.getInstallationId();
      const secondId = installationManager.getInstallationId();
      expect(secondId).toBe(firstId);
      expect(firstId).toBe('00000000-0000-0000-0000-000000000000');
    });
  });
});
