import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { isSafeHref, Markdown } from '../messages/Markdown';
import {
  getImageMimeTypeFromPath,
  readWorkspaceFileAsBlob,
} from './artifactUtils';
import styles from './CodeReviewArtifactDetail.module.css';
// Hand-duplicated from the CLI's canonical lists in
// packages/cli/src/commands/review/findings.ts. The parser below fails closed
// on any value missing here, so when the CLI adds one, update this copy and
// the contract fixture (__fixtures__/code-review-artifact-v1.json) with it.
// The CLI-side vocabulary snapshot (packages/cli/src/commands/review/
// findings.test.ts) turns red on that change and names this file.
const SEVERITIES = ['Critical', 'Suggestion', 'Nice to have'];
const CONFIDENCES = ['high', 'low'];
const SOURCES = ['review', 'build', 'test', 'probe', 'lint'];
const OUTCOMES = ['fixed', 'skipped', 'no_change_needed'];
function object(value, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  return value;
}
function string(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string.`);
  }
  return value;
}
function optionalString(value, label) {
  if (value === undefined) return undefined;
  return string(value, label);
}
function integer(value, label) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative safe integer.`);
  }
  return value;
}
function lineNumber(value, label) {
  const line = integer(value, label);
  if (line === 0) {
    throw new Error(`${label} must be a positive safe integer.`);
  }
  return line;
}
// The one field that becomes a file read. The daemon enforces workspace
// containment, but the document's own contract is checked here like every
// other field: relative, no traversal, the durable report's extension, and
// the directory the writer guarantees — save-artifact confines its report to
// .qwen/reviews/, so the renderer never follows a report the CLI would not
// have written.
function markdownReportPath(value) {
  const path = string(value, 'markdownReportPath');
  if (
    path.startsWith('/') ||
    path.split('/').includes('..') ||
    !path.endsWith('.md')
  ) {
    throw new Error(
      'markdownReportPath must be a relative .md path without ".." segments.',
    );
  }
  if (!path.startsWith('.qwen/reviews/')) {
    throw new Error('markdownReportPath must be a file under .qwen/reviews/.');
  }
  return path;
}
function enumValue(value, allowed, label) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`${label} has an unsupported value.`);
  }
  return value;
}
function stringArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array.`);
  return value.map((entry, index) => string(entry, `${label}[${index}]`));
}
function countRecord(value, keys, label) {
  const source = object(value, label);
  return Object.fromEntries(
    keys.map((key) => [key, integer(source[key], `${label}.${key}`)]),
  );
}
function parseFinding(value, index) {
  const label = `findings[${index}]`;
  const source = object(value, label);
  if (!Array.isArray(source['locations']) || source['locations'].length === 0) {
    throw new Error(`${label}.locations must be a non-empty array.`);
  }
  const locations = source['locations'].map((entry, locationIndex) => {
    const location = object(entry, `${label}.locations[${locationIndex}]`);
    return {
      file: string(
        location['file'],
        `${label}.locations[${locationIndex}].file`,
      ),
      ...(location['line'] === undefined
        ? {}
        : {
            line: lineNumber(
              location['line'],
              `${label}.locations[${locationIndex}].line`,
            ),
          }),
      ...(optionalString(
        location['anchor'],
        `${label}.locations[${locationIndex}].anchor`,
      )
        ? { anchor: location['anchor'] }
        : {}),
    };
  });
  const outcome =
    source['outcome'] === undefined
      ? undefined
      : enumValue(source['outcome'], OUTCOMES, `${label}.outcome`);
  return {
    id: string(source['id'], `${label}.id`),
    severity: enumValue(source['severity'], SEVERITIES, `${label}.severity`),
    confidence: enumValue(
      source['confidence'],
      CONFIDENCES,
      `${label}.confidence`,
    ),
    source: enumValue(source['source'], SOURCES, `${label}.source`),
    summary: string(source['summary'], `${label}.summary`),
    shortSummary: string(source['shortSummary'], `${label}.shortSummary`),
    failureScenario: string(
      source['failureScenario'],
      `${label}.failureScenario`,
    ),
    ...(optionalString(source['suggestedFix'], `${label}.suggestedFix`)
      ? { suggestedFix: source['suggestedFix'] }
      : {}),
    ...(optionalString(source['category'], `${label}.category`)
      ? { category: source['category'] }
      : {}),
    locations,
    ...(source['assetFiles'] === undefined
      ? {}
      : {
          assetFiles: stringArray(source['assetFiles'], `${label}.assetFiles`),
        }),
    ...(source['assets'] === undefined
      ? {}
      : { assets: stringArray(source['assets'], `${label}.assets`) }),
    ...(outcome ? { outcome } : {}),
    ...(optionalString(source['outcomeNote'], `${label}.outcomeNote`)
      ? { outcomeNote: source['outcomeNote'] }
      : {}),
    ...(source['heldByMeasurement'] === undefined
      ? {}
      : {
          heldByMeasurement: {
            file: string(
              object(source['heldByMeasurement'], `${label}.heldByMeasurement`)[
                'file'
              ],
              `${label}.heldByMeasurement.file`,
            ),
          },
        }),
  };
}
export function parseCodeReviewDocument(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Malformed code review JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const root = object(parsed, 'Code review document');
  if (root['schemaVersion'] !== 1) {
    throw new Error(
      `Unsupported code review schemaVersion: ${JSON.stringify(root['schemaVersion'])}. Expected 1.`,
    );
  }
  if (!Array.isArray(root['findings'])) {
    throw new Error('findings must be an array.');
  }
  const verdict = object(root['verdict'], 'verdict');
  const counts = object(root['counts'], 'counts');
  return {
    schemaVersion: 1,
    target: string(root['target'], 'target'),
    effort: string(root['effort'], 'effort'),
    verdict: {
      event: enumValue(
        verdict['event'],
        ['APPROVE', 'COMMENT', 'REQUEST_CHANGES'],
        'verdict.event',
      ),
      verdictLine: string(verdict['verdictLine'], 'verdict.verdictLine'),
      baseEvent: enumValue(
        verdict['baseEvent'],
        ['APPROVE', 'COMMENT', 'REQUEST_CHANGES'],
        'verdict.baseEvent',
      ),
      cappedBy: stringArray(verdict['cappedBy'], 'verdict.cappedBy'),
    },
    findings: root['findings'].map(parseFinding),
    counts: {
      total: integer(counts['total'], 'counts.total'),
      bySeverity: countRecord(
        counts['bySeverity'],
        SEVERITIES,
        'counts.bySeverity',
      ),
      byConfidence: countRecord(
        counts['byConfidence'],
        CONFIDENCES,
        'counts.byConfidence',
      ),
      held: integer(counts['held'], 'counts.held'),
    },
    markdownReportPath: markdownReportPath(root['markdownReportPath']),
  };
}
export function CodeReviewArtifactDetail({
  workspacePath,
  artifactVersion,
  workspaceActions,
}) {
  const { t } = useI18n();
  const [content, setContent] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [artifactTruncated, setArtifactTruncated] = useState(false);
  const [severity, setSeverity] = useState('all');
  const [confidence, setConfidence] = useState('all');
  const [reportPath, setReportPath] = useState(null);
  const [reportContent, setReportContent] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const reportRequest = useRef(0);
  // `t` is deliberately NOT a dependency: i18n memoizes it per language, and
  // including it would re-read the artifact and reset every filter on a
  // language switch. The truncated message is resolved at render time.
  useEffect(() => {
    let cancelled = false;
    reportRequest.current += 1;
    setContent(null);
    setLoadError(null);
    setArtifactTruncated(false);
    setSeverity('all');
    setConfidence('all');
    setReportPath(null);
    setReportContent(null);
    setReportError(null);
    setReportLoading(false);
    workspaceActions
      .readWorkspaceFile(workspacePath)
      .then((file) => {
        if (cancelled) return;
        if (file.truncated) {
          setArtifactTruncated(true);
          return;
        }
        setContent(file.content);
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      cancelled = true;
      reportRequest.current += 1;
    };
  }, [artifactVersion, workspaceActions, workspacePath]);
  const parsed = useMemo(() => {
    if (content === null) return null;
    try {
      return { document: parseCodeReviewDocument(content), error: null };
    } catch (error) {
      return {
        document: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [content]);
  const openReport = (path) => {
    const request = ++reportRequest.current;
    setReportPath(path);
    setReportContent(null);
    setReportError(null);
    setReportLoading(true);
    workspaceActions
      .readWorkspaceFile(path)
      .then((file) => {
        if (request !== reportRequest.current) return;
        if (file.truncated) {
          setReportError(t('codeReview.reportTruncated'));
        } else {
          setReportContent(file.content);
        }
      })
      .catch((error) => {
        if (request !== reportRequest.current) return;
        setReportError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (request === reportRequest.current) setReportLoading(false);
      });
  };
  if (reportContent !== null || reportError) {
    return _jsxs('div', {
      className: styles.report,
      children: [
        _jsx('button', {
          type: 'button',
          className: styles.secondaryButton,
          onClick: () => {
            reportRequest.current += 1;
            setReportPath(null);
            setReportContent(null);
            setReportError(null);
            setReportLoading(false);
          },
          children: t('codeReview.back'),
        }),
        _jsx('div', { className: styles.path, children: reportPath }),
        reportError
          ? _jsx('div', {
              className: styles.error,
              role: 'alert',
              children: reportError,
            })
          : _jsx(Markdown, { content: reportContent ?? '' }),
      ],
    });
  }
  const loadFailure = artifactTruncated
    ? t('codeReview.artifactTruncated')
    : loadError;
  if (loadFailure || parsed?.error) {
    // The document that names the durable report failed to load, so derive
    // the report from the artifact path by the same-stem convention
    // save-artifact is invoked with: a truncated or unparsable artifact must
    // not become a dead end when its Markdown report is still readable.
    const fallbackReport = workspacePath.endsWith('.json')
      ? `${workspacePath.slice(0, -'.json'.length)}.md`
      : null;
    return _jsxs('div', {
      className: styles.errorFallback,
      children: [
        _jsxs('div', {
          className: styles.error,
          role: 'alert',
          children: [
            _jsx('strong', { children: t('codeReview.loadErrorTitle') }),
            _jsx('span', { children: loadFailure ?? parsed?.error }),
          ],
        }),
        fallbackReport &&
          _jsx('button', {
            type: 'button',
            className: styles.secondaryButton,
            onClick: () => openReport(fallbackReport),
            disabled: reportLoading,
            children: reportLoading
              ? t('codeReview.loadingReport')
              : t('codeReview.openReport'),
          }),
      ],
    });
  }
  if (!parsed?.document) {
    return _jsx('div', {
      className: styles.empty,
      children: t('codeReview.loading'),
    });
  }
  const reviewDocument = parsed.document;
  const findings = reviewDocument.findings.filter(
    (finding) =>
      (severity === 'all' || finding.severity === severity) &&
      (confidence === 'all' || finding.confidence === confidence),
  );
  return _jsxs('div', {
    className: styles.root,
    children: [
      _jsxs('section', {
        className: styles.summary,
        children: [
          _jsxs('div', {
            children: [
              _jsx('div', {
                className: styles.eyebrow,
                children: t('codeReview.authoritativeVerdict'),
              }),
              _jsx('h2', {
                className: styles.verdict,
                children: reviewDocument.verdict.verdictLine,
              }),
              _jsx('div', {
                className: styles.meta,
                children: t('codeReview.targetEffort', {
                  target: reviewDocument.target,
                  effort: reviewDocument.effort,
                }),
              }),
            ],
          }),
          _jsx('button', {
            type: 'button',
            className: styles.primaryButton,
            onClick: () => openReport(reviewDocument.markdownReportPath),
            disabled: reportLoading,
            children: reportLoading
              ? t('codeReview.loadingReport')
              : t('codeReview.openReport'),
          }),
        ],
      }),
      _jsxs('section', {
        className: styles.metrics,
        'aria-label': t('codeReview.reviewCounts'),
        children: [
          _jsx(Metric, {
            label: t('codeReview.total'),
            value: reviewDocument.counts.total,
          }),
          SEVERITIES.map((value) =>
            _jsx(
              Metric,
              { label: value, value: reviewDocument.counts.bySeverity[value] },
              value,
            ),
          ),
          CONFIDENCES.map((value) =>
            _jsx(
              Metric,
              {
                label: t('codeReview.confidence', { value }),
                value: reviewDocument.counts.byConfidence[value],
              },
              value,
            ),
          ),
          _jsx(Metric, {
            label: t('codeReview.held'),
            value: reviewDocument.counts.held,
          }),
        ],
      }),
      _jsxs('section', {
        className: styles.caps,
        children: [
          _jsx('span', {
            className: styles.eyebrow,
            children: t('codeReview.caps'),
          }),
          _jsx('span', {
            children:
              reviewDocument.verdict.cappedBy.length > 0
                ? reviewDocument.verdict.cappedBy.join(', ')
                : t('codeReview.none'),
          }),
        ],
      }),
      _jsxs('div', {
        className: styles.filters,
        children: [
          _jsxs('label', {
            children: [
              t('codeReview.severity'),
              _jsxs('select', {
                'aria-label': t('codeReview.severity'),
                value: severity,
                onChange: (event) => setSeverity(event.target.value),
                children: [
                  _jsx('option', {
                    value: 'all',
                    children: t('codeReview.all'),
                  }),
                  SEVERITIES.map((value) =>
                    _jsxs(
                      'option',
                      {
                        value: value,
                        children: [
                          value,
                          ' (',
                          reviewDocument.counts.bySeverity[value],
                          ')',
                        ],
                      },
                      value,
                    ),
                  ),
                ],
              }),
            ],
          }),
          _jsxs('label', {
            children: [
              t('codeReview.confidenceLabel'),
              _jsxs('select', {
                'aria-label': t('codeReview.confidenceLabel'),
                value: confidence,
                onChange: (event) => setConfidence(event.target.value),
                children: [
                  _jsx('option', {
                    value: 'all',
                    children: t('codeReview.all'),
                  }),
                  CONFIDENCES.map((value) =>
                    _jsxs(
                      'option',
                      {
                        value: value,
                        children: [
                          value,
                          ' (',
                          reviewDocument.counts.byConfidence[value],
                          ')',
                        ],
                      },
                      value,
                    ),
                  ),
                ],
              }),
            ],
          }),
        ],
      }),
      _jsx('div', {
        className: styles.findings,
        children:
          findings.length === 0
            ? _jsx('div', {
                className: styles.empty,
                children: t('codeReview.noMatches'),
              })
            : findings.map((finding) =>
                _jsxs(
                  'article',
                  {
                    className: styles.finding,
                    children: [
                      _jsxs('div', {
                        className: styles.findingHeader,
                        children: [
                          _jsx('span', {
                            className: styles.severity,
                            children: finding.severity,
                          }),
                          _jsx('span', {
                            children: t('codeReview.confidence', {
                              value: finding.confidence,
                            }),
                          }),
                          _jsx('span', {
                            children: t('codeReview.source', {
                              value: finding.source,
                            }),
                          }),
                          finding.category &&
                            _jsx('span', { children: finding.category }),
                        ],
                      }),
                      _jsx('h3', { children: finding.summary }),
                      _jsx(Detail, {
                        label: t('codeReview.failureScenario'),
                        value: finding.failureScenario,
                      }),
                      finding.suggestedFix &&
                        _jsx(Detail, {
                          label: t('codeReview.suggestedFix'),
                          value: finding.suggestedFix,
                        }),
                      finding.outcome &&
                        _jsx(Detail, {
                          label: t('codeReview.outcome'),
                          value: `${finding.outcome}${finding.outcomeNote ? ` — ${finding.outcomeNote}` : ''}`,
                        }),
                      finding.heldByMeasurement &&
                        _jsx(Detail, {
                          label: t('codeReview.heldByMeasurement'),
                          value: finding.heldByMeasurement.file,
                        }),
                      _jsxs('div', {
                        className: styles.detailBlock,
                        children: [
                          _jsx('strong', {
                            children: t('codeReview.locations'),
                          }),
                          _jsx('ul', {
                            children: finding.locations.map((location, index) =>
                              _jsxs(
                                'li',
                                {
                                  children: [
                                    _jsxs('code', {
                                      children: [
                                        location.file,
                                        location.line === undefined
                                          ? ''
                                          : `:${location.line}`,
                                      ],
                                    }),
                                    location.anchor &&
                                      _jsxs('span', {
                                        children: [' \u2014 ', location.anchor],
                                      }),
                                  ],
                                },
                                `${location.file}:${location.line ?? ''}:${index}`,
                              ),
                            ),
                          }),
                        ],
                      }),
                      ((finding.assets && finding.assets.length > 0) ||
                        (finding.assetFiles &&
                          finding.assetFiles.length > 0)) &&
                        _jsxs('div', {
                          className: styles.detailBlock,
                          children: [
                            _jsx('strong', {
                              children: t('codeReview.evidence'),
                            }),
                            _jsxs('ul', {
                              children: [
                                (finding.assets ?? []).map((asset, index) =>
                                  _jsx(
                                    'li',
                                    {
                                      children: isSafeHref(asset)
                                        ? _jsx('a', {
                                            href: asset,
                                            target: '_blank',
                                            rel: 'noopener noreferrer',
                                            children: asset,
                                          })
                                        : _jsxs('span', {
                                            className: styles.notLinked,
                                            children: [
                                              asset,
                                              ' (',
                                              t('codeReview.notLinked'),
                                              ')',
                                            ],
                                          }),
                                    },
                                    `${asset}-${index}`,
                                  ),
                                ),
                                (finding.assetFiles ?? []).map((file, index) =>
                                  _jsx(
                                    EvidenceFile,
                                    {
                                      path: file,
                                      workspaceActions: workspaceActions,
                                    },
                                    `${file}-${index}`,
                                  ),
                                ),
                              ],
                            }),
                          ],
                        }),
                    ],
                  },
                  finding.id,
                ),
              ),
      }),
    ],
  });
}
// A local evidence file (`assetFiles`): an inline image when the workspace
// file is readable, the bare path when it is not. Local evidence usually
// lives under `.qwen/tmp/`, which review cleanup removes, so a path that no
// longer resolves is an ordinary state — the caption stays either way.
function EvidenceFile({ path, workspaceActions }) {
  const mimeType = getImageMimeTypeFromPath(path);
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!mimeType) return;
    let cancelled = false;
    let objectUrl;
    readWorkspaceFileAsBlob(
      (filePath, opts) => workspaceActions.readFileBytes(filePath, opts),
      path,
      mimeType,
      {
        statFile: (filePath) => workspaceActions.stat(filePath),
        isCancelled: () => cancelled,
      },
    )
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mimeType, path, workspaceActions]);
  return _jsxs('li', {
    children: [
      src &&
        _jsx('img', { className: styles.evidenceImage, src: src, alt: path }),
      _jsx('code', { children: path }),
    ],
  });
}
function Metric({ label, value }) {
  return _jsxs('div', {
    className: styles.metric,
    children: [
      _jsx('strong', { children: value }),
      _jsx('span', { children: label }),
    ],
  });
}
function Detail({ label, value }) {
  return _jsxs('div', {
    className: styles.detailBlock,
    children: [
      _jsx('strong', { children: label }),
      _jsx('p', { children: value }),
    ],
  });
}
//# sourceMappingURL=CodeReviewArtifactDetail.js.map
