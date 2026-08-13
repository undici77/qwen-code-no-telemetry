import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
mock.module('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }));
mock.module('pdfjs-dist', () => ({ GlobalWorkerOptions: { workerSrc: '' }, getDocument: () => ({}) }));
mock.module('react-i18next', () => ({ useTranslation: () => ({ t: (key) => key }) }));
let UserMessageBubble;
beforeAll(async () => {
    const mod = await import('../UserMessageBubble');
    UserMessageBubble = mod.UserMessageBubble;
});
describe('UserMessageBubble text elements', () => {
    it('renders badges from textElements and ignores legacy badge props', () => {
        const propsWithLegacyBadges = {
            content: '@qc-helper please check this',
            badges: [{
                    type: 'skill',
                    rawText: '@wrong-skill',
                    label: 'Wrong Skill',
                    start: 0,
                    end: '@wrong-skill'.length,
                }],
            textElements: [{
                    type: 'skill',
                    byte_range: { start: 0, end: '@qc-helper'.length },
                    placeholder: '@qc-helper',
                    label: 'QC Helper',
                }],
        };
        const html = renderToStaticMarkup(_jsx(UserMessageBubble, { ...propsWithLegacyBadges }));
        expect(html).toContain('QC Helper');
        expect(html).not.toContain('Wrong Skill');
        expect(html).toContain('please check this');
    });
});
//# sourceMappingURL=user-message-bubble-text-elements.test.js.map