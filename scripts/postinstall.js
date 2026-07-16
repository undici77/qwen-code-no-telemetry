/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */

// patch-package is a devDependency used to patch this repo's own node_modules
// during local development. It is not installed when consumers `npm install`
// the published package (devDependencies are skipped), so skip silently in
// that case instead of failing the install.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);

try {
  require.resolve('patch-package/package.json');
} catch {
  process.exit(0);
}

const result = spawnSync('npx', ['patch-package'], {
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(`postinstall: patch-package failed: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  console.error(`postinstall: patch-package killed by signal ${result.signal}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
