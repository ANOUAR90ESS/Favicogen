import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Catches render errors so one bad component cannot take the whole app down.
 *
 * Without this, any throw during render — a malformed SVG, a corrupt imported
 * project, an image that fails to decode — unmounted the entire tree and left
 * a white page, taking whatever the user had not saved with it.
 *
 * The fallback is deliberately plain: it must not depend on i18n, the theme,
 * or anything else that might itself be the thing that broke.
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Called when an error is caught, for logging. */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
    this.props.onError?.(error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: '460px', textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 18px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}
            aria-hidden="true"
          >
            ⚠️
          </div>

          <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px' }}>
            Something went wrong / حدث خطأ غير متوقع
          </h1>

          <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#475569', margin: '0 0 20px' }}>
            Your saved projects are safe — reloading opens the last design you were working on.
            <br />
            مشاريعك المحفوظة سليمة — أعد التحميل لفتح آخر تصميم كنت تعمل عليه.
          </p>

          <button
            onClick={this.handleReload}
            style={{
              padding: '9px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#ffffff',
              background: '#4f46e5',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Reload / إعادة التحميل
          </button>

          <details style={{ marginTop: '22px', textAlign: 'left' }}>
            <summary style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
              Technical details
            </summary>
            <pre
              style={{
                marginTop: '10px',
                padding: '10px',
                fontSize: '11px',
                lineHeight: 1.6,
                background: '#0f172a',
                color: '#e2e8f0',
                borderRadius: '8px',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
