/**
 * @license
 * Copyright 2026 Qwen Team
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, expect, it } from 'vitest';
import { supportedChannelCatalog } from './channel-registry.js';
const FIELD_KINDS = [
    'string',
    'secret',
    'boolean',
    'number',
    'enum',
    'string-list',
    'record',
    'object',
];
function assertDescriptorWireShape(descriptor, nested = false) {
    expect(typeof descriptor.key).toBe('string');
    expect(typeof descriptor.label).toBe('string');
    expect(FIELD_KINDS).toContain(descriptor.kind);
    if (nested) {
        expect(descriptor.kind).not.toBe('secret');
    }
    const allowedKeys = new Set([
        'key',
        'label',
        'kind',
        'required',
        'options',
        'default',
        'description',
    ]);
    if (descriptor.kind === 'object') {
        allowedKeys.add('properties');
        expect(descriptor.required ?? false).toBe(false);
        for (const property of descriptor.properties ?? []) {
            assertDescriptorWireShape(property, true);
        }
    }
    else {
        if (!nested &&
            (descriptor.kind === 'string' || descriptor.kind === 'secret')) {
            allowedKeys.add('envResolvable');
        }
        if (descriptor.kind === 'number') {
            allowedKeys.add('exclusiveMinimum');
        }
        expect(descriptor.properties).toBeUndefined();
        if (descriptor.kind !== 'number') {
            expect(descriptor.exclusiveMinimum).toBeUndefined();
        }
    }
    for (const key of Object.keys(descriptor)) {
        expect(allowedKeys).toContain(key);
    }
}
describe('channel descriptor SDK mirror', () => {
    it('keeps the SDK descriptor types assignable to the channel-base contract', () => {
        const fieldKindsMatch = true;
        const fieldDescriptorsMatch = true;
        const nestedFieldDescriptorsMatch = true;
        const catalogEnvelopesMatch = true;
        expect(fieldKindsMatch &&
            fieldDescriptorsMatch &&
            nestedFieldDescriptorsMatch &&
            catalogEnvelopesMatch).toBe(true);
    });
    it('keeps built-in descriptor values within the daemon wire contract', async () => {
        const catalog = await supportedChannelCatalog();
        const manageable = catalog.filter((entry) => entry.manageable);
        expect(manageable).not.toHaveLength(0);
        const dingtalk = catalog.find((entry) => entry.type === 'dingtalk');
        expect(dingtalk?.fields.some((field) => field.kind === 'object' &&
            field.properties !== undefined &&
            field.properties.length > 0)).toBe(true);
        for (const entry of manageable) {
            for (const field of entry.fields) {
                assertDescriptorWireShape(field);
            }
        }
    });
});
//# sourceMappingURL=channel-descriptor-sdk-mirror.test.js.map