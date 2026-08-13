/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const PREAPPROVED_HOSTS: ReadonlySet<string>;
export declare function isPreapprovedHost(hostname: string, pathname: string): boolean;
export declare function isPreapprovedUrl(url: string): boolean;
