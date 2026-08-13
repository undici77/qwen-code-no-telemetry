/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
export function selectToolchainAdapter(root, adapters) {
    const applicable = adapters.filter((adapter) => adapter.applies(root));
    return {
        adapter: applicable.length === 1 ? applicable[0] : null,
        applicable,
    };
}
//# sourceMappingURL=toolchain.js.map