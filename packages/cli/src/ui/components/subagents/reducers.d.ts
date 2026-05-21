/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { type CreationWizardState, type WizardAction } from './types.js';
/**
 * Initial state for the creation wizard.
 */
export declare const initialWizardState: CreationWizardState;
/**
 * Reducer for managing wizard state transitions.
 */
export declare function wizardReducer(state: CreationWizardState, action: WizardAction): CreationWizardState;
