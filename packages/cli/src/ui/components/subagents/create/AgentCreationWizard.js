import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useReducer, useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import { wizardReducer, initialWizardState } from '../reducers.js';
import { LocationSelector } from './LocationSelector.js';
import { GenerationMethodSelector } from './GenerationMethodSelector.js';
import { DescriptionInput } from './DescriptionInput.js';
import { ToolSelector } from './ToolSelector.js';
import { ColorSelector } from './ColorSelector.js';
import { CreationSummary } from './CreationSummary.js';
import {} from '../types.js';
import { WIZARD_STEPS } from '../constants.js';
import { getStepKind } from '../utils.js';
import { theme } from '../../../semantic-colors.js';
import { TextEntryStep } from './TextEntryStep.js';
import { useKeypress } from '../../../hooks/useKeypress.js';
import { t } from '../../../../i18n/index.js';
/**
 * Main orchestrator component for the subagent creation wizard.
 */
export function AgentCreationWizard({ onClose, config, }) {
    const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
    const handleNext = useCallback(() => {
        dispatch({ type: 'GO_TO_NEXT_STEP' });
    }, []);
    const handlePrevious = useCallback(() => {
        dispatch({ type: 'GO_TO_PREVIOUS_STEP' });
    }, []);
    const handleCancel = useCallback(() => {
        dispatch({ type: 'RESET_WIZARD' });
        onClose();
    }, [onClose]);
    // Centralized ESC key handling for the entire wizard
    useKeypress((key) => {
        if (key.name !== 'escape') {
            return;
        }
        // LLM DescriptionInput handles its own ESC logic when generating
        const kind = getStepKind(state.generationMethod, state.currentStep);
        if (kind === 'LLM_DESC' && state.isGenerating) {
            return; // Let DescriptionInput handle it
        }
        if (state.currentStep === WIZARD_STEPS.LOCATION_SELECTION) {
            // On first step, ESC cancels the entire wizard
            handleCancel();
        }
        else {
            // On other steps, ESC goes back to previous step
            handlePrevious();
        }
    }, { isActive: true });
    const stepProps = useMemo(() => ({
        state,
        dispatch,
        onNext: handleNext,
        onPrevious: handlePrevious,
        onCancel: handleCancel,
        config,
    }), [state, dispatch, handleNext, handlePrevious, handleCancel, config]);
    const renderStepHeader = useCallback(() => {
        const getStepHeaderText = () => {
            const kind = getStepKind(state.generationMethod, state.currentStep);
            const n = state.currentStep;
            switch (kind) {
                case 'LOCATION':
                    return t('Step {{n}}: Choose Location', { n: n.toString() });
                case 'GEN_METHOD':
                    return t('Step {{n}}: Choose Generation Method', { n: n.toString() });
                case 'LLM_DESC':
                    return t('Step {{n}}: Describe Your Subagent', { n: n.toString() });
                case 'MANUAL_NAME':
                    return t('Step {{n}}: Enter Subagent Name', { n: n.toString() });
                case 'MANUAL_PROMPT':
                    return t('Step {{n}}: Enter System Prompt', { n: n.toString() });
                case 'MANUAL_DESC':
                    return t('Step {{n}}: Enter Description', { n: n.toString() });
                case 'TOOLS':
                    return t('Step {{n}}: Select Tools', { n: n.toString() });
                case 'COLOR':
                    return t('Step {{n}}: Choose Background Color', { n: n.toString() });
                case 'FINAL':
                    return t('Step {{n}}: Confirm and Save', { n: n.toString() });
                default:
                    return t('Unknown Step');
            }
        };
        return (_jsx(Box, { children: _jsx(Text, { bold: true, children: getStepHeaderText() }) }));
    }, [state.currentStep, state.generationMethod]);
    const renderStepFooter = useCallback(() => {
        const getNavigationInstructions = () => {
            // Special case: During generation in description input step, only show cancel option
            const kind = getStepKind(state.generationMethod, state.currentStep);
            if (kind === 'LLM_DESC' && state.isGenerating) {
                return t('Esc to cancel');
            }
            if (getStepKind(state.generationMethod, state.currentStep) === 'FINAL') {
                return t('Press Enter to save, e to save and edit, Esc to go back');
            }
            // Steps that have ↑↓ navigation (RadioButtonSelect components)
            const kindForNav = getStepKind(state.generationMethod, state.currentStep);
            const hasNavigation = kindForNav === 'LOCATION' ||
                kindForNav === 'GEN_METHOD' ||
                kindForNav === 'TOOLS' ||
                kindForNav === 'COLOR';
            const navigationPart = hasNavigation ? t('↑↓ to navigate, ') : '';
            const escAction = state.currentStep === WIZARD_STEPS.LOCATION_SELECTION
                ? t('cancel')
                : t('go back');
            return t('Press Enter to continue, {{navigation}}Esc to {{action}}', {
                navigation: navigationPart,
                action: escAction,
            });
        };
        return (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: getNavigationInstructions() }) }));
    }, [state.currentStep, state.isGenerating, state.generationMethod]);
    const renderStepContent = useCallback(() => {
        const kind = getStepKind(state.generationMethod, state.currentStep);
        switch (kind) {
            case 'LOCATION':
                return _jsx(LocationSelector, { ...stepProps });
            case 'GEN_METHOD':
                return _jsx(GenerationMethodSelector, { ...stepProps });
            case 'LLM_DESC':
                return _jsx(DescriptionInput, { ...stepProps });
            case 'MANUAL_NAME':
                return (_jsx(TextEntryStep, { state: state, dispatch: dispatch, onNext: handleNext, description: t('Enter a clear, unique name for this subagent.'), placeholder: t('e.g., Code Reviewer'), height: 1, initialText: state.generatedName, onChange: (text) => {
                        const value = text; // keep raw, trim later when validating
                        dispatch({ type: 'SET_GENERATED_NAME', name: value });
                    }, validate: (text) => text.trim().length === 0 ? t('Name cannot be empty.') : null }, "manual-name"));
            case 'MANUAL_PROMPT':
                return (_jsx(TextEntryStep, { state: state, dispatch: dispatch, onNext: handleNext, description: t("Write the system prompt that defines this subagent's behavior. Be comprehensive for best results."), placeholder: t('e.g., You are an expert code reviewer...'), height: 10, initialText: state.generatedSystemPrompt, onChange: (text) => {
                        dispatch({
                            type: 'SET_GENERATED_SYSTEM_PROMPT',
                            systemPrompt: text,
                        });
                    }, validate: (text) => text.trim().length === 0
                        ? t('System prompt cannot be empty.')
                        : null }, "manual-prompt"));
            case 'MANUAL_DESC':
                return (_jsx(TextEntryStep, { state: state, dispatch: dispatch, onNext: handleNext, description: t('Describe when and how this subagent should be used.'), placeholder: t('e.g., Reviews code for best practices and potential bugs.'), height: 6, initialText: state.generatedDescription, onChange: (text) => {
                        dispatch({
                            type: 'SET_GENERATED_DESCRIPTION',
                            description: text,
                        });
                    }, validate: (text) => text.trim().length === 0
                        ? t('Description cannot be empty.')
                        : null }, "manual-desc"));
            case 'TOOLS':
                return (_jsx(ToolSelector, { tools: state.selectedTools, onSelect: (tools) => {
                        dispatch({ type: 'SET_TOOLS', tools });
                        handleNext();
                    }, config: config }));
            case 'COLOR':
                return (_jsx(ColorSelector, { color: state.color, agentName: state.generatedName, onSelect: (color) => {
                        dispatch({ type: 'SET_BACKGROUND_COLOR', color });
                        handleNext();
                    } }));
            case 'FINAL':
                return _jsx(CreationSummary, { ...stepProps });
            default:
                return (_jsx(Box, { children: _jsx(Text, { color: theme.status.error, children: t('Invalid step: {{step}}', {
                            step: state.currentStep.toString(),
                        }) }) }));
        }
    }, [stepProps, state, config, handleNext, dispatch]);
    return (_jsx(Box, { flexDirection: "column", children: _jsxs(Box, { borderStyle: "single", borderColor: theme.border.default, flexDirection: "column", padding: 1, width: "100%", gap: 1, children: [renderStepHeader(), renderStepContent(), renderStepFooter()] }) }));
}
//# sourceMappingURL=AgentCreationWizard.js.map