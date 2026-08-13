/**
 * Session Tool Definitions — Single Source of Truth
 *
 * Canonical Zod schemas, descriptions, and handler registry for all
 * session-scoped tools. Consumers derive what they need:
 *
 * - in-process runtimes can use Zod schemas directly
 * - MCP runtimes use `getToolDefsAsJsonSchema()`
 *
 * Adding a new tool: define the schema, description, handler import, and
 * one entry in SESSION_TOOL_DEFS.
 */
import { z } from 'zod';
import type { SessionToolContext } from './context.ts';
import type { ToolResult } from './types.ts';
export declare const SubmitPlanSchema: z.ZodObject<{
    planPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    planPath: string;
}, {
    planPath: string;
}>;
export declare const ConfigValidateSchema: z.ZodObject<{
    target: z.ZodEnum<["config", "sources", "statuses", "preferences", "permissions", "automations", "tool-icons", "all"]>;
    sourceSlug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    target: "config" | "all" | "permissions" | "sources" | "statuses" | "preferences" | "automations" | "tool-icons";
    sourceSlug?: string | undefined;
}, {
    target: "config" | "all" | "permissions" | "sources" | "statuses" | "preferences" | "automations" | "tool-icons";
    sourceSlug?: string | undefined;
}>;
export declare const SkillValidateSchema: z.ZodObject<{
    skillSlug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    skillSlug: string;
}, {
    skillSlug: string;
}>;
export declare const MermaidValidateSchema: z.ZodObject<{
    code: z.ZodString;
    render: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    render?: boolean | undefined;
}, {
    code: string;
    render?: boolean | undefined;
}>;
export declare const SourceTestSchema: z.ZodObject<{
    sourceSlug: z.ZodString;
    autoEnable: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    sourceSlug: string;
    autoEnable?: boolean | undefined;
}, {
    sourceSlug: string;
    autoEnable?: boolean | undefined;
}>;
export declare const SourceOAuthTriggerSchema: z.ZodObject<{
    sourceSlug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    sourceSlug: string;
}, {
    sourceSlug: string;
}>;
export declare const CredentialPromptSchema: z.ZodObject<{
    sourceSlug: z.ZodString;
    mode: z.ZodEnum<["bearer", "basic", "header", "query", "multi-header"]>;
    labels: z.ZodOptional<z.ZodObject<{
        credential: z.ZodOptional<z.ZodString>;
        username: z.ZodOptional<z.ZodString>;
        password: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        username?: string | undefined;
        password?: string | undefined;
        credential?: string | undefined;
    }, {
        username?: string | undefined;
        password?: string | undefined;
        credential?: string | undefined;
    }>>;
    description: z.ZodOptional<z.ZodString>;
    hint: z.ZodOptional<z.ZodString>;
    headerNames: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    passwordRequired: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mode: "query" | "bearer" | "header" | "basic" | "multi-header";
    sourceSlug: string;
    description?: string | undefined;
    hint?: string | undefined;
    labels?: {
        username?: string | undefined;
        password?: string | undefined;
        credential?: string | undefined;
    } | undefined;
    headerNames?: string[] | undefined;
    passwordRequired?: boolean | undefined;
}, {
    mode: "query" | "bearer" | "header" | "basic" | "multi-header";
    sourceSlug: string;
    description?: string | undefined;
    hint?: string | undefined;
    labels?: {
        username?: string | undefined;
        password?: string | undefined;
        credential?: string | undefined;
    } | undefined;
    headerNames?: string[] | undefined;
    passwordRequired?: boolean | undefined;
}>;
export declare const CallLlmSchema: z.ZodObject<{
    prompt: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        path: z.ZodString;
        startLine: z.ZodOptional<z.ZodNumber>;
        endLine: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        startLine?: number | undefined;
        endLine?: number | undefined;
    }, {
        path: string;
        startLine?: number | undefined;
        endLine?: number | undefined;
    }>]>, "many">>;
    model: z.ZodOptional<z.ZodString>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    thinking: z.ZodOptional<z.ZodBoolean>;
    thinkingBudget: z.ZodOptional<z.ZodNumber>;
    outputFormat: z.ZodOptional<z.ZodEnum<["summary", "classification", "extraction", "analysis", "comparison", "validation"]>>;
    outputSchema: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"object">;
        properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        required: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[] | undefined;
    }, {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    prompt: string;
    model?: string | undefined;
    thinking?: boolean | undefined;
    systemPrompt?: string | undefined;
    temperature?: number | undefined;
    thinkingBudget?: number | undefined;
    maxTokens?: number | undefined;
    outputFormat?: "summary" | "analysis" | "validation" | "classification" | "extraction" | "comparison" | undefined;
    attachments?: (string | {
        path: string;
        startLine?: number | undefined;
        endLine?: number | undefined;
    })[] | undefined;
    outputSchema?: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[] | undefined;
    } | undefined;
}, {
    prompt: string;
    model?: string | undefined;
    thinking?: boolean | undefined;
    systemPrompt?: string | undefined;
    temperature?: number | undefined;
    thinkingBudget?: number | undefined;
    maxTokens?: number | undefined;
    outputFormat?: "summary" | "analysis" | "validation" | "classification" | "extraction" | "comparison" | undefined;
    attachments?: (string | {
        path: string;
        startLine?: number | undefined;
        endLine?: number | undefined;
    })[] | undefined;
    outputSchema?: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[] | undefined;
    } | undefined;
}>;
export declare const UpdatePreferencesSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    includeCoAuthoredBy: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    language?: string | undefined;
    notes?: string | undefined;
    region?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    timezone?: string | undefined;
    includeCoAuthoredBy?: boolean | undefined;
}, {
    name?: string | undefined;
    language?: string | undefined;
    notes?: string | undefined;
    region?: string | undefined;
    city?: string | undefined;
    country?: string | undefined;
    timezone?: string | undefined;
    includeCoAuthoredBy?: boolean | undefined;
}>;
export declare const TransformDataSchema: z.ZodObject<{
    language: z.ZodEnum<["python3", "node", "bun"]>;
    script: z.ZodString;
    inputFiles: z.ZodArray<z.ZodString, "many">;
    outputFile: z.ZodString;
}, "strip", z.ZodTypeAny, {
    language: "node" | "bun" | "python3";
    outputFile: string;
    script: string;
    inputFiles: string[];
}, {
    language: "node" | "bun" | "python3";
    outputFile: string;
    script: string;
    inputFiles: string[];
}>;
export declare const ScriptSandboxSchema: z.ZodObject<{
    language: z.ZodEnum<["python3", "node", "bun"]>;
    script: z.ZodString;
    inputFiles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    stdin: z.ZodOptional<z.ZodString>;
    timeoutMs: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    language: "node" | "bun" | "python3";
    script: string;
    timeoutMs?: number | undefined;
    stdin?: string | undefined;
    inputFiles?: string[] | undefined;
}, {
    language: "node" | "bun" | "python3";
    script: string;
    timeoutMs?: number | undefined;
    stdin?: string | undefined;
    inputFiles?: string[] | undefined;
}>;
export declare const RenderTemplateSchema: z.ZodObject<{
    source: z.ZodString;
    template: z.ZodString;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, unknown>;
    source: string;
    template: string;
}, {
    data: Record<string, unknown>;
    source: string;
    template: string;
}>;
export declare const SendDeveloperFeedbackSchema: z.ZodObject<{
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
export declare const BrowserToolSchema: z.ZodObject<{
    command: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
}, "strip", z.ZodTypeAny, {
    command: string | string[];
}, {
    command: string | string[];
}>;
export declare const SpawnSessionSchema: z.ZodObject<{
    help: z.ZodOptional<z.ZodBoolean>;
    prompt: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    llmConnection: z.ZodOptional<z.ZodString>;
    model: z.ZodOptional<z.ZodString>;
    enabledSourceSlugs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    permissionMode: z.ZodOptional<z.ZodEnum<["allow-all", "safe", "ask", "auto-edit"]>>;
    thinkingLevel: z.ZodOptional<z.ZodEnum<["off", "low", "medium", "high", "xhigh", "max"]>>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    workingDirectory: z.ZodOptional<z.ZodString>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        name?: string | undefined;
    }, {
        path: string;
        name?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    model?: string | undefined;
    permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
    help?: boolean | undefined;
    labels?: string[] | undefined;
    prompt?: string | undefined;
    workingDirectory?: string | undefined;
    attachments?: {
        path: string;
        name?: string | undefined;
    }[] | undefined;
    thinkingLevel?: "low" | "medium" | "high" | "xhigh" | "max" | "off" | undefined;
    enabledSourceSlugs?: string[] | undefined;
    llmConnection?: string | undefined;
}, {
    name?: string | undefined;
    model?: string | undefined;
    permissionMode?: "ask" | "safe" | "auto-edit" | "allow-all" | undefined;
    help?: boolean | undefined;
    labels?: string[] | undefined;
    prompt?: string | undefined;
    workingDirectory?: string | undefined;
    attachments?: {
        path: string;
        name?: string | undefined;
    }[] | undefined;
    thinkingLevel?: "low" | "medium" | "high" | "xhigh" | "max" | "off" | undefined;
    enabledSourceSlugs?: string[] | undefined;
    llmConnection?: string | undefined;
}>;
export declare const SetSessionLabelsSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    labels: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    labels: string[];
    sessionId?: string | undefined;
}, {
    labels: string[];
    sessionId?: string | undefined;
}>;
export declare const SetSessionStatusSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    sessionId?: string | undefined;
}, {
    status: string;
    sessionId?: string | undefined;
}>;
export declare const GetSessionInfoSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId?: string | undefined;
}, {
    sessionId?: string | undefined;
}>;
export declare const ListSessionsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodOptional<z.ZodEnum<["recent", "name", "status"]>>;
    limit: z.ZodOptional<z.ZodNumber>;
    offset: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    label?: string | undefined;
    search?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "name" | "status" | "recent" | undefined;
}, {
    label?: string | undefined;
    search?: string | undefined;
    status?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    sortBy?: "name" | "status" | "recent" | undefined;
}>;
export declare const SendAgentMessageSchema: z.ZodObject<{
    sessionId: z.ZodString;
    message: z.ZodString;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        name?: string | undefined;
    }, {
        path: string;
        name?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    message: string;
    sessionId: string;
    attachments?: {
        path: string;
        name?: string | undefined;
    }[] | undefined;
}, {
    message: string;
    sessionId: string;
    attachments?: {
        path: string;
        name?: string | undefined;
    }[] | undefined;
}>;
export declare const ListMessagingChannelsSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sessionId?: string | undefined;
}, {
    sessionId?: string | undefined;
}>;
export declare const UnbindMessagingChannelSchema: z.ZodObject<{
    platform: z.ZodOptional<z.ZodEnum<["telegram", "whatsapp"]>>;
}, "strip", z.ZodTypeAny, {
    platform?: "telegram" | "whatsapp" | undefined;
}, {
    platform?: "telegram" | "whatsapp" | undefined;
}>;
export declare const TOOL_DESCRIPTIONS: {
    readonly SubmitPlan: "Submit a plan for user review.\n\nCall this after you have written your plan to a markdown file using the Write tool.\nThe plan will be displayed to the user in a special formatted view.\n\n**IMPORTANT:** After calling this tool:\n- Execution will be **automatically paused** to present the plan to the user\n- No further tool calls or text output will be processed after this tool returns\n- The conversation will resume when the user responds (accept, modify, or reject the plan)\n- Do NOT include any text or tool calls after SubmitPlan - they will not be executed";
    readonly config_validate: "Validate Qwen Code configuration files.\n\nUse this after editing configuration files to check for errors before they take effect.\nReturns structured validation results with errors, warnings, and suggestions.\n\n**Targets:**\n- `config`: Validates config.json (workspaces, model, settings)\n- `sources`: Validates all source config.json files\n- `statuses`: Validates statuses config.json\n- `preferences`: Validates preferences.json\n- `permissions`: Validates permissions.json files\n- `automations`: Validates automations.json configuration\n- `tool-icons`: Validates tool-icons.json\n- `all`: Validates all configuration files";
    readonly skill_validate: "Validate a skill's SKILL.md file.\n\nChecks:\n- Slug format (lowercase alphanumeric with hyphens)\n- SKILL.md exists and is readable\n- YAML frontmatter is valid with required fields (name, description)\n- Content is non-empty after frontmatter\n- Icon format if present (svg/png/jpg)";
    readonly mermaid_validate: "Validate Mermaid diagram syntax before outputting.\n\nUse this when:\n- Creating complex diagrams with many nodes/relationships\n- Unsure about syntax for a specific diagram type\n- Debugging a diagram that failed to render\n\nReturns validation result with specific error messages if invalid.";
    readonly source_test: "Validate, test, and (by default) activate a source configuration.\n\n**This tool performs:**\n1. **Schema validation**: Validates config.json structure\n2. **Icon handling**: Checks/downloads icon if configured\n3. **Completeness check**: Warns about missing guide.md/icon/tagline\n4. **Connection test**: Tests if the source is reachable\n5. **Auth status**: Checks if source is authenticated\n6. **Auto-enable** (default): If validation passes, flip `enabled: true` in config (if needed) and activate the source in the running session so its tools become available without a restart.\n\nPass `autoEnable: false` to keep pure validation behavior (no config or session mutations).";
    readonly source_oauth_trigger: "Start OAuth authentication for an MCP source.\n\nThis tool initiates the OAuth 2.0 + PKCE flow for sources that require authentication.\n\n**Prerequisites:**\n- Source must exist in the current workspace\n- Source must be type 'mcp' with authType 'oauth'\n- Source must have a valid MCP URL\n\n**IMPORTANT:** After calling this tool, execution will be paused while OAuth completes.";
    readonly source_google_oauth_trigger: "Trigger Google OAuth authentication for a Google API source.\n\nOpens a browser window for the user to sign in with their Google account.\n\n**Supported services:** Gmail, Calendar, Drive, Docs, Sheets, YouTube, Search Console\n\n**IMPORTANT:** After calling this tool, execution will be paused while OAuth completes.";
    readonly source_slack_oauth_trigger: "Trigger Slack OAuth authentication for a Slack API source.\n\nOpens a browser window for the user to sign in with their Slack account.\n\n**IMPORTANT:** After calling this tool, execution will be paused while OAuth completes.";
    readonly source_microsoft_oauth_trigger: "Trigger Microsoft OAuth authentication for a Microsoft API source.\n\nOpens a browser window for the user to sign in with their Microsoft account.\n\n**Supported services:** Outlook, Calendar, OneDrive, Teams, SharePoint\n\n**IMPORTANT:** After calling this tool, execution will be paused while OAuth completes.";
    readonly source_credential_prompt: "Prompt the user to enter credentials for a source.\n\nUse this when a source requires authentication that isn't OAuth.\nThe user will see a secure input UI with appropriate fields based on the auth mode.\n\n**Auth Modes:**\n- `bearer`: Single token field (Bearer Token, API Key)\n- `basic`: Username and Password fields\n- `header`: API Key with custom header name shown\n- `query`: API Key for query parameter auth\n- `multi-header`: Multiple API keys with custom header names\n\n**IMPORTANT:** After calling this tool, execution will be paused for user input.";
    readonly update_user_preferences: "Update stored user preferences. Use this when you learn information about the user that would be helpful to remember for future conversations. This includes their name, timezone, location, preferred language, or any other relevant notes. Only update fields you have confirmed information about - don't guess.";
    readonly transform_data: "Transform data files using a script and write structured output for datatable/spreadsheet blocks, or extract HTML content for html-preview blocks.\n\nUse this tool when you need to transform large datasets (20+ rows) into structured JSON for display, or extract/decode content for rich previews. Write a transform script that reads the input file and produces an output file, then reference it via `\"src\"` in your datatable/spreadsheet/html-preview/pdf-preview/image-preview block.\n\n**Workflow:**\n1. Call `transform_data` with a script that reads input files and writes output\n2. Output a datatable/spreadsheet block with `\"src\": \"data/output.json\"`, an html-preview block with `\"src\": \"data/output.html\"`, a pdf-preview block with `\"src\": \"data/output.pdf\"`, or an image-preview block with `\"src\": \"data/output.png\"`\n\n**Script conventions:**\n- Input file paths are passed as command-line arguments (last arg = output file path)\n- Python: `sys.argv[1:-1]` = input files, `sys.argv[-1]` = output path\n- Node/Bun: `process.argv.slice(2, -1)` = input files, `process.argv.at(-1)` = output path\n- For datatable/spreadsheet: output must be valid JSON: `{\"title\": \"...\", \"columns\": [...], \"rows\": [...]}`\n- For html-preview: output is an HTML file (any valid HTML)\n\n**Security:** Runs in an isolated subprocess with no access to API keys or credentials. 30-second timeout.";
    readonly script_sandbox: "Run quick inline diagnostics in a sandboxed subprocess with network isolation.\n\nUse this for short Python/Node/Bun snippets when strict Plan-mode Bash parsing blocks inline diagnostics.\n\n**Behavior:**\n- Executes script source from `script` in a temporary file\n- Returns stdout/stderr, exit code, duration, and timeout status\n- Accepts optional input files and stdin\n- Requires enforced network and filesystem isolation; if unsupported or unusable, execution is blocked\n\n**Safety:**\n- Sensitive credential env vars are stripped\n- Input files are restricted to the current session directory\n- Filesystem writes are restricted to the current session directory\n- Timeout is capped (default 5000ms, max 15000ms)\n- Network/filesystem isolation is required in all permission modes; if unavailable, execution is blocked";
    readonly render_template: "Render a source's HTML template with data.\n\nUse this when a source provides HTML templates for rich rendering of its data (e.g., issue detail views, email threads, ticket summaries).\n\n**Workflow:**\n1. Fetch data from the source (via MCP tools or API calls)\n2. Call `render_template` with the source slug, template ID, and data\n3. Output an `html-preview` block with the returned file path as `\"src\"`\n\n**Available templates** are documented in each source's `guide.md` under the \"Templates\" section.\n\nTemplates use Mustache syntax — the tool handles rendering and writes the output HTML to the session data folder.";
    readonly browser_tool: "Run browser actions using a CLI-like command (string or array input).\n\nAll browser interactions use this single tool with strict validation and actionable feedback.\nString mode supports batching with semicolons: `fill @e1 value; fill @e2 value; click @e3`\nBatch stops after navigation commands (click, navigate, back, forward) since page state may change.\n\nArray mode bypasses string parsing and preserves raw arguments exactly (recommended for semicolons, tabs, and newlines):\n- `[\"evaluate\", \"var x = 1; var y = 2; x + y\"]`\n- `[\"paste\", \"Name\\tAge\\nAlice\\t30\"]`\n\nExamples:\n- `--help`\n- `open`\n- `navigate https://example.com`\n- `snapshot`\n- `find login button` — search elements by keyword\n- `click @e12`\n- `click-at 350 200` — click at pixel coordinates (for canvas elements)\n- `fill @e5 user@example.com`\n- `type Hello World` — type into currently focused element (no ref needed)\n- `select @e3 optionValue`\n- `select @e75 CNAME --assert-text Target --timeout 3000`\n- `set-clipboard Name\\tAge\\nAlice\\t30` — write text to clipboard\n- `get-clipboard` — read clipboard text content\n- `paste Name\\tAge\\nAlice\\t30` — set clipboard and trigger Ctrl/Cmd+V\n- `scroll down 800`\n- `evaluate document.title`\n- `console 50 error`\n- `screenshot` — raw screenshot\n- `screenshot --annotated` — screenshot with @eN labels overlaid on interactive elements\n- `screenshot-region 100 200 640 480`\n- `screenshot-region --ref @e12 --padding 8`\n- `screenshot-region --selector div[data-testid=\"chart\"]`\n- `window-resize 1440 900`\n- `network 50 failed`\n- `wait network-idle 8000`\n- `key Enter`\n- `key k meta`\n- `downloads wait 15000`\n- `focus [windowId]` — focus existing browser window (no new window)\n- `windows` — list current browser windows and ownership state\n- `release` — dismiss the agent control overlay when done\n- `close` — close and destroy the browser window\n- `hide` — hide the window while preserving state";
    readonly call_llm: "Invoke a secondary LLM for focused subtasks. Use for:\n- Cost optimization: use a smaller model for simple tasks (summarization, classification)\n- Structured output: JSON schema compliance via prompt instructions\n- Parallel processing: call multiple times in one message - all run simultaneously\n- Context isolation: process content without polluting main context\n\nPut text/content directly in the 'prompt' parameter. Do NOT pass inline text via attachments.\nOnly use 'attachments' for existing file paths on disk - the tool loads file content automatically.\nFor large files (>2000 lines), use {path, startLine, endLine} to select a portion.";
    readonly spawn_session: "Create a new session that runs independently with its own prompt, connection, model, and sources.\n\nUse this to delegate tasks to parallel sessions — research, analysis, drafts, or any work that benefits from separate context.\n\nCall with help=true first to discover available connections, models, and sources.\nWhen spawning, the 'prompt' parameter is required.\n\nOptional overrides: `model`, `llmConnection`, `permissionMode`, `thinkingLevel`, `enabledSourceSlugs`, `labels`, `workingDirectory`. Omitted fields inherit from the spawning session or the workspace default.\n\n`thinkingLevel` is silently ignored on non-reasoning models (e.g. gpt-4o, gemini-2.5-flash) — the SDK drops the reasoning param rather than erroring. Use it when you want to force deeper reasoning on a supported model, or set it to `off` when spawning a session that doesn't need to think.\n\nThe spawned session appears in the session list and runs fire-and-forget.\nOnly use 'attachments' for existing file paths on disk — the tool reads them automatically.";
    readonly send_developer_feedback: "Send freeform feedback to the Qwen Code development team.\n\nUse this to share anything that would help improve the product — issues you hit, ideas for better tools, suggestions for improved workflows, or patterns you notice. Write in markdown with as much detail as possible. This is your direct line to the developers.";
    readonly set_session_labels: "Set labels on the current session or a specific session by ID. Replaces all existing labels.\n\nUse this to tag sessions for filtering or to trigger label-based automations (LabelAdd/LabelRemove events).\nPass an empty array to clear all labels. Omit sessionId to target the current session.";
    readonly set_session_status: "Set the status of the current session or a specific session by ID (e.g., \"todo\", \"in_progress\", \"done\").\n\nUse this to signal completion or trigger status-based automations (SessionStatusChange events).\nOmit sessionId to target the current session.";
    readonly get_session_info: "Get metadata about the current session or a specific session by ID.\n\nReturns labels, status, name, permission mode, and other details.\nCall with no arguments to introspect your own session state.";
    readonly list_sessions: "List sessions in the workspace. Returns total count + paginated results.\n\nUse filters (status, label, search) to narrow results instead of fetching everything. Default limit is 20 sessions.\nUse get_session_info for full details on a specific session (list-then-detail pattern).";
    readonly send_agent_message: "Send a message to another session. The message is delivered with your session ID so the target can reply back.\n\nUse this to coordinate with spawned sessions, send follow-up instructions, or relay information between sessions.\nUse list_sessions to find session IDs, or use the sessionId returned by spawn_session.\n\nThe target session receives your message with a sender envelope containing your session ID, so it can use send_agent_message to reply.";
    readonly list_messaging_channels: "List messaging channels (Telegram, WhatsApp) bound to a session.\nShows which external chat apps are connected and can send/receive messages.";
    readonly unbind_messaging_channel: "Disconnect a messaging channel from the current session.\nMessages will no longer be forwarded between the chat app and this session.";
};
/** Handler function signature for session tools. */
export type SessionToolHandler = (ctx: SessionToolContext, args: any) => Promise<ToolResult>;
/** Where a session tool is executed. */
export type SessionToolExecutionMode = 'registry' | 'backend';
/** Safe/Plan mode behavior for a session tool. */
export type SessionToolSafeMode = 'allow' | 'block';
interface SessionToolDefBase {
    name: string;
    description: string;
    inputSchema: z.ZodObject<z.ZodRawShape>;
    /** Whether this tool is allowed in Explore/Safe mode. */
    safeMode: SessionToolSafeMode;
    /** Whether this tool only reads data (no side effects). Enables parallel execution in backends that support it. */
    readOnly?: boolean;
}
/** Tool executed from the canonical registry (requires a concrete handler). */
export interface RegistrySessionToolDef extends SessionToolDefBase {
    executionMode: 'registry';
    handler: SessionToolHandler;
}
/** Tool executed by backend-specific adapters. */
export interface BackendSessionToolDef extends SessionToolDefBase {
    executionMode: 'backend';
    handler: null;
}
/** A single session tool definition combining name, description, schema, mode, and handler. */
export type SessionToolDef = RegistrySessionToolDef | BackendSessionToolDef;
export declare const SESSION_TOOL_DEFS: SessionToolDef[];
export interface SessionToolFilterOptions {
    /** Include the experimental send_developer_feedback tool. */
    includeDeveloperFeedback?: boolean;
}
/**
 * Return session tools with optional feature filtering.
 *
 * Callers should use this helper instead of filtering ad hoc so tool visibility
 * stays consistent across backend implementations.
 */
export declare function getSessionToolDefs(options?: SessionToolFilterOptions): SessionToolDef[];
/**
 * Build a name->definition registry with optional feature filtering.
 */
export declare function getSessionToolRegistry(options?: SessionToolFilterOptions): Map<string, SessionToolDef>;
/**
 * Return session tool names with optional feature filtering.
 */
export declare function getSessionToolNames(options?: SessionToolFilterOptions): Set<string>;
/**
 * Return backend-executed tool names with optional feature filtering.
 */
export declare function getSessionBackendToolNames(options?: SessionToolFilterOptions): Set<string>;
/**
 * Return registry-executed tool names with optional feature filtering.
 */
export declare function getSessionRegistryToolNames(options?: SessionToolFilterOptions): Set<string>;
export interface SessionToolNameOptions extends SessionToolFilterOptions {
    /** Optional name prefix for consumers (e.g. 'mcp__session__'). */
    prefix?: string;
}
/**
 * Return session tool names that are allowed in Explore/Safe mode.
 */
export declare function getSessionSafeAllowedToolNames(options?: SessionToolNameOptions): Set<string>;
/**
 * Return session tool names that are blocked in Explore/Safe mode.
 */
export declare function getSessionSafeBlockedToolNames(options?: SessionToolNameOptions): Set<string>;
/** Set of session tool names for quick membership checks. */
export declare const SESSION_TOOL_NAMES: Set<string>;
/** Session tool names that must be handled by backend-specific adapters. */
export declare const SESSION_BACKEND_TOOL_NAMES: Set<string>;
/** Session tool names that are always executable from the canonical registry. */
export declare const SESSION_REGISTRY_TOOL_NAMES: Set<string>;
/** Session tool names allowed in Explore/Safe mode (unfiltered canonical set). */
export declare const SESSION_SAFE_ALLOWED_TOOL_NAMES: Set<string>;
/** Session tool names blocked in Explore/Safe mode (unfiltered canonical set). */
export declare const SESSION_SAFE_BLOCKED_TOOL_NAMES: Set<string>;
/** Map from tool name → definition for O(1) lookup. */
export declare const SESSION_TOOL_REGISTRY: Map<string, SessionToolDef>;
export interface JsonSchemaToolDef {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}
/**
 * Convert session tool definitions to JSON Schema format.
 *
 * @param opts.prefix - Optional prefix for tool names
 * @param opts.includeDeveloperFeedback - Include experimental feedback tool in output
 * @returns Array of tool definitions with JSON Schema inputSchema
 */
export declare function getToolDefsAsJsonSchema(opts?: {
    prefix?: string;
    includeDeveloperFeedback?: boolean;
}): JsonSchemaToolDef[];
export {};
