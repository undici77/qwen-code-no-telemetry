import { jsx as _jsx } from "react/jsx-runtime";
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useIsScreenReaderEnabled } from 'ink';
import { useUIState } from './contexts/UIStateContext.js';
import { StreamingContext } from './contexts/StreamingContext.js';
import { QuittingDisplay } from './components/QuittingDisplay.js';
import { ScreenReaderAppLayout } from './layouts/ScreenReaderAppLayout.js';
import { DefaultAppLayout } from './layouts/DefaultAppLayout.js';
export const App = () => {
    const uiState = useUIState();
    const isScreenReaderEnabled = useIsScreenReaderEnabled();
    if (uiState.quittingMessages) {
        return _jsx(QuittingDisplay, {});
    }
    return (_jsx(StreamingContext.Provider, { value: uiState.streamingState, children: isScreenReaderEnabled ? _jsx(ScreenReaderAppLayout, {}) : _jsx(DefaultAppLayout, {}) }));
};
//# sourceMappingURL=App.js.map