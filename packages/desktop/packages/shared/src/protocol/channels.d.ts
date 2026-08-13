/**
 * RPC channel names — organized by domain namespace.
 * Wire-format strings (values) are the stable API contract.
 * Key paths are internal and may be reorganized freely.
 */
export declare const RPC_CHANNELS: {
    readonly remote: {
        readonly TEST_CONNECTION: "remote:testConnection";
    };
    readonly server: {
        readonly GET_WORKSPACES: "server:getWorkspaces";
        readonly CREATE_WORKSPACE: "server:createWorkspace";
        readonly GET_STATUS: "server:getStatus";
        readonly GET_HEALTH: "server:getHealth";
        readonly GET_ACTIVE_SESSIONS: "server:getActiveSessions";
        readonly SHUTTING_DOWN: "server:shuttingDown";
        readonly STATUS_CHANGED: "server:statusChanged";
        readonly HOME_DIR: "server:homeDir";
    };
    readonly sessions: {
        readonly GET: "sessions:get";
        readonly GET_FOR_WORKSPACE: "sessions:getForWorkspace";
        readonly GET_UNREAD_SUMMARY: "sessions:getUnreadSummary";
        readonly MARK_ALL_READ: "sessions:markAllRead";
        readonly UNREAD_SUMMARY_CHANGED: "sessions:unreadSummaryChanged";
        readonly LIST_CHANGED: "sessions:listChanged";
        readonly LIST_REFRESH_STATE_CHANGED: "sessions:listRefreshStateChanged";
        readonly CREATE: "sessions:create";
        readonly DELETE: "sessions:delete";
        readonly GET_MESSAGES: "sessions:getMessages";
        readonly SEND_MESSAGE: "sessions:sendMessage";
        readonly CANCEL: "sessions:cancel";
        readonly KILL_SHELL: "sessions:killShell";
        readonly RESPOND_TO_PERMISSION: "sessions:respondToPermission";
        readonly RESPOND_TO_CREDENTIAL: "sessions:respondToCredential";
        readonly COMMAND: "sessions:command";
        readonly GET_PENDING_PLAN_EXECUTION: "sessions:getPendingPlanExecution";
        readonly GET_PERMISSION_MODE_STATE: "sessions:getPermissionModeState";
        readonly EVENT: "session:event";
        readonly GET_MODEL: "session:getModel";
        readonly SET_MODEL: "session:setModel";
        readonly GET_FILES: "sessions:getFiles";
        readonly GET_NOTES: "sessions:getNotes";
        readonly SET_NOTES: "sessions:setNotes";
        readonly WATCH_FILES: "sessions:watchFiles";
        readonly UNWATCH_FILES: "sessions:unwatchFiles";
        readonly FILES_CHANGED: "sessions:filesChanged";
        readonly SEARCH_CONTENT: "sessions:searchContent";
        readonly EXPORT: "sessions:export";
        readonly IMPORT: "sessions:import";
        readonly EXPORT_REMOTE_TRANSFER: "sessions:exportRemoteTransfer";
        readonly IMPORT_REMOTE_TRANSFER: "sessions:importRemoteTransfer";
    };
    readonly transfer: {
        readonly START: "transfer:start";
        readonly CHUNK: "transfer:chunk";
        readonly COMMIT: "transfer:commit";
        readonly ABORT: "transfer:abort";
    };
    readonly tasks: {
        readonly GET_OUTPUT: "tasks:getOutput";
    };
    readonly workspaces: {
        readonly GET: "workspaces:get";
        readonly CREATE: "workspaces:create";
        readonly CREATE_PERMANENT_WORKTREE: "workspaces:createPermanentWorktree";
        readonly CHECK_SLUG: "workspaces:checkSlug";
        readonly UPDATE_REMOTE: "workspaces:updateRemote";
    };
    readonly window: {
        readonly GET_WORKSPACE: "window:getWorkspace";
        readonly GET_MODE: "window:getMode";
        readonly OPEN_WORKSPACE: "window:openWorkspace";
        readonly OPEN_SESSION_IN_NEW_WINDOW: "window:openSessionInNewWindow";
        readonly SWITCH_WORKSPACE: "window:switchWorkspace";
        readonly CLOSE: "window:close";
        readonly CLOSE_REQUESTED: "window:closeRequested";
        readonly CONFIRM_CLOSE: "window:confirmClose";
        readonly CANCEL_CLOSE: "window:cancelClose";
        readonly SET_TRAFFIC_LIGHTS: "window:setTrafficLights";
        readonly BEGIN_DRAG: "window:beginDrag";
        readonly MOVE_DRAG: "window:moveDrag";
        readonly END_DRAG: "window:endDrag";
        readonly FOCUS_STATE: "window:focusState";
        readonly GET_FOCUS_STATE: "window:getFocusState";
        readonly PET_SET_ENABLED: "window:petSetEnabled";
        readonly PET_SET_IGNORE_MOUSE: "window:petSetIgnoreMouse";
        readonly PET_FOCUS_SESSION: "window:petFocusSession";
    };
    readonly file: {
        readonly READ: "file:read";
        readonly READ_DATA_URL: "file:readDataUrl";
        readonly READ_PREVIEW_DATA_URL: "file:readPreviewDataUrl";
        readonly READ_BINARY: "file:readBinary";
        readonly OPEN_DIALOG: "file:openDialog";
        readonly READ_ATTACHMENT: "file:readAttachment";
        readonly READ_USER_ATTACHMENT: "file:readUserAttachment";
        readonly STORE_ATTACHMENT: "file:storeAttachment";
        readonly GENERATE_THUMBNAIL: "file:generateThumbnail";
    };
    readonly fs: {
        readonly SEARCH: "fs:search";
        readonly LIST_DIRECTORY: "fs:listDirectory";
    };
    readonly debug: {
        readonly LOG: "debug:log";
    };
    readonly theme: {
        readonly GET_SYSTEM_PREFERENCE: "theme:getSystemPreference";
        readonly SYSTEM_CHANGED: "theme:systemChanged";
        readonly APP_CHANGED: "theme:appChanged";
        readonly GET_APP: "theme:getApp";
        readonly GET_PRESETS: "theme:getPresets";
        readonly LOAD_PRESET: "theme:loadPreset";
        readonly GET_COLOR_THEME: "theme:getColorTheme";
        readonly SET_COLOR_THEME: "theme:setColorTheme";
        readonly BROADCAST_PREFERENCES: "theme:broadcastPreferences";
        readonly PREFERENCES_CHANGED: "theme:preferencesChanged";
        readonly GET_WORKSPACE_COLOR_THEME: "theme:getWorkspaceColorTheme";
        readonly SET_WORKSPACE_COLOR_THEME: "theme:setWorkspaceColorTheme";
        readonly GET_ALL_WORKSPACE_THEMES: "theme:getAllWorkspaceThemes";
        readonly BROADCAST_WORKSPACE_THEME: "theme:broadcastWorkspaceTheme";
        readonly WORKSPACE_THEME_CHANGED: "theme:workspaceThemeChanged";
    };
    readonly system: {
        readonly VERSIONS: "system:versions";
        readonly HOME_DIR: "system:homeDir";
        readonly IS_DEBUG_MODE: "system:isDebugMode";
    };
    readonly update: {
        readonly CHECK: "update:check";
        readonly GET_INFO: "update:getInfo";
        readonly INSTALL: "update:install";
        readonly DISMISS: "update:dismiss";
        readonly GET_DISMISSED: "update:getDismissed";
        readonly AVAILABLE: "update:available";
        readonly DOWNLOAD_PROGRESS: "update:downloadProgress";
    };
    readonly shell: {
        readonly OPEN_URL: "shell:openUrl";
        readonly OPEN_FILE: "shell:openFile";
        readonly SHOW_IN_FOLDER: "shell:showInFolder";
    };
    readonly menu: {
        readonly NEW_CHAT: "menu:newChat";
        readonly NEW_WINDOW: "menu:newWindow";
        readonly OPEN_SETTINGS: "menu:openSettings";
        readonly KEYBOARD_SHORTCUTS: "menu:keyboardShortcuts";
        readonly TOGGLE_FOCUS_MODE: "menu:toggleFocusMode";
        readonly TOGGLE_SIDEBAR: "menu:toggleSidebar";
        readonly QUIT: "menu:quit";
        readonly MINIMIZE: "menu:minimize";
        readonly MAXIMIZE: "menu:maximize";
        readonly ZOOM_IN: "menu:zoomIn";
        readonly ZOOM_OUT: "menu:zoomOut";
        readonly ZOOM_RESET: "menu:zoomReset";
        readonly TOGGLE_DEV_TOOLS: "menu:toggleDevTools";
        readonly UNDO: "menu:undo";
        readonly REDO: "menu:redo";
        readonly CUT: "menu:cut";
        readonly COPY: "menu:copy";
        readonly PASTE: "menu:paste";
        readonly SELECT_ALL: "menu:selectAll";
    };
    readonly deeplink: {
        readonly NAVIGATE: "deeplink:navigate";
    };
    readonly auth: {
        readonly LOGOUT: "auth:logout";
        readonly SHOW_LOGOUT_CONFIRMATION: "auth:showLogoutConfirmation";
        readonly SHOW_DELETE_SESSION_CONFIRMATION: "auth:showDeleteSessionConfirmation";
    };
    readonly credentials: {
        readonly HEALTH_CHECK: "credentials:healthCheck";
    };
    readonly onboarding: {
        readonly GET_AUTH_STATE: "onboarding:getAuthState";
        readonly VALIDATE_MCP: "onboarding:validateMcp";
        readonly START_MCP_OAUTH: "onboarding:startMcpOAuth";
        readonly DEFER_SETUP: "onboarding:deferSetup";
    };
    readonly llmConnections: {
        readonly LIST: "LLM_Connection:list";
        readonly LIST_WITH_STATUS: "LLM_Connection:listWithStatus";
        readonly GET: "LLM_Connection:get";
        readonly GET_API_KEY: "LLM_Connection:getApiKey";
        readonly SAVE: "LLM_Connection:save";
        readonly DELETE: "LLM_Connection:delete";
        readonly TEST: "LLM_Connection:test";
        readonly SET_DEFAULT: "LLM_Connection:setDefault";
        readonly SET_WORKSPACE_DEFAULT: "LLM_Connection:setWorkspaceDefault";
        readonly REFRESH_MODELS: "LLM_Connection:refreshModels";
        readonly CHANGED: "LLM_Connection:changed";
    };
    readonly settings: {
        readonly SETUP_LLM_CONNECTION: "settings:setupLlmConnection";
        readonly TEST_LLM_CONNECTION_SETUP: "settings:testLlmConnectionSetup";
        readonly LIST_QWEN_PROVIDERS: "settings:listQwenProviders";
        readonly CONNECT_QWEN_PROVIDER: "settings:connectQwenProvider";
        readonly GET_DEFAULT_THINKING_LEVEL: "settings:getDefaultThinkingLevel";
        readonly SET_DEFAULT_THINKING_LEVEL: "settings:setDefaultThinkingLevel";
        readonly GET_QWEN_CORE_SETTINGS: "settings:getQwenCoreSettings";
        readonly SET_QWEN_CORE_SETTING: "settings:setQwenCoreSetting";
        readonly SET_QWEN_MCP_SERVER: "settings:setQwenMcpServer";
        readonly REMOVE_QWEN_MCP_SERVER: "settings:removeQwenMcpServer";
        readonly SET_QWEN_HOOK: "settings:setQwenHook";
        readonly REMOVE_QWEN_HOOK: "settings:removeQwenHook";
        readonly SET_QWEN_EXTENSION_SETTING: "settings:setQwenExtensionSetting";
        readonly GET_QWEN_PERMISSION_SETTINGS: "settings:getQwenPermissionSettings";
        readonly SET_QWEN_PERMISSION_RULES: "settings:setQwenPermissionRules";
        readonly GET_GLOBAL_PERMISSION_MODE: "settings:getGlobalPermissionMode";
        readonly SET_GLOBAL_PERMISSION_MODE: "settings:setGlobalPermissionMode";
        readonly GET_NETWORK_PROXY: "settings:getNetworkProxy";
        readonly SET_NETWORK_PROXY: "settings:setNetworkProxy";
        readonly GET_SERVER_CONFIG: "settings:getServerConfig";
        readonly SET_SERVER_CONFIG: "settings:setServerConfig";
        readonly GET_SERVER_STATUS: "settings:getServerStatus";
    };
    readonly dialog: {
        readonly OPEN_FOLDER: "dialog:openFolder";
    };
    readonly preferences: {
        readonly READ: "preferences:read";
        readonly WRITE: "preferences:write";
    };
    readonly drafts: {
        readonly GET: "drafts:get";
        readonly SET: "drafts:set";
        readonly DELETE: "drafts:delete";
        readonly GET_ALL: "drafts:getAll";
    };
    readonly sources: {
        readonly GET: "sources:get";
        readonly CREATE: "sources:create";
        readonly DELETE: "sources:delete";
        readonly START_OAUTH: "sources:startOAuth";
        readonly SAVE_CREDENTIALS: "sources:saveCredentials";
        readonly CHANGED: "sources:changed";
        readonly GET_PERMISSIONS: "sources:getPermissions";
        readonly GET_MCP_TOOLS: "sources:getMcpTools";
    };
    readonly oauth: {
        readonly START: "oauth:start";
        readonly COMPLETE: "oauth:complete";
        readonly CANCEL: "oauth:cancel";
        readonly REVOKE: "oauth:revoke";
    };
    readonly workspace: {
        readonly GET_PERMISSIONS: "workspace:getPermissions";
        readonly READ_IMAGE: "workspace:readImage";
        readonly WRITE_IMAGE: "workspace:writeImage";
        readonly SETTINGS_GET: "workspaceSettings:get";
        readonly SETTINGS_UPDATE: "workspaceSettings:update";
    };
    readonly permissions: {
        readonly GET_DEFAULTS: "permissions:getDefaults";
        readonly DEFAULTS_CHANGED: "permissions:defaultsChanged";
    };
    readonly skills: {
        readonly GET: "skills:get";
        readonly GET_FILES: "skills:getFiles";
        readonly DELETE: "skills:delete";
        readonly SET_ENABLED: "skills:setEnabled";
        readonly MARKETPLACE_LIST: "skills:marketplaceList";
        readonly MARKETPLACE_INSTALL: "skills:marketplaceInstall";
        readonly OPEN_EDITOR: "skills:openEditor";
        readonly OPEN_FINDER: "skills:openFinder";
        readonly CHANGED: "skills:changed";
    };
    readonly statuses: {
        readonly LIST: "statuses:list";
        readonly REORDER: "statuses:reorder";
        readonly CHANGED: "statuses:changed";
    };
    readonly labels: {
        readonly LIST: "labels:list";
        readonly CREATE: "labels:create";
        readonly DELETE: "labels:delete";
        readonly CHANGED: "labels:changed";
    };
    readonly views: {
        readonly LIST: "views:list";
        readonly SAVE: "views:save";
    };
    readonly toolIcons: {
        readonly GET_MAPPINGS: "toolIcons:getMappings";
    };
    readonly logo: {
        readonly GET_URL: "logo:getUrl";
    };
    readonly notification: {
        readonly SHOW: "notification:show";
        readonly NAVIGATE: "notification:navigate";
        readonly GET_ENABLED: "notification:getEnabled";
        readonly SET_ENABLED: "notification:setEnabled";
    };
    readonly input: {
        readonly GET_AUTO_CAPITALISATION: "input:getAutoCapitalisation";
        readonly SET_AUTO_CAPITALISATION: "input:setAutoCapitalisation";
        readonly GET_SEND_MESSAGE_KEY: "input:getSendMessageKey";
        readonly SET_SEND_MESSAGE_KEY: "input:setSendMessageKey";
        readonly GET_VOICE_MODEL: "input:getVoiceModel";
        readonly SET_VOICE_MODEL: "input:setVoiceModel";
        readonly GET_VOICE_ENABLED: "input:getVoiceEnabled";
        readonly SET_VOICE_ENABLED: "input:setVoiceEnabled";
        readonly GET_SPELL_CHECK: "input:getSpellCheck";
        readonly SET_SPELL_CHECK: "input:setSpellCheck";
    };
    readonly power: {
        readonly GET_KEEP_AWAKE: "power:getKeepAwake";
        readonly SET_KEEP_AWAKE: "power:setKeepAwake";
    };
    readonly appearance: {
        readonly GET_RICH_TOOL_DESCRIPTIONS: "appearance:getRichToolDescriptions";
        readonly SET_RICH_TOOL_DESCRIPTIONS: "appearance:setRichToolDescriptions";
        readonly GET_SELECTED_PET_ID: "appearance:getSelectedPetId";
        readonly SET_SELECTED_PET_ID: "appearance:setSelectedPetId";
        readonly GET_PET_ENABLED: "appearance:getPetEnabled";
        readonly SET_PET_ENABLED: "appearance:setPetEnabled";
        readonly PET_ENABLED_CHANGED: "appearance:petEnabledChanged";
        readonly GET_PET_SIZE: "appearance:getPetSize";
        readonly SET_PET_SIZE: "appearance:setPetSize";
        readonly LOAD_CUSTOM_PETS: "appearance:loadCustomPets";
        readonly OPEN_PETS_FOLDER: "appearance:openPetsFolder";
    };
    readonly tools: {
        readonly GET_BROWSER_TOOL_ENABLED: "tools:getBrowserToolEnabled";
        readonly SET_BROWSER_TOOL_ENABLED: "tools:setBrowserToolEnabled";
    };
    readonly caching: {
        readonly GET_EXTENDED_PROMPT_CACHE: "caching:getExtendedPromptCache";
        readonly SET_EXTENDED_PROMPT_CACHE: "caching:setExtendedPromptCache";
        readonly GET_ENABLE_1M_CONTEXT: "caching:getEnable1MContext";
        readonly SET_ENABLE_1M_CONTEXT: "caching:setEnable1MContext";
    };
    readonly memory: {
        readonly GET_SETTINGS: "memory:getSettings";
        readonly SET_SETTINGS: "memory:setSettings";
        readonly GET_SETTINGS_PATH: "memory:getSettingsPath";
        readonly GET_PATHS: "memory:getPaths";
        readonly OPEN_PATH: "memory:openPath";
    };
    readonly badge: {
        readonly REFRESH: "badge:refresh";
        readonly SET_ICON: "badge:setIcon";
        readonly DRAW: "badge:draw";
        readonly DRAW_WINDOWS: "badge:draw-windows";
    };
    readonly releaseNotes: {
        readonly GET: "releaseNotes:get";
        readonly GET_LATEST_VERSION: "releaseNotes:getLatestVersion";
    };
    readonly git: {
        readonly GET_BRANCH: "git:getBranch";
    };
    readonly gitbash: {
        readonly CHECK: "gitbash:check";
        readonly BROWSE: "gitbash:browse";
        readonly SET_PATH: "gitbash:setPath";
    };
    readonly browserPane: {
        readonly CREATE: "browser-pane:create";
        readonly DESTROY: "browser-pane:destroy";
        readonly LIST: "browser-pane:list";
        readonly NAVIGATE: "browser-pane:navigate";
        readonly GO_BACK: "browser-pane:go-back";
        readonly GO_FORWARD: "browser-pane:go-forward";
        readonly RELOAD: "browser-pane:reload";
        readonly STOP: "browser-pane:stop";
        readonly FOCUS: "browser-pane:focus";
        readonly HIDE: "browser-pane:hide";
        readonly DOCK: "browser-pane:dock";
        readonly TOGGLE_DOCK_EXPANDED: "browser-pane:toggle-dock-expanded";
        readonly SNAPSHOT: "browser-pane:snapshot";
        readonly CLICK: "browser-pane:click";
        readonly FILL: "browser-pane:fill";
        readonly SELECT: "browser-pane:select";
        readonly SCREENSHOT: "browser-pane:screenshot";
        readonly EVALUATE: "browser-pane:evaluate";
        readonly SCROLL: "browser-pane:scroll";
        readonly LAUNCH: "browser-empty-state:launch";
        readonly STATE_CHANGED: "browser-pane:state-changed";
        readonly REMOVED: "browser-pane:removed";
        readonly INTERACTED: "browser-pane:interacted";
    };
    readonly automations: {
        readonly GET: "automations:get";
        readonly TEST: "automations:test";
        readonly SET_ENABLED: "automations:setEnabled";
        readonly DUPLICATE: "automations:duplicate";
        readonly DELETE: "automations:delete";
        readonly GET_HISTORY: "automations:getHistory";
        readonly GET_LAST_EXECUTED: "automations:getLastExecuted";
        readonly REPLAY: "automations:replay";
        readonly CHANGED: "automations:changed";
    };
    readonly resources: {
        readonly EXPORT: "resources:export";
        readonly IMPORT: "resources:import";
    };
    readonly messaging: {
        readonly WA_REGISTER: "messaging:wa:register";
        readonly WA_INCOMING: "messaging:wa:incoming";
        readonly WA_BUTTON_PRESS: "messaging:wa:buttonPress";
        readonly WA_STATUS: "messaging:wa:status";
        readonly WA_QR: "messaging:wa:qr";
        readonly WA_SEND: "messaging:wa:send";
        readonly WA_SEND_BUTTONS: "messaging:wa:sendButtons";
        readonly WA_SEND_TYPING: "messaging:wa:sendTyping";
        readonly WA_SEND_FILE: "messaging:wa:sendFile";
        readonly WA_CONNECT: "messaging:wa:connect";
        readonly WA_DISCONNECT: "messaging:wa:disconnect";
        readonly BINDING_CHANGED: "messaging:bindingChanged";
        readonly PLATFORM_STATUS: "messaging:platformStatus";
        readonly GET_CONFIG: "messaging:getConfig";
        readonly UPDATE_CONFIG: "messaging:updateConfig";
        readonly TEST_TELEGRAM: "messaging:testTelegram";
        readonly SAVE_TELEGRAM: "messaging:saveTelegram";
        readonly DISCONNECT: "messaging:disconnect";
        readonly FORGET: "messaging:forget";
        readonly GET_BINDINGS: "messaging:getBindings";
        readonly GENERATE_CODE: "messaging:generateCode";
        readonly UNBIND: "messaging:unbind";
        readonly UNBIND_BINDING: "messaging:unbindBinding";
        readonly WA_START_CONNECT: "messaging:wa:startConnect";
        readonly WA_SUBMIT_PHONE: "messaging:wa:submitPhone";
        /** Broadcast to UI clients: QR string, pairing code, status, unavailable, error. */
        readonly WA_UI_EVENT: "messaging:wa:uiEvent";
    };
};
/**
 * Flatten all channel string values from the nested RPC_CHANNELS object.
 * Used by the exhaustive routing test to ensure every channel is classified.
 */
export declare function getAllChannelValues(): string[];
