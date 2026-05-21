/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { isKittyProtocolEnabled, isKittyProtocolSupported, } from '../utils/kittyProtocolDetector.js';
/**
 * Hook that returns the cached Kitty keyboard protocol status.
 * Detection is done once at app startup to avoid repeated queries.
 */
export function useKittyKeyboardProtocol() {
    const [status] = useState({
        supported: isKittyProtocolSupported(),
        enabled: isKittyProtocolEnabled(),
        checking: false,
    });
    return status;
}
//# sourceMappingURL=useKittyKeyboardProtocol.js.map