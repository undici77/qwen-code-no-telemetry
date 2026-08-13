/**
 * Info_Alert
 *
 * Warning/error/info/success alert boxes with compound Title/Description.
 */
import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const alertVariants: (props?: ({
    variant?: "error" | "warning" | "info" | "success" | null | undefined;
    inline?: boolean | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface Info_AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
    /** Optional leading icon */
    icon?: React.ReactNode;
}
declare function Info_AlertRoot({ variant, inline, icon, className, children, ...props }: Info_AlertProps): import("react/jsx-runtime").JSX.Element;
declare function Info_AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>): import("react/jsx-runtime").JSX.Element;
declare function Info_AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): import("react/jsx-runtime").JSX.Element;
export declare const Info_Alert: typeof Info_AlertRoot & {
    Title: typeof Info_AlertTitle;
    Description: typeof Info_AlertDescription;
};
export {};
