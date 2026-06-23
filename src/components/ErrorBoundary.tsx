import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
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
        <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6] p-4 text-center">
          <div className="bg-white p-8 rounded-2xl border border-[#7DB095]/20 shadow-xl max-w-sm w-full font-sans">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-500 mb-6">
              A frontend error occurred. Refresh the page to continue.
            </p>
            <div className="text-left bg-gray-50 p-4 rounded-xl overflow-x-auto text-[10px] text-gray-600 border border-gray-100 whitespace-pre-wrap">
              {this.state.error ? String(this.state.error.stack || this.state.error) : "Script error."}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full bg-[#7DB095] hover:bg-[#648E77] text-white py-2.5 rounded-xl text-xs font-semibold"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
