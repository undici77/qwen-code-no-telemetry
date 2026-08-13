import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from 'ink-testing-library';
import { OverflowProvider } from '../contexts/OverflowContext.js';
import { getScreenBuffer } from '../selection/screen-buffer.js';
import { getSelectedText } from '../selection/selection-text.js';
import { colorizeCode } from './CodeColorizer.js';
it('excludes code line numbers from copied text', () => {
    const settings = {
        merged: { ui: { showLineNumbers: true } },
    };
    const { stdout } = render(_jsx(OverflowProvider, { children: colorizeCode('const value = 1;\nreturn value;', 'javascript', undefined, 20, {
            settings,
        }) }));
    const frame = getScreenBuffer(stdout).frame;
    expect(getSelectedText(frame, {
        sx: 0,
        sy: 0,
        ex: frame.width - 1,
        ey: frame.height - 1,
    })).toBe('const value = 1;\nreturn value;');
});
//# sourceMappingURL=CodeColorizer.semantic.test.js.map