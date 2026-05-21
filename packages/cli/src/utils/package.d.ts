/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { type PackageJson as BasePackageJson } from 'read-package-up';
export type PackageJson = BasePackageJson & {
    config?: {
        sandboxImageUri?: string;
    };
};
export declare function getPackageJson(): Promise<PackageJson | undefined>;
