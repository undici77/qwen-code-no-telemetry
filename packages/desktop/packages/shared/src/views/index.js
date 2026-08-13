/**
 * Views Module
 *
 * Dynamic views computed from session state using Filtrex expressions.
 * Never persisted on sessions — purely runtime evaluation.
 */
export { compileView, compileAllViews, evaluateViews, buildViewContext } from './evaluator.ts';
export { validateViewExpression, AVAILABLE_FIELDS, AVAILABLE_FUNCTIONS } from './validation.ts';
export { getDefaultViews } from './defaults.ts';
export { VIEW_FUNCTIONS } from './functions.ts';
//# sourceMappingURL=index.js.map