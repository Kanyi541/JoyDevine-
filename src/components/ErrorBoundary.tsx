import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 text-center">
          <div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
            <p className="text-slate-400 mb-4">{this.state.error?.message}</p>
            <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 rounded"
            >
                Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
