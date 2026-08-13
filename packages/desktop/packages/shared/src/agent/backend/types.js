/* eslint-disable import/no-internal-modules */
/**
 * Backend Abstraction Types
 *
 * Defines the core interface that AI backends must implement.
 * The CraftAgent facade delegates to the backend runtime while
 * maintaining a consistent API surface.
 *
 * Key design decisions:
 * - Provider-agnostic events: All backends emit the same AgentEvent types
 * - Capabilities-driven UI: Model/thinking selectors read from capabilities()
 * - Callback pattern: Facade sets callbacks after creating backend
 * - AsyncGenerator for streaming: Consistent with existing CraftAgent API
 */
// Import AbortReason and RecoveryMessage from core module (single source of truth)
import { AbortReason } from '../core/index.ts';
export { AbortReason };
//# sourceMappingURL=types.js.map