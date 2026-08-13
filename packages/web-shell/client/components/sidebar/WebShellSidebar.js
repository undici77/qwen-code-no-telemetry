import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { useActions, useChannels, useConnection, useWorkspace, useWorkspaceActions, } from '@qwen-code/webui/daemon-react-sdk';
import { DaemonHttpError } from '@qwen-code/sdk/daemon';
import { ActivityIcon, BlocksIcon, CalendarClockIcon, ChevronDownIcon, ChevronRightIcon, Columns2Icon, LayoutGridIcon, ListTodoIcon, MessageCircleIcon, EllipsisVerticalIcon, ArchiveIcon, ArchiveRestoreIcon, DownloadIcon, FolderInputIcon, GitBranchIcon, GitForkIcon, PencilIcon, PinIcon, Trash2Icon, MoonIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, PlusIcon, RadioTowerIcon, SearchIcon, SettingsIcon, SquarePenIcon, SunIcon, TargetIcon, } from 'lucide-react';
import { WebShellThemeId } from '../../themeContext';
import { useI18n } from '../../i18n';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Field, FieldGroup, FieldLabel } from '../ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, } from '../ui/dropdown-menu';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { DialogShell } from '../dialogs/DialogShell';
import { WorkspaceSection } from './WorkspaceSection';
import { SessionGroupSection } from './SessionGroupSection';
import { SessionDetailsSubmenu } from './SessionDetailsSubmenu';
import { groupSessionsByChannelType } from './channelSessionGroups';
import { resolveSessionDetailsCollisionBoundary } from './sessionDetailsCollisionBoundary';
import { isPrimaryCollapsedSectionId, readCollapsedSessionSectionIds, replaceOwnedCollapsedSessionSectionIds, } from './collapsedSessionSections';
import { SESSION_LIST_PAGE_SIZE, SESSION_ORGANIZATION_FEATURE, } from '../../constants/sessions';
import styles from './WebShellSidebar.module.css';
import { useSessionCatalogController, useSessionCatalogPolling, useSessionCatalogQueries, useWebShellSessions, } from '../../session-catalog/session-catalog-hooks';
const SIDEBAR_WIDTH_STORAGE_KEY = 'qwen-code-web-shell-sidebar-width';
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_MAX_WIDTH_WINDOW_RATIO = 0.5;
const SIDEBAR_FOOTER_COMPACT_WIDTH = 344;
const SIDEBAR_FOOTER_TIGHT_WIDTH = 250;
const SIDEBAR_DRAG_VISUAL_MIN_WIDTH = 200;
const SIDEBAR_COLLAPSE_DRAG_THRESHOLD = 56;
const SIDEBAR_COLLAPSE_DRAG_WIDTH = SIDEBAR_DRAG_VISUAL_MIN_WIDTH - SIDEBAR_COLLAPSE_DRAG_THRESHOLD;
const ACTIVE_SESSION_POLL_INTERVAL_MS = 2000;
const IDLE_SESSION_POLL_INTERVAL_MS = 30_000;
const DIALOG_SESSION_LABEL_MAX_LENGTH = 96;
const RECENT_SESSION_SECTION_ID = 'recent';
const GROUP_MENU_WIDTH = 240;
const GROUP_MENU_MARGIN = 8;
const CUSTOM_GROUP_COLOR_OPTION = '__custom__';
const DEFAULT_CUSTOM_GROUP_COLOR = '#416ef5';
function matchesSessionSource(session, source) {
    if (source === 'channel')
        return session.sourceType === 'channel';
    if (source === 'default') {
        return session.sourceType === undefined || session.sourceType === 'default';
    }
    return true;
}
function getSessionIdentity(sessionId, workspaceCwd) {
    return `${workspaceCwd ?? ''}\0${sessionId}`;
}
const DEFAULT_FOOTER_ITEMS = [
    'settings',
    'version',
    'theme',
    'sessionsOverview',
    'splitView',
    'daemonStatus',
    'collapse',
];
const DEFAULT_PRIMARY_NAV_ITEMS = [
    'newTask',
    'plugins',
    'channels',
    'scheduledTasks',
    'goals',
];
const DEFAULT_SESSION_ACTION_ITEMS = ['details', 'rename', 'group', 'export', 'delete', 'pin', 'archive'];
const DEFAULT_INLINE_ACTION_ITEMS = ['pin', 'archive'];
/**
 * Palette order for the quick color-grouping buckets. Mirrors core's
 * `GROUP_COLOR_OPTIONS`; kept as a local constant so the client never imports
 * from core. Used both to order the color sections and as a fallback when the
 * daemon's color catalog has not loaded yet.
 */
const SESSION_GROUP_COLORS = [
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
];
function cx(...classes) {
    return classes.filter(Boolean).join(' ');
}
function isAbortError(error) {
    return error instanceof DOMException && error.name === 'AbortError';
}
function getWorkspaceName(workspaceCwd) {
    if (!workspaceCwd)
        return '';
    const parts = workspaceCwd.split(/[\\/]+/).filter(Boolean);
    return parts.at(-1) ?? workspaceCwd;
}
function getSessionLabel(session) {
    const displayName = session.displayName?.trim();
    return displayName || session.sessionId.slice(0, 8);
}
function getCompactSessionLabel(session) {
    const normalized = getSessionLabel(session).replace(/\s+/g, ' ').trim();
    if (normalized.length <= DIALOG_SESSION_LABEL_MAX_LENGTH) {
        return normalized;
    }
    return `${normalized
        .slice(0, DIALOG_SESSION_LABEL_MAX_LENGTH - 3)
        .trimEnd()}...`;
}
function getSessionCreatedTime(session) {
    if (!session.createdAt)
        return 0;
    const time = Date.parse(session.createdAt);
    return Number.isFinite(time) ? time : 0;
}
function getDefaultGroupColor(colorOptions) {
    return colorOptions[0] ?? 'blue';
}
function normalizeHexColorInput(value) {
    const normalized = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(normalized)) {
        return normalized.toLowerCase();
    }
    return undefined;
}
function normalizeGroupColorInput(value, presets) {
    const normalized = value.trim();
    if (presets.includes(normalized)) {
        return normalized;
    }
    return normalizeHexColorInput(normalized);
}
function getGroupColorClass(color) {
    if (color.startsWith('#'))
        return styles.groupColorCustom;
    switch (color) {
        case 'red':
            return styles.groupColorRed;
        case 'orange':
            return styles.groupColorOrange;
        case 'yellow':
            return styles.groupColorYellow;
        case 'green':
            return styles.groupColorGreen;
        case 'blue':
            return styles.groupColorBlue;
        case 'purple':
            return styles.groupColorPurple;
    }
    return undefined;
}
function getGroupColorStyle(color) {
    return color.startsWith('#') ? { backgroundColor: color } : undefined;
}
// The cap scales with the window so wide displays can reveal full session
// names, but never exceeds half the window so the sidebar cannot crush the
// main content area. SIDEBAR_MAX_WIDTH is the floor, preserving the old
// fixed cap on small windows.
function getSidebarMaxWidth() {
    if (typeof window === 'undefined')
        return SIDEBAR_MAX_WIDTH;
    return Math.max(SIDEBAR_MAX_WIDTH, Math.floor(window.innerWidth * SIDEBAR_MAX_WIDTH_WINDOW_RATIO));
}
function clampSidebarWidth(width) {
    return Math.min(getSidebarMaxWidth(), Math.max(SIDEBAR_MIN_WIDTH, width));
}
function clampSidebarVisualWidth(width) {
    return Math.min(getSidebarMaxWidth(), Math.max(SIDEBAR_DRAG_VISUAL_MIN_WIDTH, width));
}
function readSidebarWidth() {
    if (typeof window === 'undefined')
        return SIDEBAR_DEFAULT_WIDTH;
    try {
        const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
        const width = raw ? Number(raw) : SIDEBAR_DEFAULT_WIDTH;
        return Number.isFinite(width)
            ? clampSidebarWidth(width)
            : SIDEBAR_DEFAULT_WIDTH;
    }
    catch {
        return SIDEBAR_DEFAULT_WIDTH;
    }
}
function writeSidebarWidth(width) {
    try {
        window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clampSidebarWidth(width)));
    }
    catch {
        // localStorage can be unavailable in private or embedded contexts.
    }
}
function IconNewChat() {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: "M12 5v14M5 12h14" }) }));
}
/**
 * Qwen brand mark. Same artwork as the browser-tab favicon in index.html and
 * the QwenLM GitHub avatar; inlined as an SVG rather than hot-linked because
 * the Web Shell CSP is `img-src 'self' data: blob:` (see web-shell-static.ts),
 * which blocks remote images. The purple #6D44E8 fill is legible on both the
 * light and dark sidebar backgrounds. Filled (not stroked) so it opts out of
 * the shared `.navIcon svg` stroke styling.
 */
function IconQwenLogo() {
    return (_jsx("svg", { viewBox: "0 0 141.38 140", "aria-hidden": "true", children: _jsx("path", { fill: "#6D44E8", d: "m140.93 85-16.35-28.33-1.93-3.34 8.66-15a3.323 3.323 0 0 0 0-3.34l-9.62-16.67c-.3-.51-.72-.93-1.22-1.22s-1.07-.45-1.67-.45H82.23l-8.66-15a3.33 3.33 0 0 0-2.89-1.67H51.43c-.59 0-1.17.16-1.66.45-.5.29-.92.71-1.22 1.22L32.19 29.98l-1.92 3.33H12.96c-.59 0-1.17.16-1.66.45-.5.29-.93.71-1.22 1.22L.45 51.66a3.323 3.323 0 0 0 0 3.34l18.28 31.67-8.66 15a3.32 3.32 0 0 0 0 3.34l9.62 16.67c.3.51.72.93 1.22 1.22s1.07.45 1.67.45h36.56l8.66 15a3.35 3.35 0 0 0 2.89 1.67h19.25a3.34 3.34 0 0 0 2.89-1.67l18.28-31.67h17.32c.6 0 1.17-.16 1.67-.45s.92-.71 1.22-1.22l9.62-16.67a3.323 3.323 0 0 0 0-3.34ZM51.44 3.33 61.07 20l-9.63 16.66h76.98l-9.62 16.66H45.67l-11.54-20zM57.21 120H22.58l9.63-16.67h19.25l-38.5-66.67h19.25l9.62 16.67L68.78 100l-11.55 20Zm61.59-33.34-9.62-16.67-38.49 66.67-9.63-16.67 9.63-16.66 26.94-46.67h23.1l17.32 30z" }) }));
}
function IconChevron({ expanded }) {
    return (_jsx("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: expanded ? _jsx("path", { d: "m6 9 6 6 6-6" }) : _jsx("path", { d: "m9 6 6 6-6 6" }) }));
}
export function WebShellSidebar({ collapsed, onCollapsedChange, onOpenSettings, onOpenPlugins, onOpenChannels, onOpenDaemonStatus, onOpenScheduledTasks, onOpenGoals, onOpenSessions, canOpenSessionsOverview, onOpenSplitView, canOpenSplitView, onNewSession, onLoadSession, onSelectCurrentSession, onSessionRenameConfirmed, onError, theme, onThemeChange, mobileOpen, selectedWorkspaceCwd, onSelectWorkspace, onOpenGitDiff, onOpenCommit, onOpenAddWorkspace, workspaces: providedWorkspaces, lockedWorkspaceCwd, lockedWorkspace: lockedWorkspaceOptions, branding, primaryNav: primaryNavOptions, hideProjectHeader, sessionActions: sessionActionsOptions, footer, }) {
    const { t } = useI18n();
    const connection = useConnection();
    const actions = useActions();
    const workspaceActions = useWorkspaceActions();
    const workspace = useWorkspace();
    const sessionCatalogController = useSessionCatalogController(workspace.client);
    const footerItems = useMemo(() => new Set(footer === false ? [] : (footer?.items ?? DEFAULT_FOOTER_ITEMS)), [footer]);
    const primaryNavItems = useMemo(() => new Set(primaryNavOptions?.items ?? DEFAULT_PRIMARY_NAV_ITEMS), [primaryNavOptions?.items]);
    const sessionActionItems = useMemo(() => new Set(sessionActionsOptions?.items ?? DEFAULT_SESSION_ACTION_ITEMS), [sessionActionsOptions?.items]);
    const inlineActionItems = useMemo(() => new Set(sessionActionsOptions?.inlineItems ?? DEFAULT_INLINE_ACTION_ITEMS), [sessionActionsOptions?.inlineItems]);
    const shouldRenderBrand = branding !== false && !(mobileOpen && (branding?.hideWhenCompact ?? true));
    const organizationEnabled = Boolean(connection.capabilities?.features?.includes(SESSION_ORGANIZATION_FEATURE));
    const sourceMetadataEnabled = Boolean(connection.capabilities?.features?.includes('session_source_metadata'));
    const [sessionSource, setSessionSource] = useState('default');
    const selectedSessionSource = sourceMetadataEnabled
        ? sessionSource
        : undefined;
    const channelGroupingEnabled = Boolean(selectedSessionSource === 'channel' &&
        workspace.capabilities?.features.includes('channel_management'));
    const { data: channelCatalogData, catalog: channelTypeCatalog, channels: channelInstances, reload: reloadChannelCatalog, error: channelCatalogError, } = useChannels({
        autoLoad: channelGroupingEnabled,
        enabled: channelGroupingEnabled,
    });
    const sessionArchiveEnabled = Boolean(connection.capabilities?.features?.includes('session_archive'));
    const workspaceQualifiedRestCoreEnabled = Boolean(connection.capabilities?.features?.includes('workspace_qualified_rest_core'));
    // Phase 4: registered workspaces on a multi-workspace daemon (absent or a
    // single entry otherwise). Drives the new-session workspace picker.
    const workspaces = useMemo(() => providedWorkspaces ?? workspace.capabilities?.workspaces ?? [], [providedWorkspaces, workspace.capabilities?.workspaces]);
    const workspaceCatalogAdvertised = workspaces.length > 0 ||
        workspace.capabilities?.workspaces !== undefined ||
        connection.capabilities?.workspaces !== undefined;
    const primaryWorkspaceCwd = workspaces.find((entry) => entry.primary)?.cwd ??
        workspace.capabilities?.workspaceCwd ??
        connection.workspaceCwd;
    const lockedWorkspace = lockedWorkspaceCwd
        ? workspaces.find((entry) => entry.cwd === lockedWorkspaceCwd)
        : undefined;
    const includePrimaryWorkspaceSessions = !lockedWorkspaceCwd || lockedWorkspace?.primary === true;
    const { sessions, loading, error, data: sessionsPage, reload, deleteSession, exportSession, archiveSession, catalogQuery, } = useWebShellSessions({
        autoLoad: true,
        enabled: includePrimaryWorkspaceSessions,
        pageSize: SESSION_LIST_PAGE_SIZE,
        archiveState: 'active',
        ...(selectedSessionSource ? { sourceType: selectedSessionSource } : {}),
        ...(organizationEnabled
            ? { view: 'organized', group: 'all' }
            : {}),
    });
    // The catalog starts with loading=false before its subscription requests
    // data, so !loading is not “settled”. Treat the first data as the ready signal (empty
    // lists are still defined data) so the initial-catalog latch waits. Errors
    // must NOT settle it: a latch consumed against a failed request would treat
    // every section from the eventual successful reload as brand-new,
    // auto-collapsing and persisting over the user's restored expansions.
    const sessionsCatalogReady = !organizationEnabled ||
        !includePrimaryWorkspaceSessions ||
        sessionsPage !== undefined;
    // Which source the settled sessions page belongs to. Switching the source
    // changes the catalog query key, whose entry starts without a page
    // (undefined), so reconciliation must not run until a page fetched for the
    // new source settles — otherwise the other source's sections would be
    // consumed as the new source's initial catalog.
    const lastSettledSessionsPageRef = useRef(sessionsPage);
    const settledSessionsSourceRef = useRef(sessionSource);
    useEffect(() => {
        // An undefined page is the empty pre-settle snapshot, not a settled fetch.
        if (sessionsPage === undefined)
            return;
        if (lastSettledSessionsPageRef.current !== sessionsPage) {
            lastSettledSessionsPageRef.current = sessionsPage;
            settledSessionsSourceRef.current = sessionSource;
        }
    }, [sessionsPage, sessionSource]);
    const loadPinnedSessions = organizationEnabled && selectedSessionSource !== 'channel';
    const { sessions: primaryPinnedSessions } = useWebShellSessions({
        autoLoad: loadPinnedSessions,
        enabled: loadPinnedSessions && includePrimaryWorkspaceSessions,
        pageSize: SESSION_LIST_PAGE_SIZE,
        archiveState: 'active',
        ...(selectedSessionSource ? { sourceType: selectedSessionSource } : {}),
        view: 'organized',
        group: 'pinned',
    });
    const [archivedExpanded, setArchivedExpanded] = useState(false);
    const [pinnedExpanded, setPinnedExpanded] = useState(true);
    const { sessions: archivedSessions, loading: archivedLoading, error: archivedError, reload: reloadArchived, deleteSession: deleteArchivedSession, unarchiveSession, catalogQuery: archivedCatalogQuery, } = useWebShellSessions({
        autoLoad: true,
        enabled: sessionArchiveEnabled &&
            archivedExpanded &&
            includePrimaryWorkspaceSessions,
        pageSize: SESSION_LIST_PAGE_SIZE,
        archiveState: 'archived',
        ...(selectedSessionSource ? { sourceType: selectedSessionSource } : {}),
        ...(organizationEnabled
            ? { view: 'organized', group: 'all' }
            : {}),
    });
    const [groups, setGroups] = useState([]);
    const [menuGroups, setMenuGroups] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);
    const [groupBusy, setGroupBusy] = useState(false);
    const [editingSessionIdentity, setEditingSessionIdentity] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [busySessionIds, setBusySessionIds] = useState(() => new Set());
    const busySessionIdsRef = useRef(new Set());
    const [exportingSessionIds, setExportingSessionIds] = useState(() => new Set());
    const exportingSessionIdsRef = useRef(new Set());
    const [creatingSession, setCreatingSession] = useState(false);
    const creatingSessionRef = useRef(false);
    const [deleteCandidate, setDeleteCandidate] = useState(null);
    const [groupMenu, setGroupMenu] = useState(null);
    const [groupEditor, setGroupEditor] = useState(null);
    const [groupName, setGroupName] = useState('');
    const [groupColor, setGroupColor] = useState('blue');
    const [lastValidCustomGroupColor, setLastValidCustomGroupColor] = useState(DEFAULT_CUSTOM_GROUP_COLOR);
    const [deleteGroupCandidate, setDeleteGroupCandidate] = useState(null);
    const [collapsedSessionSectionIds, setCollapsedSessionSectionIds] = useState(() => new Set(Array.from(readCollapsedSessionSectionIds()).filter(isPrimaryCollapsedSectionId)));
    const knownSessionSectionIdsRef = useRef(new Set());
    // Dedicated first-sync latch, keyed by session source: each source's first
    // settled catalog only registers section ids. Without per-source latches the
    // Tasks settle consumes the shared latch and the first Channels visit treats
    // every platform section as brand-new, auto-collapsing and persisting them.
    // Do not infer this from knownSessionSectionIdsRef.size — seeding that set
    // early would make the first real sync look mid-session and auto-collapse
    // restored expansions.
    const awaitingInitialSessionCatalogBySourceRef = useRef({ default: true, channel: true });
    const [groupsCatalogReady, setGroupsCatalogReady] = useState(!organizationEnabled);
    // organizationEnabled can flip true mid-session (capabilities can land after
    // the flat sessions request settles). Close the gate during that same render:
    // deferring to the reload effect would let the auto-collapse effect consume
    // the first-sync latch against the stale pre-organized catalog first.
    const [prevOrganizationEnabled, setPrevOrganizationEnabled] = useState(organizationEnabled);
    if (prevOrganizationEnabled !== organizationEnabled) {
        setPrevOrganizationEnabled(organizationEnabled);
        setGroupsCatalogReady(!organizationEnabled);
    }
    const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
    const [projectExpanded, setProjectExpanded] = useState(false);
    const [projectsExpanded, setProjectsExpanded] = useState(true);
    const [searchOpen, setSearchOpen] = useState(false);
    const [workspaceRemovalCandidate, setWorkspaceRemovalCandidate] = useState(null);
    const [workspaceRemovalActivity, setWorkspaceRemovalActivity] = useState(null);
    const [workspaceRemovalSubmitting, setWorkspaceRemovalSubmitting] = useState(false);
    const workspaceRemovalMountedRef = useRef(false);
    const workspaceRemovalDismissedRef = useRef(false);
    const [workspaceRemovalRemoteInProgress, setWorkspaceRemovalRemoteInProgress,] = useState(false);
    const [workspaceSessionsReloadToken, setWorkspaceSessionsReloadToken] = useState(0);
    const [autoExpandWorkspace, setAutoExpandWorkspace] = useState(null);
    // Keep the token for WorkspaceSection's group and Git consumers. Session
    // catalogs are invalidated directly through their owning workspace.
    const bumpWorkspaceReload = useCallback(() => {
        setWorkspaceSessionsReloadToken((v) => v + 1);
    }, []);
    useEffect(() => {
        workspaceRemovalMountedRef.current = true;
        return () => {
            workspaceRemovalMountedRef.current = false;
            workspaceRemovalDismissedRef.current = true;
        };
    }, []);
    const [searchQuery, setSearchQuery] = useState('');
    const [isResizing, setIsResizing] = useState(false);
    const [completedUnreadIds, setCompletedUnreadIds] = useState(() => new Set());
    const sidebarRef = useRef(null);
    const groupMenuRef = useRef(null);
    const sessionMenuPointerDismissRef = useRef(false);
    const previousRunningBySourceRef = useRef({ default: null, channel: null });
    const lastTrackedSessionSourceRef = useRef(sessionSource);
    const autoOpenedContextRef = useRef(null);
    const resizeTeardownRef = useRef(null);
    const currentSessionId = connection.sessionId;
    const workspaceRemovalEnabled = Boolean(connection.capabilities?.features?.includes('workspace_runtime_removal'));
    const canExportSessions = connection.capabilities?.features?.includes('session_export') ?? false;
    const canExportWorkspaceSessions = connection.capabilities?.features?.includes('workspace_session_export') ??
        false;
    const canExportArchivedSessions = connection.capabilities?.features?.includes('workspace_archived_session_export') ?? false;
    const currentSessionIdentity = currentSessionId
        ? getSessionIdentity(currentSessionId, connection.workspaceCwd || primaryWorkspaceCwd)
        : null;
    const projectName = getWorkspaceName(connection.workspaceCwd) || t('sidebar.projectFallback');
    const displayedWorkspaces = useMemo(() => {
        const availableWorkspaces = workspaces.length > 0
            ? workspaces
            : [
                {
                    id: 'primary',
                    cwd: connection.workspaceCwd || projectName,
                    primary: true,
                    trusted: true,
                },
            ];
        return lockedWorkspaceCwd
            ? availableWorkspaces.filter((entry) => entry.cwd === lockedWorkspaceCwd)
            : availableWorkspaces;
    }, [connection.workspaceCwd, lockedWorkspaceCwd, projectName, workspaces]);
    const secondaryWorkspaceCwds = useMemo(() => displayedWorkspaces
        .filter((entry) => !entry.primary && entry.trusted)
        .map((entry) => entry.cwd), [displayedWorkspaces]);
    const secondaryPinnedQueries = useMemo(() => secondaryWorkspaceCwds.map((workspaceCwd) => ({
        routeKind: 'qualified',
        workspaceCwd,
        options: {
            pageSize: SESSION_LIST_PAGE_SIZE,
            archiveState: 'active',
            ...(selectedSessionSource
                ? { sourceType: selectedSessionSource }
                : {}),
            view: 'organized',
            group: 'pinned',
        },
    })), [secondaryWorkspaceCwds, selectedSessionSource]);
    const secondaryPinnedSnapshots = useSessionCatalogQueries(workspace.client, secondaryPinnedQueries, {
        autoLoad: true,
        enabled: organizationEnabled && selectedSessionSource !== 'channel',
    });
    const secondaryPinnedSessions = useMemo(() => secondaryPinnedSnapshots.flatMap((snapshot) => snapshot.page?.sessions ?? []), [secondaryPinnedSnapshots]);
    const secondaryArchivedEnabled = archivedExpanded &&
        sessionArchiveEnabled &&
        workspaceQualifiedRestCoreEnabled;
    const secondaryArchivedQueries = useMemo(() => secondaryWorkspaceCwds.map((workspaceCwd) => ({
        routeKind: 'qualified',
        workspaceCwd,
        options: {
            pageSize: SESSION_LIST_PAGE_SIZE,
            archiveState: 'archived',
            ...(selectedSessionSource
                ? { sourceType: selectedSessionSource }
                : {}),
            ...(organizationEnabled
                ? { view: 'organized', group: 'all' }
                : {}),
        },
    })), [organizationEnabled, secondaryWorkspaceCwds, selectedSessionSource]);
    const secondaryArchivedSnapshots = useSessionCatalogQueries(workspace.client, secondaryArchivedQueries, { autoLoad: true, enabled: secondaryArchivedEnabled });
    const secondaryArchivedSessions = useMemo(() => secondaryArchivedSnapshots.flatMap((snapshot) => snapshot.page?.sessions ?? []), [secondaryArchivedSnapshots]);
    const secondaryArchivedLoading = secondaryArchivedSnapshots.some((snapshot) => snapshot.loading);
    const secondaryArchivedError = secondaryArchivedSnapshots.some((snapshot) => snapshot.error !== undefined);
    const toggleArchived = useCallback(() => {
        if (!archivedExpanded) {
            const queries = [
                ...(includePrimaryWorkspaceSessions && archivedCatalogQuery
                    ? [archivedCatalogQuery]
                    : []),
                ...(workspaceQualifiedRestCoreEnabled ? secondaryArchivedQueries : []),
            ];
            if (queries.length > 0) {
                sessionCatalogController.refreshQueries(queries);
            }
        }
        setArchivedExpanded((expanded) => !expanded);
    }, [
        archivedCatalogQuery,
        archivedExpanded,
        includePrimaryWorkspaceSessions,
        secondaryArchivedQueries,
        sessionCatalogController,
        workspaceQualifiedRestCoreEnabled,
    ]);
    const liveWorkspaces = useMemo(() => displayedWorkspaces.filter((entry) => entry.kind === 'live'), [displayedWorkspaces]);
    const projectWorkspaces = useMemo(() => displayedWorkspaces.filter((entry) => entry.kind !== 'live'), [displayedWorkspaces]);
    const pinnedSessions = useMemo(() => {
        const byId = new Map();
        for (const session of [
            ...(includePrimaryWorkspaceSessions ? primaryPinnedSessions : []),
            ...secondaryPinnedSessions,
        ]) {
            if (!matchesSessionSource(session, selectedSessionSource))
                continue;
            byId.set(getSessionIdentity(session.sessionId, session.workspaceCwd || primaryWorkspaceCwd), session);
        }
        return [...byId.values()];
    }, [
        includePrimaryWorkspaceSessions,
        primaryWorkspaceCwd,
        primaryPinnedSessions,
        selectedSessionSource,
        secondaryPinnedSessions,
    ]);
    const resolveSessionWorkspaceScope = useCallback((session) => {
        const explicitCwd = session.workspaceCwd;
        const cwd = explicitCwd || primaryWorkspaceCwd || '';
        const workspaceEntry = workspaces.find((entry) => entry.cwd === cwd);
        if (explicitCwd && !workspaceEntry) {
            if (!workspaceCatalogAdvertised && cwd === primaryWorkspaceCwd) {
                return { kind: 'primary', cwd };
            }
            return { kind: 'unknown', cwd };
        }
        if (workspaceEntry && !workspaceEntry.trusted) {
            return { kind: 'untrusted', cwd, workspace: workspaceEntry };
        }
        if (workspaceEntry?.primary ||
            (!explicitCwd && cwd === primaryWorkspaceCwd)) {
            return { kind: 'primary', cwd };
        }
        if (!workspaceEntry)
            return { kind: 'unknown', cwd };
        if (lockedWorkspaceCwd === cwd) {
            return { kind: 'locked', cwd, workspace: workspaceEntry };
        }
        return { kind: 'restricted', cwd, workspace: workspaceEntry };
    }, [
        lockedWorkspaceCwd,
        primaryWorkspaceCwd,
        workspaceCatalogAdvertised,
        workspaces,
    ]);
    const getSessionWorkspaceCwd = useCallback((session) => resolveSessionWorkspaceScope(session).cwd, [resolveSessionWorkspaceScope]);
    const isMutableSessionScope = useCallback((scope) => scope.kind === 'primary' || scope.kind === 'locked', []);
    const canUseWorkspaceQualifiedActions = useCallback((scope) => scope.kind === 'primary' ||
        (scope.kind === 'locked' && workspaceQualifiedRestCoreEnabled), [workspaceQualifiedRestCoreEnabled]);
    // Organization (pin/group) is safe for any trusted workspace — not just
    // locked ones — because it only mutates display metadata, never executes
    // code or touches the filesystem.
    const canUseOrganizationActions = useCallback((scope) => {
        if (scope.kind === 'unknown' || scope.kind === 'untrusted')
            return false;
        return scope.kind === 'primary' || workspaceQualifiedRestCoreEnabled;
    }, [workspaceQualifiedRestCoreEnabled]);
    const isActiveSessionReadOnly = useCallback((session) => !isMutableSessionScope(resolveSessionWorkspaceScope(session)), [isMutableSessionScope, resolveSessionWorkspaceScope]);
    const getSessionWorkspaceActions = useCallback((session) => {
        const scope = resolveSessionWorkspaceScope(session);
        if (scope.kind === 'primary')
            return workspaceActions;
        if (scope.kind === 'locked' || scope.kind === 'restricted') {
            return workspace.client.workspaceByCwd(scope.cwd);
        }
        return undefined;
    }, [resolveSessionWorkspaceScope, workspace.client, workspaceActions]);
    const getIdentityForSession = useCallback((session) => getSessionIdentity(session.sessionId, getSessionWorkspaceCwd(session)), [getSessionWorkspaceCwd]);
    const isCurrentSession = useCallback((session) => currentSessionIdentity === getIdentityForSession(session), [currentSessionIdentity, getIdentityForSession]);
    const canRenameSession = useCallback((session) => sessionActionItems.has('rename') &&
        isCurrentSession(session) &&
        isMutableSessionScope(resolveSessionWorkspaceScope(session)), [
        isCurrentSession,
        isMutableSessionScope,
        resolveSessionWorkspaceScope,
        sessionActionItems,
    ]);
    const canShowDeleteSession = useCallback((session) => sessionActionItems.has('delete') &&
        canUseWorkspaceQualifiedActions(resolveSessionWorkspaceScope(session)), [
        canUseWorkspaceQualifiedActions,
        resolveSessionWorkspaceScope,
        sessionActionItems,
    ]);
    const canDeleteSession = useCallback((session) => !isCurrentSession(session) && canShowDeleteSession(session), [canShowDeleteSession, isCurrentSession]);
    const canOrganizeSession = useCallback((session, item) => organizationEnabled &&
        sessionActionItems.has(item) &&
        canUseOrganizationActions(resolveSessionWorkspaceScope(session)), [
        canUseOrganizationActions,
        organizationEnabled,
        resolveSessionWorkspaceScope,
        sessionActionItems,
    ]);
    const resolveWorkspaceScope = useCallback((workspaceCwd) => resolveSessionWorkspaceScope({
        sessionId: '',
        workspaceCwd,
    }), [resolveSessionWorkspaceScope]);
    const canOrganizeWorkspace = useCallback((workspaceCwd) => organizationEnabled &&
        sessionActionItems.has('group') &&
        canUseOrganizationActions(resolveWorkspaceScope(workspaceCwd)), [
        canUseOrganizationActions,
        organizationEnabled,
        resolveWorkspaceScope,
        sessionActionItems,
    ]);
    const groupAssignmentPolicyRef = useRef(null);
    groupAssignmentPolicyRef.current = {
        canOrganizeSession,
        getSessionWorkspaceActions,
        resolveWorkspaceScope,
    };
    const canMutateSessionArchive = useCallback((session) => {
        const scope = resolveSessionWorkspaceScope(session);
        if (scope.kind === 'unknown' || scope.kind === 'untrusted')
            return false;
        return (sessionArchiveEnabled &&
            (scope.kind === 'primary' || workspaceQualifiedRestCoreEnabled));
    }, [
        resolveSessionWorkspaceScope,
        sessionArchiveEnabled,
        workspaceQualifiedRestCoreEnabled,
    ]);
    const getActiveExportScope = useCallback((session) => {
        const scope = resolveSessionWorkspaceScope(session);
        if (scope.kind === 'primary' && canExportSessions) {
            return scope;
        }
        if (scope.kind === 'locked' && canExportWorkspaceSessions) {
            return scope;
        }
        return undefined;
    }, [
        canExportSessions,
        canExportWorkspaceSessions,
        resolveSessionWorkspaceScope,
    ]);
    const getArchivedExportWorkspaceCwd = useCallback((session) => {
        const scope = resolveSessionWorkspaceScope(session);
        return canExportArchivedSessions &&
            scope.kind !== 'unknown' &&
            scope.kind !== 'untrusted'
            ? scope.cwd
            : undefined;
    }, [canExportArchivedSessions, resolveSessionWorkspaceScope]);
    const canArchiveSession = useCallback((session) => sessionActionItems.has('archive') &&
        !isCurrentSession(session) &&
        canMutateSessionArchive(session), [canMutateSessionArchive, isCurrentSession, sessionActionItems]);
    const canUnarchiveSession = useCallback((session) => sessionActionItems.has('archive') && canMutateSessionArchive(session), [canMutateSessionArchive, sessionActionItems]);
    const allArchivedSessions = useMemo(() => {
        const byIdentity = new Map();
        for (const session of [
            ...(includePrimaryWorkspaceSessions ? archivedSessions : []),
            ...secondaryArchivedSessions,
        ]) {
            if (!matchesSessionSource(session, selectedSessionSource))
                continue;
            byIdentity.set(getIdentityForSession(session), session);
        }
        return [...byIdentity.values()];
    }, [
        archivedSessions,
        getIdentityForSession,
        includePrimaryWorkspaceSessions,
        selectedSessionSource,
        secondaryArchivedSessions,
    ]);
    const effectiveArchivedLoading = (includePrimaryWorkspaceSessions && archivedLoading) ||
        secondaryArchivedLoading;
    const effectiveArchivedError = (includePrimaryWorkspaceSessions && Boolean(archivedError)) ||
        secondaryArchivedError;
    const qwenCodeVersion = connection.capabilities?.qwenCodeVersion || '';
    // Numeric releases render as "v1.2.3"; a non-semver fallback such as
    // "unknown" is shown as-is so we never produce a bogus "vunknown".
    const versionLabel = qwenCodeVersion
        ? /^\d/.test(qwenCodeVersion)
            ? `v${qwenCodeVersion}`
            : qwenCodeVersion
        : '';
    const footerCompact = !collapsed && sidebarWidth < SIDEBAR_FOOTER_COMPACT_WIDTH;
    const footerTight = !collapsed && sidebarWidth < SIDEBAR_FOOTER_TIGHT_WIDTH;
    const sidebarStyle = {
        '--web-shell-sidebar-width': `${sidebarWidth}px`,
    };
    const newSessionDisabled = creatingSession;
    useEffect(() => {
        if (!currentSessionId)
            return;
        const activeWorkspace = displayedWorkspaces.find((entry) => entry.cwd === connection.workspaceCwd) ??
            (displayedWorkspaces.length === 1 && displayedWorkspaces[0]?.primary
                ? displayedWorkspaces[0]
                : undefined);
        if (!activeWorkspace)
            return;
        const contextKey = `session:${currentSessionId}:${activeWorkspace.id}`;
        if (autoOpenedContextRef.current === contextKey)
            return;
        autoOpenedContextRef.current = contextKey;
        setProjectsExpanded(true);
        if (activeWorkspace.primary) {
            setProjectExpanded(true);
        }
        else {
            setAutoExpandWorkspace({ id: activeWorkspace.id, key: contextKey });
        }
    }, [connection.workspaceCwd, currentSessionId, displayedWorkspaces]);
    useEffect(() => {
        if (currentSessionId || selectedWorkspaceCwd !== undefined) {
            return;
        }
        if (!workspace.capabilities)
            return;
        const connectedWorkspace = workspaces.find((entry) => entry.cwd === connection.workspaceCwd);
        const contextKey = `new:${connectedWorkspace?.id ?? 'primary'}`;
        if (autoOpenedContextRef.current === contextKey)
            return;
        autoOpenedContextRef.current = contextKey;
        setProjectsExpanded(true);
        if (connectedWorkspace && !connectedWorkspace.primary) {
            setProjectExpanded(false);
            setAutoExpandWorkspace({
                id: connectedWorkspace.id,
                key: contextKey,
            });
            onSelectWorkspace?.(connectedWorkspace.cwd);
            return;
        }
        setProjectExpanded(true);
    }, [
        connection.workspaceCwd,
        currentSessionId,
        onSelectWorkspace,
        selectedWorkspaceCwd,
        workspace.capabilities,
        workspaces,
    ]);
    const setSessionBusy = useCallback((sessionId, busy, workspaceCwd) => {
        const identity = getSessionIdentity(sessionId, workspaceCwd || primaryWorkspaceCwd);
        const next = new Set(busySessionIdsRef.current);
        if (busy) {
            next.add(identity);
        }
        else {
            next.delete(identity);
        }
        busySessionIdsRef.current = next;
        setBusySessionIds(next);
    }, [primaryWorkspaceCwd]);
    const reloadGroups = useCallback(async () => {
        if (!organizationEnabled) {
            setGroups([]);
            setColorOptions([]);
            setGroupsCatalogReady(true);
            return;
        }
        try {
            const catalog = await workspaceActions.listSessionGroups();
            setGroups(catalog.groups);
            setMenuGroups(catalog.groups);
            setColorOptions(catalog.colorOptions);
            // Empty catalogs still settle the latch — sessions/groups hydrate on
            // independent requests, so readiness cannot wait for a non-empty list.
            // Failures must not settle it (see sessionsCatalogReady above).
            setGroupsCatalogReady(true);
        }
        catch (err) {
            onError(err, t('sidebar.groupsLoadFailed'));
        }
    }, [onError, organizationEnabled, t, workspaceActions]);
    useEffect(() => {
        if (!organizationEnabled) {
            setGroups([]);
            setColorOptions([]);
            setGroupsCatalogReady(true);
            return;
        }
        setGroupsCatalogReady(false);
        void reloadGroups();
    }, [organizationEnabled, reloadGroups]);
    useEffect(() => {
        if (!groupMenu)
            return;
        const handlePointerDown = (event) => {
            if (groupMenuRef.current?.contains(event.target))
                return;
            setGroupMenu(null);
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setGroupMenu(null);
            }
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [groupMenu]);
    useEffect(() => {
        if (!groupMenu)
            return;
        const animationFrame = window.requestAnimationFrame(() => {
            const items = Array.from(groupMenuRef.current?.querySelectorAll('button:not(:disabled)') ?? []);
            const selected = items.find((item) => item.getAttribute('aria-checked') === 'true') ??
                items[0];
            selected?.focus();
        });
        return () => window.cancelAnimationFrame(animationFrame);
    }, [groupMenu]);
    const handleGroupMenuKeyDown = useCallback((event) => {
        const items = Array.from(groupMenuRef.current?.querySelectorAll('button:not(:disabled)') ?? []);
        if (items.length === 0)
            return;
        const activeIndex = items.indexOf(document.activeElement);
        const currentIndex = activeIndex >= 0 ? activeIndex : -1;
        let nextIndex;
        if (event.key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % items.length;
        }
        else if (event.key === 'ArrowUp') {
            nextIndex = (currentIndex - 1 + items.length) % items.length;
        }
        else if (event.key === 'Home') {
            nextIndex = 0;
        }
        else if (event.key === 'End') {
            nextIndex = items.length - 1;
        }
        else if (event.key === 'Escape') {
            event.preventDefault();
            setGroupMenu(null);
            return;
        }
        if (nextIndex === undefined)
            return;
        event.preventDefault();
        items[nextIndex]?.focus();
    }, []);
    useEffect(() => () => {
        resizeTeardownRef.current?.(false);
    }, []);
    // The max width derives from window size, so re-clamp when the window
    // shrinks below a previously stored wider sidebar.
    useEffect(() => {
        function handleWindowResize() {
            setSidebarWidth((current) => clampSidebarWidth(current));
        }
        window.addEventListener('resize', handleWindowResize);
        return () => window.removeEventListener('resize', handleWindowResize);
    }, []);
    useEffect(() => {
        if (collapsed) {
            setProjectExpanded(false);
            setSearchOpen(false);
            setSearchQuery('');
        }
    }, [collapsed]);
    const hasRunningSession = useMemo(() => sessions.some((session) => session.hasActivePrompt), [sessions]);
    const sessionPollInterval = projectExpanded || hasRunningSession || selectedSessionSource === 'channel'
        ? (hasRunningSession || selectedSessionSource === 'channel') && !error
            ? ACTIVE_SESSION_POLL_INTERVAL_MS
            : IDLE_SESSION_POLL_INTERVAL_MS
        : undefined;
    useSessionCatalogPolling(workspace.client, includePrimaryWorkspaceSessions ? catalogQuery : undefined, sessionPollInterval);
    // Channel grouping rides the session poll cadence: instances added or
    // removed while the channel source is active must reach the grouping logic
    // without a source switch.
    const channelCatalogPollInFlightRef = useRef(false);
    useEffect(() => {
        if (!channelGroupingEnabled)
            return;
        // Back off on the channels hook's OWN failures too — a persistently
        // failing channels endpoint must not be re-requested every 2s.
        const pollInterval = !error && !channelCatalogError
            ? ACTIVE_SESSION_POLL_INTERVAL_MS
            : IDLE_SESSION_POLL_INTERVAL_MS;
        const intervalId = window.setInterval(() => {
            if (document.hidden || channelCatalogPollInFlightRef.current)
                return;
            channelCatalogPollInFlightRef.current = true;
            void reloadChannelCatalog().finally(() => {
                channelCatalogPollInFlightRef.current = false;
            });
        }, pollInterval);
        return () => window.clearInterval(intervalId);
    }, [
        channelCatalogError,
        channelGroupingEnabled,
        error,
        reloadChannelCatalog,
    ]);
    useEffect(() => {
        if (lastTrackedSessionSourceRef.current !== sessionSource) {
            lastTrackedSessionSourceRef.current = sessionSource;
            return;
        }
        if (loading || error)
            return;
        const runningBySessionId = new Map(sessions
            .filter((session) => matchesSessionSource(session, selectedSessionSource))
            .map((session) => [
            getIdentityForSession(session),
            Boolean(session.hasActivePrompt),
        ]));
        const previousRunningBySessionId = previousRunningBySourceRef.current[sessionSource];
        previousRunningBySourceRef.current[sessionSource] = runningBySessionId;
        if (previousRunningBySessionId === null)
            return;
        setCompletedUnreadIds((current) => {
            const next = new Set(current);
            let changed = false;
            for (const [sessionIdentity, wasRunning] of previousRunningBySessionId) {
                const isRunning = runningBySessionId.get(sessionIdentity);
                if (wasRunning &&
                    isRunning === false &&
                    sessionIdentity !== currentSessionIdentity &&
                    !next.has(sessionIdentity)) {
                    next.add(sessionIdentity);
                    changed = true;
                }
            }
            for (const sessionIdentity of next) {
                if (sessionIdentity === currentSessionIdentity ||
                    (previousRunningBySessionId.has(sessionIdentity) &&
                        (!runningBySessionId.has(sessionIdentity) ||
                            runningBySessionId.get(sessionIdentity)))) {
                    next.delete(sessionIdentity);
                    changed = true;
                }
            }
            return changed ? next : current;
        });
    }, [
        currentSessionIdentity,
        error,
        getIdentityForSession,
        loading,
        selectedSessionSource,
        sessionSource,
        sessions,
    ]);
    const reconcileRemovedWorkspace = useCallback(async (removed) => {
        if (!workspaceRemovalMountedRef.current)
            return;
        if (selectedWorkspaceCwd === removed.cwd) {
            onSelectWorkspace?.(undefined);
        }
        sessionCatalogController.invalidateWorkspace(removed.cwd);
        setWorkspaceSessionsReloadToken((token) => token + 1);
        try {
            await workspace.refreshCapabilities?.();
        }
        catch {
            // The mutation already converged; a later refresh will reconcile.
        }
        if (!workspaceRemovalMountedRef.current)
            return;
        setWorkspaceRemovalCandidate(null);
        setWorkspaceRemovalActivity(null);
        setWorkspaceRemovalRemoteInProgress(false);
        void reload().catch(() => undefined);
        void reloadArchived().catch(() => undefined);
    }, [
        onSelectWorkspace,
        reload,
        reloadArchived,
        selectedWorkspaceCwd,
        sessionCatalogController,
        workspace,
    ]);
    const requestWorkspaceRemoval = useCallback((candidate) => {
        if (workspaceRemovalSubmitting)
            return;
        workspaceRemovalDismissedRef.current = false;
        setWorkspaceRemovalActivity(null);
        setWorkspaceRemovalRemoteInProgress(false);
        setWorkspaceRemovalCandidate(candidate);
    }, [workspaceRemovalSubmitting]);
    const confirmWorkspaceRemoval = useCallback(async () => {
        const candidate = workspaceRemovalCandidate;
        if (!candidate || workspaceRemovalSubmitting)
            return;
        const force = workspaceRemovalActivity !== null;
        if (force &&
            connection.sessionId &&
            connection.workspaceCwd === candidate.cwd) {
            return;
        }
        setWorkspaceRemovalSubmitting(true);
        try {
            await workspaceActions.removeWorkspace(candidate.id, { force });
            await reconcileRemovedWorkspace(candidate);
        }
        catch (error) {
            if (!workspaceRemovalMountedRef.current)
                return;
            if (error instanceof DaemonHttpError) {
                const body = error.body;
                if (error.status === 409 &&
                    body?.code === 'workspace_busy' &&
                    body.activity) {
                    setWorkspaceRemovalActivity(body.activity);
                    return;
                }
                if (error.status === 400 && body?.code === 'workspace_mismatch') {
                    await reconcileRemovedWorkspace(candidate);
                    return;
                }
                if (error.status === 409 &&
                    (body?.code === 'workspace_removal_in_progress' ||
                        body?.code === 'workspace_registration_in_progress')) {
                    setWorkspaceRemovalRemoteInProgress(true);
                    let lastError = error;
                    let exhaustedTransientRetries = true;
                    for (let attempt = 0; attempt < 20; attempt++) {
                        if (!workspaceRemovalMountedRef.current ||
                            workspaceRemovalDismissedRef.current) {
                            return;
                        }
                        await new Promise((resolve) => window.setTimeout(resolve, 250));
                        if (!workspaceRemovalMountedRef.current ||
                            workspaceRemovalDismissedRef.current) {
                            return;
                        }
                        try {
                            await workspaceActions.removeWorkspace(candidate.id, { force });
                            await reconcileRemovedWorkspace(candidate);
                            return;
                        }
                        catch (retryError) {
                            if (!workspaceRemovalMountedRef.current)
                                return;
                            lastError = retryError;
                            if (retryError instanceof DaemonHttpError) {
                                const retryBody = retryError.body;
                                if (retryError.status === 400 &&
                                    retryBody?.code === 'workspace_mismatch') {
                                    await reconcileRemovedWorkspace(candidate);
                                    return;
                                }
                                if (retryError.status === 409 &&
                                    retryBody?.code === 'workspace_busy' &&
                                    retryBody.activity) {
                                    setWorkspaceRemovalRemoteInProgress(false);
                                    setWorkspaceRemovalActivity(retryBody.activity);
                                    return;
                                }
                                if (retryError.status === 409 &&
                                    (retryBody?.code === 'workspace_removal_in_progress' ||
                                        retryBody?.code === 'workspace_registration_in_progress')) {
                                    continue;
                                }
                            }
                            exhaustedTransientRetries = false;
                            break;
                        }
                    }
                    if (!workspaceRemovalMountedRef.current ||
                        workspaceRemovalDismissedRef.current) {
                        return;
                    }
                    setWorkspaceRemovalRemoteInProgress(false);
                    onError(exhaustedTransientRetries
                        ? new Error('Workspace removal remained in progress after retries.')
                        : lastError, t('sidebar.removeWorkspaceError'));
                    return;
                }
            }
            onError(error, t('sidebar.removeWorkspaceError'));
        }
        finally {
            if (workspaceRemovalMountedRef.current) {
                setWorkspaceRemovalSubmitting(false);
            }
        }
    }, [
        connection.sessionId,
        connection.workspaceCwd,
        onError,
        reconcileRemovedWorkspace,
        t,
        workspaceActions,
        workspaceRemovalActivity,
        workspaceRemovalCandidate,
        workspaceRemovalSubmitting,
    ]);
    const handleNewSession = useCallback((workspaceCwd) => {
        if (creatingSessionRef.current)
            return;
        creatingSessionRef.current = true;
        setCreatingSession(true);
        void (async () => {
            try {
                const created = await onNewSession(workspaceCwd);
                if (created) {
                    bumpWorkspaceReload();
                    const ownerCwd = workspaceCwd ?? primaryWorkspaceCwd;
                    if (ownerCwd) {
                        sessionCatalogController.invalidateWorkspace(ownerCwd);
                    }
                }
            }
            catch (err) {
                if (!isAbortError(err)) {
                    onError(err, t('sidebar.newSessionFailed'));
                }
            }
            finally {
                creatingSessionRef.current = false;
                setCreatingSession(false);
            }
        })();
    }, [
        bumpWorkspaceReload,
        onError,
        onNewSession,
        primaryWorkspaceCwd,
        sessionCatalogController,
        t,
    ]);
    const handleLoadSession = useCallback((sessionId, workspaceCwd) => {
        const sessionIdentity = getSessionIdentity(sessionId, workspaceCwd || primaryWorkspaceCwd);
        if (sessionIdentity === currentSessionIdentity) {
            onSelectCurrentSession?.();
            return;
        }
        if (busySessionIdsRef.current.has(sessionIdentity))
            return;
        setCompletedUnreadIds((current) => {
            if (!current.has(sessionIdentity))
                return current;
            const next = new Set(current);
            next.delete(sessionIdentity);
            return next;
        });
        setSessionBusy(sessionId, true, workspaceCwd);
        void (async () => {
            try {
                await onLoadSession(sessionId, workspaceCwd);
            }
            catch (err) {
                if (!isAbortError(err)) {
                    onError(err, t('sidebar.switchFailed'));
                }
            }
            finally {
                setSessionBusy(sessionId, false, workspaceCwd);
            }
        })();
    }, [
        currentSessionIdentity,
        onError,
        onLoadSession,
        onSelectCurrentSession,
        primaryWorkspaceCwd,
        setSessionBusy,
        t,
    ]);
    const startRename = useCallback((session) => {
        if (!canRenameSession(session))
            return;
        setEditingSessionIdentity(getIdentityForSession(session));
        setEditingName(getSessionLabel(session));
    }, [canRenameSession, getIdentityForSession]);
    const cancelRename = useCallback(() => {
        setEditingSessionIdentity(null);
        setEditingName('');
    }, []);
    useEffect(() => {
        const currentSession = currentSessionId
            ? {
                sessionId: currentSessionId,
                workspaceCwd: connection.workspaceCwd,
            }
            : undefined;
        if (editingSessionIdentity !== null &&
            (!currentSession ||
                editingSessionIdentity !== currentSessionIdentity ||
                !canRenameSession(currentSession))) {
            cancelRename();
        }
    }, [
        canRenameSession,
        cancelRename,
        connection.workspaceCwd,
        currentSessionId,
        currentSessionIdentity,
        editingSessionIdentity,
    ]);
    const saveRename = useCallback(() => {
        const nextName = editingName.trim();
        if (!nextName ||
            !currentSessionId ||
            editingSessionIdentity !== currentSessionIdentity ||
            !canRenameSession({
                sessionId: currentSessionId,
                workspaceCwd: connection.workspaceCwd,
            })) {
            cancelRename();
            return;
        }
        const sessionId = currentSessionId;
        const workspaceCwd = connection.workspaceCwd;
        const sessionIdentity = currentSessionIdentity;
        if (!sessionIdentity || busySessionIdsRef.current.has(sessionIdentity)) {
            return;
        }
        setSessionBusy(sessionId, true, connection.workspaceCwd);
        let renamed = false;
        actions
            .renameSession(nextName)
            .then(() => {
            renamed = true;
            if (workspaceCwd) {
                if (onSessionRenameConfirmed) {
                    onSessionRenameConfirmed(workspaceCwd, sessionId, nextName);
                }
                else {
                    sessionCatalogController.renamed(workspaceCwd, sessionId, nextName);
                }
            }
            cancelRename();
            bumpWorkspaceReload();
        })
            .catch((err) => {
            onError(err, t('sidebar.renameFailed'));
            cancelRename();
        })
            .finally(() => {
            if (!renamed && workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
            }
            setSessionBusy(sessionId, false, workspaceCwd);
        });
    }, [
        actions,
        bumpWorkspaceReload,
        canRenameSession,
        cancelRename,
        connection.workspaceCwd,
        currentSessionIdentity,
        currentSessionId,
        editingName,
        editingSessionIdentity,
        onSessionRenameConfirmed,
        onError,
        sessionCatalogController,
        setSessionBusy,
        t,
    ]);
    const handleDeleteSession = useCallback((session) => {
        if (!canDeleteSession(session))
            return;
        setDeleteCandidate(session);
    }, [canDeleteSession]);
    const setSessionExporting = useCallback((sessionId, exporting, workspaceCwd) => {
        const identity = getSessionIdentity(sessionId, workspaceCwd || primaryWorkspaceCwd);
        const next = new Set(exportingSessionIdsRef.current);
        if (exporting) {
            next.add(identity);
        }
        else {
            next.delete(identity);
        }
        exportingSessionIdsRef.current = next;
        setExportingSessionIds(next);
    }, [primaryWorkspaceCwd]);
    const handleExportSession = useCallback((session) => {
        const sessionId = session.sessionId;
        const sessionIdentity = getIdentityForSession(session);
        const archived = session.isArchived === true;
        const activeExportScope = getActiveExportScope(session);
        if (!sessionActionItems.has('export') ||
            (archived
                ? !getArchivedExportWorkspaceCwd(session)
                : !activeExportScope) ||
            exportingSessionIdsRef.current.has(sessionIdentity)) {
            return;
        }
        setSessionExporting(sessionId, true, session.workspaceCwd);
        void (async () => {
            try {
                let result;
                if (archived) {
                    const workspaceCwd = getArchivedExportWorkspaceCwd(session);
                    if (!workspaceCwd)
                        return;
                    result = await workspace.client
                        .workspaceByCwd(workspaceCwd)
                        .exportArchivedSession(sessionId, { format: 'html' });
                }
                else if (activeExportScope?.kind === 'primary') {
                    result = await exportSession(sessionId, 'html');
                }
                else if (activeExportScope?.kind === 'locked') {
                    result = await workspace.client
                        .workspaceByCwd(activeExportScope.cwd)
                        .exportSession(sessionId, { format: 'html' });
                }
                else {
                    return;
                }
                const blob = new Blob([result.content], {
                    type: result.mimeType || 'text/html',
                });
                const url = URL.createObjectURL(blob);
                try {
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = result.filename;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                }
                finally {
                    URL.revokeObjectURL(url);
                }
            }
            catch (err) {
                onError(err, t('sidebar.exportFailed'));
            }
            finally {
                setSessionExporting(sessionId, false, session.workspaceCwd);
            }
        })();
    }, [
        exportSession,
        getActiveExportScope,
        getArchivedExportWorkspaceCwd,
        getIdentityForSession,
        onError,
        setSessionExporting,
        sessionActionItems,
        t,
        workspace.client,
    ]);
    const confirmDeleteSession = useCallback(() => {
        if (!deleteCandidate)
            return;
        const sessionId = deleteCandidate.sessionId;
        const sessionIdentity = getIdentityForSession(deleteCandidate);
        if (!canDeleteSession(deleteCandidate)) {
            setDeleteCandidate(null);
            return;
        }
        const scope = resolveSessionWorkspaceScope(deleteCandidate);
        const isArchived = Boolean(deleteCandidate.isArchived);
        const removeSession = scope.kind === 'locked'
            ? async (id) => {
                const result = await workspace.client
                    .workspaceByCwd(scope.cwd)
                    .deleteSessionsData([id]);
                const itemError = result.errors.find((entry) => entry.sessionId === id);
                if (itemError)
                    throw new Error(itemError.error);
            }
            : scope.kind === 'primary'
                ? isArchived
                    ? deleteArchivedSession
                    : deleteSession
                : undefined;
        setDeleteCandidate(null);
        if (!removeSession)
            return;
        if (busySessionIdsRef.current.has(sessionIdentity))
            return;
        setSessionBusy(sessionId, true, deleteCandidate.workspaceCwd);
        removeSession(sessionId)
            .then(() => {
            bumpWorkspaceReload();
        })
            .catch((err) => onError(err, t('sidebar.deleteFailed')))
            .finally(() => {
            const workspaceCwd = deleteCandidate.workspaceCwd ?? primaryWorkspaceCwd;
            if (scope.kind !== 'primary' && workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
            }
            setSessionBusy(sessionId, false, deleteCandidate.workspaceCwd);
        });
    }, [
        bumpWorkspaceReload,
        canDeleteSession,
        deleteArchivedSession,
        deleteCandidate,
        deleteSession,
        getIdentityForSession,
        onError,
        primaryWorkspaceCwd,
        resolveSessionWorkspaceScope,
        sessionCatalogController,
        setSessionBusy,
        t,
        workspace.client,
    ]);
    const handleRenameFromMenu = useCallback((session) => {
        if (!isCurrentSession(session))
            return;
        startRename(session);
    }, [isCurrentSession, startRename]);
    const handleCreateGroup = useCallback(() => {
        if (!canOrganizeWorkspace())
            return;
        setGroupMenu(null);
        setGroupName('');
        setGroupColor(getDefaultGroupColor(colorOptions));
        setLastValidCustomGroupColor(DEFAULT_CUSTOM_GROUP_COLOR);
        setGroupEditor({ mode: 'create' });
    }, [canOrganizeWorkspace, colorOptions]);
    const handleCreateWorkspaceGroup = useCallback((workspaceCwd) => {
        if (!canOrganizeWorkspace(workspaceCwd))
            return;
        void (async () => {
            try {
                const catalog = await workspace.client
                    .workspaceByCwd(workspaceCwd)
                    .listSessionGroups();
                setGroupMenu(null);
                setGroupName('');
                setGroupColor(getDefaultGroupColor(catalog.colorOptions));
                setLastValidCustomGroupColor(DEFAULT_CUSTOM_GROUP_COLOR);
                setGroupEditor({ mode: 'create', workspaceCwd });
            }
            catch (err) {
                onError(err, t('sidebar.groupsLoadFailed'));
            }
        })();
    }, [canOrganizeWorkspace, onError, t, workspace.client]);
    const handleCreateGroupForSession = useCallback((session) => {
        if (!canOrganizeSession(session, 'group'))
            return;
        setGroupMenu(null);
        setGroupName('');
        setGroupColor(getDefaultGroupColor(colorOptions));
        setLastValidCustomGroupColor(DEFAULT_CUSTOM_GROUP_COLOR);
        setGroupEditor({
            mode: 'create',
            targetSession: session,
            workspaceCwd: session.workspaceCwd,
        });
    }, [canOrganizeSession, colorOptions]);
    const handleRenameGroup = useCallback((group, workspaceCwd) => {
        if (!canOrganizeWorkspace(workspaceCwd))
            return;
        setGroupName(group.name);
        setGroupColor(group.color);
        setLastValidCustomGroupColor(normalizeHexColorInput(group.color) ?? DEFAULT_CUSTOM_GROUP_COLOR);
        setGroupEditor({ mode: 'edit', group, workspaceCwd });
    }, [canOrganizeWorkspace]);
    const closeGroupEditor = useCallback(() => {
        if (groupBusy)
            return;
        setGroupEditor(null);
        setGroupName('');
        setGroupColor(getDefaultGroupColor(colorOptions));
        setLastValidCustomGroupColor(DEFAULT_CUSTOM_GROUP_COLOR);
    }, [colorOptions, groupBusy]);
    const saveGroupEditor = useCallback(() => {
        if (!groupEditor)
            return;
        if (!canOrganizeWorkspace(groupEditor.workspaceCwd) ||
            (groupEditor.targetSession &&
                !canOrganizeSession(groupEditor.targetSession, 'group'))) {
            closeGroupEditor();
            return;
        }
        const name = groupName.trim();
        const color = normalizeGroupColorInput(groupColor, colorOptions.length > 0 ? colorOptions : SESSION_GROUP_COLORS);
        if (!name || !color)
            return;
        void (async () => {
            setGroupBusy(true);
            const reportCreatedGroupAssignmentFailure = (error) => {
                setGroupEditor(null);
                setGroupName('');
                if (groupEditor.workspaceCwd) {
                    bumpWorkspaceReload();
                }
                else {
                    void reloadGroups().catch(() => undefined);
                }
                onError(error, t('sidebar.groupAssignFailedAfterCreate'));
            };
            try {
                const scope = resolveWorkspaceScope(groupEditor.workspaceCwd);
                const groupActions = scope.kind === 'primary'
                    ? workspaceActions
                    : scope.kind === 'locked' || scope.kind === 'restricted'
                        ? workspace.client.workspaceByCwd(scope.cwd)
                        : undefined;
                if (!groupActions)
                    return;
                const group = groupEditor.mode === 'create'
                    ? await groupActions.createSessionGroup({
                        name,
                        color,
                    })
                    : await groupActions.updateSessionGroup(groupEditor.group.id, {
                        name,
                        color,
                    });
                if (groupEditor.mode === 'create') {
                    if (groupEditor.targetSession) {
                        try {
                            const livePolicy = groupAssignmentPolicyRef.current;
                            const targetScope = livePolicy?.resolveWorkspaceScope(groupEditor.targetSession.workspaceCwd);
                            if (!livePolicy ||
                                !targetScope ||
                                !livePolicy.canOrganizeSession(groupEditor.targetSession, 'group') ||
                                targetScope.kind !== scope.kind ||
                                targetScope.cwd !== scope.cwd) {
                                reportCreatedGroupAssignmentFailure(new Error(t('sidebar.groupAssignFailedAfterCreate')));
                                return;
                            }
                            const targetActions = livePolicy.getSessionWorkspaceActions(groupEditor.targetSession);
                            if (!targetActions) {
                                reportCreatedGroupAssignmentFailure(new Error(t('sidebar.groupAssignFailedAfterCreate')));
                                return;
                            }
                            await targetActions.updateSessionOrganization(groupEditor.targetSession.sessionId, 
                            // Assigning a named group clears any color tag (single choice
                            // in the UI), matching assignSessionGroup.
                            { groupId: group.id, color: null });
                            bumpWorkspaceReload();
                        }
                        catch (err) {
                            reportCreatedGroupAssignmentFailure(err);
                            return;
                        }
                    }
                }
                setGroupEditor(null);
                setGroupName('');
                if (groupEditor.workspaceCwd) {
                    bumpWorkspaceReload();
                }
                else {
                    void reloadGroups().catch(() => undefined);
                }
            }
            catch (err) {
                onError(err, groupEditor.mode === 'create'
                    ? t('sidebar.groupCreateFailed')
                    : t('sidebar.groupUpdateFailed'));
            }
            finally {
                const workspaceCwd = groupEditor.workspaceCwd ?? primaryWorkspaceCwd;
                if (workspaceCwd) {
                    sessionCatalogController.invalidateWorkspace(workspaceCwd);
                }
                setGroupBusy(false);
            }
        })();
    }, [
        bumpWorkspaceReload,
        colorOptions,
        groupColor,
        groupEditor,
        groupName,
        canOrganizeSession,
        canOrganizeWorkspace,
        closeGroupEditor,
        onError,
        primaryWorkspaceCwd,
        reloadGroups,
        resolveWorkspaceScope,
        sessionCatalogController,
        t,
        workspaceActions,
        workspace.client,
    ]);
    const handleDeleteGroup = useCallback((group, workspaceCwd) => {
        if (!canOrganizeWorkspace(workspaceCwd))
            return;
        setDeleteGroupCandidate({ group, workspaceCwd });
    }, [canOrganizeWorkspace]);
    const confirmDeleteGroup = useCallback(() => {
        if (!deleteGroupCandidate)
            return;
        if (!canOrganizeWorkspace(deleteGroupCandidate.workspaceCwd)) {
            setDeleteGroupCandidate(null);
            return;
        }
        setGroupBusy(true);
        const scope = resolveWorkspaceScope(deleteGroupCandidate.workspaceCwd);
        const groupActions = scope.kind === 'primary'
            ? workspaceActions
            : scope.kind === 'locked' || scope.kind === 'restricted'
                ? workspace.client.workspaceByCwd(scope.cwd)
                : undefined;
        if (!groupActions) {
            setGroupBusy(false);
            return;
        }
        groupActions
            .deleteSessionGroup(deleteGroupCandidate.group.id)
            .then(() => {
            setDeleteGroupCandidate(null);
            if (deleteGroupCandidate.workspaceCwd) {
                bumpWorkspaceReload();
            }
        })
            .catch((err) => onError(err, t('sidebar.groupDeleteFailed')))
            .then(() => deleteGroupCandidate.workspaceCwd
            ? undefined
            : reloadGroups().catch(() => undefined))
            .finally(() => {
            const workspaceCwd = deleteGroupCandidate.workspaceCwd ?? primaryWorkspaceCwd;
            if (workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
            }
            setGroupBusy(false);
        });
    }, [
        deleteGroupCandidate,
        canOrganizeWorkspace,
        onError,
        primaryWorkspaceCwd,
        reloadGroups,
        t,
        bumpWorkspaceReload,
        resolveWorkspaceScope,
        sessionCatalogController,
        workspace.client,
        workspaceActions,
    ]);
    useEffect(() => {
        if (deleteCandidate && !canDeleteSession(deleteCandidate)) {
            setDeleteCandidate(null);
        }
    }, [canDeleteSession, deleteCandidate]);
    useEffect(() => {
        if (groupMenu && !canOrganizeSession(groupMenu.session, 'group')) {
            setGroupMenu(null);
        }
    }, [canOrganizeSession, groupMenu]);
    useEffect(() => {
        if (groupEditor &&
            (!canOrganizeWorkspace(groupEditor.workspaceCwd) ||
                (groupEditor.targetSession &&
                    !canOrganizeSession(groupEditor.targetSession, 'group')))) {
            setGroupEditor(null);
            setGroupName('');
        }
    }, [canOrganizeSession, canOrganizeWorkspace, groupEditor]);
    useEffect(() => {
        if (deleteGroupCandidate &&
            !canOrganizeWorkspace(deleteGroupCandidate.workspaceCwd)) {
            setDeleteGroupCandidate(null);
        }
    }, [canOrganizeWorkspace, deleteGroupCandidate]);
    const handleTogglePin = useCallback((session) => {
        const sessionId = session.sessionId;
        const sessionIdentity = getIdentityForSession(session);
        if (!canOrganizeSession(session, 'pin') ||
            busySessionIdsRef.current.has(sessionIdentity)) {
            return;
        }
        setSessionBusy(sessionId, true, session.workspaceCwd);
        const sessionActions = getSessionWorkspaceActions(session);
        if (!sessionActions) {
            setSessionBusy(sessionId, false, session.workspaceCwd);
            return;
        }
        sessionActions
            .updateSessionOrganization(sessionId, {
            isPinned: !session.isPinned,
        })
            .then(() => {
            bumpWorkspaceReload();
        })
            .catch((err) => onError(err, t('sidebar.organizationFailed')))
            .finally(() => {
            const workspaceCwd = session.workspaceCwd ?? primaryWorkspaceCwd;
            if (workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
            }
            setSessionBusy(sessionId, false, session.workspaceCwd);
        });
    }, [
        bumpWorkspaceReload,
        getIdentityForSession,
        getSessionWorkspaceActions,
        onError,
        primaryWorkspaceCwd,
        canOrganizeSession,
        sessionCatalogController,
        setSessionBusy,
        t,
    ]);
    const handleArchive = useCallback((session) => {
        const sessionId = session.sessionId;
        const sessionIdentity = getIdentityForSession(session);
        // The daemon force-ends a live turn on archive; keep the current
        // session off-limits, mirroring the delete guard.
        if (!canArchiveSession(session))
            return;
        if (busySessionIdsRef.current.has(sessionIdentity))
            return;
        const scope = resolveSessionWorkspaceScope(session);
        setSessionBusy(sessionId, true, session.workspaceCwd);
        void (async () => {
            try {
                if (scope.kind === 'locked' || scope.kind === 'restricted') {
                    const result = await workspace.client
                        .workspaceByCwd(scope.cwd)
                        .archiveSessionsData([sessionId]);
                    const itemError = result.errors.find((entry) => entry.sessionId === sessionId);
                    if (itemError) {
                        onError(new Error(itemError.error), t('sidebar.archiveFailed'));
                    }
                }
                else if (scope.kind === 'primary') {
                    await archiveSession(sessionId);
                }
                else {
                    return;
                }
            }
            catch (err) {
                onError(err, t('sidebar.archiveFailed'));
            }
            finally {
                bumpWorkspaceReload();
                const workspaceCwd = session.workspaceCwd ?? primaryWorkspaceCwd;
                if (scope.kind !== 'primary' && workspaceCwd) {
                    sessionCatalogController.invalidateWorkspace(workspaceCwd);
                }
                setSessionBusy(sessionId, false, session.workspaceCwd);
            }
        })();
    }, [
        archiveSession,
        bumpWorkspaceReload,
        canArchiveSession,
        getIdentityForSession,
        onError,
        primaryWorkspaceCwd,
        sessionCatalogController,
        setSessionBusy,
        t,
        resolveSessionWorkspaceScope,
        workspace.client,
    ]);
    const handleUnarchive = useCallback((session) => {
        const sessionId = session.sessionId;
        const sessionIdentity = getIdentityForSession(session);
        if (!canUnarchiveSession(session))
            return;
        if (busySessionIdsRef.current.has(sessionIdentity))
            return;
        const scope = resolveSessionWorkspaceScope(session);
        setSessionBusy(sessionId, true, session.workspaceCwd);
        void (async () => {
            try {
                if (scope.kind === 'locked' || scope.kind === 'restricted') {
                    const result = await workspace.client
                        .workspaceByCwd(scope.cwd)
                        .unarchiveSessionsData([sessionId]);
                    const itemError = result.errors.find((entry) => entry.sessionId === sessionId);
                    if (itemError) {
                        onError(new Error(itemError.error), t('sidebar.unarchiveFailed'));
                    }
                }
                else if (scope.kind === 'primary') {
                    await unarchiveSession(sessionId);
                }
                else {
                    return;
                }
            }
            catch (err) {
                onError(err, t('sidebar.unarchiveFailed'));
            }
            finally {
                bumpWorkspaceReload();
                const workspaceCwd = session.workspaceCwd ?? primaryWorkspaceCwd;
                if (scope.kind !== 'primary' && workspaceCwd) {
                    sessionCatalogController.invalidateWorkspace(workspaceCwd);
                }
                setSessionBusy(sessionId, false, session.workspaceCwd);
            }
        })();
    }, [
        bumpWorkspaceReload,
        canUnarchiveSession,
        getIdentityForSession,
        onError,
        primaryWorkspaceCwd,
        sessionCatalogController,
        setSessionBusy,
        t,
        unarchiveSession,
        resolveSessionWorkspaceScope,
        workspace.client,
    ]);
    const openGroupMenuFromAnchor = useCallback(async (anchorEl, session) => {
        if (!canOrganizeSession(session, 'group'))
            return;
        let groupCount = 0;
        try {
            const sessionActions = getSessionWorkspaceActions(session);
            if (!sessionActions)
                return;
            const catalog = await sessionActions.listSessionGroups();
            if (!canOrganizeSession(session, 'group'))
                return;
            setMenuGroups(catalog.groups);
            setColorOptions(catalog.colorOptions);
            groupCount = catalog.groups.length;
        }
        catch (err) {
            onError(err, t('sidebar.groupsLoadFailed'));
            return;
        }
        if (!anchorEl.isConnected)
            return;
        const rect = anchorEl.getBoundingClientRect();
        const viewportWidth = typeof window === 'undefined'
            ? rect.right + GROUP_MENU_WIDTH
            : window.innerWidth;
        const viewportHeight = typeof window === 'undefined' ? rect.top + 320 : window.innerHeight;
        const estimatedHeight = Math.min(320, 34 * (groupCount + SESSION_GROUP_COLORS.length + 2) + 25);
        const left = rect.right + GROUP_MENU_MARGIN + GROUP_MENU_WIDTH <= viewportWidth
            ? rect.right + GROUP_MENU_MARGIN
            : Math.max(GROUP_MENU_MARGIN, rect.left - GROUP_MENU_WIDTH - GROUP_MENU_MARGIN);
        const top = Math.max(GROUP_MENU_MARGIN, Math.min(rect.top, viewportHeight - estimatedHeight - GROUP_MENU_MARGIN));
        setGroupMenu({
            session,
            top,
            left,
        });
    }, [canOrganizeSession, getSessionWorkspaceActions, onError, t]);
    const assignSessionGroup = useCallback((session, groupId) => {
        const sessionId = session.sessionId;
        const sessionIdentity = getIdentityForSession(session);
        if (!canOrganizeSession(session, 'group') ||
            busySessionIdsRef.current.has(sessionIdentity)) {
            return;
        }
        setGroupMenu(null);
        setSessionBusy(sessionId, true, session.workspaceCwd);
        const sessionActions = getSessionWorkspaceActions(session);
        if (!sessionActions) {
            setSessionBusy(sessionId, false, session.workspaceCwd);
            return;
        }
        sessionActions
            // Group and color are a single choice in the UI: assigning a named
            // group (or "Ungrouped", groupId=null) clears any color tag.
            .updateSessionOrganization(sessionId, { groupId, color: null })
            .then(() => {
            bumpWorkspaceReload();
        })
            .catch((err) => onError(err, t('sidebar.organizationFailed')))
            .finally(() => {
            const workspaceCwd = session.workspaceCwd ?? primaryWorkspaceCwd;
            if (workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
            }
            setSessionBusy(sessionId, false, session.workspaceCwd);
        });
    }, [
        bumpWorkspaceReload,
        getIdentityForSession,
        getSessionWorkspaceActions,
        onError,
        primaryWorkspaceCwd,
        canOrganizeSession,
        sessionCatalogController,
        setSessionBusy,
        t,
    ]);
    const assignSessionColor = useCallback((session, color) => {
        const sessionId = session.sessionId;
        const sessionIdentity = getIdentityForSession(session);
        if (!canOrganizeSession(session, 'group') ||
            busySessionIdsRef.current.has(sessionIdentity)) {
            return;
        }
        setGroupMenu(null);
        setSessionBusy(sessionId, true, session.workspaceCwd);
        const sessionActions = getSessionWorkspaceActions(session);
        if (!sessionActions) {
            setSessionBusy(sessionId, false, session.workspaceCwd);
            return;
        }
        sessionActions
            // Picking a color clears any named-group assignment (single choice).
            .updateSessionOrganization(sessionId, { color, groupId: null })
            .then(() => {
            bumpWorkspaceReload();
        })
            .catch((err) => onError(err, t('sidebar.organizationFailed')))
            .finally(() => {
            const workspaceCwd = session.workspaceCwd ?? primaryWorkspaceCwd;
            if (workspaceCwd) {
                sessionCatalogController.invalidateWorkspace(workspaceCwd);
            }
            setSessionBusy(sessionId, false, session.workspaceCwd);
        });
    }, [
        bumpWorkspaceReload,
        getIdentityForSession,
        getSessionWorkspaceActions,
        onError,
        primaryWorkspaceCwd,
        canOrganizeSession,
        sessionCatalogController,
        setSessionBusy,
        t,
    ]);
    const filteredSessions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const sourceScopedSessions = sessions.filter((session) => matchesSessionSource(session, selectedSessionSource));
        const unpinnedSessions = selectedSessionSource === 'channel'
            ? sourceScopedSessions
            : sourceScopedSessions.filter((session) => !session.isPinned);
        const nextSessions = query
            ? unpinnedSessions.filter((session) => {
                const label = getSessionLabel(session).toLowerCase();
                return (label.includes(query) ||
                    session.sessionId.toLowerCase().includes(query));
            })
            : unpinnedSessions.slice();
        if (organizationEnabled) {
            return nextSessions;
        }
        const createdTimeById = new Map(nextSessions.map((session) => [
            session.sessionId,
            getSessionCreatedTime(session),
        ]));
        return nextSessions.sort((a, b) => (createdTimeById.get(b.sessionId) ?? 0) -
            (createdTimeById.get(a.sessionId) ?? 0));
    }, [organizationEnabled, searchQuery, selectedSessionSource, sessions]);
    const channelCatalogLoaded = channelCatalogData !== undefined;
    const channelSessionSections = useMemo(() => selectedSessionSource === 'channel' && channelCatalogLoaded
        ? groupSessionsByChannelType(filteredSessions, channelTypeCatalog, channelInstances, t('sidebar.channelType.other'))
        : null, [
        channelCatalogLoaded,
        channelInstances,
        channelTypeCatalog,
        filteredSessions,
        selectedSessionSource,
        t,
    ]);
    const sessionSections = useMemo(() => {
        if (!organizationEnabled)
            return [];
        const searching = searchQuery.trim().length > 0;
        const validGroupIds = new Set(groups.map((group) => group.id));
        const sessionsByColor = new Map();
        const sessionsByGroupId = new Map();
        for (const group of groups) {
            sessionsByGroupId.set(group.id, []);
        }
        const recentSessions = [];
        for (const session of filteredSessions) {
            // Color takes precedence: the picker keeps color and group mutually
            // exclusive, but stay defensive if a store somehow carries both.
            if (session.color && SESSION_GROUP_COLORS.includes(session.color)) {
                const bucket = sessionsByColor.get(session.color) ?? [];
                bucket.push(session);
                sessionsByColor.set(session.color, bucket);
                continue;
            }
            const groupSessions = session.groupId && validGroupIds.has(session.groupId)
                ? sessionsByGroupId.get(session.groupId)
                : undefined;
            if (groupSessions) {
                groupSessions.push(session);
            }
            else {
                recentSessions.push(session);
            }
        }
        const sections = [];
        // Color buckets first, in palette order; only render non-empty ones so the
        // sidebar never shows six empty color headers.
        for (const color of SESSION_GROUP_COLORS) {
            const colorSessions = sessionsByColor.get(color);
            if (!colorSessions || colorSessions.length === 0)
                continue;
            sections.push({
                id: `color:${color}`,
                kind: 'color',
                label: t(`sidebar.groupColor.${color}`),
                countLabel: String(colorSessions.length),
                color,
                sessions: colorSessions,
            });
        }
        // Named groups next (kept visible even when empty, unless searching).
        for (const group of groups) {
            const groupSessions = sessionsByGroupId.get(group.id) ?? [];
            if (searching && groupSessions.length === 0)
                continue;
            sections.push({
                id: `group:${group.id}`,
                kind: 'group',
                label: group.name,
                countLabel: String(groupSessions.length),
                color: group.color,
                group,
                sessions: groupSessions,
            });
        }
        if (recentSessions.length > 0 && sections.length > 0) {
            sections.push({
                id: RECENT_SESSION_SECTION_ID,
                kind: 'recent',
                label: t('sidebar.groupUngrouped'),
                countLabel: String(recentSessions.length),
                sessions: recentSessions,
            });
        }
        return sections;
    }, [filteredSessions, groups, organizationEnabled, searchQuery, t]);
    useEffect(() => {
        const activeSections = channelSessionSections ?? sessionSections;
        if (selectedSessionSource === 'channel') {
            if (!channelCatalogLoaded)
                return;
            // The refetch for the new source retains the previous source's page
            // until it settles; wait for a page fetched for the channel source.
            if (settledSessionsSourceRef.current !== 'channel')
                return;
        }
        else {
            if (!organizationEnabled)
                return;
            if (!groupsCatalogReady || !sessionsCatalogReady)
                return;
        }
        const unseenIds = activeSections
            .map((section) => section.id)
            .filter((id) => !knownSessionSectionIdsRef.current.has(id));
        const isInitialCatalog = awaitingInitialSessionCatalogBySourceRef.current[sessionSource];
        if (isInitialCatalog) {
            // First-sync registration must reflect the full unfiltered catalog:
            // sections hidden by an active search would never register and would
            // later auto-collapse as mid-session additions. An empty first catalog
            // keeps the latch so the first real sections still register as initial
            // — channel sessions are externally driven and can arrive while the
            // tab is open on an empty settle.
            if (searchQuery.trim() || activeSections.length === 0)
                return;
            awaitingInitialSessionCatalogBySourceRef.current[sessionSource] = false;
            for (const id of unseenIds)
                knownSessionSectionIdsRef.current.add(id);
            return;
        }
        if (unseenIds.length === 0)
            return;
        for (const id of unseenIds)
            knownSessionSectionIdsRef.current.add(id);
        // Brand-new sections that appear mid-session still start collapsed.
        setCollapsedSessionSectionIds((current) => {
            const next = new Set(current);
            for (const id of unseenIds)
                next.add(id);
            return next;
        });
    }, [
        groupsCatalogReady,
        channelCatalogLoaded,
        channelSessionSections,
        organizationEnabled,
        searchQuery,
        selectedSessionSource,
        sessionSections,
        sessionSource,
        sessionsCatalogReady,
    ]);
    useEffect(() => {
        replaceOwnedCollapsedSessionSectionIds(collapsedSessionSectionIds, isPrimaryCollapsedSectionId);
    }, [collapsedSessionSectionIds]);
    const toggleSessionSection = useCallback((sectionId) => {
        setCollapsedSessionSectionIds((current) => {
            const next = new Set(current);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            }
            else {
                next.add(sectionId);
            }
            return next;
        });
    }, []);
    const getSessionDetailsCollisionBoundary = useCallback(() => resolveSessionDetailsCollisionBoundary(sidebarRef.current), []);
    const handleResizePointerDown = useCallback((event) => {
        if (collapsed)
            return;
        event.preventDefault();
        resizeTeardownRef.current?.(true);
        setIsResizing(true);
        const startX = event.clientX;
        const startWidth = sidebarWidth;
        const previousCursor = document.body.style.cursor;
        const previousUserSelect = document.body.style.userSelect;
        let collapsedByDrag = false;
        let teardown = () => undefined;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        catch {
            // Pointer capture is best-effort; window listeners still handle drag.
        }
        function getRawWidth(clientX) {
            return startWidth + clientX - startX;
        }
        function restoreExpandedWidth() {
            const restoredWidth = clampSidebarWidth(startWidth);
            setSidebarWidth(restoredWidth);
            writeSidebarWidth(restoredWidth);
        }
        function collapseFromDrag() {
            if (collapsedByDrag)
                return;
            collapsedByDrag = true;
            restoreExpandedWidth();
            teardown(true);
            onCollapsedChange(true);
        }
        function handlePointerMove(moveEvent) {
            const rawWidth = getRawWidth(moveEvent.clientX);
            if (rawWidth <= SIDEBAR_COLLAPSE_DRAG_WIDTH) {
                collapseFromDrag();
                return;
            }
            setSidebarWidth(clampSidebarVisualWidth(rawWidth));
        }
        teardown = function resizeTeardown(updateState) {
            document.body.style.cursor = previousCursor;
            document.body.style.userSelect = previousUserSelect;
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerCancel);
            resizeTeardownRef.current = null;
            if (updateState) {
                setIsResizing(false);
            }
        };
        function handlePointerUp(upEvent) {
            const rawWidth = getRawWidth(upEvent.clientX);
            if (rawWidth <= SIDEBAR_COLLAPSE_DRAG_WIDTH) {
                collapseFromDrag();
                return;
            }
            const nextWidth = clampSidebarWidth(rawWidth);
            setSidebarWidth(nextWidth);
            writeSidebarWidth(nextWidth);
            teardown(true);
        }
        function handlePointerCancel() {
            teardown(true);
        }
        resizeTeardownRef.current = teardown;
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp, { once: true });
        window.addEventListener('pointercancel', handlePointerCancel, {
            once: true,
        });
    }, [collapsed, onCollapsedChange, sidebarWidth]);
    const deleteCandidateLabel = deleteCandidate
        ? getCompactSessionLabel(deleteCandidate)
        : '';
    const groupMenuSelectedColor = groupMenu?.session.color &&
        SESSION_GROUP_COLORS.includes(groupMenu.session.color)
        ? groupMenu.session.color
        : null;
    const groupMenuSelectedGroupId = !groupMenuSelectedColor &&
        groupMenu?.session.groupId &&
        menuGroups.some((group) => group.id === groupMenu.session.groupId)
        ? groupMenu.session.groupId
        : null;
    const menuColorOptions = colorOptions.length > 0 ? colorOptions : SESSION_GROUP_COLORS;
    const groupMenuUngroupedSelected = groupMenuSelectedGroupId === null && groupMenuSelectedColor === null;
    const deleteGroupCandidateLabel = deleteGroupCandidate?.group.name ?? '';
    const groupColorChoices = colorOptions.length > 0
        ? colorOptions
        : ['blue'];
    const normalizedGroupColor = normalizeGroupColorInput(groupColor, groupColorChoices);
    const customGroupColor = !groupColorChoices.includes(groupColor);
    const canSaveGroup = groupName.trim().length > 0 &&
        normalizedGroupColor !== undefined &&
        !groupBusy;
    const groupEditorTitle = groupEditor?.mode === 'create'
        ? t('sidebar.groupCreate')
        : t('sidebar.groupRename');
    const renderSessionRow = useCallback((session, options = {}) => {
        const { isArchived = false } = options;
        const readOnly = options.readOnly ?? isActiveSessionReadOnly(session);
        const sessionIdentity = getIdentityForSession(session);
        const label = getSessionLabel(session);
        const stamp = session.updatedAt || session.createdAt;
        const time = stamp ? formatRelativeTime(stamp, t) : '';
        const busy = busySessionIds.has(sessionIdentity);
        const exporting = exportingSessionIds.has(sessionIdentity);
        const completedUnread = !isCurrentSession(session) && completedUnreadIds.has(sessionIdentity);
        if (isArchived) {
            const archivedExportWorkspaceCwd = getArchivedExportWorkspaceCwd(session);
            const showArchivedDetails = sessionActionItems.has('details');
            const showArchivedExport = sessionActionItems.has('export') &&
                Boolean(archivedExportWorkspaceCwd);
            const showArchivedUnarchive = canUnarchiveSession(session);
            const showArchivedDelete = canDeleteSession(session);
            const hasArchivedActions = showArchivedDetails ||
                showArchivedExport ||
                showArchivedUnarchive ||
                showArchivedDelete;
            return (_jsxs("div", { className: cx(styles.sessionRow, styles.archivedRow, busy && styles.busySession), children: [_jsx("span", { className: styles.sessionText, title: label, children: label }), _jsxs("div", { className: styles.sessionMetaSlot, children: [_jsx("span", { className: styles.sessionTime, children: time }), hasArchivedActions && (_jsx("div", { className: styles.sessionActions, onClick: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: styles.sessionActionButton, type: "button", "aria-label": t('sidebar.moreActions'), title: t('sidebar.moreActions'), children: _jsx(EllipsisVerticalIcon, {}) }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-auto min-w-40", onPointerDownOutside: () => {
                                                sessionMenuPointerDismissRef.current = true;
                                            }, onCloseAutoFocus: (event) => {
                                                if (!sessionMenuPointerDismissRef.current)
                                                    return;
                                                sessionMenuPointerDismissRef.current = false;
                                                event.preventDefault();
                                            }, children: _jsxs(DropdownMenuGroup, { children: [showArchivedDetails && (_jsx(SessionDetailsSubmenu, { session: session, label: label, completedUnread: completedUnread, onError: onError, getCollisionBoundary: getSessionDetailsCollisionBoundary })), showArchivedExport && (_jsxs(DropdownMenuItem, { disabled: exporting, onSelect: () => handleExportSession(session), children: [_jsx(DownloadIcon, {}), t('sidebar.export')] })), showArchivedUnarchive && (_jsxs(DropdownMenuItem, { onSelect: () => handleUnarchive(session), children: [_jsx(ArchiveRestoreIcon, {}), t('sidebar.unarchive')] })), showArchivedDelete && (_jsxs(DropdownMenuItem, { variant: "destructive", onSelect: () => handleDeleteSession(session), children: [_jsx(Trash2Icon, {}), t('sidebar.delete')] }))] }) })] }) }))] })] }, sessionIdentity));
        }
        const isCurrent = isCurrentSession(session);
        const isEditing = isCurrent && editingSessionIdentity === sessionIdentity;
        const needsUserInput = !session.isWaitingForPermission && session.isWaitingForUserQuestion;
        const attentionLabel = session.isWaitingForPermission
            ? t('sidebar.waitingForApproval')
            : needsUserInput
                ? t('sidebar.userInputNeeded')
                : null;
        const mutableScope = !isActiveSessionReadOnly(session);
        const showPin = canOrganizeSession(session, 'pin');
        const showArchive = sessionActionItems.has('archive') && canMutateSessionArchive(session);
        const showRename = sessionActionItems.has('rename') && mutableScope;
        const activeExportScope = getActiveExportScope(session);
        const showExport = sessionActionItems.has('export') && Boolean(activeExportScope);
        const showDelete = canShowDeleteSession(session);
        return (_jsx("div", { className: cx(styles.sessionRow, isCurrent && styles.currentSession, session.isPinned && styles.pinnedSession, session.hasActivePrompt && styles.runningSession, busy && styles.busySession), role: "button", tabIndex: 0, "aria-current": isCurrent ? 'page' : undefined, onClick: () => handleLoadSession(session.sessionId, session.workspaceCwd), onDoubleClick: () => {
                if (!collapsed && canRenameSession(session))
                    startRename(session);
            }, onKeyDown: (event) => {
                if (event.key === 'Enter') {
                    handleLoadSession(session.sessionId, session.workspaceCwd);
                }
            }, children: !collapsed && (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.sessionStatusSlot, children: completedUnread ? (_jsx("span", { className: styles.sessionStatusDot, "aria-hidden": "true" })) : null }), isEditing && canRenameSession(session) ? (_jsx("form", { className: styles.renameForm, onClick: (event) => event.stopPropagation(), onSubmit: (event) => {
                            event.preventDefault();
                            saveRename();
                        }, children: _jsx("input", { autoFocus: true, className: styles.renameInput, value: editingName, onChange: (event) => setEditingName(event.target.value), onBlur: cancelRename, onKeyDown: (event) => {
                                if (event.key === 'Escape') {
                                    event.preventDefault();
                                    cancelRename();
                                }
                            } }) })) : (_jsxs(_Fragment, { children: [_jsxs("span", { className: styles.sessionText, title: label, children: [session.worktree && (_jsx(GitForkIcon, { size: 11, strokeWidth: 1.5, className: styles.sessionBadgeIcon, "aria-label": t('sidebar.newWorktreeTask') })), session.branch && (_jsx(GitBranchIcon, { size: 11, strokeWidth: 1.5, className: styles.sessionBadgeIcon, "aria-label": session.branch.name })), label] }), _jsxs("div", { className: styles.sessionMetaSlot, children: [attentionLabel && (_jsx("span", { className: cx(styles.sessionAttention, needsUserInput && styles.sessionAttentionUserInput), "aria-label": attentionLabel, children: attentionLabel })), session.hasActivePrompt ? (_jsx("span", { className: styles.sessionLoading, "aria-label": t('sidebar.running') })) : !attentionLabel ? (_jsx("span", { className: styles.sessionTime, children: time })) : null, readOnly && showArchive && (_jsx("div", { className: styles.sessionActions, onClick: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), children: inlineActionItems.has('archive') ? (_jsx("button", { className: styles.sessionActionButton, type: "button", disabled: busy || isCurrent, "aria-label": t('sidebar.archive'), title: isCurrent
                                                ? t('sidebar.archiveCurrentDisabled')
                                                : t('sidebar.archive'), onClick: () => handleArchive(session), children: _jsx(ArchiveIcon, {}) })) : (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: styles.sessionActionButton, type: "button", "aria-label": t('sidebar.moreActions'), title: t('sidebar.moreActions'), children: _jsx(EllipsisVerticalIcon, {}) }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-auto min-w-40", onPointerDownOutside: () => {
                                                        sessionMenuPointerDismissRef.current = true;
                                                    }, onCloseAutoFocus: (event) => {
                                                        if (!sessionMenuPointerDismissRef.current)
                                                            return;
                                                        sessionMenuPointerDismissRef.current = false;
                                                        event.preventDefault();
                                                    }, children: _jsx(DropdownMenuGroup, { children: _jsxs(DropdownMenuItem, { disabled: busy || isCurrent, title: isCurrent
                                                                ? t('sidebar.archiveCurrentDisabled')
                                                                : undefined, onSelect: () => handleArchive(session), children: [_jsx(ArchiveIcon, {}), t('sidebar.archive')] }) }) })] })) })), (!readOnly || showPin) && (_jsxs("div", { className: styles.sessionActions, onClick: (event) => event.stopPropagation(), onKeyDown: (event) => event.stopPropagation(), children: [(() => {
                                                const inlineActions = [
                                                    {
                                                        key: 'pin',
                                                        icon: _jsx(PinIcon, { size: 16, strokeWidth: 1.2 }),
                                                        label: session.isPinned
                                                            ? t('sidebar.unpin')
                                                            : t('sidebar.pin'),
                                                        disabled: busy,
                                                        active: session.isPinned,
                                                        visible: showPin && inlineActionItems.has('pin'),
                                                        onClick: () => handleTogglePin(session),
                                                    },
                                                    {
                                                        key: 'archive',
                                                        icon: _jsx(ArchiveIcon, { size: 16, strokeWidth: 1.2 }),
                                                        label: t('sidebar.archive'),
                                                        disabled: busy || isCurrent,
                                                        title: isCurrent
                                                            ? t('sidebar.archiveCurrentDisabled')
                                                            : t('sidebar.archive'),
                                                        visible: showArchive && inlineActionItems.has('archive'),
                                                        onClick: () => handleArchive(session),
                                                    },
                                                    {
                                                        key: 'rename',
                                                        icon: _jsx(PencilIcon, { size: 16, strokeWidth: 1.2 }),
                                                        label: t('sidebar.rename'),
                                                        disabled: !isCurrent,
                                                        title: !isCurrent
                                                            ? t('sidebar.renameCurrentOnly')
                                                            : undefined,
                                                        visible: showRename && inlineActionItems.has('rename'),
                                                        onClick: () => handleRenameFromMenu(session),
                                                    },
                                                    {
                                                        key: 'export',
                                                        icon: (_jsx(DownloadIcon, { size: 16, strokeWidth: 1.2 })),
                                                        label: t('sidebar.export'),
                                                        disabled: exporting,
                                                        visible: showExport && inlineActionItems.has('export'),
                                                        onClick: () => handleExportSession(session),
                                                    },
                                                    {
                                                        key: 'delete',
                                                        icon: _jsx(Trash2Icon, { size: 16, strokeWidth: 1.2 }),
                                                        label: t('sidebar.delete'),
                                                        disabled: isCurrent,
                                                        destructive: true,
                                                        title: isCurrent
                                                            ? t('sidebar.currentDeleteDisabled')
                                                            : undefined,
                                                        visible: showDelete && inlineActionItems.has('delete'),
                                                        onClick: () => handleDeleteSession(session),
                                                    },
                                                ];
                                                return inlineActions
                                                    .filter((a) => a.visible)
                                                    .map((action) => (_jsx("button", { className: cx(styles.sessionActionButton, action.active &&
                                                        styles.activeSessionActionButton), type: "button", disabled: action.disabled, "aria-label": action.label, title: action.title ?? action.label, onClick: action.onClick, style: action.destructive && !action.disabled
                                                        ? {
                                                            color: 'var(--destructive, #dc2626)',
                                                        }
                                                        : undefined, children: action.icon ?? (_jsx("span", { style: { fontSize: 12 }, children: action.label })) }, action.key)));
                                            })(), (showPin && !inlineActionItems.has('pin')) ||
                                                (showArchive && !inlineActionItems.has('archive')) ||
                                                sessionActionItems.has('details') ||
                                                (showRename && !inlineActionItems.has('rename')) ||
                                                canOrganizeSession(session, 'group') ||
                                                (showExport && !inlineActionItems.has('export')) ||
                                                (showDelete && !inlineActionItems.has('delete')) ? (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: styles.sessionActionButton, type: "button", "aria-label": t('sidebar.moreActions'), title: t('sidebar.moreActions'), children: _jsx(EllipsisVerticalIcon, {}) }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-auto min-w-40", onPointerDownOutside: () => {
                                                            sessionMenuPointerDismissRef.current = true;
                                                        }, onCloseAutoFocus: (event) => {
                                                            if (!sessionMenuPointerDismissRef.current)
                                                                return;
                                                            sessionMenuPointerDismissRef.current = false;
                                                            event.preventDefault();
                                                        }, children: _jsxs(DropdownMenuGroup, { children: [showPin && !inlineActionItems.has('pin') && (_jsxs(DropdownMenuItem, { disabled: busy, onSelect: () => handleTogglePin(session), children: [_jsx(PinIcon, {}), session.isPinned
                                                                            ? t('sidebar.unpin')
                                                                            : t('sidebar.pin')] })), showArchive &&
                                                                    !inlineActionItems.has('archive') && (_jsxs(DropdownMenuItem, { disabled: busy || isCurrent, title: isCurrent
                                                                        ? t('sidebar.archiveCurrentDisabled')
                                                                        : undefined, onSelect: () => handleArchive(session), children: [_jsx(ArchiveIcon, {}), t('sidebar.archive')] })), sessionActionItems.has('details') && (_jsx(SessionDetailsSubmenu, { session: session, label: label, completedUnread: completedUnread, onError: onError, getCollisionBoundary: getSessionDetailsCollisionBoundary })), showRename &&
                                                                    !inlineActionItems.has('rename') && (_jsxs(DropdownMenuItem, { disabled: !isCurrent, title: !isCurrent
                                                                        ? t('sidebar.renameCurrentOnly')
                                                                        : undefined, onSelect: () => handleRenameFromMenu(session), children: [_jsx(PencilIcon, {}), t('sidebar.rename')] })), canOrganizeSession(session, 'group') && (_jsxs(DropdownMenuItem, { disabled: busy, onSelect: (event) => openGroupMenuFromAnchor(event.currentTarget, session), children: [_jsx(FolderInputIcon, {}), t('sidebar.sessionGroup')] })), showExport &&
                                                                    !inlineActionItems.has('export') && (_jsxs(DropdownMenuItem, { disabled: exporting, onSelect: () => handleExportSession(session), children: [_jsx(DownloadIcon, {}), t('sidebar.export')] })), showDelete &&
                                                                    !inlineActionItems.has('delete') && (_jsxs(DropdownMenuItem, { variant: "destructive", disabled: isCurrent, title: isCurrent
                                                                        ? t('sidebar.currentDeleteDisabled')
                                                                        : undefined, onSelect: () => handleDeleteSession(session), children: [_jsx(Trash2Icon, {}), t('sidebar.delete')] }))] }) })] })) : null] }))] })] }))] })) }, sessionIdentity));
    }, [
        busySessionIds,
        canDeleteSession,
        canShowDeleteSession,
        canOrganizeSession,
        canRenameSession,
        canUnarchiveSession,
        canMutateSessionArchive,
        cancelRename,
        collapsed,
        completedUnreadIds,
        editingName,
        editingSessionIdentity,
        exportingSessionIds,
        getArchivedExportWorkspaceCwd,
        getActiveExportScope,
        getIdentityForSession,
        getSessionDetailsCollisionBoundary,
        onError,
        handleArchive,
        handleDeleteSession,
        handleExportSession,
        handleLoadSession,
        handleRenameFromMenu,
        handleTogglePin,
        handleUnarchive,
        isCurrentSession,
        openGroupMenuFromAnchor,
        saveRename,
        sessionActionItems,
        inlineActionItems,
        isActiveSessionReadOnly,
        startRename,
        t,
    ]);
    const body = useMemo(() => {
        // Gate notices on the resource, not the filtered view: background
        // refreshes set loading/error while retaining the settled page, so a
        // filter-empty or empty-but-settled view must not flash or swap to retry.
        if (loading && sessionsPage === undefined) {
            return (_jsx("div", { className: styles.notice, children: t('sidebar.loadingSessions') }));
        }
        if (error && sessionsPage === undefined) {
            return (_jsx("button", { className: styles.retry, type: "button", onClick: reload, children: t('sidebar.loadFailed') }));
        }
        if (filteredSessions.length === 0 &&
            (selectedSessionSource === 'channel' ||
                channelSessionSections !== null ||
                searchQuery.trim() ||
                !organizationEnabled ||
                sessionSections.length === 0)) {
            return _jsx("div", { className: styles.notice, children: t('sidebar.searchEmpty') });
        }
        if (channelSessionSections) {
            return channelSessionSections.map((section) => (_jsx(SessionGroupSection, { id: section.id, label: section.label, count: section.sessions.length, expanded: !collapsedSessionSectionIds.has(section.id), onToggle: () => toggleSessionSection(section.id), children: section.sessions.map((session) => renderSessionRow(session)) }, section.id)));
        }
        if (selectedSessionSource === 'channel') {
            return filteredSessions.map((session) => renderSessionRow(session));
        }
        if (!organizationEnabled) {
            return filteredSessions.map((session) => renderSessionRow(session));
        }
        if (sessionSections.length === 0) {
            return filteredSessions.map((session) => renderSessionRow(session));
        }
        return sessionSections.map((section) => {
            const expanded = !collapsedSessionSectionIds.has(section.id);
            const group = section.group;
            return (_jsx(SessionGroupSection, { id: section.id, label: section.label, count: section.sessions.length, color: section.color, expanded: expanded, onToggle: () => toggleSessionSection(section.id), onRename: section.kind === 'group' && group && canOrganizeWorkspace()
                    ? () => handleRenameGroup(group)
                    : undefined, onDelete: section.kind === 'group' && group && canOrganizeWorkspace()
                    ? () => handleDeleteGroup(group)
                    : undefined, renameLabel: t('sidebar.groupRename'), deleteLabel: t('sidebar.groupDelete'), actionsDisabled: groupBusy, children: section.sessions.map((session) => renderSessionRow(session)) }, section.id));
        });
    }, [
        collapsedSessionSectionIds,
        canOrganizeWorkspace,
        channelSessionSections,
        error,
        filteredSessions,
        groupBusy,
        handleDeleteGroup,
        handleRenameGroup,
        loading,
        organizationEnabled,
        reload,
        renderSessionRow,
        searchQuery,
        selectedSessionSource,
        sessionSections,
        sessionsPage,
        t,
        toggleSessionSection,
    ]);
    const archivedSection = useMemo(() => {
        if (!sessionArchiveEnabled || collapsed || searchQuery.trim())
            return null;
        const header = (_jsxs("button", { type: "button", className: styles.archivedHeader, "aria-expanded": archivedExpanded, onClick: toggleArchived, children: [_jsx("span", { className: styles.archivedTitle, style: { flex: '0 1 auto' }, children: t('sidebar.archivedTitle') }), _jsx("span", { className: styles.archivedChevron, "aria-hidden": "true", children: archivedExpanded ? _jsx(ChevronDownIcon, {}) : _jsx(ChevronRightIcon, {}) }), archivedExpanded && allArchivedSessions.length > 0 && (_jsx("span", { className: styles.archivedCount, children: allArchivedSessions.length }))] }));
        if (!archivedExpanded) {
            return _jsx("div", { className: styles.archivedSection, children: header });
        }
        const retry = (_jsx("button", { className: styles.retry, type: "button", onClick: () => {
                void reloadArchived().catch(() => undefined);
                for (const workspaceCwd of secondaryWorkspaceCwds) {
                    sessionCatalogController.invalidateWorkspace(workspaceCwd);
                }
            }, children: t('sidebar.loadFailed') }));
        let content;
        if (effectiveArchivedLoading && allArchivedSessions.length === 0) {
            content = (_jsx("div", { className: styles.notice, children: t('sidebar.loadingSessions') }));
        }
        else if (effectiveArchivedError && allArchivedSessions.length === 0) {
            content = retry;
        }
        else if (allArchivedSessions.length === 0) {
            content = (_jsx("div", { className: styles.notice, children: t('sidebar.archivedEmpty') }));
        }
        else {
            content = (_jsxs(_Fragment, { children: [allArchivedSessions.map((session) => renderSessionRow(session, { isArchived: true })), effectiveArchivedError && retry] }));
        }
        return (_jsxs("div", { className: styles.archivedSection, children: [header, _jsx("div", { className: styles.archivedList, children: content })] }));
    }, [
        archivedExpanded,
        allArchivedSessions,
        collapsed,
        effectiveArchivedError,
        effectiveArchivedLoading,
        reloadArchived,
        renderSessionRow,
        searchQuery,
        secondaryWorkspaceCwds,
        sessionCatalogController,
        sessionArchiveEnabled,
        t,
        toggleArchived,
    ]);
    return (_jsx(_Fragment, { children: _jsxs("aside", { ref: sidebarRef, className: cx(styles.sidebar, collapsed && styles.collapsed, isResizing && styles.resizing, mobileOpen && styles.mobileOpen), "aria-label": t('sidebar.label'), style: sidebarStyle, children: [groupMenu && (_jsxs("div", { ref: groupMenuRef, className: styles.groupMenu, role: "menu", "aria-label": t('sidebar.sessionGroup'), style: { top: groupMenu.top, left: groupMenu.left }, onClick: (event) => event.stopPropagation(), onKeyDown: handleGroupMenuKeyDown, onMouseDown: (event) => event.stopPropagation(), children: [_jsxs("button", { className: cx(styles.groupMenuItem, groupMenuUngroupedSelected && styles.groupMenuItemActive), type: "button", role: "menuitemradio", "aria-checked": groupMenuUngroupedSelected, onClick: () => assignSessionGroup(groupMenu.session, null), children: [_jsx("span", { className: styles.groupMenuEmptyDot }), _jsx("span", { className: styles.groupMenuName, children: t('sidebar.groupUngrouped') }), groupMenuUngroupedSelected && (_jsx("span", { className: styles.groupMenuCheck, children: "\u2713" }))] }), menuColorOptions.map((color) => {
                            const selected = groupMenuSelectedColor === color;
                            return (_jsxs("button", { className: cx(styles.groupMenuItem, selected && styles.groupMenuItemActive), type: "button", role: "menuitemradio", "aria-checked": selected, onClick: () => assignSessionColor(groupMenu.session, color), children: [_jsx("span", { className: cx(styles.groupMenuDot, getGroupColorClass(color)) }), _jsx("span", { className: styles.groupMenuName, children: t(`sidebar.groupColor.${color}`) }), selected && _jsx("span", { className: styles.groupMenuCheck, children: "\u2713" })] }, `color:${color}`));
                        }), menuGroups.map((group) => {
                            const selected = groupMenuSelectedGroupId === group.id;
                            return (_jsxs("button", { className: cx(styles.groupMenuItem, selected && styles.groupMenuItemActive), type: "button", role: "menuitemradio", "aria-checked": selected, onClick: () => assignSessionGroup(groupMenu.session, group.id), children: [_jsx("span", { className: cx(styles.groupMenuDot, getGroupColorClass(group.color)), style: getGroupColorStyle(group.color) }), _jsx("span", { className: styles.groupMenuName, children: group.name }), selected && _jsx("span", { className: styles.groupMenuCheck, children: "\u2713" })] }, group.id));
                        }), _jsx("div", { className: styles.groupMenuSeparator }), _jsxs("button", { className: styles.groupMenuItem, type: "button", role: "menuitem", onClick: () => handleCreateGroupForSession(groupMenu.session), children: [_jsx("span", { className: styles.groupMenuIcon, children: _jsx(IconNewChat, {}) }), _jsx("span", { className: styles.groupMenuName, children: t('sidebar.groupCreate') })] })] })), deleteCandidate && (_jsx(DialogShell, { title: t('delete.title'), size: "sm", onClose: () => setDeleteCandidate(null), children: _jsxs("div", { className: styles.confirmContent, children: [_jsx("p", { className: styles.confirmDescription, children: t('sidebar.deleteConfirmDescription', {
                                    name: deleteCandidateLabel,
                                }) }), _jsxs("div", { className: styles.confirmActions, children: [_jsx("button", { className: styles.secondaryButton, type: "button", onClick: () => setDeleteCandidate(null), children: t('common.cancel') }), _jsx("button", { className: styles.dangerButton, type: "button", onClick: confirmDeleteSession, children: t('sidebar.delete') })] })] }) })), workspaceRemovalCandidate && (_jsx(DialogShell, { title: t('sidebar.removeWorkspaceTitle'), size: "sm", onClose: () => {
                        if (!workspaceRemovalSubmitting ||
                            workspaceRemovalRemoteInProgress) {
                            workspaceRemovalDismissedRef.current = true;
                            setWorkspaceRemovalCandidate(null);
                            setWorkspaceRemovalActivity(null);
                            setWorkspaceRemovalRemoteInProgress(false);
                        }
                    }, children: _jsxs("div", { className: styles.confirmContent, children: [_jsx("p", { className: styles.confirmDescription, children: workspaceRemovalActivity
                                    ? t('sidebar.removeWorkspaceBusy', {
                                        name: workspaceRemovalCandidate.cwd,
                                    })
                                    : t('sidebar.removeWorkspaceConfirm', {
                                        name: workspaceRemovalCandidate.cwd,
                                    }) }), workspaceRemovalActivity && (_jsxs("ul", { className: styles.workspaceRemovalActivityList, children: [_jsx("li", { children: t('sidebar.removeWorkspaceSessions', {
                                            count: workspaceRemovalActivity.sessions,
                                        }) }), _jsx("li", { children: t('sidebar.removeWorkspacePrompts', {
                                            count: workspaceRemovalActivity.activePrompts,
                                        }) }), _jsx("li", { children: t('sidebar.removeWorkspaceStarts', {
                                            count: workspaceRemovalActivity.pendingSessionStarts,
                                        }) }), _jsx("li", { children: t('sidebar.removeWorkspaceConnections', {
                                            count: workspaceRemovalActivity.acpConnections,
                                        }) }), _jsx("li", { children: t('sidebar.removeWorkspaceMemoryTasks', {
                                            count: workspaceRemovalActivity.memoryTasks,
                                        }) }), _jsx("li", { children: t('sidebar.removeWorkspaceWorkers', {
                                            count: workspaceRemovalActivity.channelWorkers,
                                        }) }), _jsx("li", { children: t('sidebar.removeWorkspaceVoiceSessions', {
                                            count: workspaceRemovalActivity.voiceSessions ?? 0,
                                        }) })] })), workspaceRemovalActivity &&
                                connection.sessionId &&
                                connection.workspaceCwd === workspaceRemovalCandidate.cwd && (_jsx("p", { className: styles.confirmDescription, children: t('sidebar.removeWorkspaceCurrentSession') })), workspaceRemovalRemoteInProgress && (_jsx("p", { className: styles.confirmDescription, children: t('sidebar.removeWorkspaceInProgress') })), _jsxs("div", { className: styles.confirmActions, children: [_jsx("button", { className: styles.secondaryButton, type: "button", disabled: workspaceRemovalSubmitting &&
                                            !workspaceRemovalRemoteInProgress, onClick: () => {
                                            workspaceRemovalDismissedRef.current = true;
                                            setWorkspaceRemovalCandidate(null);
                                            setWorkspaceRemovalActivity(null);
                                            setWorkspaceRemovalRemoteInProgress(false);
                                        }, children: t('common.cancel') }), _jsx("button", { className: styles.dangerButton, type: "button", disabled: workspaceRemovalSubmitting ||
                                            workspaceRemovalRemoteInProgress ||
                                            (workspaceRemovalActivity !== null &&
                                                Boolean(connection.sessionId) &&
                                                connection.workspaceCwd === workspaceRemovalCandidate.cwd), onClick: () => void confirmWorkspaceRemoval(), children: workspaceRemovalActivity
                                            ? t('sidebar.forceRemoveWorkspace')
                                            : t('sidebar.removeWorkspace') })] })] }) })), groupEditor && (_jsx(DialogShell, { title: groupEditorTitle, size: "sm", onClose: closeGroupEditor, children: _jsxs("form", { className: "flex flex-col gap-6", onSubmit: (event) => {
                            event.preventDefault();
                            saveGroupEditor();
                        }, children: [_jsxs(FieldGroup, { children: [_jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "session-group-name", children: t('sidebar.groupNamePrompt') }), _jsx(Input, { id: "session-group-name", value: groupName, autoFocus: true, maxLength: 64, onChange: (event) => setGroupName(event.target.value) })] }), _jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "session-group-color", children: t('sidebar.groupColor') }), _jsxs(Select, { value: customGroupColor ? CUSTOM_GROUP_COLOR_OPTION : groupColor, onValueChange: (value) => {
                                                    setGroupColor(value === CUSTOM_GROUP_COLOR_OPTION
                                                        ? lastValidCustomGroupColor
                                                        : value);
                                                }, children: [_jsx(SelectTrigger, { id: "session-group-color", className: "w-full", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: _jsxs(SelectGroup, { children: [groupColorChoices.map((color) => (_jsx(SelectItem, { value: color, children: t(`sidebar.groupColor.${color}`) }, color))), _jsx(SelectItem, { value: CUSTOM_GROUP_COLOR_OPTION, children: t('sidebar.groupColor.custom') })] }) })] })] }), customGroupColor && (_jsxs(Field, { children: [_jsx(FieldLabel, { htmlFor: "session-group-hex-color", children: t('sidebar.groupColor.hex') }), _jsxs("div", { className: styles.groupCustomColorRow, children: [_jsx(Input, { className: styles.groupColorPicker, type: "color", value: lastValidCustomGroupColor, "aria-label": t('sidebar.groupColor.picker'), onChange: (event) => {
                                                            const value = event.target.value.toLowerCase();
                                                            setLastValidCustomGroupColor(value);
                                                            setGroupColor(value);
                                                        } }), _jsx(Input, { id: "session-group-hex-color", value: groupColor, maxLength: 7, spellCheck: false, "aria-invalid": normalizedGroupColor === undefined, onChange: (event) => {
                                                            const raw = event.target.value;
                                                            const trimmed = raw.trim();
                                                            const value = (trimmed && !trimmed.startsWith('#')
                                                                ? `#${trimmed}`
                                                                : raw);
                                                            setGroupColor(value);
                                                            const normalized = normalizeHexColorInput(value);
                                                            if (normalized) {
                                                                setLastValidCustomGroupColor(normalized);
                                                            }
                                                        } })] }), normalizedGroupColor === undefined && (_jsx("span", { className: styles.groupColorError, role: "alert", children: t('sidebar.groupColor.invalid') }))] }))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", disabled: groupBusy, onClick: closeGroupEditor, children: t('common.cancel') }), _jsx(Button, { type: "submit", disabled: !canSaveGroup, children: t('common.save') })] })] }) })), deleteGroupCandidate && (_jsx(DialogShell, { title: t('sidebar.groupDelete'), size: "sm", onClose: () => {
                        if (!groupBusy)
                            setDeleteGroupCandidate(null);
                    }, children: _jsxs("div", { className: styles.confirmContent, children: [_jsx("p", { className: styles.confirmDescription, children: t('sidebar.groupDeleteConfirm', {
                                    name: deleteGroupCandidateLabel,
                                }) }), _jsxs("div", { className: styles.confirmActions, children: [_jsx("button", { className: styles.secondaryButton, type: "button", disabled: groupBusy, onClick: () => setDeleteGroupCandidate(null), children: t('common.cancel') }), _jsx("button", { className: styles.dangerButton, type: "button", disabled: groupBusy, onClick: confirmDeleteGroup, children: t('sidebar.groupDelete') })] })] }) })), shouldRenderBrand && (_jsx("div", { className: styles.topRow, children: branding?.render ? (branding.render()) : (_jsxs(_Fragment, { children: [_jsx("span", { className: styles.brandLogo, "aria-hidden": "true", children: _jsx(IconQwenLogo, {}) }), !collapsed && (_jsx("span", { className: styles.brandName, children: "Qwen Code" }))] })) })), _jsxs("div", { className: styles.primaryNav, children: [primaryNavItems.has('newTask') && (_jsxs("button", { className: styles.newChatButton, type: "button", title: t('sidebar.newTask'), "aria-label": t('sidebar.newTask'), disabled: newSessionDisabled, onClick: () => handleNewSession(), children: [_jsx("span", { className: styles.navIcon, children: _jsx(SquarePenIcon, { size: 16, strokeWidth: 1.2 }) }), !collapsed && _jsx("span", { children: t('sidebar.newTask') })] })), primaryNavItems.has('plugins') && (_jsxs("button", { className: styles.pluginButton, type: "button", title: t('sidebar.plugins'), "aria-label": t('sidebar.plugins'), onClick: onOpenPlugins, children: [_jsx("span", { className: styles.navIcon, children: _jsx(BlocksIcon, { size: 16, strokeWidth: 1.2 }) }), !collapsed && _jsx("span", { children: t('sidebar.plugins') })] })), primaryNavItems.has('channels') && (_jsxs("button", { className: styles.pluginButton, type: "button", title: t('sidebar.channels'), "aria-label": t('sidebar.channels'), onClick: onOpenChannels, children: [_jsx("span", { className: styles.navIcon, children: _jsx(RadioTowerIcon, { size: 16, strokeWidth: 1.2 }) }), !collapsed && _jsx("span", { children: t('sidebar.channels') })] })), primaryNavItems.has('scheduledTasks') && (_jsxs("button", { className: styles.pluginButton, type: "button", title: t('sidebar.scheduledTasks'), "aria-label": t('sidebar.scheduledTasks'), onClick: onOpenScheduledTasks, children: [_jsx("span", { className: styles.navIcon, children: _jsx(CalendarClockIcon, { size: 16, strokeWidth: 1.2 }) }), !collapsed && _jsx("span", { children: t('sidebar.scheduledTasks') })] })), primaryNavItems.has('goals') && (_jsxs("button", { className: styles.pluginButton, type: "button", title: t('sidebar.goals'), "aria-label": t('sidebar.goals'), onClick: onOpenGoals, children: [_jsx("span", { className: styles.navIcon, children: _jsx(TargetIcon, { size: 16, strokeWidth: 1.2 }) }), !collapsed && _jsx("span", { children: t('sidebar.goals') })] })), primaryNavOptions?.render?.()] }), _jsx("div", { className: styles.body, children: _jsxs("div", { className: styles.sessionList, children: [!collapsed && sourceMetadataEnabled && (_jsx(Tabs, { className: "px-2 pb-2", value: sessionSource, onValueChange: (value) => setSessionSource(value), children: _jsxs(TabsList, { className: "w-full", "aria-label": t('sidebar.sessionSource'), children: [_jsxs(TabsTrigger, { value: "default", children: [_jsx(ListTodoIcon, {}), t('sidebar.sessionSource.tasks')] }), _jsxs(TabsTrigger, { value: "channel", children: [_jsx(MessageCircleIcon, {}), t('sidebar.sessionSource.channels')] })] }) })), !collapsed &&
                                selectedSessionSource !== 'channel' &&
                                pinnedSessions.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.projectsHeader, children: _jsxs("button", { className: styles.projectsHeaderToggle, type: "button", "aria-expanded": pinnedExpanded, onClick: () => setPinnedExpanded((expanded) => !expanded), children: [_jsx("span", { children: t('sidebar.pinnedSessions') }), _jsx(IconChevron, { expanded: pinnedExpanded })] }) }), pinnedExpanded && (_jsx("div", { className: styles.pinnedSessionList, children: pinnedSessions.map((session) => renderSessionRow(session, {
                                            readOnly: isActiveSessionReadOnly(session),
                                        })) }))] })), !collapsed &&
                                liveWorkspaces.map((ws) => (_jsx(WorkspaceSection, { workspace: ws, renderHeader: (expanded) => (_jsxs(_Fragment, { children: [_jsx(RadioTowerIcon, { size: 16, strokeWidth: 1.2, "aria-hidden": "true" }), _jsx("span", { className: styles.liveWorkspaceLabel, children: t('sidebar.live') }), expanded ? (_jsx(ChevronDownIcon, { size: 15, strokeWidth: 1.8, "aria-hidden": "true" })) : (_jsx(ChevronRightIcon, { size: 15, strokeWidth: 1.8, "aria-hidden": "true" }))] })), client: workspace.client, reloadToken: workspaceSessionsReloadToken, untrustedLabel: t('sidebar.workspaceUntrusted'), readOnlyLabel: t('sidebar.workspaceReadOnly'), trustToOpenLabel: t('sidebar.workspaceTrustToOpen'), noSessionsLabel: t('sidebar.noSessions'), loadErrorLabel: t('sidebar.loadFailed'), organizationEnabled: false, sourceType: selectedSessionSource, channelGroupingEnabled: channelGroupingEnabled, ungroupedLabel: t('sidebar.groupUngrouped'), formatTime: (iso) => formatRelativeTime(iso, t), autoExpandKey: autoExpandWorkspace?.id === ws.id
                                        ? autoExpandWorkspace.key
                                        : undefined, renderSession: (session) => renderSessionRow({ ...session, workspaceCwd: ws.cwd }, {
                                        readOnly: isActiveSessionReadOnly({
                                            ...session,
                                            workspaceCwd: ws.cwd,
                                        }),
                                    }) }, ws.id))), !collapsed && !hideProjectHeader && (_jsxs("div", { className: styles.projectsHeader, children: [_jsxs("button", { className: styles.projectsHeaderToggle, type: "button", "aria-expanded": projectsExpanded, onClick: () => setProjectsExpanded((expanded) => !expanded), children: [_jsx("span", { children: t('sidebar.project') }), _jsx(IconChevron, { expanded: projectsExpanded })] }), _jsxs("div", { className: styles.projectsHeaderActions, children: [_jsx("button", { className: styles.projectsHeaderAction, type: "button", title: t('sidebar.search'), "aria-label": t('sidebar.search'), onClick: () => {
                                                    setSearchOpen((open) => {
                                                        if (open)
                                                            setSearchQuery('');
                                                        return !open;
                                                    });
                                                    setProjectsExpanded(true);
                                                }, children: _jsx(SearchIcon, {}) }), !lockedWorkspaceCwd && onOpenAddWorkspace && (_jsx("button", { className: styles.projectsHeaderAction, type: "button", title: t('sidebar.addWorkspace'), "aria-label": t('sidebar.addWorkspace'), onClick: onOpenAddWorkspace, children: _jsx(PlusIcon, {}) }))] })] })), searchOpen && !collapsed && !hideProjectHeader && (_jsxs("div", { className: styles.projectSearch, children: [_jsx(SearchIcon, { "aria-hidden": "true" }), _jsx(Input, { value: searchQuery, placeholder: t('sidebar.searchPlaceholder'), "aria-label": t('sidebar.search'), autoFocus: true, onChange: (event) => setSearchQuery(event.target.value), onKeyDown: (event) => {
                                            if (event.key === 'Escape') {
                                                setSearchQuery('');
                                                setSearchOpen(false);
                                            }
                                        } })] })), (collapsed || projectsExpanded) && (_jsx(_Fragment, { children: !collapsed && (_jsx("div", { className: styles.workspacePicker, children: _jsx("div", { className: styles.workspaceList, children: projectWorkspaces.map((ws) => (_jsxs(Fragment, { children: [_jsx(WorkspaceSection, { workspace: ws, renderHeader: lockedWorkspaceCwd &&
                                                        lockedWorkspaceOptions?.render
                                                        ? (expanded) => lockedWorkspaceOptions.render?.(ws, {
                                                            expanded,
                                                        })
                                                        : undefined, client: workspace.client, reloadToken: workspaceSessionsReloadToken, untrustedLabel: t('sidebar.workspaceUntrusted'), readOnlyLabel: t('sidebar.workspaceReadOnly'), trustToOpenLabel: t('sidebar.workspaceTrustToOpen'), noSessionsLabel: t('sidebar.noSessions'), loadErrorLabel: t('sidebar.loadFailed'), organizationEnabled: organizationEnabled, sourceType: selectedSessionSource, channelGroupingEnabled: channelGroupingEnabled, ungroupedLabel: t('sidebar.groupUngrouped'), onRenameGroup: canOrganizeWorkspace(ws.cwd)
                                                        ? handleRenameGroup
                                                        : undefined, onDeleteGroup: canOrganizeWorkspace(ws.cwd)
                                                        ? handleDeleteGroup
                                                        : undefined, renameGroupLabel: t('sidebar.groupRename'), deleteGroupLabel: t('sidebar.groupDelete'), groupActionsDisabled: groupBusy, excludePinned: selectedSessionSource !== 'channel', onOpenGitDiff: onOpenGitDiff, onOpenCommit: onOpenCommit, formatTime: (iso) => formatRelativeTime(iso, t), searchQuery: searchQuery, expanded: ws.primary ? projectExpanded : undefined, autoExpandKey: autoExpandWorkspace?.id === ws.id
                                                        ? autoExpandWorkspace?.key
                                                        : undefined, onExpandedChange: ws.primary ? setProjectExpanded : undefined, renderSessions: !ws.primary, renderSession: (session) => renderSessionRow({
                                                        ...session,
                                                        workspaceCwd: ws.cwd,
                                                    }, {
                                                        readOnly: isActiveSessionReadOnly({
                                                            ...session,
                                                            workspaceCwd: ws.cwd,
                                                        }),
                                                    }), headerActions: (visible) => {
                                                        if (lockedWorkspaceCwd &&
                                                            lockedWorkspaceOptions?.render) {
                                                            return null;
                                                        }
                                                        const canRemove = !lockedWorkspaceCwd &&
                                                            workspaceRemovalEnabled &&
                                                            !ws.primary &&
                                                            ws.removable === true;
                                                        if (!ws.trusted && !canRemove)
                                                            return null;
                                                        const wsCwd = ws.primary ? undefined : ws.cwd;
                                                        return (_jsxs("div", { className: styles.workspaceHeaderActions, style: {
                                                                visibility: visible ? 'visible' : 'hidden',
                                                            }, children: [ws.trusted && (_jsxs(_Fragment, { children: [canOrganizeWorkspace(ws.cwd) && (_jsx("button", { className: styles.workspaceHeaderAction, type: "button", "aria-label": t('sidebar.groupCreate'), onClick: (event) => {
                                                                                event.preventDefault();
                                                                                event.stopPropagation();
                                                                                if (ws.primary) {
                                                                                    handleCreateGroup();
                                                                                }
                                                                                else {
                                                                                    handleCreateWorkspaceGroup(ws.cwd);
                                                                                }
                                                                            }, children: _jsx(PlusIcon, { size: 16, strokeWidth: 1.2 }) })), _jsx("button", { className: styles.workspaceHeaderAction, type: "button", title: t('sidebar.newTask'), "aria-label": t('sidebar.newTask'), onClick: (event) => {
                                                                                event.preventDefault();
                                                                                event.stopPropagation();
                                                                                handleNewSession(wsCwd);
                                                                            }, children: _jsx(SquarePenIcon, { size: 16, strokeWidth: 1.2 }) })] })), canRemove && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("button", { className: styles.workspaceHeaderAction, type: "button", "aria-label": t('sidebar.workspaceActions'), disabled: workspaceRemovalSubmitting &&
                                                                                    workspaceRemovalCandidate?.id ===
                                                                                        ws.id, children: _jsx(EllipsisVerticalIcon, { size: 16, strokeWidth: 1.2 }) }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-auto min-w-40", children: _jsxs(DropdownMenuItem, { variant: "destructive", "aria-label": `${t('sidebar.removeWorkspace')}: ${ws.cwd}`, onSelect: () => requestWorkspaceRemoval(ws), children: [_jsx(Trash2Icon, {}), t('sidebar.removeWorkspace')] }) })] }))] }));
                                                    } }), ws.primary &&
                                                    (projectExpanded || searchQuery.trim()) ? (_jsx("div", { className: styles.workspaceSessionBody, children: body })) : null] }, ws.id))) }) })) })), archivedSection] }) }), footer !== false && (_jsxs("div", { className: cx(styles.footer, footerCompact && styles.footerCompact, footerTight && styles.footerTight), children: [_jsxs("div", { className: styles.footerPrimary, children: [footer && typeof footer === 'object' && footer.render?.(), footerItems.has('settings') && (_jsxs("button", { className: styles.footerButton, type: "button", title: t('sidebar.settings'), "aria-label": t('sidebar.settings'), onClick: onOpenSettings, children: [_jsx("span", { className: `${styles.navIcon} ${styles.settingsIcon}`, children: _jsx(SettingsIcon, { size: 16, strokeWidth: 1.2 }) }), !collapsed && !footerCompact && (_jsx("span", { className: styles.footerButtonLabel, children: t('sidebar.settings') }))] })), !collapsed &&
                                    !footerTight &&
                                    versionLabel &&
                                    footerItems.has('version') && (_jsx("span", { className: styles.version, title: `Qwen Code ${versionLabel}`, children: versionLabel }))] }), _jsxs("div", { className: styles.footerActions, children: [footerItems.has('theme') && (_jsx("button", { className: styles.collapseButton, type: "button", title: theme === WebShellThemeId.Dark
                                        ? t('sidebar.themeLight')
                                        : t('sidebar.themeDark'), "aria-label": theme === WebShellThemeId.Dark
                                        ? t('sidebar.themeLight')
                                        : t('sidebar.themeDark'), onClick: () => onThemeChange(theme === WebShellThemeId.Dark
                                        ? WebShellThemeId.Light
                                        : WebShellThemeId.Dark), children: theme === WebShellThemeId.Dark ? (_jsx(SunIcon, { size: 16, strokeWidth: 1.2 })) : (_jsx(MoonIcon, { size: 16, strokeWidth: 1.2 })) })), canOpenSessionsOverview &&
                                    footerItems.has('sessionsOverview') && (_jsx("button", { className: styles.collapseButton, type: "button", title: t('sidebar.sessionsOverview'), "aria-label": t('sidebar.sessionsOverview'), onClick: onOpenSessions, children: _jsx(LayoutGridIcon, { size: 16, strokeWidth: 1.2 }) })), canOpenSplitView && footerItems.has('splitView') && (_jsx("button", { className: styles.collapseButton, type: "button", title: t('sidebar.splitView'), "aria-label": t('sidebar.splitView'), onClick: onOpenSplitView, children: _jsx(Columns2Icon, { size: 16, strokeWidth: 1.2 }) })), footerItems.has('daemonStatus') && (_jsx("button", { className: styles.collapseButton, type: "button", title: t('sidebar.daemonStatus'), "aria-label": t('sidebar.daemonStatus'), onClick: onOpenDaemonStatus, children: _jsx(ActivityIcon, { size: 16, strokeWidth: 1.2 }) })), !mobileOpen && footerItems.has('collapse') && (_jsx("button", { className: styles.collapseButton, type: "button", title: collapsed ? t('sidebar.expand') : t('sidebar.collapse'), "aria-label": collapsed ? t('sidebar.expand') : t('sidebar.collapse'), onClick: () => onCollapsedChange(!collapsed), children: collapsed ? (_jsx(PanelLeftOpenIcon, { size: 16, strokeWidth: 1.2 })) : (_jsx(PanelLeftCloseIcon, { size: 16, strokeWidth: 1.2 })) }))] })] })), _jsx("div", { className: styles.resizeHandle, role: "separator", "aria-orientation": "vertical", onPointerDown: handleResizePointerDown })] }) }));
}
//# sourceMappingURL=WebShellSidebar.js.map