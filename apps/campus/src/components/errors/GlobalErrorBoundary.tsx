import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CampusSphere][GlobalErrorBoundary] Unhandled error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full flex flex-col items-center text-center space-y-6 animate-in fade-in duration-300">
            <div className="relative">
              <img src="/CS.svg" alt="CampusSphere" className="h-14 w-14" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Interruption temporaire</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-automata text-foreground">
                Oups, une erreur inattendue est survenue
              </h1>
              <p className="text-sm text-muted-foreground">
                L'application a rencontré un problème inattendu. Vos données sont préservées.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <Button
                variant="outline"
                className="w-full sm:w-1/2 gap-2"
                onClick={this.handleReset}
              >
                <RotateCcw className="h-4 w-4" />
                Actualiser
              </Button>
              <Button
                className="w-full sm:w-1/2 bg-secondary hover:bg-muted text-secondary-foreground border border-border/60 gap-2"
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4" />
                Accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
