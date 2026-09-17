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
    <Card className="group flex flex-col overflow-hidden rounded-2xl border-border/70 transition-all duration-300">
      <div className="relative h-20 w-full flex flex-col items-center justify-center bg-muted/60 animate-pulse border-b">
        <Skeleton className="w-8 h-8 rounded-lg bg-muted-foreground/20" />
      </div>

      <div className="p-2.5 flex flex-col flex-1 justify-between bg-card">
        <div className="mb-2 flex flex-col gap-1">
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>

        <div className="flex items-center justify-between pt-2 mt-2 border-t border-border/40 h-5">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-8" />
        </div>
      </div>
    </Card>
  );
}

export function SphereSkeleton() {
  return (
    <Card className="group flex flex-col overflow-hidden border-border/40 transition-all duration-300">
      <div className="relative h-24 bg-muted animate-pulse">
        <div className="absolute top-2 right-2">
           <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="absolute -bottom-4 left-4">
          <Skeleton className="w-12 h-12 rounded-full border-[3px] border-card bg-muted-foreground/20" />
        </div>
      </div>

      <div className="pt-7 px-4 pb-4 flex flex-col flex-1 bg-card">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Skeleton className="h-5 w-2/3" />
        </div>
        <Skeleton className="h-3 w-full mt-2" />
        <Skeleton className="h-3 w-4/5 mt-1 mb-4" />

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-12 rounded-md" />
            <Skeleton className="h-6 w-10 rounded-md" />
          </div>
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
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
