import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <div className="w-full py-5 px-3.5 sm:px-5 md:px-6 border-b border-border/40 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-[160px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="grid grid-cols-3 gap-2 pt-2 mt-1 border-t border-border/30 px-2 sm:px-4">
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 mb-4 w-full">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export function ResourceSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-2 sm:px-3 border-b border-border/40">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg hidden sm:block" />
      </div>
    </div>
  );
}

export function SphereSkeleton({ layout = "list" }: { layout?: "list" | "grid" } = {}) {
  if (layout === "grid") {
    return (
      <div className="flex flex-col gap-2.5 animate-pulse">
        <div className="aspect-[16/9] w-full rounded-2xl bg-muted/60" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 px-3 sm:px-4 rounded-xl border-b border-border/30">
      <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
      <div className="space-y-1.5 min-w-0 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
    </div>
  );
}

export function ProfileSkeleton({ cardClasses }: { cardClasses?: string } = {}) {
  const containerClass = cardClasses || "border border-border/40 rounded-2xl bg-card/40 overflow-hidden";

  return (
    <div className="w-full space-y-4">
      {/* 1. Profile Header Card */}
      <div className={containerClass}>
        {/* Photo de couverture */}
        <div className="relative rounded-t-null sm:rounded-t-lg h-48 bg-muted/60 animate-pulse" />

        <div className="p-4 sm:p-6 relative">
          <div className="flex flex-col md:flex-row md:items-start gap-4 sm:gap-6">
            {/* Top row on mobile (Avatar on left, actions on right) / Left column on PC (Avatar with actions below) */}
            <div className="flex items-start justify-between md:flex-col md:items-start md:space-y-4 shrink-0">
              <Skeleton className="-mt-16 sm:-mt-20 h-28 w-28 sm:h-32 sm:w-32 rounded-full ring-4 ring-background shrink-0" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>

            {/* Profile Info: right column on PC */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28 mt-1.5" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Impact Score et Mood (45% / 55%) */}
              <div className="grid grid-cols-[9fr_11fr] gap-2 sm:gap-3 w-full p-2.5 sm:p-3 bg-muted/40 border border-border/40 rounded-xl">
                {/* 45% Impact Score */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>

                {/* 55% Mood du moment */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 border-l border-border/50 pl-2 sm:pl-3">
                  <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Custom Tabs Bar (outside header card) */}
      <div className="mt-4 w-full overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-grid grid-flow-col text-center border-b border-border/40 min-w-full">
          {[
            { width: "w-12", active: true },
            { width: "w-16", active: false },
            { width: "w-20", active: false },
            { width: "w-24", active: false },
          ].map((tab, idx) => (
            <div
              key={idx}
              className={`w-full flex justify-center px-4 py-4 border-b-4 ${
                tab.active ? "border-primary" : "border-transparent"
              }`}
            >
              <Skeleton className={`h-4 ${tab.width}`} />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Posts Feed (outside header card) */}
      <div className="space-y-4 mt-6">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 border-b">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full cursor-pointer" />
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ConnectionSkeleton() {
  return (
    <div className="py-3 px-2 border-b border-border/40 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}
