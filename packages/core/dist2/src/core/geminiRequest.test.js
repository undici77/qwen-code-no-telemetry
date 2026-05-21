/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect } from 'vitest';
import { partListUnionToString } from './geminiRequest.js';
import {} from '@google/genai';
describe('partListUnionToString', () => {
    it('should return the string value if the input is a string', () => {
        const result = partListUnionToString('hello');
        expect(result).toBe('hello');
    });
    it('should return a concatenated string if the input is an array of strings', () => {
        const result = partListUnionToString(['hello', ' ', 'world']);
        expect(result).toBe('hello world');
    });
    it('should handle videoMetadata', () => {
        const part = { videoMetadata: {} };
        const result = partListUnionToString(part);
        expect(result).toBe('[Video Metadata]');
    });
    it('should handle thought', () => {
        const part = { thought: true };
        const result = partListUnionToString(part);
        expect(result).toBe('[Thought: true]');
    });
    it('should handle codeExecutionResult', () => {
        const part = { codeExecutionResult: {} };
        const result = partListUnionToString(part);
        expect(result).toBe('[Code Execution Result]');
    });
    it('should handle executableCode', () => {
        const part = { executableCode: {} };
        const result = partListUnionToString(part);
        expect(result).toBe('[Executable Code]');
    });
    it('should handle fileData', () => {
        const part = {
            fileData: { mimeType: 'text/plain', fileUri: 'file.txt' },
        };
        const result = partListUnionToString(part);
        expect(result).toBe('[File Data]');
    });
    it('should handle functionCall', () => {
        const part = { functionCall: { name: 'myFunction' } };
        const result = partListUnionToString(part);
        expect(result).toBe('[Function Call: myFunction]');
    });
    it('should handle functionResponse', () => {
        const part = {
            functionResponse: { name: 'myFunction', response: {} },
        };
        const result = partListUnionToString(part);
        expect(result).toBe('[Function Response: myFunction]');
    });
    it('should handle inlineData', () => {
        const part = { inlineData: { mimeType: 'image/png', data: '...' } };
        const result = partListUnionToString(part);
        expect(result).toBe('<image/png>');
    });
    it('should handle text', () => {
        const part = { text: 'hello' };
        const result = partListUnionToString(part);
        expect(result).toBe('hello');
    });
    it('should return an empty string for an unknown part type', () => {
        const part = {};
        const result = partListUnionToString(part);
        expect(result).toBe('');
    });
});
//# sourceMappingURL=geminiRequest.test.js.map