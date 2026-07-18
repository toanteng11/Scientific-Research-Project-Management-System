import { Component } from 'react';
import ServerErrorPage from './ServerErrorPage';

/**
 * GlobalErrorBoundary — Top-level React Error Boundary (class component).
 *
 * Catches uncaught exceptions during the render phase, in lifecycle methods,
 * and in constructors of the subtree below this boundary. Prevents a full
 * unmount of the root React tree (white screen) by substituting a fallback UI.
 *
 * Does not catch: event handler errors, async code, or errors in the boundary's
 * own render method (the fallback must remain minimal and non-throwing).
 */
export default class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary] Uncaught render tree error:', error);
    console.error('[GlobalErrorBoundary] componentStack:', errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ServerErrorPage isClientCrash />;
    }
    return this.props.children;
  }
}
