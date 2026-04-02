import { Component, type ErrorInfo, type ReactNode } from "react";

type ResourceDetailErrorBoundaryProps = {
  children: ReactNode;
  snapshot: Record<string, unknown>;
};

type ResourceDetailErrorBoundaryState = {
  hasError: boolean;
};

function serializeSnapshot(snapshot: Record<string, unknown>) {
  try {
    return JSON.stringify(snapshot);
  } catch {
    return "{\"error\":\"snapshot_not_serializable\"}";
  }
}

export class ResourceDetailErrorBoundary extends Component<
  ResourceDetailErrorBoundaryProps,
  ResourceDetailErrorBoundaryState
> {
  state: ResourceDetailErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const serializedSnapshot = serializeSnapshot(this.props.snapshot);

    console.error("[ResourceDetail][ErrorBoundary] render crash", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      serializedSnapshot,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Impossible d'afficher cette ressource pour le moment.
        </div>
      );
    }

    return this.props.children;
  }
}
