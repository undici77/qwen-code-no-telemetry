/**
 * @license
 * Copyright 2025 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Application } from 'express';
/**
 * Allow same-origin requests from the Web Shell. Browsers send an `Origin`
 * header on same-origin POST/fetch calls; the browser-origin wall would reject
 * them. Only loopback origins are matched.
 */
export declare function installSelfOriginStripMiddleware(app: Application, getPort: () => number): void;
