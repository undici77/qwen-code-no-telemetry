/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect, useState } from 'react';
import { Storage } from '@qwen-code/qwen-code-core';
import { detectTomlCommands } from '../../services/command-migration-tool.js';
/**
 * Hook to detect TOML command files and manage migration nudge visibility.
 * Checks all command directories: workspace, user, and global levels.
 */
export function useCommandMigration(settings, storage) {
    const [showMigrationNudge, setShowMigrationNudge] = useState(false);
    const [tomlFiles, setTomlFiles] = useState([]);
    useEffect(() => {
        const checkTomlCommands = async () => {
            const allFiles = [];
            // Check workspace commands directory (.qwen/commands)
            const workspaceCommandsDir = storage.getProjectCommandsDir();
            const workspaceFiles = await detectTomlCommands(workspaceCommandsDir);
            allFiles.push(...workspaceFiles.map((f) => `workspace: ${f}`));
            // Check user commands directory (~/.qwen/commands)
            const userCommandsDir = Storage.getUserCommandsDir();
            const userFiles = await detectTomlCommands(userCommandsDir);
            allFiles.push(...userFiles.map((f) => `user: ${f}`));
            if (allFiles.length > 0) {
                setTomlFiles(allFiles);
                setShowMigrationNudge(true);
            }
        };
        checkTomlCommands();
    }, [storage]);
    return {
        showMigrationNudge,
        tomlFiles,
        setShowMigrationNudge,
    };
}
//# sourceMappingURL=useCommandMigration.js.map