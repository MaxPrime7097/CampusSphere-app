import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { FriendSuggestions } from "@/components/feed/FriendSuggestions";
import { ResourceFeedCard } from "@/components/feed/ResourceFeedCard";
import { FeedSidebar } from "@/components/layout/FeedSidebar";
import { WelcomeTeamModal } from "@/components/onboarding/WelcomeTeamModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { listPosts, listSpheres, listResources } from "@/services/api";
import { Button } from "@/components/ui/button";
import { House as HomeIcon, ArrowClockwise as RefreshCw, Spinner as Loader2 } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { mapPostToCard } from "@/lib/postCardMapper";
import { PostSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import type { PostCardData, Sphere } from "@/types";
import type { Resource } from "@/types";

// ─── Feed item union type ────────────────────────────────────────────────────
type FeedPost = { kind: "post"; data: PostCardData; date: string };
type FeedResource = { kind: "resource"; data: Resource; date: string };
type FeedItem = FeedPost | FeedResource;

export function Home() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const spheresQuery = useQuery({
    queryKey: ["home", "popular-spheres"],
    queryFn: () => listSpheres(),
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (spheres) =>
      [...(Array.isArray(spheres) ? spheres : [])]
        .sort((a: Sphere, b: Sphere) => Number(b.memberCount || 0) - Number(a.memberCount || 0))
        .slice(0, 3),
  });

  const [posts, setPosts] = useState<PostCardData[]>([]);

  const postsQuery = useQuery({
    queryKey: ["home", "posts"],
    queryFn: () => listPosts(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) => (data || []).map(mapPostToCard),
  });

  const resourcesQuery = useQuery({
    queryKey: ["home", "recent-resources"],
    queryFn: () => listResources({ limit: 10 }),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (Array.isArray(postsQuery.data)) {
      setPosts(postsQuery.data);
    }
  }, [postsQuery.data]);

  // ─── Merge posts + resources sorted by date ──────────────────────────────
  const feedItems = useMemo<FeedItem[]>(() => {
    const postItems: FeedPost[] = posts.map((p) => ({
      kind: "post",
      data: p,
      date: (p as any).createdAt || "",
    }));

    const resourceItems: FeedResource[] = ((resourcesQuery.data as Resource[]) || []).map((r) => ({
      kind: "resource",
      data: r,
      date: r.createdAt || "",
    }));

    return [...postItems, ...resourceItems].sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [posts, resourcesQuery.data]);

  const loadError = postsQuery.error
    ? (postsQuery.error as any)?.message || "Erreur de chargement du fil d'actualite"
    : null;

  const isInitialLoading = postsQuery.isLoading && posts.length === 0 && !postsQuery.data;

  const fetchPosts = async () => {
    const result = await postsQuery.refetch();
    setPosts((result.data || []) as any[]);
  };

  const handleLoadMore = () => {
    void handleRefresh();
  };

  const handleRefresh = async () => {
    setIsLoading(true);

    try {
      await Promise.all([fetchPosts(), resourcesQuery.refetch()]);
      setLastRefresh(new Date());

      toast({
        title: "Feed actualise",
        description: "Les contenus ont ete mis a jour",
        duration: 2000,
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de rafraichir le feed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostCreated = (createdPost: unknown) => {
    const mappedPost = mapPostToCard(createdPost as Record<string, unknown>);
    setPosts((prev) => [mappedPost, ...prev.filter((post) => post.id !== mappedPost.id)]);
  };

  return (
    <div className="min-h-screen bg-background">
      <WelcomeTeamModal />
      <div className={isMobile ? "w-full pt-3.5 pb-8" : "container max-w-7xl mx-auto"}>
        <div className={isMobile ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6 px-4"}>
          {/* Main Feed */}
          <div className={isMobile ? "w-full space-y-4" : "lg:col-span-8 xl:col-span-7 py-6 space-y-4 md:space-y-6"}>

            {/* Create Post */}
            <div className={cn("campus-animate-slide-up mb-2", isMobile && "px-3.5 sm:px-4")}>
              <CreatePost onPostCreated={handlePostCreated} />
            </div>

            {/* Suggestions carousel (mobile and screens without sidebar) */}
            <div className={cn(isMobile ? "block" : "lg:hidden")}>
              <FriendSuggestions />
            </div>

            {/* Feed */}
            <div>
              {loadError && (
                <div className={cn("mb-3", isMobile && "px-3.5 sm:px-4")}>
                  <div className="py-3 px-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                    {loadError}
                  </div>
                </div>
              )}
              {isInitialLoading ? (
                <div className={cn(isMobile && "px-3.5 sm:px-4 space-y-4")}>
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </div>
              ) : feedItems.length === 0 ? (
                <div className={cn(isMobile && "px-3.5 sm:px-4")}>
                  <EmptyState
                    icon={HomeIcon}
                    title="Fil d'actualite vide"
                    description="Il n'y a pas encore de contenus a afficher. Soyez le premier a partager quelque chose !"
                    actionLabel="Creer un post"
                    onAction={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  />
                </div>
              ) : (
                feedItems.map((item) => (
                  <div
                    key={item.kind === "post" ? `post-${item.data.id}` : `resource-${item.data.id}`}
                    className="campus-animate-fade-in"
                  >
                    {item.kind === "post" ? (
                      <PostCard post={item.data} />
                    ) : (
                      <ResourceFeedCard resource={item.data} />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Load More */}
            <div className="text-center py-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Chargement...
                  </>
                ) : (
                  "Charger plus..."
                )}
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Desktop Only */}
          {!isMobile && (
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-5 relative">
              <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain py-6 pr-2 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:hsl(var(--border))_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border/70 [&::-webkit-scrollbar-thumb]:rounded-full transition-colors">
                <FeedSidebar />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
