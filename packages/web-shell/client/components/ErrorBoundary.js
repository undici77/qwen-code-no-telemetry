import { Component } from 'react';
const EMPTY_KEYS = [];
function resetKeysChanged(prev, next) {
    if (prev === next)
        return false;
    if (prev.length !== next.length)
        return true;
    return prev.some((value, index) => !Object.is(value, next[index]));
}
/**
 * Generic React error boundary. web-shell ships as an embeddable component, so
 * a throw in any one subtree (Markdown, KaTeX, Mermaid, a tool panel) must not
 * white-screen the host page. Wrap risky subtrees with this and supply a
 * graceful fallback.
 */
export class ErrorBoundary extends Component {
    state = {
        error: null,
        resetKeys: this.props.resetKeys ?? EMPTY_KEYS,
    };
    static getDerivedStateFromError(error) {
        return { error };
    }
    static getDerivedStateFromProps(props, state) {
        const nextKeys = props.resetKeys ?? EMPTY_KEYS;
        if (resetKeysChanged(state.resetKeys, nextKeys)) {
            return { error: null, resetKeys: nextKeys };
        }
        return null;
    }
    componentDidCatch(error, info) {
        console.error(`[web-shell] ${this.props.label ?? 'render'} failed:`, error, info.componentStack);
    }
    reset = () => {
        this.setState({ error: null });
    };
    render() {
        const { error } = this.state;
        if (error === null)
            return this.props.children;
        const { fallback } = this.props;
        return typeof fallback === 'function'
            ? fallback(error, this.reset)
            : fallback;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map