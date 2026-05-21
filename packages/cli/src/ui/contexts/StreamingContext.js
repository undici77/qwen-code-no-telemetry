/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext } from 'react';
export const StreamingContext = createContext(undefined);
export const useStreamingContext = () => {
    const context = React.useContext(StreamingContext);
    if (context === undefined) {
        throw new Error('useStreamingContext must be used within a StreamingContextProvider');
    }
    return context;
};
//# sourceMappingURL=StreamingContext.js.map