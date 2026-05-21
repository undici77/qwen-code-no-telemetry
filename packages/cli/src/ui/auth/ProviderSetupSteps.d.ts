/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { ProviderSetupFlow } from './useProviderSetupFlow.js';
export interface ProviderSetupStepsProps {
    flow: ProviderSetupFlow;
}
export declare function ProviderSetupSteps({ flow, }: ProviderSetupStepsProps): React.JSX.Element | null;
