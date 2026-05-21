import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useMemo } from 'react';
import { Box } from 'ink';
import { RadioButtonSelect } from '../../shared/RadioButtonSelect.js';
import {} from '@qwen-code/qwen-code-core';
import { t } from '../../../../i18n/index.js';
import {} from '../types.js';
export const ActionSelectionStep = ({ selectedExtension, hasUpdateAvailable, onActionSelect, }) => {
    const [selectedAction, setSelectedAction] = useState(null);
    const isActive = selectedExtension?.isActive ?? false;
    // Build action list based on extension state
    const actions = useMemo(() => {
        const allActions = [
            {
                key: 'view',
                get label() {
                    return t('View Details');
                },
                value: 'view',
            },
            ...(hasUpdateAvailable
                ? [
                    {
                        key: 'update',
                        get label() {
                            return t('Update Extension');
                        },
                        value: 'update',
                    },
                ]
                : []),
            ...(isActive
                ? [
                    {
                        key: 'disable',
                        get label() {
                            return t('Disable Extension');
                        },
                        value: 'disable',
                    },
                ]
                : [
                    {
                        key: 'enable',
                        get label() {
                            return t('Enable Extension');
                        },
                        value: 'enable',
                    },
                ]),
            {
                key: 'uninstall',
                get label() {
                    return t('Uninstall Extension');
                },
                value: 'uninstall',
            },
        ];
        return allActions;
    }, [hasUpdateAvailable, isActive]);
    const handleActionSelect = (value) => {
        setSelectedAction(value);
        onActionSelect(value);
    };
    const selectedIndex = selectedAction
        ? actions.findIndex((action) => action.value === selectedAction)
        : 0;
    return (_jsx(Box, { flexDirection: "column", children: _jsx(RadioButtonSelect, { items: actions, initialIndex: selectedIndex, onSelect: handleActionSelect, showNumbers: false }) }));
};
//# sourceMappingURL=ActionSelectionStep.js.map