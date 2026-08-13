import type { ChannelLoopController, ChannelLoopStore } from '@qwen-code/channel-base';
export declare function createChannelLoopController(store: ChannelLoopStore): ChannelLoopController;
export declare function isChannelCronEnabled(settings: {
    merged: {
        experimental?: {
            cron?: boolean;
        };
    };
}): boolean;
