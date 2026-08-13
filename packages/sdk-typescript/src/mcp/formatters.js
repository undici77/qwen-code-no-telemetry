/**
 * Tool result formatting utilities for MCP responses
 *
 * Converts various output types to MCP content blocks.
 */
export function formatToolResult(result) {
    // Handle Error objects
    if (result instanceof Error) {
        return {
            content: [
                {
                    type: 'text',
                    text: result.message || 'Unknown error',
                },
            ],
            isError: true,
        };
    }
    // Handle null/undefined
    if (result === null || result === undefined) {
        return {
            content: [
                {
                    type: 'text',
                    text: '',
                },
            ],
        };
    }
    // Handle string
    if (typeof result === 'string') {
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    }
    // Handle number
    if (typeof result === 'number') {
        return {
            content: [
                {
                    type: 'text',
                    text: String(result),
                },
            ],
        };
    }
    // Handle boolean
    if (typeof result === 'boolean') {
        return {
            content: [
                {
                    type: 'text',
                    text: String(result),
                },
            ],
        };
    }
    // Handle object (including arrays)
    if (typeof result === 'object') {
        try {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch {
            // JSON.stringify failed
            return {
                content: [
                    {
                        type: 'text',
                        text: String(result),
                    },
                ],
            };
        }
    }
    // Fallback: convert to string
    return {
        content: [
            {
                type: 'text',
                text: String(result),
            },
        ],
    };
}
export function formatToolError(error) {
    const message = error instanceof Error ? error.message : error;
    return {
        content: [
            {
                type: 'text',
                text: message,
            },
        ],
        isError: true,
    };
}
export function formatTextResult(text) {
    return {
        content: [
            {
                type: 'text',
                text,
            },
        ],
    };
}
export function formatJsonResult(data) {
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(data, null, 2),
            },
        ],
    };
}
export function mergeToolResults(results) {
    const mergedContent = [];
    let hasError = false;
    for (const result of results) {
        mergedContent.push(...result.content);
        if (result.isError) {
            hasError = true;
        }
    }
    return {
        content: mergedContent,
        isError: hasError,
    };
}
export function isValidContentBlock(block) {
    if (!block || typeof block !== 'object') {
        return false;
    }
    const blockObj = block;
    if (!blockObj.type || typeof blockObj.type !== 'string') {
        return false;
    }
    switch (blockObj.type) {
        case 'text':
            return typeof blockObj.text === 'string';
        case 'image':
            return (typeof blockObj.data === 'string' &&
                typeof blockObj.mimeType === 'string');
        case 'resource':
            return typeof blockObj.uri === 'string';
        default:
            return false;
    }
}
//# sourceMappingURL=formatters.js.map