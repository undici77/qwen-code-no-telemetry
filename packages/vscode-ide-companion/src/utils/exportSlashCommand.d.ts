/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const EXPORT_PARENT_COMMAND_NAME: "export";
export declare const EXPORT_PARENT_COMMAND_DESCRIPTION = "Export current session to a file. Available formats: html, md, json, jsonl.";
export declare const EXPORT_SESSION_FORMATS: readonly ["html", "md", "json", "jsonl"];
export type SessionExportFormat = (typeof EXPORT_SESSION_FORMATS)[number];
export declare const EXPORT_SUBCOMMAND_SPECS: ReadonlyArray<{
    name: SessionExportFormat;
    description: string;
}>;
export declare function isSessionExportFormat(value: string): value is SessionExportFormat;
export declare function getExportSubcommandRequiredMessage(): string;
