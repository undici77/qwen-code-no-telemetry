/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Unset FORCE_COLOR and NO_COLOR to ensure consistent theme behavior between local and CI test runs.
// Without FORCE_COLOR, ink auto-detects the terminal; since ink-testing-library uses a fake
// non-TTY stdout, colors are disabled, giving plain-text output that assertions can check easily.
if (process.env['FORCE_COLOR'] !== undefined) {
  delete process.env['FORCE_COLOR'];
}
if (process.env['NO_COLOR'] !== undefined) {
  delete process.env['NO_COLOR'];
}

// Avoid writing per-session debug log files during CLI tests.
// Individual tests can still opt in by overriding this env var explicitly.
if (process.env['QWEN_DEBUG_LOG_FILE'] === undefined) {
  process.env['QWEN_DEBUG_LOG_FILE'] = '0';
}

import './src/test-utils/customMatchers.js';
