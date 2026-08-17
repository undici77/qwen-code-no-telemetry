import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useI18n } from '../../i18n';
import { createSentinelSerializer } from '../../utils/sentinelMessage';
import styles from './StatusMessage.module.css';
const { serialize: serializeStatusMessage, parse: parseStatusMessage } =
  createSentinelSerializer('web-shell:status:v1:');
export { serializeStatusMessage, parseStatusMessage };
function Row({ label, children, gap }) {
  return _jsxs('div', {
    className: `${styles.row}${gap ? ` ${styles.rowGap}` : ''}`,
    children: [
      _jsx('span', { className: styles.label, children: label }),
      _jsx('span', { className: styles.value, children: children }),
    ],
  });
}
export function StatusMessage({ info }) {
  const { t } = useI18n();
  return _jsxs('div', {
    className: styles.panel,
    children: [
      _jsx('div', { className: styles.title, children: t('about.title') }),
      info.cliVersion &&
        _jsx(Row, {
          label: t('about.qwenCode'),
          children: _jsx('span', {
            className: styles.accent,
            children: info.cliVersion,
          }),
        }),
      info.runtime &&
        _jsx(Row, { label: t('about.runtime'), children: info.runtime }),
      info.platform &&
        _jsx(Row, { label: t('about.platform'), children: info.platform }),
      info.auth &&
        _jsx(Row, { label: t('about.auth'), gap: true, children: info.auth }),
      info.baseUrl &&
        _jsx(Row, { label: t('about.baseUrl'), children: info.baseUrl }),
      info.model &&
        _jsx(Row, { label: t('about.model'), children: info.model }),
      info.fastModel &&
        info.fastModel !== info.model &&
        _jsx(Row, { label: t('about.fastModel'), children: info.fastModel }),
      info.sessionId &&
        _jsx(Row, { label: t('about.sessionId'), children: info.sessionId }),
      _jsx(Row, {
        label: t('about.sandbox'),
        children: info.sandbox || t('about.noSandbox'),
      }),
      _jsx(Row, {
        label: t('about.proxy'),
        children: info.proxy || t('about.noProxy'),
      }),
      info.memoryUsage &&
        _jsx(Row, {
          label: t('about.memoryUsage'),
          children: info.memoryUsage,
        }),
    ],
  });
}
//# sourceMappingURL=StatusMessage.js.map
