import React from 'react';

interface IErrorBoundaryProps {
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  IErrorBoundaryProps,
  IErrorBoundaryState
> {
  public constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(): IErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: unknown): void {
    // Keep error logging centralized and non-blocking for scaffold stage.
    console.error('Unhandled render error:', error);
  }

  public render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div
          className='rounded-xl border border-danger-500/40 bg-surface-900/80 p-4 text-sm text-text-300'
          role='alert'
        >
          Something went wrong while rendering this section.
        </div>
      );
    }

    return this.props.children;
  }
}
