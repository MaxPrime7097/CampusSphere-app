import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export function PostSkeleton() {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-3 w-[150px]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <Skeleton className="h-[200px] w-full rounded-md mt-4" />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
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
    <Card className="overflow-hidden border bg-card/50 backdrop-blur-sm transition-all duration-300">
      <CardContent className="p-0">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 bg-muted/20 border-b">
          <Skeleton className="h-6 w-6 rounded flex-shrink-0 bg-muted/40" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-4/5 bg-muted/40" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-3 w-16 rounded-full bg-muted/30" />
              <Skeleton className="h-3 w-10 rounded-full bg-muted/30" />
            </div>
          </div>
        </div>
        
        <div className="px-3 py-2.5 sm:px-4 sm:py-3 space-y-3">
          {/* Stats row */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20 bg-muted/30" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-8 bg-muted/30" />
              <Skeleton className="h-3 w-8 bg-muted/30" />
              <Skeleton className="h-3 w-10 bg-muted/30" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 pt-1">
            <Skeleton className="h-8 w-8 rounded-lg bg-muted/30" />
            <Skeleton className="h-8 w-8 rounded-lg bg-muted/30" />
            <Skeleton className="h-8 w-8 rounded-lg bg-muted/30" />
            <Skeleton className="h-8 flex-1 rounded-lg bg-primary/10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SphereSkeleton() {
  return (
    <Card className="overflow-hidden campus-card border-none bg-card/50 backdrop-blur-sm">
      <div className="h-24 bg-muted animate-pulse" />
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-1.5">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        
        <div className="flex items-center justify-between py-1">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-7 w-7 rounded-full border-2 border-background" />
            ))}
          </div>
          <Skeleton className="h-3 w-20" />
        </div>

        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </Card>
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
    <Card className="border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
