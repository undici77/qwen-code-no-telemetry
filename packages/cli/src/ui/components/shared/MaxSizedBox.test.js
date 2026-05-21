import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { OverflowProvider } from '../../contexts/OverflowContext.js';
import { MaxSizedBox, setMaxSizedBoxDebugging } from './MaxSizedBox.js';
import { Box, Text } from 'ink';
import { describe, it, expect } from 'vitest';
describe('<MaxSizedBox />', () => {
    // Make sure MaxSizedBox logs errors on invalid configurations.
    // This is useful for debugging issues with the component.
    // It should be set to false in production for performance and to avoid
    // cluttering the console if there are ignorable issues.
    setMaxSizedBoxDebugging(true);
    it('renders children without truncation when they fit', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 80, maxHeight: 10, children: _jsx(Box, { children: _jsx(Text, { children: "Hello, World!" }) }) }) }));
        expect(lastFrame()).equals('Hello, World!');
    });
    it('hides lines when content exceeds maxHeight', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: 2, children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 3" }) })] }) }));
        expect(lastFrame()).equals(`... first 2 lines hidden ...
Line 3`);
    });
    it('hides lines at the end when content exceeds maxHeight and overflowDirection is bottom', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: 2, overflowDirection: "bottom", children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 3" }) })] }) }));
        expect(lastFrame()).equals(`Line 1
... last 2 lines hidden ...`);
    });
    it('wraps text that exceeds maxWidth', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 10, maxHeight: 5, children: _jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: "This is a long line of text" }) }) }) }));
        expect(lastFrame()).equals(`This is a
long line
of text`);
    });
    it('handles mixed wrapping and non-wrapping segments', () => {
        const multilineText = `This part will wrap around.
And has a line break.
  Leading spaces preserved.`;
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 20, maxHeight: 20, children: [_jsx(Box, { children: _jsx(Text, { children: "Example" }) }), _jsxs(Box, { children: [_jsx(Text, { children: "No Wrap: " }), _jsx(Text, { wrap: "wrap", children: multilineText })] }), _jsxs(Box, { children: [_jsx(Text, { children: "Longer No Wrap: " }), _jsx(Text, { wrap: "wrap", children: "This part will wrap around." })] })] }) }));
        expect(lastFrame()).equals(`Example
No Wrap: This part
         will wrap
         around.
         And has a
         line break.
           Leading
         spaces
         preserved.
Longer No Wrap: This
                part
                will
                wrap
                arou
                nd.`);
    });
    it('handles words longer than maxWidth by splitting them', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 5, maxHeight: 5, children: _jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: "Supercalifragilisticexpialidocious" }) }) }) }));
        expect(lastFrame()).equals(`... …
istic
expia
lidoc
ious`);
    });
    it('does not truncate when maxHeight is undefined', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: undefined, children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2" }) })] }) }));
        expect(lastFrame()).equals(`Line 1
Line 2`);
    });
    it('shows plural "lines" when more than one line is hidden', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: 2, children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 3" }) })] }) }));
        expect(lastFrame()).equals(`... first 2 lines hidden ...
Line 3`);
    });
    it('shows plural "lines" when more than one line is hidden and overflowDirection is bottom', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: 2, overflowDirection: "bottom", children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 3" }) })] }) }));
        expect(lastFrame()).equals(`Line 1
... last 2 lines hidden ...`);
    });
    it('renders an empty box for empty children', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 80, maxHeight: 10 }) }));
        // Expect an empty string or a box with nothing in it.
        // Ink renders an empty box as an empty string.
        expect(lastFrame()).equals('');
    });
    it('wraps text with multi-byte unicode characters correctly', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 5, maxHeight: 5, children: _jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: "\u4F60\u597D\u4E16\u754C" }) }) }) }));
        // "你好" has a visual width of 4. "世界" has a visual width of 4.
        // With maxWidth=5, it should wrap after the second character.
        expect(lastFrame()).equals(`你好
世界`);
    });
    it('wraps text with multi-byte emoji characters correctly', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 5, maxHeight: 5, children: _jsx(Box, { children: _jsx(Text, { wrap: "wrap", children: "\uD83D\uDC36\uD83D\uDC36\uD83D\uDC36\uD83D\uDC36\uD83D\uDC36" }) }) }) }));
        // Each "🐶" has a visual width of 2.
        // With maxWidth=5, it should wrap every 2 emojis.
        expect(lastFrame()).equals(`🐶🐶
🐶🐶
🐶`);
    });
    it('falls back to an ellipsis when width is extremely small', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 2, maxHeight: 2, children: _jsxs(Box, { children: [_jsx(Text, { children: "No" }), _jsx(Text, { wrap: "wrap", children: "wrap" })] }) }) }));
        expect(lastFrame()).equals('N…');
    });
    it('truncates long non-wrapping text with ellipsis', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 3, maxHeight: 2, children: _jsxs(Box, { children: [_jsx(Text, { children: "ABCDE" }), _jsx(Text, { wrap: "wrap", children: "wrap" })] }) }) }));
        expect(lastFrame()).equals('AB…');
    });
    it('truncates non-wrapping text containing line breaks', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 3, maxHeight: 2, children: _jsxs(Box, { children: [_jsx(Text, { children: 'A\nBCDE' }), _jsx(Text, { wrap: "wrap", children: "wrap" })] }) }) }));
        expect(lastFrame()).equals(`A\n…`);
    });
    it('truncates emoji characters correctly with ellipsis', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 3, maxHeight: 2, children: _jsxs(Box, { children: [_jsx(Text, { children: "\uD83D\uDC36\uD83D\uDC36\uD83D\uDC36" }), _jsx(Text, { wrap: "wrap", children: "wrap" })] }) }) }));
        expect(lastFrame()).equals(`🐶…`);
    });
    it('shows ellipsis for multiple rows with long non-wrapping text', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 3, maxHeight: 3, children: [_jsxs(Box, { children: [_jsx(Text, { children: "AAA" }), _jsx(Text, { wrap: "wrap", children: "first" })] }), _jsxs(Box, { children: [_jsx(Text, { children: "BBB" }), _jsx(Text, { wrap: "wrap", children: "second" })] }), _jsxs(Box, { children: [_jsx(Text, { children: "CCC" }), _jsx(Text, { wrap: "wrap", children: "third" })] })] }) }));
        expect(lastFrame()).equals(`AA…\nBB…\nCC…`);
    });
    it('accounts for additionalHiddenLinesCount', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: 2, additionalHiddenLinesCount: 5, children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 3" }) })] }) }));
        // 1 line is hidden by overflow, 5 are additionally hidden.
        expect(lastFrame()).equals(`... first 7 lines hidden ...
Line 3`);
    });
    it('handles React.Fragment as a child', () => {
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsxs(MaxSizedBox, { maxWidth: 80, maxHeight: 10, children: [_jsxs(_Fragment, { children: [_jsx(Box, { children: _jsx(Text, { children: "Line 1 from Fragment" }) }), _jsx(Box, { children: _jsx(Text, { children: "Line 2 from Fragment" }) })] }), _jsx(Box, { children: _jsx(Text, { children: "Line 3 direct child" }) })] }) }));
        expect(lastFrame()).equals(`Line 1 from Fragment
Line 2 from Fragment
Line 3 direct child`);
    });
    it('clips a long single text child from the top', () => {
        const THIRTY_LINES = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 80, maxHeight: 10, children: _jsx(Box, { children: _jsx(Text, { children: THIRTY_LINES }) }) }) }));
        const expected = [
            '... first 21 lines hidden ...',
            ...Array.from({ length: 9 }, (_, i) => `Line ${22 + i}`),
        ].join('\n');
        expect(lastFrame()).equals(expected);
    });
    it('clips a long single text child from the bottom', () => {
        const THIRTY_LINES = Array.from({ length: 30 }, (_, i) => `Line ${i + 1}`).join('\n');
        const { lastFrame } = render(_jsx(OverflowProvider, { children: _jsx(MaxSizedBox, { maxWidth: 80, maxHeight: 10, overflowDirection: "bottom", children: _jsx(Box, { children: _jsx(Text, { children: THIRTY_LINES }) }) }) }));
        const expected = [
            ...Array.from({ length: 9 }, (_, i) => `Line ${i + 1}`),
            '... last 21 lines hidden ...',
        ].join('\n');
        expect(lastFrame()).equals(expected);
    });
});
//# sourceMappingURL=MaxSizedBox.test.js.map