/**
 * PromptHandler - Processes prompt actions for App events
 *
 * Subscribes to App events and collects prompt actions to be executed.
 * Prompts are queued and delivered via callback for the caller to execute.
 */
import { createLogger } from '../../utils/debug.ts';
import { APP_EVENTS } from '../types.ts';
import { matcherMatches, buildEnvFromPayload, expandEnvVars, parsePromptReferences } from '../utils.ts';
import { deriveAutomationName } from '../name-utils.ts';
const log = createLogger('prompt-handler');
// ============================================================================
// PromptHandler Implementation
// ============================================================================
export class PromptHandler {
    options;
    configProvider;
    bus = null;
    boundHandler = null;
    constructor(options, configProvider) {
        this.options = options;
        this.configProvider = configProvider;
    }
    /**
     * Subscribe to App events on the bus.
     */
    subscribe(bus) {
        this.bus = bus;
        this.boundHandler = this.handleEvent.bind(this);
        bus.onAny(this.boundHandler);
        log.debug(`[PromptHandler] Subscribed to event bus`);
    }
    /**
     * Handle an event by processing matching prompt actions.
     */
    async handleEvent(event, payload) {
        // Only process App events for prompt actions
        if (!APP_EVENTS.includes(event)) {
            return;
        }
        const matchers = this.configProvider.getMatchersForEvent(event);
        if (matchers.length === 0)
            return;
        // Group prompt actions by matcher for per-matcher history
        const matcherPrompts = [];
        for (const matcher of matchers) {
            if (!matcherMatches(matcher, event, payload))
                continue;
            const prompts = [];
            for (const action of matcher.actions) {
                if (action.type === 'prompt') {
                    prompts.push({ prompt: action, labels: matcher.labels, permissionMode: matcher.permissionMode });
                }
            }
            if (prompts.length > 0) {
                matcherPrompts.push({ matcherId: matcher.id, automationName: deriveAutomationName(event, matcher), prompts });
            }
        }
        if (matcherPrompts.length === 0)
            return;
        const totalPrompts = matcherPrompts.reduce((s, m) => s + m.prompts.length, 0);
        log.debug(`[PromptHandler] Processing ${totalPrompts} prompts for ${event}`);
        // Build environment variables
        const env = buildEnvFromPayload(event, payload);
        // Process prompts per matcher
        const pendingPrompts = [];
        for (const { matcherId, automationName, prompts } of matcherPrompts) {
            for (const { prompt, labels, permissionMode } of prompts) {
                // Expand environment variables in the prompt
                const expandedPrompt = expandEnvVars(prompt.prompt, env);
                // Parse references
                const references = parsePromptReferences(expandedPrompt);
                // Expand labels
                const expandedLabels = labels?.map(label => expandEnvVars(label, env));
                pendingPrompts.push({
                    sessionId: this.options.sessionId,
                    matcherId,
                    automationName,
                    prompt: expandedPrompt,
                    mentions: references.mentions,
                    labels: expandedLabels,
                    permissionMode,
                    llmConnection: prompt.llmConnection,
                    model: prompt.model,
                });
            }
        }
        // Deliver prompts via callback
        if (pendingPrompts.length > 0 && this.options.onPromptsReady) {
            log.debug(`[PromptHandler] Delivering ${pendingPrompts.length} prompts`);
            this.options.onPromptsReady(pendingPrompts);
        }
    }
    /**
     * Clean up resources.
     */
    dispose() {
        if (this.bus && this.boundHandler) {
            this.bus.offAny(this.boundHandler);
            this.boundHandler = null;
        }
        this.bus = null;
        log.debug(`[PromptHandler] Disposed`);
    }
}
//# sourceMappingURL=prompt-handler.js.map