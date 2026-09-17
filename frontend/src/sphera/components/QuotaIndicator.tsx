import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getGenerationQuota } from "../services/spheraService";
import { Progress } from "@/components/ui/progress";
import { Sparkles, AlertCircle } from "lucide-react";

export const QuotaIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const { data: response, isLoading } = useQuery({
    queryKey: ["sphera-generation-quota"],
    queryFn: getGenerationQuota,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const quotaData = response?.data || { used: 0, remaining: 5, limit: 5 };
  const { used, remaining, limit } = quotaData;
  const percentUsed = Math.min(100, Math.round((used / limit) * 100));
  const isExhausted = remaining === 0;


  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border text-xs font-medium ${
        isExhausted
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-primary/5 text-muted-foreground border-border/50"
      } ${className || ""}`}
    >
      {isExhausted ? (
        <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
      ) : (
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
      )}
      <div className="flex items-center gap-2">
        <span>
          <strong className={isExhausted ? "text-destructive" : "text-foreground"}>{remaining}</strong> / {limit} gén.
        </span>
        <Progress value={percentUsed} className="w-14 h-1.5 bg-muted" />
      </div>
    </div>
  );
};
