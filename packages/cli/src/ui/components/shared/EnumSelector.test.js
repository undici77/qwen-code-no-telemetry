import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { renderWithProviders } from '../../../test-utils/render.js';
import { EnumSelector } from './EnumSelector.js';
import { describe, it, expect } from 'vitest';
const LANGUAGE_OPTIONS = [
    { label: 'English', value: 'en' },
    { label: '中文 (简体)', value: 'zh' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
];
const NUMERIC_OPTIONS = [
    { label: 'Low', value: 1 },
    { label: 'Medium', value: 2 },
    { label: 'High', value: 3 },
];
describe('<EnumSelector />', () => {
    it('renders with string options and matches snapshot', () => {
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: LANGUAGE_OPTIONS, currentValue: "en", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toMatchSnapshot();
    });
    it('renders with numeric options and matches snapshot', () => {
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: NUMERIC_OPTIONS, currentValue: 2, isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toMatchSnapshot();
    });
    it('renders inactive state and matches snapshot', () => {
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: LANGUAGE_OPTIONS, currentValue: "zh", isActive: false, onValueChange: () => { } }));
        expect(lastFrame()).toMatchSnapshot();
    });
    it('renders with single option and matches snapshot', () => {
        const singleOption = [
            { label: 'Only Option', value: 'only' },
        ];
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: singleOption, currentValue: "only", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toMatchSnapshot();
    });
    it('renders nothing when no options are provided', () => {
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: [], currentValue: "", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toBe('');
    });
    it('handles currentValue not found in options', () => {
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: LANGUAGE_OPTIONS, currentValue: "invalid", isActive: true, onValueChange: () => { } }));
        // Should default to first option
        expect(lastFrame()).toContain('English');
    });
    it('updates when currentValue changes externally', () => {
        const { rerender, lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: LANGUAGE_OPTIONS, currentValue: "en", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toContain('English');
        rerender(_jsx(EnumSelector, { options: LANGUAGE_OPTIONS, currentValue: "zh", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toContain('中文 (简体)');
    });
    it('shows navigation arrows when multiple options available', () => {
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: LANGUAGE_OPTIONS, currentValue: "en", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).toContain('←');
        expect(lastFrame()).toContain('→');
    });
    it('hides navigation arrows when single option available', () => {
        const singleOption = [
            { label: 'Only Option', value: 'only' },
        ];
        const { lastFrame } = renderWithProviders(_jsx(EnumSelector, { options: singleOption, currentValue: "only", isActive: true, onValueChange: () => { } }));
        expect(lastFrame()).not.toContain('←');
        expect(lastFrame()).not.toContain('→');
    });
});
//# sourceMappingURL=EnumSelector.test.js.map