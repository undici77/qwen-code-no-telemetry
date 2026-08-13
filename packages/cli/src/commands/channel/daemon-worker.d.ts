import type { CommandModule } from 'yargs';
import type { ChannelAgentBridge, ChannelWebhookRunOptions, ChannelWebhookTask, DaemonChannelLoopMcpHost, DaemonChannelSessionClient, DaemonChannelSessionFactory } from '@qwen-code/channel-base';
import type { ServeChannelSelection } from '../../serve/types.js';
import { type ChannelDeliveryRequest } from '../../runtime/channel-delivery-ipc.js';
import { type ChannelStartupReportMessage } from '../../serve/channel-worker-startup-ipc.js';
interface DaemonCapabilitiesLike {
    features: string[];
    workspaceCwd?: string;
    /**
     * Registered runtimes advertised by a multi-workspace daemon.
     * Absent on legacy single-workspace daemons, where `workspaceCwd` is used.
     */
    workspaces?: Array<{
        cwd: string;
        id: string;
        primary: boolean;
        trusted: boolean;
    }>;
}
interface DaemonClientLike {
    capabilities(): Promise<DaemonCapabilitiesLike>;
    workspaceByCwd?(cwd: string): {
        deleteSessionsData(sessionIds: string[]): Promise<{
            removed: string[];
            notFound: string[];
            errors: Array<{
                sessionId: string;
                error: string;
            }>;
        }>;
    };
}
interface DaemonSessionClientStaticLike {
    createOrAttach(client: DaemonClientLike, req: {
        workspaceCwd: string;
        modelServiceId?: string;
        sessionScope: 'thread';
        approvalMode?: string;
        sourceType?: string;
        sourceId?: string;
    }, clientId?: string): Promise<DaemonChannelSessionClient>;
    load(client: DaemonClientLike, sessionId: string, req: {
        workspaceCwd: string;
        modelServiceId?: string;
        sessionScope: 'thread';
        approvalMode?: string;
    }, clientId?: string): Promise<DaemonChannelSessionClient>;
}
interface DaemonSdkLike {
    DaemonClient: new (opts: {
        baseUrl: string;
        token?: string;
    }) => DaemonClientLike;
    DaemonSessionClient: DaemonSessionClientStaticLike;
}
interface ChannelDaemonWorkerReady {
    pid: number;
    channels: string[];
    requestedChannels: string[];
}
export interface ChannelDaemonWorkerHandle {
    readonly channels: string[];
    deliverChannelMessage(request: ChannelDeliveryRequest): Promise<void>;
    validateWebhookTask(task: ChannelWebhookTask): void;
    runWebhookTask(task: ChannelWebhookTask, options?: ChannelWebhookRunOptions): Promise<void>;
    close(): Promise<void>;
}
export interface RunChannelDaemonWorkerOptions {
    daemonUrl: string;
    daemonToken?: string;
    workspace: string;
    selection: ServeChannelSelection;
    loadDaemonSdk?: () => Promise<DaemonSdkLike>;
    sendReady?: (ready: ChannelDaemonWorkerReady) => void;
    reportStartup?: (message: ChannelStartupReportMessage) => Promise<void>;
    startupSignal?: AbortSignal;
    channelLoopMcpHost?: DaemonChannelLoopMcpHost;
    promptAuthorization?: string;
}
export declare function createDaemonSessionFactory({ client, DaemonSessionClient, clientId, }: {
    client: DaemonClientLike;
    DaemonSessionClient: DaemonSessionClientStaticLike;
    clientId: string;
}): DaemonChannelSessionFactory;
export declare function createDaemonChannelBridgeFacade(bridge: ChannelAgentBridge, opts: {
    exposeShellCommand: boolean;
}): ChannelAgentBridge;
export declare function runChannelDaemonWorker(opts: RunChannelDaemonWorkerOptions): Promise<ChannelDaemonWorkerHandle>;
interface DaemonWorkerArgs {
    channel?: string[];
}
export declare const daemonWorkerCommand: CommandModule<unknown, DaemonWorkerArgs>;
export {};
