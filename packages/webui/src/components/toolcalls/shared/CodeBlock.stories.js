/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { CodeBlock } from './LayoutComponents.js';
/**
 * CodeBlock displays formatted code or command output.
 */
const meta = {
    title: 'ToolCalls/Shared/CodeBlock',
    component: CodeBlock,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};
export default meta;
export const ShortCode = {
    args: {
        children: 'const greeting = "Hello, World!";',
    },
};
export const MultilineCode = {
    args: {
        children: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,
    },
};
export const CommandOutput = {
    args: {
        children: `$ npm run build
> @qwen-code/webui@0.1.0 build
> vite build

vite v5.4.21 building for production...
✓ 131 modules transformed.
✓ built in 2.34s`,
    },
};
//# sourceMappingURL=CodeBlock.stories.js.map