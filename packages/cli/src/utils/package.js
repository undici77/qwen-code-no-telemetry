/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { readPackageUp, } from 'read-package-up';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let packageJson;
export async function getPackageJson() {
    if (packageJson) {
        return packageJson;
    }
    const result = await readPackageUp({ cwd: __dirname });
    if (!result) {
        // TODO: Maybe bubble this up as an error.
        return;
    }
    packageJson = result.packageJson;
    return packageJson;
}
//# sourceMappingURL=package.js.map