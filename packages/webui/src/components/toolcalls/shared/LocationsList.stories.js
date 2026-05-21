/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { LocationsList } from './LayoutComponents.js';
/**
 * LocationsList displays a list of file locations with clickable links.
 */
const meta = {
    title: 'ToolCalls/Shared/LocationsList',
    component: LocationsList,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
};
export default meta;
export const SingleFile = {
    args: {
        locations: [{ path: 'src/App.tsx', line: 10 }],
    },
};
export const MultipleFiles = {
    args: {
        locations: [
            { path: 'src/App.tsx', line: 10 },
            { path: 'src/components/Header.tsx', line: 25 },
            { path: 'src/utils/helpers.ts', line: 42 },
        ],
    },
};
export const WithoutLineNumbers = {
    args: {
        locations: [{ path: 'package.json' }, { path: 'tsconfig.json' }],
    },
};
//# sourceMappingURL=LocationsList.stories.js.map