import type { DaemonChannelInstanceSnapshot, DaemonChannelTypeCatalog, DaemonSessionSummary } from '@qwen-code/sdk/daemon';
export interface ChannelSessionGroup {
    id: string;
    label: string;
    sessions: DaemonSessionSummary[];
}
export declare function groupSessionsByChannelType(sessions: readonly DaemonSessionSummary[], catalog: DaemonChannelTypeCatalog, instances: Readonly<Record<string, DaemonChannelInstanceSnapshot>>, otherLabel: string): ChannelSessionGroup[];
