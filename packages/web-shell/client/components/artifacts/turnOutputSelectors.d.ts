import type { DaemonSessionArtifact } from '@qwen-code/sdk/daemon';
import type { Message } from '../../adapters/types';
import type { TurnOutputFileChange, TurnOutputScheduledTask } from './TurnOutputs';
export declare function getArtifactsByTurn(messages: readonly Message[], artifacts: readonly DaemonSessionArtifact[], workspaceCwd?: string): ReadonlyMap<string, readonly DaemonSessionArtifact[]>;
export declare function getFileChangesByTurn(messages: readonly Message[], artifactsByTurn: ReadonlyMap<string, readonly DaemonSessionArtifact[]>, workspaceCwd?: string): ReadonlyMap<string, readonly TurnOutputFileChange[]>;
export declare function getScheduledTasksByTurn(messages: readonly Message[]): ReadonlyMap<string, readonly TurnOutputScheduledTask[]>;
