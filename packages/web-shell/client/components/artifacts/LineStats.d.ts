import type { TurnOutputFileChange } from './TurnOutputs';
export declare function LineStats({
  additions,
  deletions,
  className,
  additionsClassName,
  deletionsClassName,
}: {
  additions: number | undefined;
  deletions: number | undefined;
  className: string;
  additionsClassName: string;
  deletionsClassName: string;
}): import('react/jsx-runtime').JSX.Element | null;
export declare function sumLineStats(
  changes: readonly TurnOutputFileChange[],
): any;
