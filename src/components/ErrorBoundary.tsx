import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0F172A] border border-white/10 rounded-3xl p-8 space-y-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">
                System Recovery Mode
              </h2>
              <p className="text-sm text-white/60 break-words">
                {this.state.errorMessage}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00F3FF] text-black font-black uppercase tracking-widest text-xs hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={14} />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
