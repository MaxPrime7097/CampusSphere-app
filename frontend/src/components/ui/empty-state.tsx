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
      <div className="bg-primary/5 p-4 rounded-full mb-4">
        <Icon className="h-10 w-10 text-primary/40" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        {description}
      </p>
      {action ? action : actionLabel && onAction ? (
        <Button onClick={onAction} className="campus-gradient text-white shadow-md hover:shadow-lg transition-all active:scale-95">
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </div>
  );
}
