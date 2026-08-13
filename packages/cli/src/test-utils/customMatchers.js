/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { expect } from 'vitest';
// RegExp to detect invalid characters: backspace, and ANSI escape codes
// eslint-disable-next-line no-control-regex
const invalidCharsRegex = /[\b\x1b]/;
function toHaveOnlyValidCharacters(buffer) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { isNot } = this;
    let pass = true;
    const invalidLines = [];
    for (let i = 0; i < buffer.lines.length; i++) {
        const line = buffer.lines[i];
        if (line.includes('\n')) {
            pass = false;
            invalidLines.push({ line: i, content: line });
            break; // Fail fast on newlines
        }
        if (invalidCharsRegex.test(line)) {
            pass = false;
            invalidLines.push({ line: i, content: line });
        }
    }
    return {
        pass,
        message: () => `Expected buffer ${isNot ? 'not ' : ''}to have only valid characters, but found invalid characters in lines:\n${invalidLines
            .map((l) => `  [${l.line}]: "${l.content}"`) /* This line was changed */
            .join('\n')}`,
        actual: buffer.lines,
        expected: 'Lines with no line breaks, backspaces, or escape codes.',
    };
}
expect.extend({
    toHaveOnlyValidCharacters,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
});
//# sourceMappingURL=customMatchers.js.map