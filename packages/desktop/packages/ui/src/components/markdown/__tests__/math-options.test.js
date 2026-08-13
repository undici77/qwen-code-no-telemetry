import { describe, it, expect } from 'bun:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { MARKDOWN_MATH_OPTIONS } from '../math-options';
function parseMarkdown(input) {
    const processor = unified().use(remarkParse).use(remarkMath, MARKDOWN_MATH_OPTIONS);
    return processor.runSync(processor.parse(input));
}
function collectInlineMathValues(node) {
    const values = [];
    const walk = (current) => {
        if (current.type === 'inlineMath' && typeof current.value === 'string') {
            values.push(current.value);
        }
        for (const child of current.children ?? []) {
            walk(child);
        }
    };
    walk(node);
    return values;
}
describe('MARKDOWN_MATH_OPTIONS', () => {
    it('does not treat currency-like single-dollar text as inline math', () => {
        const tree = parseMarkdown('**$2M–$4M ARR/employee**');
        expect(collectInlineMathValues(tree)).toEqual([]);
    });
    it('still supports explicit $$ math delimiters', () => {
        const tree = parseMarkdown('The formula is $$E=mc^2$$.');
        expect(collectInlineMathValues(tree)).toEqual(['E=mc^2']);
    });
});
//# sourceMappingURL=math-options.test.js.map