import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#080B18] text-white px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Algo deu errado</h1>
            <p className="text-slate-400 text-sm mb-8">
              Ocorreu um erro inesperado. Tente recarregar a pÃ¡gina.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="bg-red-900/20 border border-red-500/20 rounded-xl p-4 text-xs text-red-300 text-left mb-6 overflow-auto max-h-40">
                {this.state.error.stack ?? this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#9b7fff] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <RefreshCw size={16} />
              Voltar ao inÃ­cio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
