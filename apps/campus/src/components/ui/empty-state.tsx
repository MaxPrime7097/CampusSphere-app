import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  children,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center bg-card/30 backdrop-blur-sm rounded-2xl border border-dashed border-muted-foreground/20",
      className
    )}>
      <div className="bg-muted p-3.5 rounded-full mb-3">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-5">
        {description}
      </p>
      {action ? action : actionLabel && onAction ? (
        <Button onClick={onAction} size="sm" variant="secondary" className="bg-secondary hover:bg-muted text-secondary-foreground border border-border/60">
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </div>
  );
}
