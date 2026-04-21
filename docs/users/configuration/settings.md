# Qwen Code Configuration

> [!tip]
>
> **Authentication / API keys:** Authentication (API Key, Alibaba Cloud Coding Plan) and auth-related environment variables (like `OPENAI_API_KEY`) are documented in **[Authentication](../configuration/authentication.md)**.

You can configure Qwen Code by creating or editing a `settings.json` file in your configuration directory:

- **Linux/macOS:** `~/.qwen/settings.json`
- **Windows:** `%APPDATA%\qwen\settings.json`

## Settings Reference

The following settings are available in the `settings.json` file.

### General

| Setting                                    | Type      | Description                                                                                                                                                                   | Default     |
| :----------------------------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- |
| `general.preferredEditor`                  | `string`  | The preferred editor to open files in.                                                                                                                                        | `undefined` |
| `general.vimMode`                          | `boolean` | Enable Vim keybindings in the terminal.                                                                                                                                       | `false`     |
| `general.enableAutoUpdate`                 | `boolean` | Enable automatic update checks and installations on startup.                                                                                                                  | `false`     |
| `general.showSessionRecap`                 | `boolean` | Auto-show a one-line "where you left off" recap when returning to the terminal after being away. Off by default. Use `/recap` to trigger manually regardless of this setting. | `false`     |
| `general.sessionRecapAwayThresholdMinutes` | `number`  | How many minutes the terminal must be blurred before an auto-recap fires on the next focus-in.                                                                                | `5`         |
| `general.gitCoAuthor`                      | `boolean` | Automatically add a `Co-authored-by` trailer to git commit messages when commits are made through Qwen Code.                                                                  | `false`     |
| `general.language`                         | `string`  | The language for the user interface.                                                                                                                                          | `"auto"`    |
| `general.outputLanguage`                   | `string`  | The language for LLM output.                                                                                                                                                  | `"auto"`    |
| `general.terminalBell`                     | `boolean` | Play terminal bell sound when response completes or needs approval.                                                                                                           | `true`      |
| `general.chatRecording`                    | `boolean` | Enable saving chat history to disk. Disabling this will also prevent `--continue` and `--resume` from working.                                                                | `true`      |
| `general.defaultFileEncoding`              | `string`  | Default encoding for new files (`utf-8` or `utf-8-bom`).                                                                                                                      | `"utf-8"`   |

### UI

| Setting                        | Type      | Description                                                                         | Default       |
| :----------------------------- | :-------- | :---------------------------------------------------------------------------------- | :------------ |
| `ui.theme`                     | `string`  | The color theme for the UI.                                                         | `"Qwen Dark"` |
| `ui.hideWindowTitle`           | `boolean` | Hide the window title bar.                                                          | `false`       |
| `ui.showStatusInTitle`         | `boolean` | Show Qwen Code status and thoughts in the terminal window title.                    | `false`       |
| `ui.hideTips`                  | `boolean` | Hide helpful tips in the UI.                                                        | `false`       |
| `ui.showLineNumbers`           | `boolean` | Show line numbers in the code output.                                               | `true`        |
| `ui.showCitations`             | `boolean` | Show citations for generated text in the chat.                                      | `false`       |
| `ui.enableWelcomeBack`         | `boolean` | Show welcome back dialog when returning to a project with conversation history.     | `true`        |
| `ui.enableUserFeedback`        | `boolean` | Show optional feedback dialog after conversations to help improve Qwen performance. | `true`        |
| `ui.enableFollowupSuggestions` | `boolean` | Show context-aware follow-up suggestions after task completion.                     | `false`       |
| `ui.compactMode`               | `boolean` | Hide tool output and thinking for a cleaner view (toggle with `Ctrl+O`).            | `false`       |

### Model

| Setting                   | Type     | Description                                                                                                | Default     |
| :------------------------ | :------- | :--------------------------------------------------------------------------------------------------------- | :---------- |
| `model.name`              | `string` | The model to use for conversations.                                                                        | `undefined` |
| `fastModel`               | `string` | Model used for generating prompt suggestions and speculative execution. Leave empty to use the main model. | `""`        |
| `model.maxSessionTurns`   | `number` | Maximum number of user/model/tool turns to keep in a session. `-1` means unlimited.                        | `-1`        |
| `model.sessionTokenLimit` | `number` | The maximum number of tokens allowed in a session.                                                         | `undefined` |

### Context

| Setting                                           | Type      | Description                                           | Default |
| :------------------------------------------------ | :-------- | :---------------------------------------------------- | :------ |
| `context.fileFiltering.respectGitIgnore`          | `boolean` | Respect `.gitignore` files when searching for files.  | `true`  |
| `context.fileFiltering.respectQwenIgnore`         | `boolean` | Respect `.qwenignore` files when searching for files. | `true`  |
| `context.fileFiltering.enableRecursiveFileSearch` | `boolean` | Enable recursive file search functionality.           | `true`  |
| `context.fileFiltering.enableFuzzySearch`         | `boolean` | Enable fuzzy search when searching for files.         | `true`  |

### Tools

| Setting                              | Type                  | Description                                                                   | Default     |
| :----------------------------------- | :-------------------- | :---------------------------------------------------------------------------- | :---------- |
| `tools.sandbox`                      | `boolean` \| `string` | Sandbox execution environment. Can be a boolean or a path string.             | `undefined` |
| `tools.shell.enableInteractiveShell` | `boolean`             | Use `node-pty` for an interactive shell experience.                           | `true`      |
| `tools.approvalMode`                 | `string`              | Approval mode for tool usage (`plan`, `default`, `auto_edit`, `yolo`).        | `"default"` |
| `tools.useRipgrep`                   | `boolean`             | Use `ripgrep` for file content search instead of the fallback implementation. | `true`      |

### Privacy

| Setting                          | Type      | Description                            | Default |
| :------------------------------- | :-------- | :------------------------------------- | :------ |
| `privacy.usageStatisticsEnabled` | `boolean` | Enable collection of usage statistics. | `false` |

## Example `settings.json`

```json
{
  "general": {
    "vimMode": true,
    "enableAutoUpdate": false
  },
  "ui": {
    "theme": "Qwen Light",
    "compactMode": true
  },
  "model": {
    "name": "qwen-max"
  }
}
```

## Disabling Telemetry (No-Telemetry Version)

In the no-telemetry version of Qwen Code, telemetry is disabled by default. You can verify this by checking the `privacy` category in your `settings.json` file:

```json
{
  "privacy": {
    "usageStatisticsEnabled": false
  }
}
```

> [!note]
>
> In the no-telemetry version, all telemetry collection is replaced with no-op implementations. No data is sent to external servers regardless of this setting.
