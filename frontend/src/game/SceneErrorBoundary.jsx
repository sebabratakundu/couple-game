import React from 'react';

/**
 * Error boundary for 3D scenes. If a scene throws, we catch it and
 * offer a "Return to Park" fallback instead of a white screen.
 */
export default class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }
  componentDidCatch(err, info) {
    // eslint-disable-next-line no-console
    console.error('Scene error caught:', err, info);
  }
  reset = () => {
    this.setState({ hasError: false, err: null });
    if (this.props.onReset) this.props.onReset();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="scene-error" data-testid="scene-error">
          <div className="scene-error-inner">
            <div className="scene-error-heart">💛</div>
            <h2>A little hiccup in the park…</h2>
            <p className="scene-error-msg">
              Something small broke while we were setting up this activity. Don't worry, nothing is lost.
            </p>
            <button className="mg-btn" onClick={this.reset} data-testid="scene-error-return">
              Return to the Park ❤️
            </button>
            {process.env.NODE_ENV !== 'production' && this.state.err && (
              <pre className="scene-error-detail">{String(this.state.err && this.state.err.stack || this.state.err)}</pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
