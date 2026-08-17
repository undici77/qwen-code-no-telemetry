import type { TodoItem } from '../../adapters/types';
import type { WebShellBottomStatusItem } from '../../customization';
interface TodoPanelProps {
  todos: TodoItem[];
  title?: string;
  statusItems?: readonly WebShellBottomStatusItem[];
  onOpen?: () => void;
}
export declare const TodoPanel: import('react').NamedExoticComponent<TodoPanelProps>;
export {};
