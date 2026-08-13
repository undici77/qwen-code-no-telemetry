/**
 * PowerShell Command Validator
 *
 * Uses PowerShell's native System.Management.Automation.Language.Parser to create
 * a proper AST and validate commands in Plan mode. This mirrors the approach
 * used by bash-validator.ts but for PowerShell syntax.
 *
 * AST Node Types (from PowerShell):
 * - ScriptBlockAst: Root node
 * - PipelineAst: Pipeline of commands
 * - CommandAst: Simple command with elements
 * - CommandExpressionAst: Expression used as command
 * - SubExpressionAst: $(...) substitution
 * - ScriptBlockExpressionAst: { ... } script blocks
 */
import { spawnSync } from 'child_process';
import { join } from 'path';
import { debug } from '../utils/debug.ts';
// ============================================================
// Module Root (set at Electron startup)
// ============================================================
/**
 * Module-level root directory for the PowerShell parser script.
 * Set once at Electron startup via setPowerShellValidatorRoot(__dirname).
 */
let _validatorRoot;
/**
 * Register the directory containing the PowerShell parser script.
 * Call this once at app startup: setPowerShellValidatorRoot(join(__dirname, 'resources'))
 *
 * After this, the validator will look for powershell-parser.ps1 in this directory.
 */
export function setPowerShellValidatorRoot(dir) {
    _validatorRoot = dir;
    debug('[PowerShellValidator] Root set to:', dir);
}
// ============================================================
// Dangerous Cmdlets and Patterns
// ============================================================
/**
 * Cmdlets that are dangerous because they write to the filesystem or execute code.
 */
const DANGEROUS_CMDLETS = new Set([
    // File writing
    'out-file',
    'set-content',
    'add-content',
    'new-item',
    'copy-item',
    'move-item',
    'remove-item',
    'rename-item',
    'clear-content',
    // Code execution
    'invoke-expression',
    'iex',
    'invoke-command',
    'icm',
    'start-process',
    'start',
    'saps',
    // Script execution
    'invoke-item',
    'ii',
    // Downloading with output
    'invoke-webrequest',
    'iwr',
    'invoke-restmethod',
    'irm',
    // Registry modification
    'set-itemproperty',
    'new-itemproperty',
    'remove-itemproperty',
    // Service/process modification
    'stop-process',
    'kill',
    'stop-service',
    'start-service',
    'restart-service',
    'set-service',
    // Dangerous aliases
    'del',
    'rd',
    'rm',
    'rmdir',
    'erase',
    'ri',
    'mi',
    'ni',
    'sp',
]);
/**
 * Check if a cmdlet name is inherently dangerous.
 */
function isDangerousCmdlet(cmdlet) {
    return DANGEROUS_CMDLETS.has(cmdlet.toLowerCase());
}
// ============================================================
// PowerShell Process Management
// ============================================================
let powershellAvailable = null;
let powershellPath = null;
/**
 * Check if PowerShell (pwsh) is available on this system.
 * Uses synchronous check for compatibility with existing validation flow.
 */
export function isPowerShellAvailable() {
    if (powershellAvailable !== null) {
        return powershellAvailable;
    }
    // Try pwsh first (PowerShell Core - cross-platform), then Windows PowerShell by name
    const candidates = ['pwsh', 'powershell'];
    // On Windows, also try the full path to powershell.exe as a fallback.
    // Spawned subprocesses (e.g. from Electron) may not inherit the full system
    // PATH, so 'powershell' by name can fail even though it's always installed.
    if (process.platform === 'win32') {
        const systemRoot = process.env.SystemRoot || process.env.SYSTEMROOT || 'C:\\Windows';
        candidates.push(join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'));
    }
    for (const cmd of candidates) {
        try {
            const result = spawnSync(cmd, ['-NoProfile', '-NonInteractive', '-Command', 'exit 0'], {
                stdio: ['ignore', 'pipe', 'pipe'],
                timeout: 5000,
                encoding: 'utf8',
                shell: true,
            });
            if (result.status === 0) {
                powershellPath = cmd;
                powershellAvailable = true;
                debug('[PowerShellValidator] Found PowerShell:', powershellPath);
                return true;
            }
        }
        catch {
            // Try next option
        }
    }
    powershellAvailable = false;
    debug('[PowerShellValidator] PowerShell not available');
    return false;
}
/**
 * Get the path to the PowerShell parser script.
 * Requires setPowerShellValidatorRoot() to have been called at startup.
 */
function getParserScriptPath() {
    if (!_validatorRoot) {
        throw new Error('PowerShell validator root not set. Call setPowerShellValidatorRoot() at startup.');
    }
    return join(_validatorRoot, 'powershell-parser.ps1');
}
/**
 * Parse a PowerShell command using the native parser.
 * Synchronous for compatibility with existing validation flow.
 */
function parseCommand(command) {
    if (!powershellPath) {
        return { success: false, error: 'PowerShell not available' };
    }
    const scriptPath = getParserScriptPath();
    try {
        const result = spawnSync(powershellPath, ['-NoProfile', '-NonInteractive', '-File', scriptPath, '-Command', command], {
            stdio: ['ignore', 'pipe', 'pipe'],
            timeout: 10000,
            encoding: 'utf8',
            maxBuffer: 10 * 1024 * 1024, // 10MB for large ASTs
        });
        if (result.error) {
            return {
                success: false,
                error: `Failed to spawn PowerShell: ${result.error.message}`,
            };
        }
        const stdout = result.stdout || '';
        const stderr = result.stderr || '';
        if (result.status !== 0 && !stdout) {
            return {
                success: false,
                error: stderr || `PowerShell exited with code ${result.status}`,
            };
        }
        try {
            return JSON.parse(stdout);
        }
        catch (e) {
            return {
                success: false,
                error: `Failed to parse PowerShell output: ${e instanceof Error ? e.message : String(e)}`,
            };
        }
    }
    catch (e) {
        return {
            success: false,
            error: `PowerShell execution failed: ${e instanceof Error ? e.message : String(e)}`,
        };
    }
}
// ============================================================
// Validation Logic
// ============================================================
/**
 * Validate a PowerShell command using AST analysis.
 *
 * @param command - The PowerShell command string to validate
 * @param patterns - Compiled regex patterns for allowed commands
 * @returns Validation result with detailed reason if rejected
 */
export function validatePowerShellCommand(command, patterns) {
    // Check if PowerShell is available
    if (!isPowerShellAvailable()) {
        return {
            allowed: false,
            reason: {
                type: 'powershell_unavailable',
                explanation: 'PowerShell is not available on this system',
            },
        };
    }
    // Parse the command
    const parseResult = parseCommand(command);
    if (!parseResult.success || !parseResult.ast) {
        return {
            allowed: false,
            reason: {
                type: 'parse_error',
                error: parseResult.error || 'Unknown parse error',
            },
        };
    }
    // Check for parse errors
    if (parseResult.parseErrors && parseResult.parseErrors.length > 0) {
        return {
            allowed: false,
            reason: {
                type: 'parse_error',
                error: parseResult.parseErrors.map(e => e.Message).join('; '),
            },
        };
    }
    // Validate the AST
    const subcommandResults = [];
    const result = validateNode(parseResult.ast, patterns, subcommandResults);
    return {
        ...result,
        subcommandResults: subcommandResults.length > 0 ? subcommandResults : undefined,
    };
}
/**
 * Recursively validate an AST node.
 */
function validateNode(node, patterns, results) {
    if (!node) {
        return { allowed: true };
    }
    switch (node.Type) {
        case 'ScriptBlockAst':
            return validateScriptBlock(node, patterns, results);
        case 'NamedBlockAst':
            return validateNamedBlock(node, patterns, results);
        case 'PipelineAst':
            return validatePipeline(node, patterns, results);
        case 'CommandAst':
            return validateCommand(node, patterns, results);
        case 'CommandExpressionAst':
            return validateCommandExpression(node, patterns, results);
        case 'AssignmentStatementAst':
            return {
                allowed: false,
                reason: {
                    type: 'assignment',
                    explanation: 'Variable assignment could modify state',
                },
            };
        case 'SubExpressionAst':
            return {
                allowed: false,
                reason: {
                    type: 'subexpression',
                    explanation: '$(...) subexpressions execute embedded commands',
                },
            };
        case 'ScriptBlockExpressionAst':
            return {
                allowed: false,
                reason: {
                    type: 'script_block',
                    explanation: 'Script blocks { } can execute arbitrary code',
                },
            };
        default:
            // Check for dangerous patterns in any node
            return validateGenericNode(node, patterns, results);
    }
}
/**
 * Validate a ScriptBlockAst (root node).
 */
function validateScriptBlock(node, patterns, results) {
    // Validate each block
    for (const block of [node.BeginBlock, node.ProcessBlock, node.EndBlock]) {
        if (block) {
            const result = validateNode(block, patterns, results);
            if (!result.allowed) {
                return result;
            }
        }
    }
    return { allowed: true };
}
/**
 * Validate a NamedBlockAst.
 */
function validateNamedBlock(node, patterns, results) {
    for (const stmt of node.Statements || []) {
        const result = validateNode(stmt, patterns, results);
        if (!result.allowed) {
            return result;
        }
    }
    return { allowed: true };
}
/**
 * Validate a PipelineAst.
 */
function validatePipeline(node, patterns, results) {
    // Check for background execution
    if (node.Background) {
        return {
            allowed: false,
            reason: {
                type: 'background_execution',
                explanation: 'Background execution (&) could hide malicious activity',
            },
        };
    }
    // Validate each pipeline element
    for (const element of node.PipelineElements || []) {
        const result = validateNode(element, patterns, results);
        if (!result.allowed) {
            return result;
        }
    }
    return { allowed: true };
}
/**
 * Validate a CommandAst.
 */
function validateCommand(node, patterns, results) {
    // Check invocation operator
    if (node.InvocationOperator === 'Dot') {
        return {
            allowed: false,
            reason: {
                type: 'dot_sourcing',
                explanation: 'Dot-sourcing (.) executes scripts in current scope',
            },
        };
    }
    if (node.InvocationOperator === 'Ampersand') {
        return {
            allowed: false,
            reason: {
                type: 'script_block',
                explanation: 'Call operator (&) executes commands/scripts',
            },
        };
    }
    // Check for file redirections
    for (const redirect of node.Redirections || []) {
        if (redirect.Type === 'FileRedirectionAst') {
            const fileRedirect = redirect;
            const target = fileRedirect.Location?.Text || 'unknown';
            // Allow redirection to $null (PowerShell's /dev/null)
            if (target.toLowerCase() === '$null') {
                continue;
            }
            return {
                allowed: false,
                reason: {
                    type: 'redirect',
                    target,
                    explanation: `File redirection to "${target}" writes to filesystem`,
                },
            };
        }
    }
    // Build command string for pattern matching
    const commandParts = [];
    for (const element of node.CommandElements || []) {
        // Check each element for dangerous constructs
        const dangerCheck = checkForDangerousConstructs(element);
        if (dangerCheck) {
            return { allowed: false, reason: dangerCheck };
        }
        // Extract text for pattern matching
        const text = getElementText(element);
        if (text) {
            commandParts.push(text);
        }
    }
    const commandStr = commandParts.join(' ');
    const cmdletName = commandParts[0] || '';
    // Check if cmdlet is inherently dangerous
    if (isDangerousCmdlet(cmdletName)) {
        const subResult = {
            command: commandStr,
            allowed: false,
            reason: `Cmdlet "${cmdletName}" can modify system state`,
        };
        results.push(subResult);
        return {
            allowed: false,
            reason: {
                type: 'unsafe_command',
                command: commandStr,
                explanation: `Cmdlet "${cmdletName}" can modify system state`,
            },
        };
    }
    // Check against safe patterns (case-insensitive for PowerShell)
    // PowerShell cmdlets are case-insensitive, so Get-Process == get-process == GET-PROCESS
    const matchesPattern = patterns.some(pattern => {
        // Try original pattern first
        if (pattern.regex.test(commandStr)) {
            return true;
        }
        // If pattern doesn't have 'i' flag, try case-insensitive match
        if (!pattern.regex.flags.includes('i')) {
            try {
                const caseInsensitiveRegex = new RegExp(pattern.source, pattern.regex.flags + 'i');
                return caseInsensitiveRegex.test(commandStr);
            }
            catch {
                // If regex creation fails, fall back to original result
                return false;
            }
        }
        return false;
    });
    const subResult = {
        command: commandStr,
        allowed: matchesPattern,
        reason: matchesPattern ? undefined : 'Not in read-only allowlist',
    };
    results.push(subResult);
    if (!matchesPattern) {
        return {
            allowed: false,
            reason: {
                type: 'unsafe_command',
                command: commandStr,
                explanation: 'Command is not in the read-only allowlist',
            },
        };
    }
    return { allowed: true };
}
/**
 * Validate a CommandExpressionAst.
 */
function validateCommandExpression(node, patterns, results) {
    return validateNode(node.Expression, patterns, results);
}
/**
 * Validate any node for dangerous patterns.
 */
function validateGenericNode(node, _patterns, _results) {
    const dangerCheck = checkForDangerousConstructs(node);
    if (dangerCheck) {
        return { allowed: false, reason: dangerCheck };
    }
    return { allowed: true };
}
/**
 * Check an AST node for dangerous constructs.
 */
function checkForDangerousConstructs(node) {
    if (!node) {
        return null;
    }
    switch (node.Type) {
        case 'SubExpressionAst':
            return {
                type: 'subexpression',
                explanation: `$(...) subexpression executes embedded commands (found: ${node.Text})`,
            };
        case 'ScriptBlockExpressionAst':
            return {
                type: 'script_block',
                explanation: `Script block { } can execute arbitrary code (found: ${node.Text})`,
            };
        case 'ExpandableStringExpressionAst': {
            const expandable = node;
            // Check for subexpressions in the string
            for (const nested of expandable.NestedExpressions || []) {
                if (nested.Type === 'SubExpressionAst') {
                    return {
                        type: 'subexpression',
                        explanation: `String contains $(...) subexpression (found: ${node.Text})`,
                    };
                }
            }
            break;
        }
        case 'InvokeMemberExpressionAst': {
            // Method invocation could be dangerous
            const invoke = node;
            const memberText = invoke.Member?.Text?.toLowerCase() || '';
            // Block potentially dangerous method calls
            const dangerousMethods = ['invoke', 'invokescript', 'create', 'start'];
            if (dangerousMethods.some(m => memberText.includes(m))) {
                return {
                    type: 'invoke_expression',
                    explanation: `Method invocation could execute code (found: ${node.Text})`,
                };
            }
            break;
        }
    }
    return null;
}
/**
 * Get the text value from a command element.
 */
function getElementText(node) {
    if (!node) {
        return null;
    }
    switch (node.Type) {
        case 'StringConstantExpressionAst':
            return node.Value;
        case 'VariableExpressionAst':
            return `$${node.VariablePath}`;
        case 'CommandParameterAst':
            return node.Text;
        default:
            return node.Text;
    }
}
/**
 * Synchronous check if command looks like PowerShell syntax.
 * Used to determine whether to use PowerShell or bash validation.
 */
export function looksLikePowerShell(command) {
    const psPatterns = [
        // Cmdlet pattern: Verb-Noun
        /\b(Get|Set|New|Remove|Add|Clear|Write|Read|Out|ConvertTo|ConvertFrom|Test|Select|Where|ForEach|Sort|Group|Measure|Compare|Format|Export|Import|Start|Stop|Invoke|Enable|Disable|Register|Unregister|Update|Find|Install|Uninstall|Save|Publish|Push|Pop)-\w+/i,
        // PowerShell variables in pipeline
        /\$\w+\s*\|/,
        // PowerShell operators
        /\s-(?:eq|ne|gt|lt|ge|le|like|notlike|match|notmatch|contains|notcontains|in|notin|replace|split|join)\s/i,
        // Array/hashtable literals
        /@\([^)]*\)/,
        /@\{[^}]*\}/,
        // PowerShell specific cmdlets
        /\b(Where-Object|Select-Object|ForEach-Object|Sort-Object|Group-Object|Measure-Object)\b/i,
        // Common PowerShell aliases that differ from Unix
        /\b(gci|gcm|gps|gsv|gjb)\b/i,
    ];
    return psPatterns.some(p => p.test(command));
}
// ============================================================
// Write Target Extraction (for plans folder exception)
// ============================================================
/**
 * Detect and unwrap `powershell.exe -Command "..."` wrapper, returning the inner command.
 *
 * Codex on Windows often wraps PowerShell commands in:
 *   "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -Command "Set-Content -Path \"...\" ..."
 *   powershell.exe -NoProfile -Command "..."
 *   pwsh -Command "..."
 *
 * The PS AST parser sees `powershell.exe` as the top-level command (not the inner cmdlet),
 * so extractPowerShellWriteTarget() fails. This function strips the wrapper and returns
 * the inner command with escaped quotes unescaped, so it can be re-parsed.
 */
export function unwrapPowerShellCommand(command) {
    // Match: "C:\...\powershell.exe" -Command "inner"  OR  powershell.exe -Command "inner"  OR  pwsh -Command "inner"
    // Optional flags like -NoProfile -NonInteractive before -Command
    const match = command.match(/^(?:"[^"]*[/\\]?(?:powershell|pwsh)(?:\.exe)?"\s+|(?:powershell|pwsh)(?:\.exe)?\s+)(?:-(?!Command)\w+\s+)*-Command\s+"((?:[^"\\]|\\.)*)"\s*$/i);
    if (!match?.[1])
        return null;
    // Unescape inner escaped quotes: \" → "
    return match[1].replace(/\\"/g, '"');
}
/** Read cmdlets that read files */
const READ_CMDLETS = ['get-content', 'gc', 'type'];
/** Write cmdlets that output to files */
const WRITE_CMDLETS = ['out-file', 'set-content', 'add-content'];
/**
 * Extract file path from PowerShell write commands using AST analysis.
 * Used to check if a write command targets the plans folder.
 *
 * @param command - The PowerShell command string
 * @returns The file path if a write cmdlet is detected, null otherwise
 */
export function extractPowerShellWriteTarget(command) {
    if (!isPowerShellAvailable())
        return null;
    // If wrapped in powershell.exe -Command "...", unwrap and re-parse the inner command.
    // The PS AST parser would see powershell.exe as the top-level command (not the write cmdlet).
    const innerCommand = unwrapPowerShellCommand(command);
    if (innerCommand) {
        return extractPowerShellWriteTarget(innerCommand);
    }
    const parseResult = parseCommand(command);
    if (!parseResult.success || !parseResult.ast)
        return null;
    // Find the last command in any pipeline (where write cmdlets typically appear)
    const lastCmd = findLastPipelineCommand(parseResult.ast);
    if (!lastCmd)
        return null;
    // Check if it's a write cmdlet
    const cmdName = getCommandName(lastCmd);
    if (!cmdName || !WRITE_CMDLETS.includes(cmdName.toLowerCase()))
        return null;
    // Extract -FilePath or -Path parameter value
    let targetPath = extractParameterValue(lastCmd, ['FilePath', 'Path']);
    // Fallback: check for positional parameter (e.g. Out-File C:\temp\file.txt)
    if (!targetPath) {
        targetPath = extractFirstPositionalArg(lastCmd);
    }
    if (targetPath) {
        debug('[PowerShellValidator] Extracted write target:', targetPath);
    }
    return targetPath;
}
/**
 * Extract file path from PowerShell read commands using AST analysis.
 * Used to detect file reads (Get-Content, gc, type) for prerequisite tracking.
 *
 * Handles complex cases like:
 * - Get-Content -Path "file.txt" -Encoding UTF8
 * - gc file.txt | Select-String "pattern"
 * - powershell.exe -Command "Get-Content file.txt"
 *
 * @param command - The PowerShell command string
 * @returns The file path if a read cmdlet is detected, null otherwise
 */
export function extractPowerShellReadTarget(command) {
    if (!isPowerShellAvailable())
        return null;
    // If wrapped in powershell.exe -Command "...", unwrap and re-parse the inner command.
    const innerCommand = unwrapPowerShellCommand(command);
    if (innerCommand) {
        return extractPowerShellReadTarget(innerCommand);
    }
    const parseResult = parseCommand(command);
    if (!parseResult.success || !parseResult.ast)
        return null;
    // Find the first command in any pipeline (where read cmdlets appear as data source)
    const firstCmd = findFirstPipelineCommand(parseResult.ast);
    if (!firstCmd)
        return null;
    // Check if it's a read cmdlet
    const cmdName = getCommandName(firstCmd);
    if (!cmdName || !READ_CMDLETS.includes(cmdName.toLowerCase()))
        return null;
    // Extract -Path or -LiteralPath parameter value
    let targetPath = extractParameterValue(firstCmd, ['Path', 'LiteralPath']);
    // Fallback: positional parameter (e.g. Get-Content C:\temp\file.txt)
    if (!targetPath) {
        targetPath = extractFirstPositionalArg(firstCmd);
    }
    return targetPath;
}
/**
 * Find the first CommandAst in a pipeline within the AST.
 * Read cmdlets are typically the data source (first in pipeline).
 */
function findFirstPipelineCommand(ast) {
    const pipeline = findFirstPipeline(ast);
    if (!pipeline || !pipeline.PipelineElements?.length)
        return null;
    const firstElement = pipeline.PipelineElements[0];
    if (firstElement?.Type === 'CommandAst') {
        return firstElement;
    }
    return null;
}
/**
 * Find the last CommandAst in a pipeline within the AST.
 */
function findLastPipelineCommand(ast) {
    // Navigate to the first pipeline
    const pipeline = findFirstPipeline(ast);
    if (!pipeline || !pipeline.PipelineElements?.length)
        return null;
    // Get the last element in the pipeline
    const lastElement = pipeline.PipelineElements[pipeline.PipelineElements.length - 1];
    if (lastElement?.Type === 'CommandAst') {
        return lastElement;
    }
    return null;
}
/**
 * Recursively find the first PipelineAst in the AST.
 */
function findFirstPipeline(node) {
    if (!node)
        return null;
    if (node.Type === 'PipelineAst') {
        return node;
    }
    // Check ScriptBlockAst
    if (node.Type === 'ScriptBlockAst') {
        const scriptBlock = node;
        for (const block of [scriptBlock.EndBlock, scriptBlock.ProcessBlock, scriptBlock.BeginBlock]) {
            if (block) {
                const result = findFirstPipeline(block);
                if (result)
                    return result;
            }
        }
    }
    // Check NamedBlockAst
    if (node.Type === 'NamedBlockAst') {
        const namedBlock = node;
        for (const stmt of namedBlock.Statements || []) {
            const result = findFirstPipeline(stmt);
            if (result)
                return result;
        }
    }
    return null;
}
/**
 * Get the command name from a CommandAst.
 */
function getCommandName(cmd) {
    if (!cmd.CommandElements?.length)
        return null;
    const firstElement = cmd.CommandElements[0];
    // Command name is typically a StringConstantExpressionAst
    if (firstElement?.Type === 'StringConstantExpressionAst') {
        return firstElement.Value || null;
    }
    return null;
}
/**
 * Extract a parameter value from a CommandAst.
 * Looks for named parameters like -FilePath or -Path.
 */
function extractParameterValue(cmd, paramNames) {
    if (!cmd.CommandElements)
        return null;
    const lowerParamNames = paramNames.map(p => p.toLowerCase());
    for (let i = 0; i < cmd.CommandElements.length; i++) {
        const element = cmd.CommandElements[i];
        // Check for CommandParameterAst (named parameter)
        if (element?.Type === 'CommandParameterAst') {
            const param = element;
            const paramName = param.ParameterName?.toLowerCase();
            if (paramName && lowerParamNames.includes(paramName)) {
                // Parameter value might be in Argument property or next element
                if (param.Argument) {
                    return extractStringValue(param.Argument);
                }
                // Check next element for the value
                const nextElement = cmd.CommandElements[i + 1];
                if (nextElement && nextElement.Type !== 'CommandParameterAst') {
                    return extractStringValue(nextElement);
                }
            }
        }
    }
    return null;
}
/**
 * Extract the first positional argument from a CommandAst.
 * Skips the command name (index 0) and any named parameters (CommandParameterAst)
 * along with their values. Returns the first remaining string element.
 *
 * This handles commands like: Out-File C:\temp\file.txt
 * where the path is a positional parameter (no -FilePath flag).
 */
function extractFirstPositionalArg(cmd) {
    if (!cmd.CommandElements || cmd.CommandElements.length < 2)
        return null;
    let i = 1; // Skip index 0 (cmdlet name)
    while (i < cmd.CommandElements.length) {
        const element = cmd.CommandElements[i];
        if (element?.Type === 'CommandParameterAst') {
            // Skip the parameter name and its value (next element)
            i += 2;
            continue;
        }
        // First non-parameter element is the positional argument
        if (!element)
            return null;
        return extractStringValue(element);
    }
    return null;
}
/**
 * Extract string value from various AST node types.
 */
function extractStringValue(node) {
    if (!node)
        return null;
    switch (node.Type) {
        case 'StringConstantExpressionAst':
            return node.Value || null;
        case 'ExpandableStringExpressionAst':
            return node.Value || null;
        default:
            // Fallback to Text property which contains the raw text
            return node.Text?.replace(/^['"]|['"]$/g, '') || null;
    }
}
//# sourceMappingURL=powershell-validator.js.map