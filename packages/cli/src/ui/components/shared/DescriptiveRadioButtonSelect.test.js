import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '../../../test-utils/render.js';
import { DescriptiveRadioButtonSelect, } from './DescriptiveRadioButtonSelect.js';
vi.mock('./BaseSelectionList.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        BaseSelectionList: vi.fn(({ children, ...props }) => (_jsx(actual.BaseSelectionList, { ...props, children: children }))),
    };
});
vi.mock('../../semantic-colors.js', () => ({
    theme: {
        text: {
            primary: 'COLOR_PRIMARY',
            secondary: 'COLOR_SECONDARY',
        },
        status: {
            success: 'COLOR_SUCCESS',
        },
    },
}));
describe('DescriptiveRadioButtonSelect', () => {
    const mockOnSelect = vi.fn();
    const mockOnHighlight = vi.fn();
    const ITEMS = [
        {
            title: 'Foo Title',
            description: 'This is Foo.',
            value: 'foo',
            key: 'foo',
        },
        {
            title: 'Bar Title',
            description: 'This is Bar.',
            value: 'bar',
            key: 'bar',
        },
        {
            title: 'Baz Title',
            description: 'This is Baz.',
            value: 'baz',
            disabled: true,
            key: 'baz',
        },
    ];
    const renderComponent = (props = {}) => {
        const defaultProps = {
            items: ITEMS,
            onSelect: mockOnSelect,
            ...props,
        };
        return renderWithProviders(_jsx(DescriptiveRadioButtonSelect, { ...defaultProps }));
    };
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should render correctly with default props', () => {
        const { lastFrame } = renderComponent();
        expect(lastFrame()).toMatchSnapshot();
    });
    it('should render correctly with custom props', () => {
        const { lastFrame } = renderComponent({
            initialIndex: 1,
            isFocused: false,
            showScrollArrows: true,
            maxItemsToShow: 5,
            showNumbers: true,
            onHighlight: mockOnHighlight,
        });
        expect(lastFrame()).toMatchSnapshot();
    });
});
//# sourceMappingURL=DescriptiveRadioButtonSelect.test.js.map