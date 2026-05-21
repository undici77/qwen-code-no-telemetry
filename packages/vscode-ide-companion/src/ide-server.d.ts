/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as vscode from 'vscode';
import type { DiffManager } from './diff-manager.js';
export declare class IDEServer {
    private server;
    private context;
    private log;
    private lockFile;
    private port;
    private authToken;
    private transports;
    private openFilesManager;
    diffManager: DiffManager;
    constructor(log: (message: string) => void, diffManager: DiffManager);
    start(context: vscode.ExtensionContext): Promise<void>;
    broadcastIdeContextUpdate(): void;
    syncEnvVars(): Promise<void>;
    stop(): Promise<void>;
}
