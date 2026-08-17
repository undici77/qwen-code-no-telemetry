import type { TodoItem } from '../../adapters/types';
interface PlanMessageProps {
  id: string;
  todos: TodoItem[];
  isLocateFlashing?: boolean;
}
export declare const PlanMessage: import('react').NamedExoticComponent<PlanMessageProps>;
export {};
