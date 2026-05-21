/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
/**
 * Minimum height for the MaxSizedBox component.
 * This ensures there is room for at least one line of content as well as the
 * message that content was truncated.
 */
export declare const MINIMUM_MAX_HEIGHT = 2;
export declare function setMaxSizedBoxDebugging(value: boolean): void;
interface MaxSizedBoxProps {
    children?: React.ReactNode;
    maxWidth?: number;
    maxHeight: number | undefined;
    overflowDirection?: 'top' | 'bottom';
    additionalHiddenLinesCount?: number;
}
/**
 * A React component that constrains the size of its children and provides
 * content-aware truncation when the content exceeds the specified `maxHeight`.
 *
 * `MaxSizedBox` requires a specific structure for its children to correctly
 * measure and render the content:
 *
 * 1.  **Direct children must be `<Box>` elements.** Each `<Box>` represents a
 *     single row of content.
 * 2.  **Row `<Box>` elements must contain only `<Text>` elements.** These
 *     `<Text>` elements can be nested and there are no restrictions to Text
 *     element styling other than that non-wrapping text elements must be
 *     before wrapping text elements.
 *
 * **Constraints:**
 * - **Box Properties:** Custom properties on the child `<Box>` elements are
 *   ignored. In debug mode, runtime checks will report errors for any
 *   unsupported properties.
 * - **Text Wrapping:** Within a single row, `<Text>` elements with no wrapping
 *   (e.g., headers, labels) must appear before any `<Text>` elements that wrap.
 * - **Element Types:** Runtime checks will warn if unsupported element types
 *   are used as children.
 *
 * @example
 * <MaxSizedBox maxWidth={80} maxHeight={10}>
 *   <Box>
 *     <Text>This is the first line.</Text>
 *   </Box>
 *   <Box>
 *     <Text color="cyan" wrap="truncate">Non-wrapping Header: </Text>
 *     <Text>This is the rest of the line which will wrap if it's too long.</Text>
 *   </Box>
 *   <Box>
 *     <Text>
 *       Line 3 with <Text color="yellow">nested styled text</Text> inside of it.
 *     </Text>
 *   </Box>
 * </MaxSizedBox>
 */
export declare const MaxSizedBox: React.FC<MaxSizedBoxProps>;
export {};
