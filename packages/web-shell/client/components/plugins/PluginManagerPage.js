import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useCallback, useMemo, useState } from 'react';
import { SearchIcon, ServerIcon } from 'lucide-react';
import { AgentsManagerPage } from '../agents/AgentsManagerPage';
import { ExtensionsManagerPage } from '../extensions/ExtensionsManagerPage';
import { McpManagerPage } from '../mcp/McpManagerPage';
import { SkillsManagerPage } from '../skills/SkillsManagerPage';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../ui/empty';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useI18n } from '../../i18n';
export function PluginManagerPage({
  mcpMessage,
  loadMcpMessage,
  onClose,
  onUseSkill,
  initialFocusRef,
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('extensions');
  const [detailOpen, setDetailOpen] = useState(false);
  const [pageRevision, setPageRevision] = useState(0);
  const [mcpLoaded, setMcpLoaded] = useState(false);
  const [mcpLoadError, setMcpLoadError] = useState(null);
  const loadMcp = useCallback(() => {
    setMcpLoaded(false);
    setMcpLoadError(null);
    void loadMcpMessage()
      .then(() => setMcpLoaded(true))
      .catch((error) => {
        setMcpLoadError(error instanceof Error ? error.message : String(error));
      });
  }, [loadMcpMessage]);
  const resetToRoot = useCallback(() => {
    setDetailOpen(false);
    setPageRevision((revision) => revision + 1);
  }, []);
  const embedded = useMemo(
    () => ({ onRoot: resetToRoot, onDetailChange: setDetailOpen }),
    [resetToRoot],
  );
  const handleTabChange = (value) => {
    const nextTab = value;
    setActiveTab(nextTab);
    setDetailOpen(false);
    setPageRevision((revision) => revision + 1);
    if (nextTab === 'mcp') {
      loadMcp();
    }
  };
  return _jsxs(Tabs, {
    value: activeTab,
    onValueChange: handleTabChange,
    className: 'w-full',
    children: [
      !detailOpen
        ? _jsx('div', {
            className:
              'sticky -top-4 z-10 -mx-5 -mt-4 border-b bg-background px-5 py-3',
            children: _jsxs(TabsList, {
              className: 'h-8',
              'aria-label': t('plugins.sections'),
              children: [
                _jsx(TabsTrigger, {
                  ref: initialFocusRef,
                  value: 'extensions',
                  children: t('plugins.extensions'),
                }),
                _jsx(TabsTrigger, { value: 'mcp', children: t('plugins.mcp') }),
                _jsx(TabsTrigger, {
                  value: 'skills',
                  children: t('plugins.skills'),
                }),
                _jsx(TabsTrigger, {
                  value: 'agents',
                  children: t('plugins.agents'),
                }),
              ],
            }),
          })
        : null,
      _jsx(TabsContent, {
        value: activeTab,
        className: 'mt-0',
        children:
          activeTab === 'extensions'
            ? _jsx(
                ExtensionsManagerPage,
                { onClose: onClose, embedded: embedded },
                `extensions-${pageRevision}`,
              )
            : activeTab === 'skills'
              ? _jsx(
                  SkillsManagerPage,
                  {
                    onClose: onClose,
                    onUseSkill: onUseSkill,
                    embedded: embedded,
                  },
                  `skills-${pageRevision}`,
                )
              : activeTab === 'agents'
                ? _jsx(
                    AgentsManagerPage,
                    { onClose: onClose, embedded: embedded },
                    `agents-${pageRevision}`,
                  )
                : mcpLoadError
                  ? _jsxs(Alert, {
                      variant: 'destructive',
                      className: 'mt-4',
                      children: [
                        _jsx(AlertTitle, {
                          children: t('plugins.mcpLoadFailed'),
                        }),
                        _jsxs(AlertDescription, {
                          className: 'space-y-3',
                          children: [
                            _jsx('p', { children: mcpLoadError }),
                            _jsx(Button, {
                              variant: 'outline',
                              size: 'sm',
                              onClick: loadMcp,
                              children: t('common.retry'),
                            }),
                          ],
                        }),
                      ],
                    })
                  : mcpMessage && mcpLoaded
                    ? _jsx(
                        McpManagerPage,
                        {
                          message: mcpMessage,
                          onClose: onClose,
                          embedded: embedded,
                        },
                        `mcp-${pageRevision}`,
                      )
                    : _jsxs('div', {
                        className: 'flex w-full flex-col gap-6 pb-8 pt-4',
                        children: [
                          _jsxs('div', {
                            className: 'relative',
                            children: [
                              _jsx(SearchIcon, {
                                className:
                                  'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
                              }),
                              _jsx(Input, {
                                'aria-label': t('common.search'),
                                readOnly: true,
                                className: 'pl-9',
                                placeholder: `${t('common.search')} MCP…`,
                              }),
                            ],
                          }),
                          _jsx(Empty, {
                            className: 'border',
                            children: _jsxs(EmptyHeader, {
                              children: [
                                _jsx(EmptyMedia, {
                                  variant: 'icon',
                                  children: _jsx(ServerIcon, {}),
                                }),
                                _jsx(EmptyTitle, { children: t('mcp.empty') }),
                                _jsx(EmptyDescription, {
                                  children: t('mcp.emptyDescription'),
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
      }),
    ],
  });
}
//# sourceMappingURL=PluginManagerPage.js.map
