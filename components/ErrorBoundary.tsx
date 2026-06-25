"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (options: { error?: Error; reset: () => void }) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
      return;
    }

    console.error("Uncaught error:", error.message, {
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      const reset = () => this.setState({ hasError: false, error: undefined });
      if (this.props.fallback) {
        return this.props.fallback({ error: this.state.error, reset });
      }

      return (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950" role="alert" data-testid="error-boundary-fallback">
          <h2 className="font-semibold text-red-800 dark:text-red-100">Something went wrong</h2>
          <button
            type="button"
            className="mt-2 text-red-600 underline dark:text-red-200"
            onClick={reset}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
