export type ChannelMemoryIntent =
  | {
      kind: 'remember';
      texts: string[];
    }
  | {
      kind: 'list';
      page: number;
    }
  | {
      kind: 'inspect';
      id: string;
    }
  | {
      kind: 'remove';
      id: string;
    }
  | {
      kind: 'update';
      id: string;
      text: string;
    }
  | {
      kind: 'update_confirm';
    }
  | {
      kind: 'remove_confirm';
    }
  | {
      kind: 'clear_request';
    }
  | {
      kind: 'clear_confirm';
    };
export declare function parseChannelMemoryIntent(
  text: string,
): ChannelMemoryIntent | null;
