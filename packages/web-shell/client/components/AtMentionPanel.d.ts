import { type RefObject } from 'react';
import { type AtMentionMenuState } from '../hooks/useAtMentionMenu';
export declare function AtMentionPanel({
  menu,
  anchorRef,
  panelRef,
  onSelect,
  onAccept,
  onBack,
  onSearch,
  onSelectTab,
}: {
  menu: AtMentionMenuState;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
  onSelect: (index: number) => boolean;
  onAccept: (index?: number) => boolean;
  onBack: () => boolean;
  onSearch: (query: string) => boolean;
  onSelectTab: (tabId: string) => boolean;
}): import('react').ReactPortal | null;
