import { type ReactNode, type RefObject } from 'react';
interface ShadowDomBoundaryProps {
  children: ReactNode;
  enabled: boolean;
  language: string;
  themeClassName: string;
  styles?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}
export declare function ShadowDomBoundary({
  children,
  enabled,
  language,
  themeClassName,
  styles,
  initialFocusRef,
}: ShadowDomBoundaryProps):
  | string
  | number
  | bigint
  | boolean
  | Iterable<ReactNode>
  | Promise<
      | string
      | number
      | bigint
      | boolean
      | import('react').ReactPortal
      | import('react').ReactElement<
          unknown,
          string | import('react').JSXElementConstructor<any>
        >
      | Iterable<ReactNode>
      | null
      | undefined
    >
  | import('react/jsx-runtime').JSX.Element
  | null
  | undefined;
export {};
