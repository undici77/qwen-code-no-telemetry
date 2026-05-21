/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
/**
 * Recursively creates files and directories based on the provided `FileSystemStructure`.
 * @param dir The base directory where the structure will be created.
 * @param structure The `FileSystemStructure` defining the files and directories.
 */
async function create(dir, structure) {
    for (const [name, content] of Object.entries(structure)) {
        const newPath = path.join(dir, name);
        if (typeof content === 'string') {
            await fs.writeFile(newPath, content);
        }
        else if (Array.isArray(content)) {
            await fs.mkdir(newPath, { recursive: true });
            for (const item of content) {
                if (typeof item === 'string') {
                    await fs.writeFile(path.join(newPath, item), '');
                }
                else {
                    await create(newPath, item);
                }
            }
        }
        else if (typeof content === 'object' && content !== null) {
            await fs.mkdir(newPath, { recursive: true });
            await create(newPath, content);
        }
    }
}
/**
 * Creates a temporary directory and populates it with a given file system structure.
 * @param structure The `FileSystemStructure` to create within the temporary directory.
 * @returns A promise that resolves to the absolute path of the created temporary directory.
 */
export async function createTmpDir(structure) {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-cli-test-'));
    await create(tmpDir, structure);
    return tmpDir;
}
/**
 * Cleans up (deletes) a temporary directory and its contents.
 * @param dir The absolute path to the temporary directory to clean up.
 */
export async function cleanupTmpDir(dir) {
    await fs.rm(dir, { recursive: true, force: true });
}
//# sourceMappingURL=file-system-test-helpers.js.map