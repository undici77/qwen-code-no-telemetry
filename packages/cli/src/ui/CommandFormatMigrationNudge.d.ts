/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type CommandMigrationNudgeResult = {
    userSelection: 'yes' | 'no';
};
interface CommandFormatMigrationNudgeProps {
    tomlFiles: string[];
    onComplete: (result: CommandMigrationNudgeResult) => void;
}
export declare function CommandFormatMigrationNudge({ tomlFiles, onComplete, }: CommandFormatMigrationNudgeProps): import("react/jsx-runtime").JSX.Element;
export {};
