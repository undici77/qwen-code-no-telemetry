/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { InputFormProps } from './InputForm.js';
type InputFormStoryProps = Omit<InputFormProps, 'inputFieldRef'>;
/**
 * InputForm component is the main chat input with toolbar.
 * Features edit mode toggle, active file indicator, context usage, and command buttons.
 */
declare const meta: Meta<InputFormStoryProps>;
export default meta;
type Story = StoryObj<typeof meta>;
export declare const Default: Story;
export declare const WithActiveFile: Story;
export declare const WithSelection: Story;
export declare const WithContextUsage: Story;
export declare const Streaming: Story;
export declare const WaitingForResponse: Story;
export declare const WithCompletionMenu: Story;
export declare const PlanMode: Story;
export declare const SkipAutoContext: Story;
export declare const FullyLoaded: Story;
