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
      <div className="flex justify-between pt-2">
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-6 w-12" />
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

export function ProfileSkeleton() {
  return (
    <div className="w-full">
      <div className="h-64 w-full bg-muted animate-pulse rounded-b-lg" />
      <div className="container px-4 md:px-6 -mt-20">
        <div className="flex flex-col md:flex-row gap-6 md:items-end">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
          <div className="flex-1 space-y-2 mb-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3 mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="mt-8">
          <div className="flex gap-6 border-b">
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-8 w-24 mb-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div className="md:col-span-2 space-y-4">
              <PostSkeleton />
              <PostSkeleton />
            </div>
          </div>
        </div>
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
