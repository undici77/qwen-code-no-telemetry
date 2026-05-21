/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import type { WizardStepProps } from '../types.js';
interface TextEntryStepProps extends Pick<WizardStepProps, 'dispatch' | 'onNext' | 'state'> {
    description: string;
    placeholder?: string;
    /**
     * Visual height of the input viewport in rows. Name entry can be 1, others can be larger.
     */
    height?: number;
    /** Initial text value when the step loads */
    initialText?: string;
    /**
     * Called on every text change to update state.
     */
    onChange: (text: string) => void;
    /**
     * Optional validation. Return error message when invalid.
     */
    validate?: (text: string) => string | null;
}
export declare function TextEntryStep({ state, dispatch, onNext, description, placeholder, height, initialText, onChange, validate, }: TextEntryStepProps): import("react/jsx-runtime").JSX.Element;
export {};
