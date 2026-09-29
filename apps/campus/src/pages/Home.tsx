import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { FriendSuggestions } from "@/components/feed/FriendSuggestions";
import { FeedSidebar } from "@/components/layout/FeedSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { listPosts, listSpheres } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HomeIcon, RefreshCw, Loader2, Users, MessageCircle, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { mapPostToCard } from "@/lib/postCardMapper";
import { PostSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";
import type { PostCardData, Sphere } from "@/types";

export function Home() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (Array.isArray(postsQuery.data)) {
      setPosts(postsQuery.data);
    }
  }, [postsQuery.data]);

  const loadError = postsQuery.error
    ? (postsQuery.error as any)?.message || "Erreur de chargement du fil d'actualité"
    : null;

  const isInitialLoading = postsQuery.isLoading && posts.length === 0 && !postsQuery.data;

  const popularSpheres = spheresQuery.data || [];

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
      await fetchPosts();
      setLastRefresh(new Date());

      toast({
        title: "Feed actualisé",
        description: "Les posts ont été mis à jour",
        duration: 2000,
      });
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de rafraîchir le feed",
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
      <div className={isMobile ? "w-full pt-3.5 pb-8" : "container max-w-7xl mx-auto"}>
        <div className={isMobile ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6 px-4"}>
          {/* Main Feed - Center (Global scroll, no internal scrollbar) */}
          <div className={isMobile ? "w-full space-y-4" : "lg:col-span-8 xl:col-span-7 py-6 space-y-4 md:space-y-6"}>

            {/* Create Post */}
            <div className={cn("campus-animate-slide-up mb-2", isMobile && "px-3.5 sm:px-4")}>
              <CreatePost onPostCreated={handlePostCreated} />
            </div>

            {/* Posts Feed */}
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
              ) : posts.length === 0 ? (
                <div className={cn(isMobile && "px-3.5 sm:px-4")}>
                  <EmptyState
                    icon={HomeIcon}
                    title="Fil d'actualité vide"
                    description="Il n'y a pas encore de posts à afficher. Soyez le premier à partager quelque chose !"
                    actionLabel="Créer un post"
                    onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  />
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.id}
                    className="campus-animate-fade-in"
                  >
                    <PostCard post={post} />
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
                  "Charger plus de posts..."
                )}
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Desktop Only (Fixed sticky to viewport below header) */}
          {!isMobile && (
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-5 relative">
              <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto overscroll-contain py-6 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden hover:[scrollbar-width:thin] hover:[&::-webkit-scrollbar]:block">
                <FeedSidebar />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
