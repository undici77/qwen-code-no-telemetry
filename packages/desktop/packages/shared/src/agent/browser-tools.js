/**
 * Browser Tools (`browser_tool`)
 *
 * Session-scoped tooling that enables the agent to interact with built-in
 * in-app browser windows via a single CLI-like command wrapper.
 * Commands delegate to BrowserPaneFns callbacks wired by Electron's
 * SessionManager to BrowserPaneManager.
 *
 * The session → browser instance mapping is handled by the callback provider
 * (getOrCreateForSession pattern), so commands don't need instance IDs.
 */
import { z } from 'zod';
import { executeBrowserToolCommand } from './browser-tool-runtime.ts';
import { localTool } from '../mcp/local-tools.ts';
function errorResponse(message) {
    return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
    };
}
function successResponse(text) {
    return {
        content: [{ type: 'text', text }],
    };
}
const BROWSER_RELEASE_HINT = '\n\nWhen you are done using the browser, call browser_tool with command "close" to close the window entirely, or "release" to dismiss the overlay and let the user continue browsing.';
// ============================================================================
// Tool Descriptions
// ============================================================================
const BROWSER_TOOL_DESCRIPTION = `Run browser actions using a CLI-like command (string or array input).

All browser interactions use this single tool with strict validation and actionable feedback.
String mode supports batching with semicolons: \`fill @e1 value; fill @e2 value; click @e3\`
Batch stops after navigation commands (click, navigate, back, forward) since page state may change.

Array mode bypasses string parsing and preserves raw arguments exactly (recommended for semicolons, tabs, and newlines):
- \`["evaluate", "var x = 1; var y = 2; x + y"]\`
- \`["paste", "Name\\tAge\\nAlice\\t30"]\`

Examples:
- \`--help\`
- \`open\`
- \`navigate https://example.com\`
- \`snapshot\`
- \`find login button\` — search elements by keyword
- \`click @e12\`
- \`click-at 350 200\` — click at pixel coordinates (for canvas elements)
- \`drag 100 200 300 400\` — drag from (100,200) to (300,400)
- \`fill @e5 user@example.com\`
- \`type Hello World\` — type into currently focused element (no ref needed)
- \`select @e3 optionValue\`
- \`select @e75 CNAME --assert-text Target --timeout 3000\`
- \`set-clipboard Name\\tAge\\nAlice\\t30\` — write text to clipboard
- \`get-clipboard\` — read clipboard text content
- \`paste Name\\tAge\\nAlice\\t30\` — set clipboard and trigger Ctrl/Cmd+V
- \`upload @e3 /path/to/file.pdf\` — attach local file(s) to a file input
- \`scroll down 800\`
- \`evaluate document.title\`
- \`console 50 error\`
- \`screenshot\` — raw screenshot
- \`screenshot --annotated\` — screenshot with @eN labels overlaid on interactive elements
- \`screenshot-region 100 200 640 480\`
- \`screenshot-region --ref @e12 --padding 8\`
- \`screenshot-region --selector div[data-testid="chart"]\`
- \`window-resize 1440 900\`
- \`network 50 failed\`
- \`wait network-idle 8000\`
- \`key Enter\`
- \`key k meta\`
- \`downloads wait 15000\`
- \`focus [windowId]\` — focus existing browser window (no new window)
- \`windows\` — list current browser windows and ownership state
- \`release [windowId|all]\` — dismiss the agent control overlay when done
- \`close [windowId]\` — close and destroy the browser window
- \`hide [windowId]\` — hide the window while preserving state`;
// ============================================================================
// Tool Factories
// ============================================================================
export function createBrowserTools(options) {
    function getBrowserFns() {
        const fns = options.getBrowserPaneFns();
        if (!fns) {
            throw new Error('Browser window controls are not available. This tool requires the desktop app.');
        }
        return fns;
    }
    return [
        // Single CLI-like tool for all browser actions
        localTool('browser_tool', BROWSER_TOOL_DESCRIPTION, {
            command: z.union([
                z.string(),
                z.array(z.string()),
            ]).describe('Browser command as a string (e.g., "click @e1") or array (e.g., ["evaluate", "var x = 1; x + 2"]). Array mode preserves semicolons and whitespace in arguments.'),
        }, async (args) => {
            try {
                const result = await executeBrowserToolCommand({
                    command: args.command,
                    fns: getBrowserFns(),
                    sessionId: options.sessionId,
                });
                const text = result.appendReleaseHint
                    ? result.output + BROWSER_RELEASE_HINT
                    : result.output;
                if (result.image) {
                    return {
                        content: [
                            { type: 'text', text },
                            { type: 'image', data: result.image.data, mimeType: result.image.mimeType },
                        ],
                    };
                }
                return successResponse(text);
            }
            catch (error) {
                return errorResponse(error instanceof Error ? error.message : String(error));
            }
        }),
    ];
}
//# sourceMappingURL=browser-tools.js.map