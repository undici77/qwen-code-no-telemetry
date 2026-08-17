import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from 'react/jsx-runtime';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStatusReport } from '@qwen-code/webui/daemon-react-sdk';
import { useI18n } from '../../i18n';
import { ErrorBoundary } from '../ErrorBoundary';
import { SvgLineChart } from './SvgLineChart';
import { UsageDashboardTab } from './UsageDashboardTab';
import styles from './DaemonStatusDialog.module.css';
// The cheap in-memory summary is polled continuously; the expensive detail
// (per-session, workspace diagnostics, auth — the daemon may spawn the ACP
// child and aggregate several diagnostic surfaces to build it) is fetched only
// on open and on an explicit refresh, so parking the dialog open never rehits
// that path. Both surface as one dashboard: the summary/full split is a daemon
// cost boundary, not something the operator should have to think about.
const REFRESH_INTERVAL_MS = 5000;
const DAEMON_TABS = [
  { id: 'overview', labelKey: 'daemon.tab.overview' },
  { id: 'usage', labelKey: 'daemon.tab.usage' },
  { id: 'metrics', labelKey: 'daemon.tab.metrics' },
  { id: 'diagnostics', labelKey: 'daemon.tab.diagnostics' },
];
function formatUptime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
function formatDurationMs(ms) {
  ms = Math.max(0, ms); // clamp clock-skew negatives to a "0ms" contract
  if (ms >= 60_000) return formatUptime(ms);
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1)}s`;
  return `${ms}ms`;
}
function formatBytes(bytes) {
  // Adaptive unit: sub-MB windows (idle-pipe keep-alive traffic) would read a
  // misleading "0.0 MB", so drop to KB/B and show a nonzero value. RSS/heap are
  // always ≥ 1 MB, so those charts stay in MB/GB unchanged.
  const kb = bytes / 1024;
  if (kb < 1) return `${Math.round(bytes)} B`;
  const mb = kb / 1024;
  if (mb < 1) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}
// Compact counts for chart peaks/current values: thousands collapse to "12.3k"
// so token burn and request counts stay legible in the narrow legend.
function formatCount(value) {
  const n = Math.round(value);
  if (n >= 10_000) {
    return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return n.toLocaleString();
}
function formatPercent(value) {
  return `${value.toFixed(value >= 100 || value === 0 ? 0 : 1)}%`;
}
function channelWorkerState(worker) {
  if (worker.exitCode != null) {
    return `${worker.state} (exit ${worker.exitCode})`;
  }
  if (worker.signal) return `${worker.state} (${worker.signal})`;
  return worker.state;
}
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
// A section's status is the worst of its individual checks, but the summary
// chips only carry counts — so a "warning preflight" reads as opaque. Pull the
// individual warning/error entries out of the raw section data so the dashboard
// can say *what* is wrong (e.g. "auth: No auth method configured"). Section
// payloads differ but consistently carry status cells under these keys.
const SECTION_CELL_KEYS = [
  'cells',
  'servers',
  'errors',
  'skills',
  'tools',
  'providers',
  'hooks',
  'extensions',
  'budgets',
];
function extractProblemCells(data) {
  if (!isRecord(data)) return [];
  const problems = [];
  for (const key of SECTION_CELL_KEYS) {
    const arr = data[key];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!isRecord(item)) continue;
      const status = item['status'];
      if (status !== 'warning' && status !== 'error') continue;
      const label = String(
        item['kind'] ?? item['name'] ?? item['serverName'] ?? key,
      );
      const message =
        typeof item['error'] === 'string'
          ? item['error']
          : typeof item['hint'] === 'string'
            ? item['hint']
            : undefined;
      problems.push({ label, status, message });
    }
  }
  return problems;
}
function levelClass(level) {
  switch (level) {
    case 'ok':
      return styles.levelOk;
    case 'warning':
      return styles.levelWarning;
    case 'error':
      return styles.levelError;
    default:
      return styles.levelUnavailable;
  }
}
function Row({ label, value }) {
  return _jsxs('div', {
    className: styles.row,
    children: [
      _jsx('span', { className: styles.rowLabel, children: label }),
      _jsx('span', { className: styles.rowValue, children: value }),
    ],
  });
}
// Self-documenting metric: an ⓘ affordance next to a chart title whose hover /
// focus reveals a plain-language explanation (what it measures, its unit, and
// what's normal). The button's `aria-label` carries the text to assistive tech,
// so the visual bubble is `aria-hidden` to avoid a double read. Purpose: cut the
// "what does this mean / why two 'errors'?" support questions the dense metrics
// tab otherwise generates.
function InfoHint({ text }) {
  return _jsxs('span', {
    className: styles.infoHint,
    children: [
      _jsx('button', {
        type: 'button',
        className: styles.infoHintButton,
        'aria-label': text,
        children: _jsx('span', { 'aria-hidden': 'true', children: '\u24D8' }),
      }),
      _jsx('span', {
        'aria-hidden': 'true',
        className: styles.infoHintTip,
        children: text,
      }),
    ],
  });
}
function Card({ title, help, children }) {
  return _jsxs('section', {
    className: styles.card,
    children: [
      help
        ? _jsxs('div', {
            className: styles.cardHeader,
            children: [
              _jsx('h3', { className: styles.cardTitle, children: title }),
              _jsx(InfoHint, { text: help }),
            ],
          })
        : _jsx('h3', { className: styles.cardTitle, children: title }),
      children,
    ],
  });
}
function WorkspaceSectionRow({ name, section }) {
  const { t } = useI18n();
  const summaryEntries = Object.entries(section.summary ?? {});
  const problemCells = extractProblemCells(section.data);
  return _jsxs('div', {
    className: styles.workspaceRow,
    children: [
      _jsxs('div', {
        className: styles.workspaceRowHead,
        children: [
          _jsx('span', {
            className: `${styles.badge} ${levelClass(section.status)}`,
            children: t(`daemon.level.${section.status}`),
          }),
          _jsx('span', { className: styles.workspaceName, children: name }),
          _jsx('span', {
            className: styles.workspaceDuration,
            children: formatDurationMs(section.durationMs),
          }),
        ],
      }),
      section.error &&
        _jsx('div', {
          className: styles.workspaceError,
          children: section.error.message,
        }),
      problemCells.map((cell, index) =>
        _jsxs(
          'div',
          {
            className: styles.workspaceCell,
            children: [
              _jsx('span', {
                className: `${styles.badge} ${levelClass(cell.status)}`,
                children: t(`daemon.level.${cell.status}`),
              }),
              _jsx('span', {
                className: styles.workspaceCellLabel,
                children: cell.label,
              }),
              cell.message &&
                _jsx('span', {
                  className: styles.workspaceCellMessage,
                  children: cell.message,
                }),
            ],
          },
          `${cell.label}-${index}`,
        ),
      ),
      summaryEntries.length > 0 &&
        _jsx('div', {
          className: styles.workspaceSummary,
          children: summaryEntries.map(([key, value]) =>
            _jsxs(
              'span',
              {
                className: styles.summaryChip,
                children: [
                  key,
                  ': ',
                  value === null ? t('common.na') : String(value),
                ],
              },
              key,
            ),
          ),
        }),
    ],
  });
}
function FullDetail({ report }) {
  const { t } = useI18n();
  const full = report.full;
  if (!full) return null;
  const workspaceEntries = Object.entries(full.workspace).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return _jsxs(_Fragment, {
    children: [
      _jsx(Card, {
        title: t('daemon.full.sessions.title'),
        children:
          full.sessions.length === 0
            ? _jsx('div', {
                className: styles.empty,
                children: t('daemon.full.sessions.empty'),
              })
            : full.sessions.map((session) =>
                _jsxs(
                  'div',
                  {
                    className: styles.sessionRow,
                    children: [
                      _jsx('div', {
                        className: styles.sessionName,
                        children: session.displayName || session.sessionId,
                      }),
                      _jsxs('div', {
                        className: styles.sessionMeta,
                        children: [
                          _jsx('span', {
                            children: t('common.clients', {
                              count: session.clientCount,
                            }),
                          }),
                          _jsx('span', {
                            children: t('daemon.full.session.pendingPrompts', {
                              count: session.pendingPromptCount,
                            }),
                          }),
                          _jsx('span', {
                            children: t(
                              'daemon.full.session.pendingPermissions',
                              {
                                count: session.pendingPermissionCount,
                              },
                            ),
                          }),
                          session.hasActivePrompt &&
                            _jsx('span', {
                              className: styles.activePrompt,
                              children: t('daemon.full.session.prompting'),
                            }),
                        ],
                      }),
                    ],
                  },
                  session.sessionId,
                ),
              ),
      }),
      _jsx(Card, {
        title: t('daemon.full.workspace.title'),
        children:
          workspaceEntries.length === 0
            ? _jsx('div', {
                className: styles.empty,
                children: t('daemon.full.workspace.empty'),
              })
            : workspaceEntries.map(([name, section]) =>
                _jsx(
                  WorkspaceSectionRow,
                  { name: name, section: section },
                  name,
                ),
              ),
      }),
      _jsxs(Card, {
        title: t('daemon.full.auth.title'),
        children: [
          _jsx(Row, {
            label: t('daemon.full.auth.providers'),
            value:
              full.auth.supportedDeviceFlowProviders.join(', ') ||
              t('daemon.none'),
          }),
          _jsx(Row, {
            label: t('daemon.full.auth.pending'),
            value: full.auth.pendingDeviceFlowCount,
          }),
          _jsx(Row, {
            label: t('daemon.full.acp.title'),
            value: full.acpConnections.length,
          }),
        ],
      }),
    ],
  });
}
// Bottleneck-analysis dashboard: the daemon samples load, throughput, latency,
// resource pressure, and token burn into one time-bucketed series, so these
// charts share an x-axis. Lining up "N tasks running at once" (concurrency)
// against event-loop lag, queue wait, memory, and API latency shows *where* a
// busy daemon is actually stalling.
function MetricsCharts({ series }) {
  const { t } = useI18n();
  if (series.length === 0) {
    return _jsx(Card, {
      title: t('daemon.charts.title'),
      children: _jsx('div', {
        className: styles.empty,
        children: t('daemon.charts.empty'),
      }),
    });
  }
  const col = (pick) => series.map(pick);
  // Bucket timestamps drive the hover tooltip's time header.
  const times = series.map((b) => b.t);
  const chart = (titleKey, format, lines, helpKey) =>
    _jsx(Card, {
      title: t(titleKey),
      help: t(helpKey),
      children: _jsx(SvgLineChart, {
        series: lines,
        timestamps: times,
        format: format,
        ariaLabel: t(titleKey),
        peakLabel: t('daemon.charts.peak'),
      }),
    });
  return _jsxs('div', {
    className: `${styles.grid} ${styles.chartsGrid}`,
    children: [
      chart(
        'daemon.charts.concurrency',
        formatCount,
        [
          {
            label: t('daemon.charts.activePrompts'),
            values: col((b) => b.activePrompts),
            color: 'var(--primary)',
          },
          {
            label: t('daemon.charts.queuedPrompts'),
            values: col((b) => b.queuedPrompts),
            color: 'var(--warning-color)',
          },
          {
            label: t('daemon.charts.activeSessions'),
            values: col((b) => b.activeSessions),
            color: 'var(--muted-foreground)',
          },
        ],
        'daemon.charts.concurrency.help',
      ),
      chart(
        'daemon.charts.requests',
        formatCount,
        [
          {
            label: t('daemon.charts.reqTotal'),
            values: col((b) => b.requests),
            color: 'var(--success-color)',
          },
          {
            label: t('daemon.charts.reqErrors'),
            values: col((b) => b.errors),
            color: 'var(--error-color)',
          },
          {
            label: t('daemon.charts.reqRejected'),
            values: col((b) => b.rateLimitRejected),
            color: 'var(--warning-color)',
          },
        ],
        'daemon.charts.requests.help',
      ),
      chart(
        'daemon.charts.apiLatency',
        formatDurationMs,
        [
          {
            label: 'p50',
            values: col((b) => b.latencyP50Ms),
            color: 'var(--agent-blue-400)',
          },
          {
            label: 'p95',
            values: col((b) => b.latencyP95Ms),
            color: 'var(--warning-color)',
          },
        ],
        'daemon.charts.apiLatency.help',
      ),
      chart(
        'daemon.charts.llmLatency',
        formatDurationMs,
        [
          {
            label: 'p50',
            values: col((b) => b.llmApiP50Ms),
            color: 'var(--agent-blue-400)',
          },
          {
            label: 'p95',
            values: col((b) => b.llmApiP95Ms),
            color: 'var(--primary)',
          },
        ],
        'daemon.charts.llmLatency.help',
      ),
      chart(
        'daemon.charts.apiHealth',
        formatCount,
        [
          {
            label: t('daemon.charts.apiErrors'),
            values: col((b) => b.llmApiErrors ?? 0),
            color: 'var(--error-color)',
          },
          {
            label: t('daemon.charts.apiRetries'),
            values: col((b) => b.llmApiRetries ?? 0),
            color: 'var(--warning-color)',
          },
        ],
        'daemon.charts.apiHealth.help',
      ),
      chart(
        'daemon.charts.promptLatency',
        formatDurationMs,
        [
          {
            label: t('daemon.charts.queueWait'),
            values: col((b) => b.promptQueueWaitP95Ms),
            color: 'var(--warning-color)',
          },
          {
            label: t('daemon.charts.promptDuration'),
            values: col((b) => b.promptDurationP95Ms),
            color: 'var(--primary)',
          },
        ],
        'daemon.charts.promptLatency.help',
      ),
      chart(
        'daemon.charts.eventLoop',
        formatDurationMs,
        [
          {
            label: t('daemon.charts.eventLoopLag'),
            values: col((b) => b.eventLoopLagP99Ms),
            color: 'var(--error-color)',
          },
        ],
        'daemon.charts.eventLoop.help',
      ),
      chart(
        'daemon.charts.cpu',
        formatPercent,
        [
          {
            label: t('daemon.charts.cpuDaemon'),
            values: col((b) => b.cpuPercent),
            color: 'var(--muted-foreground)',
          },
          {
            label: t('daemon.charts.cpuChild'),
            values: col((b) => b.childCpuPercent),
            color: 'var(--primary)',
          },
        ],
        'daemon.charts.cpu.help',
      ),
      chart(
        'daemon.charts.memory',
        formatBytes,
        [
          {
            label: t('daemon.charts.rssDaemon'),
            values: col((b) => b.rssBytes),
            color: 'var(--muted-foreground)',
          },
          {
            label: t('daemon.charts.heap'),
            values: col((b) => b.heapUsedBytes),
            color: 'var(--agent-blue-400)',
          },
          {
            label: t('daemon.charts.rssChild'),
            values: col((b) => b.childRssBytes),
            color: 'var(--primary)',
          },
        ],
        'daemon.charts.memory.help',
      ),
      chart(
        'daemon.charts.pipe',
        formatBytes,
        [
          {
            label: t('daemon.charts.pipeIn'),
            values: col((b) => b.pipeInBytes),
            color: 'var(--agent-blue-400)',
          },
          {
            label: t('daemon.charts.pipeOut'),
            values: col((b) => b.pipeOutBytes),
            color: 'var(--success-color)',
          },
        ],
        'daemon.charts.pipe.help',
      ),
      chart(
        'daemon.charts.connections',
        formatCount,
        [
          {
            label: 'SSE',
            values: col((b) => b.sseConnections),
            color: 'var(--primary)',
          },
          {
            label: 'WS',
            values: col((b) => b.wsConnections),
            color: 'var(--agent-blue-400)',
          },
          {
            label: 'ACP',
            values: col((b) => b.acpConnections),
            color: 'var(--muted-foreground)',
          },
        ],
        'daemon.charts.connections.help',
      ),
      chart(
        'daemon.charts.tokens',
        formatCount,
        [
          {
            label: t('daemon.charts.tokensIn'),
            values: col((b) => b.tokensIn),
            color: 'var(--agent-blue-400)',
          },
          {
            label: t('daemon.charts.tokensOut'),
            values: col((b) => b.tokensOut),
            color: 'var(--success-color)',
          },
        ],
        'daemon.charts.tokens.help',
      ),
    ],
  });
}
function DaemonStatusDialogInner() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  // WAI-ARIA tabs keyboard support: roving tabindex (only the active tab is in
  // the tab order) + Arrow/Home/End moving focus and selection across the
  // tablist, so keyboard-only users can switch tabs without tabbing through all
  // the panel content in between.
  const tabRefs = useRef([]);
  const handleTabKeyDown = (e, index) => {
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      next = (index + 1) % DAEMON_TABS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      next = (index - 1 + DAEMON_TABS.length) % DAEMON_TABS.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = DAEMON_TABS.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    setActiveTab(DAEMON_TABS[next].id);
    tabRefs.current[next]?.focus();
  };
  // Two independent fetches: the summary drives the always-live top cards and
  // rides the auto-refresh interval; the full report backs the detail sections
  // and is only pulled on open (autoLoad) and on manual refresh.
  const summary = useStatusReport({ autoLoad: true, detail: 'summary' });
  const full = useStatusReport({ autoLoad: true, detail: 'full' });
  // `reload` is a stable callback; depend on it (not the hook object, which is
  // a fresh spread each render) so the poll interval is installed once rather
  // than torn down and reinstalled on every data update.
  const summaryReload = summary.reload;
  const fullReload = full.reload;
  // Skip a tick when the tab is backgrounded (matching the sidebar poll) or
  // when the previous poll is still outstanding: useDaemonResource discards
  // stale completions but does not abort, and the client timeout is 30s, so a
  // degraded daemon could otherwise accumulate overlapping calls.
  const summaryPollInFlightRef = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.hidden || summaryPollInFlightRef.current) return;
      summaryPollInFlightRef.current = true;
      void summaryReload().finally(() => {
        summaryPollInFlightRef.current = false;
      });
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [summaryReload]);
  const refreshAll = useCallback(() => {
    void summaryReload();
    void fullReload();
  }, [summaryReload, fullReload]);
  // Prefer the continuously-refreshed summary for the top cards; fall back to
  // the full report so the dashboard still renders if only that has landed.
  const report = summary.report ?? full.report;
  const fullReport = full.report;
  const loading = summary.loading || full.loading;
  const error = summary.error ?? full.error;
  if (!report) {
    return _jsx('div', {
      className: styles.dialog,
      children: _jsx('div', {
        className: styles.empty,
        children: error
          ? `${t('daemon.loadFailed')}: ${error.message}`
          : t('daemon.loading'),
      }),
    });
  }
  // The daemon only appends workspace/preflight/MCP issues (and rolls them into
  // `status`) for detail=full, so the summary can read "ok" with an empty issue
  // list while a loaded full report is failing. Drive the badge and issue list
  // off the full report whenever it is available; keep the live counters on the
  // summary. The rollup then refreshes on open/manual rather than every 5s,
  // which only ever over-reports (safe) between full fetches.
  const rollupReport = fullReport ?? report;
  const { daemon, runtime, security, limits, capabilities } = report;
  const acp = runtime.transport.acp;
  const rateRejected = Object.values(
    runtime.rateLimit.rejectedSinceStart,
  ).reduce((sum, count) => sum + count, 0);
  const limitValue = (value) =>
    value === null ? t('daemon.limits.unlimited') : value;
  return _jsxs('div', {
    className: styles.dialog,
    children: [
      _jsxs('div', {
        className: styles.toolbar,
        children: [
          _jsx('span', {
            role: 'status',
            'aria-label': `${t('daemon.title')}: ${t(`daemon.level.${rollupReport.status}`)}`,
            className: `${styles.badge} ${levelClass(rollupReport.status)}`,
            children: t(`daemon.level.${rollupReport.status}`),
          }),
          _jsx('span', {
            className: styles.updatedAt,
            children: t('daemon.updatedAt', {
              time: new Date(report.generatedAt).toLocaleTimeString(),
            }),
          }),
          summary.error &&
            summary.report &&
            _jsx('span', {
              className: styles.refreshError,
              children: t('daemon.loadFailed'),
            }),
          _jsx('div', {
            className: styles.toolbarActions,
            children: _jsx('button', {
              type: 'button',
              className: styles.refreshButton,
              onClick: refreshAll,
              disabled: loading,
              children: t('daemon.refresh'),
            }),
          }),
        ],
      }),
      rollupReport.issues.length > 0 &&
        _jsx(Card, {
          title: t('daemon.issues.title'),
          children: rollupReport.issues.map((issue, index) =>
            _jsxs(
              'div',
              {
                className: styles.issueRow,
                children: [
                  _jsx('span', {
                    className: `${styles.badge} ${
                      issue.severity === 'error'
                        ? styles.levelError
                        : styles.levelWarning
                    }`,
                    children:
                      issue.severity === 'error'
                        ? t('daemon.level.error')
                        : t('daemon.level.warning'),
                  }),
                  _jsx('span', {
                    className: styles.issueMessage,
                    children: issue.message,
                  }),
                ],
              },
              `${issue.code}-${index}`,
            ),
          ),
        }),
      _jsx('div', {
        className: styles.tabs,
        role: 'tablist',
        'aria-label': t('daemon.title'),
        children: DAEMON_TABS.map((tab, index) =>
          _jsx(
            'button',
            {
              ref: (el) => {
                tabRefs.current[index] = el;
              },
              type: 'button',
              role: 'tab',
              id: `daemon-tab-${tab.id}`,
              'aria-selected': tab.id === activeTab,
              'aria-controls': `daemon-tabpanel-${tab.id}`,
              tabIndex: tab.id === activeTab ? 0 : -1,
              className: `${styles.tab} ${tab.id === activeTab ? styles.tabActive : ''}`,
              onClick: () => setActiveTab(tab.id),
              onKeyDown: (e) => handleTabKeyDown(e, index),
              children: t(tab.labelKey),
            },
            tab.id,
          ),
        ),
      }),
      activeTab === 'overview' &&
        _jsxs('div', {
          role: 'tabpanel',
          id: 'daemon-tabpanel-overview',
          'aria-labelledby': 'daemon-tab-overview',
          tabIndex: 0,
          className: styles.grid,
          children: [
            _jsxs(Card, {
              title: t('daemon.overview.title'),
              children: [
                daemon.qwenCodeVersion &&
                  _jsx(Row, {
                    label: t('daemon.overview.version'),
                    value: daemon.qwenCodeVersion,
                  }),
                _jsx(Row, {
                  label: t('daemon.overview.pid'),
                  value: daemon.pid,
                }),
                _jsx(Row, {
                  label: t('daemon.overview.mode'),
                  value: daemon.mode,
                }),
                _jsx(Row, {
                  label: t('daemon.overview.uptime'),
                  value: formatUptime(daemon.uptimeMs),
                }),
                _jsxs('div', {
                  className: styles.pathRow,
                  children: [
                    _jsx('span', {
                      className: styles.rowLabel,
                      children: t('daemon.overview.workspace'),
                    }),
                    _jsx('span', {
                      className: styles.pathValue,
                      title: daemon.workspaceCwd,
                      children: _jsx('bdi', { children: daemon.workspaceCwd }),
                    }),
                  ],
                }),
              ],
            }),
            _jsxs(Card, {
              title: t('daemon.runtime.title'),
              children: [
                runtime.error
                  ? _jsxs('div', {
                      className: styles.workspaceError,
                      children: [
                        t('daemon.runtime.startFailed'),
                        ': ',
                        runtime.error,
                      ],
                    })
                  : runtime.loading
                    ? _jsx('div', {
                        className: styles.empty,
                        children: t('daemon.runtime.startingUp'),
                      })
                    : null,
                _jsx(Row, {
                  label: t('daemon.runtime.activeSessions'),
                  value: runtime.sessions.active,
                }),
                runtime.activity &&
                  _jsxs(_Fragment, {
                    children: [
                      _jsx(Row, {
                        label: t('daemon.runtime.activePrompts'),
                        value: runtime.activity.activePrompts,
                      }),
                      _jsx(Row, {
                        label: t('daemon.runtime.idle'),
                        value:
                          runtime.activity.idleSinceMs === null
                            ? t('daemon.runtime.noActivity')
                            : formatDurationMs(runtime.activity.idleSinceMs),
                      }),
                    ],
                  }),
                _jsx(Row, {
                  label: t('daemon.runtime.pendingPermissions'),
                  value: runtime.permissions.pending,
                }),
                _jsx(Row, {
                  label: t('daemon.runtime.permissionPolicy'),
                  value: runtime.permissions.policy,
                }),
                _jsx(Row, {
                  label: t('daemon.runtime.channel'),
                  value: runtime.channel.live
                    ? t('daemon.runtime.channelLive')
                    : t('daemon.runtime.channelDown'),
                }),
                runtime.channelWorker.enabled &&
                  _jsxs(_Fragment, {
                    children: [
                      _jsx(Row, {
                        label: t('daemon.runtime.channelWorker'),
                        value: channelWorkerState(runtime.channelWorker),
                      }),
                      runtime.channelWorker.error &&
                        _jsx('div', {
                          className: styles.workspaceError,
                          children: runtime.channelWorker.error,
                        }),
                      (runtime.channelWorker.restartCount ?? 0) > 0 &&
                        _jsx(Row, {
                          label: t('daemon.runtime.channelWorkerRestarts'),
                          value: runtime.channelWorker.restartCount,
                        }),
                    ],
                  }),
                _jsx(Row, {
                  label: t('daemon.runtime.memory'),
                  value: `${formatBytes(runtime.process.rss)} / ${formatBytes(runtime.process.heapUsed)}`,
                }),
              ],
            }),
            _jsxs(Card, {
              title: t('daemon.transport.title'),
              children: [
                _jsx(Row, {
                  label: t('daemon.transport.restSse'),
                  value: runtime.transport.restSseActive,
                }),
                acp.enabled
                  ? _jsxs(_Fragment, {
                      children: [
                        _jsx(Row, {
                          label: t('daemon.transport.acpConnections'),
                          value: acp.connections,
                        }),
                        _jsx(Row, {
                          label: t('daemon.transport.acpStreams'),
                          value: `${acp.sessionStreams} / ${acp.sseStreams} / ${acp.wsStreams}`,
                        }),
                        _jsx(Row, {
                          label: t('daemon.transport.pendingRequests'),
                          value: acp.pendingClientRequests,
                        }),
                      ],
                    })
                  : _jsx('div', {
                      className: styles.empty,
                      children: t('daemon.transport.acpDisabled'),
                    }),
                _jsx(Row, {
                  label: t('daemon.transport.rateLimitRejected'),
                  value: runtime.rateLimit.enabled
                    ? rateRejected
                    : t('common.disabled'),
                }),
              ],
            }),
            _jsxs(Card, {
              title: t('daemon.security.title'),
              children: [
                _jsx(Row, {
                  label: t('daemon.security.token'),
                  value: security.tokenConfigured
                    ? t('daemon.security.configured')
                    : t('daemon.security.notConfigured'),
                }),
                _jsx(Row, {
                  label: t('daemon.security.requireAuth'),
                  value: security.requireAuth
                    ? t('common.enabled')
                    : t('common.disabled'),
                }),
                _jsx(Row, {
                  label: t('daemon.security.loopback'),
                  value: security.loopbackBind
                    ? t('common.enabled')
                    : t('common.disabled'),
                }),
                _jsx(Row, {
                  label: t('daemon.security.allowOrigin'),
                  value: security.allowOriginMode,
                }),
                _jsx(Row, {
                  label: t('daemon.security.shell'),
                  value: security.sessionShellCommandEnabled
                    ? t('common.enabled')
                    : t('common.disabled'),
                }),
              ],
            }),
            _jsxs(Card, {
              title: t('daemon.limits.title'),
              children: [
                _jsx(Row, {
                  label: t('daemon.limits.maxSessions'),
                  value: limitValue(limits.maxSessions),
                }),
                _jsx(Row, {
                  label: t('daemon.limits.maxPendingPrompts'),
                  value: limitValue(limits.maxPendingPromptsPerSession),
                }),
                _jsx(Row, {
                  label: t('daemon.limits.maxConnections'),
                  value: limitValue(limits.listenerMaxConnections),
                }),
                _jsx(Row, {
                  label: t('daemon.limits.eventRing'),
                  value: limits.eventRingSize,
                }),
                _jsx(Row, {
                  label: t('daemon.limits.promptDeadline'),
                  value:
                    limits.promptDeadlineMs === null
                      ? t('daemon.limits.unlimited')
                      : formatDurationMs(limits.promptDeadlineMs),
                }),
                _jsx(Row, {
                  label: t('daemon.limits.sessionIdle'),
                  value: formatDurationMs(limits.sessionIdleTimeoutMs),
                }),
              ],
            }),
            _jsx(Card, {
              title: capabilities.features.length
                ? t('daemon.capabilities.titleCount', {
                    count: capabilities.features.length,
                  })
                : t('daemon.capabilities.title'),
              children:
                capabilities.features.length === 0
                  ? _jsx('span', {
                      className: styles.empty,
                      children: t('daemon.none'),
                    })
                  : _jsx('div', {
                      className: styles.featureChips,
                      children: [...capabilities.features]
                        .sort()
                        .map((feature) =>
                          _jsx(
                            'span',
                            {
                              className: styles.featureChip,
                              children: feature,
                            },
                            feature,
                          ),
                        ),
                    }),
            }),
          ],
        }),
      activeTab === 'usage' &&
        _jsx('div', {
          role: 'tabpanel',
          id: 'daemon-tabpanel-usage',
          'aria-labelledby': 'daemon-tab-usage',
          tabIndex: 0,
          children: _jsx(ErrorBoundary, {
            label: 'daemon-usage',
            fallback: _jsx('div', {
              className: styles.empty,
              children: t('daemon.usage.failed'),
            }),
            children: _jsx(UsageDashboardTab, {}),
          }),
        }),
      activeTab === 'metrics' &&
        _jsx('div', {
          role: 'tabpanel',
          id: 'daemon-tabpanel-metrics',
          'aria-labelledby': 'daemon-tab-metrics',
          tabIndex: 0,
          children: _jsx(MetricsCharts, {
            series: report.runtime.metrics?.series ?? [],
          }),
        }),
      activeTab === 'diagnostics' &&
        _jsx('div', {
          role: 'tabpanel',
          id: 'daemon-tabpanel-diagnostics',
          'aria-labelledby': 'daemon-tab-diagnostics',
          tabIndex: 0,
          children: _jsx(ErrorBoundary, {
            label: 'daemon-status-detail',
            fallback: _jsx('div', {
              className: styles.empty,
              children: t('daemon.details.failed'),
            }),
            children: fullReport?.full
              ? _jsx(FullDetail, { report: fullReport })
              : full.loading
                ? _jsx('div', {
                    className: styles.empty,
                    children: t('daemon.details.loading'),
                  })
                : full.error
                  ? _jsxs('div', {
                      className: styles.empty,
                      children: [
                        t('daemon.details.failed'),
                        ': ',
                        full.error.message,
                      ],
                    })
                  : // Fetch resolved but the daemon omitted the `full` section — don't
                    // hang on the loading placeholder forever.
                    _jsx('div', {
                      className: styles.empty,
                      children: t('daemon.details.failed'),
                    }),
          }),
        }),
    ],
  });
}
// A malformed or partial daemon response — most likely exactly when the daemon
// is sick and this dashboard is most needed — must not white-screen the whole
// web shell. Contain any render throw to the dialog; the function-form fallback
// surfaces the actual render error (distinct from a network failure). Because
// the parent only mounts the dialog while open, closing and re-opening remounts
// the boundary, so a transient bad payload recovers on the next open.
export function DaemonStatusDialog() {
  const { t } = useI18n();
  return _jsx(ErrorBoundary, {
    label: 'daemon-status',
    fallback: (error) =>
      _jsx('div', {
        className: styles.dialog,
        children: _jsxs('div', {
          className: styles.empty,
          children: [t('daemon.loadFailed'), ': ', error.message],
        }),
      }),
    children: _jsx(DaemonStatusDialogInner, {}),
  });
}
//# sourceMappingURL=DaemonStatusDialog.js.map
