'use client';

/**
 * ErrorBoundary.tsx — React class-based error boundary.
 *
 * Catches render errors in any child component tree.
 * Without this, a single crashed chart crashes the whole page.
 *
 * Usage:
 *   <ErrorBoundary label="Sentiment Chart">
 *     <SentimentChart ... />
 *   </ErrorBoundary>
 */

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label?: string;           // shown in the fallback UI
  fallback?: ReactNode;     // optional custom fallback
}

interface State {
  hasError: boolean;
  message:  string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary] "${this.props.label ?? 'Component'}" crashed:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,.25)',
            background: 'rgba(239,68,68,.06)',
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>
            ⚠️ {this.props.label ?? 'Component'} failed to render
          </p>
          <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: 11 }}>
            {this.state.message || 'An unexpected error occurred.'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
