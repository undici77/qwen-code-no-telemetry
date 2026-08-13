/**
 * @license
 * Copyright 2026 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */
import { normalizePartList } from './nonInteractiveHelpers.js';
export const MID_TURN_USER_MESSAGE_PREFIX = '\n[User message received during tool execution]: ';
export function prefixMidTurnUserMessageParts(parts, displayText) {
    const partArray = normalizePartList(parts);
    if (partArray.length === 0) {
        return [{ text: `${MID_TURN_USER_MESSAGE_PREFIX}${displayText}` }];
    }
    const [firstPart, ...rest] = partArray;
    if ('text' in firstPart && typeof firstPart.text === 'string') {
        return [
            {
                ...firstPart,
                text: `${MID_TURN_USER_MESSAGE_PREFIX}${firstPart.text}`,
            },
            ...rest,
        ];
    }
    return [
        { text: `${MID_TURN_USER_MESSAGE_PREFIX}${displayText}` },
        ...partArray,
    ];
}
//# sourceMappingURL=midTurnUserMessage.js.map