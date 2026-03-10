import { Component } from 'react';
import * as Sentry from '@sentry/react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    try {
      Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } });
    } catch { /* sentry may not be initialized */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#f5f0eb', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 16, color: '#1a1a1a' }}>
            Erreur de rendu
          </h1>
          <pre style={{
            background: '#fff', border: '2px solid #1a1a1a', borderRadius: 12,
            padding: 20, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            boxShadow: '4px 4px 0 #1a1a1a', fontSize: 13, color: '#ef4444',
          }}>
            {this.state.error?.toString()}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            style={{
              marginTop: 20, padding: '10px 20px', background: '#b9ff66',
              border: '2px solid #1a1a1a', borderRadius: 12, fontWeight: 700,
              cursor: 'pointer', boxShadow: '3px 3px 0 #1a1a1a',
            }}
          >
            Réinitialiser et retour au login
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
