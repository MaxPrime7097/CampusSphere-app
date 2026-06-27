import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { FriendSuggestions } from "@/components/feed/FriendSuggestions";
import { FeedSidebar } from "@/components/layout/FeedSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { listPosts, listSpheres } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HomeIcon, RefreshCw, Loader2, Users, MessageCircle, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { mapPostToCard } from "@/lib/postCardMapper";
import { PostSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery } from "@tanstack/react-query";

export function Home() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const spheresQuery = useQuery({
    queryKey: ["home", "popular-spheres"],
    queryFn: listSpheres,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (spheres) =>
      [...(Array.isArray(spheres) ? spheres : [])]
        .sort((a: any, b: any) => (b.member_count || 0) - (a.member_count || 0))
        .slice(0, 3),
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const postsQuery = useQuery({
    queryKey: ["home", "posts"],
    queryFn: listPosts,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) => (data || []).map(mapPostToCard),
  });

  useEffect(() => {
    if (Array.isArray(postsQuery.data)) {
      setPosts(postsQuery.data);
      setLoadError(null);
      setIsInitialLoading(false);
      return;
    }

    if (postsQuery.isLoading) {
      setIsInitialLoading(true);
      return;
    }

    if (postsQuery.error) {
      setLoadError((postsQuery.error as any)?.message || "Erreur de chargement du fil d'actualité");
      setIsInitialLoading(false);
    }
  }, [postsQuery.data, postsQuery.error, postsQuery.isLoading]);

  const popularSpheres = spheresQuery.data || [];

  const fetchPosts = async () => {
    const result = await postsQuery.refetch();
    setPosts((result.data || []) as any[]);
    setLoadError(null);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className={isMobile ? "" : "container max-w-7xl mx-auto"}>
        <div className={isMobile ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 md:py-6 px-3 md:px-4"}>
          {/* Main Feed - Center */}
          <div className={isMobile ? "w-full" : "lg:col-span-8 xl:col-span-7 space-y-4 md:space-y-6"}>

            {/* Create Post */}
            <div className="campus-animate-slide-up">
              <CreatePost onPostCreated={handlePostCreated} />
            </div>

            {/* Posts Feed */}
            <div className={isMobile ? "space-y-0" : "space-y-4"}>
              {loadError && (
                <Card className="border-destructive/30">
                  <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
                </Card>
              )}
              {isInitialLoading ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : posts.length === 0 ? (
                <EmptyState
                  icon={HomeIcon}
                  title="Fil d'actualité vide"
                  description="Il n'y a pas encore de posts à afficher. Soyez le premier à partager quelque chose !"
                  actionLabel="Créer un post"
                  onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                />
              ) : (
                posts.map((post, index) => (
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
                className="text-primary hover:text-primary-light font-medium"
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

          {/* Right Sidebar - Desktop Only */}
          {!isMobile && (
            <div className="hidden lg:block lg:col-span-4 xl:col-span-5">
              <FeedSidebar />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
