/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useSyncExternalStore } from 'react';
import { consumeSidechannelMidTurnInjected, getSidechannelMidTurnInjected, subscribeSidechannelMidTurnInjected, } from './midTurnInjectedSidechannel.js';
/**
 * Subscribe to injected mid-turn batches. Unlike a latest-wins signal, this
 * accumulates every batch so multi-batch turns (one frame per tool batch) are
 * all reconciled; the consumer calls `consume(handled)` with the batches it
 * processed.
 */
export function useDaemonMidTurnInjected() {
    const batches = useSyncExternalStore(subscribeSidechannelMidTurnInjected, getSidechannelMidTurnInjected, getSidechannelMidTurnInjected);
    // Stable identity (empty deps): `consume` removes exactly the batches it is
    // handed, so it needs no closure over the current snapshot.
    const consume = useCallback((handled) => consumeSidechannelMidTurnInjected(handled), []);
    return { batches, consume };
}
//# sourceMappingURL=useDaemonMidTurnInjected.js.map