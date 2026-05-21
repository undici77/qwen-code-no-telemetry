/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
export declare const useStateAndRef: <T extends object | null | undefined | number | string>(initialValue: T) => readonly [T, React.RefObject<T>, React.Dispatch<React.SetStateAction<T>>];
