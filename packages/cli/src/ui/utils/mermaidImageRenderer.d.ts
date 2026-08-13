/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export type TerminalImageProtocol = 'kitty' | 'iterm2';
export interface MermaidImageRenderOptions {
    source: string;
    contentWidth: number;
    availableTerminalHeight?: number;
    env?: NodeJS.ProcessEnv;
    signal?: AbortSignal;
}
export interface MermaidTerminalImageResult {
    kind: 'terminal-image';
    title: string;
    sequence: string;
    rows: number;
    protocol: TerminalImageProtocol;
    placeholder?: KittyImagePlaceholder;
}
export interface MermaidAnsiImageResult {
    kind: 'ansi';
    title: string;
    lines: string[];
}
export interface MermaidImageUnavailableResult {
    kind: 'unavailable';
    reason: string;
    showReason?: boolean;
}
export type MermaidImageRenderResult = MermaidTerminalImageResult | MermaidAnsiImageResult | MermaidImageUnavailableResult;
interface PngSize {
    width: number;
    height: number;
}
export interface KittyImagePlaceholder {
    color: string;
    imageId: number;
    lines: string[];
}
export declare function detectTerminalImageProtocol(env?: NodeJS.ProcessEnv): TerminalImageProtocol | null;
export declare function encodeITerm2InlineImage(png: Buffer, widthCells: number, rows: number): string;
export declare function encodeKittyImage(png: Buffer, widthCells: number, rows: number): string;
export declare function encodeKittyVirtualImage(png: Buffer, imageId: number, widthCells: number, rows: number): string;
export declare function buildKittyPlaceholder(imageId: number, widthCells: number, rows: number): KittyImagePlaceholder;
export declare function readPngSize(png: Buffer): PngSize | null;
/**
 * @internal Test-oriented sync renderer; the interactive TUI uses the async
 * renderer to keep external processes outside React render.
 */
export declare function renderMermaidImageSync({ source, contentWidth, availableTerminalHeight, env, }: MermaidImageRenderOptions): MermaidImageRenderResult;
export declare function renderMermaidImageAsync({ source, contentWidth, availableTerminalHeight, env, signal, }: MermaidImageRenderOptions): Promise<MermaidImageRenderResult>;
export declare function findExecutable(command: string, env: NodeJS.ProcessEnv): string | null;
export declare function shouldRunThroughShell(command: string): boolean;
export declare function createRendererChildEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export {};
