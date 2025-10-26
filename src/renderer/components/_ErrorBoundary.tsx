import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Renderer crashed', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-center text-white">
          <h1 className="text-2xl font-bold">Something went wrong.</h1>
          <p className="mt-2 max-w-sm text-slate-400">Reload the application or check the developer console for details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
