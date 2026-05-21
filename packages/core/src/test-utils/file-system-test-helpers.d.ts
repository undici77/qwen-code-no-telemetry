/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Defines the structure of a virtual file system to be created for testing.
 * Keys are file or directory names, and values can be:
 * - A string: The content of a file.
 * - A `FileSystemStructure` object: Represents a subdirectory with its own structure.
 * - An array of strings or `FileSystemStructure` objects: Represents a directory
 *   where strings are empty files and objects are subdirectories.
 *
 * @example
 * // Example 1: Simple files and directories
 * const structure1 = {
 *   'file1.txt': 'Hello, world!',
 *   'empty-dir': [],
 *   'src': {
 *     'main.js': '// Main application file',
 *     'utils.ts': '// Utility functions',
 *   },
 * };
 *
 * @example
 * // Example 2: Nested directories and empty files within an array
 * const structure2 = {
 *   'config.json': '{ "port": 3000 }',
 *   'data': [
 *     'users.csv',
 *     'products.json',
 *     {
 *       'logs': [
 *         'error.log',
 *         'access.log',
 *       ],
 *     },
 *   ],
 * };
 */
export type FileSystemStructure = {
    [name: string]: string | FileSystemStructure | Array<string | FileSystemStructure>;
};
/**
 * Creates a temporary directory and populates it with a given file system structure.
 * @param structure The `FileSystemStructure` to create within the temporary directory.
 * @returns A promise that resolves to the absolute path of the created temporary directory.
 */
export declare function createTmpDir(structure: FileSystemStructure): Promise<string>;
/**
 * Cleans up (deletes) a temporary directory and its contents.
 * @param dir The absolute path to the temporary directory to clean up.
 */
export declare function cleanupTmpDir(dir: string): Promise<void>;
