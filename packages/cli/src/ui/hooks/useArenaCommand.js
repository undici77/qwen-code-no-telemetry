/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useState } from 'react';
export function useArenaCommand() {
    const [activeArenaDialog, setActiveArenaDialog] = useState(null);
    const openArenaDialog = useCallback((type) => {
        setActiveArenaDialog(type);
    }, []);
    const closeArenaDialog = useCallback(() => {
        setActiveArenaDialog(null);
    }, []);
    return {
        activeArenaDialog,
        openArenaDialog,
        closeArenaDialog,
    };
}
//# sourceMappingURL=useArenaCommand.js.map