/* eslint-disable @typescript-eslint/no-explicit-any */
import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { FriendSuggestions } from "@/components/feed/FriendSuggestions";
import { FeedSidebar } from "@/components/layout/FeedSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { postService } from "@/services/api/contentServices";
import { sphereService } from "@/services/api/sphereService";
import { authService } from "@/services/api/authService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Loader2, Users, MessageCircle, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User, Sphere, Post, PostCardProps, ApiError } from "@/types/api";



export function Home() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [popularSpheres, setPopularSpheres] = useState<Sphere[]>([]);

  // Load current user
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const response = await authService.getCurrentUser();
        if (isMounted && response) {
          setCurrentUser(response);
        }
      } catch (error) {
        const err = error as ApiError;
        console.error('Error loading current user:', err);
        // Utilisateur non connecté - on ne montre pas d'erreur
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Load popular spheres
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        const spheres = await sphereService.getAllSpheres();
        if (isMounted) {
          const sorted = [...(spheres || [])]
            .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
            .slice(0, 3);
          setPopularSpheres(sorted);
        }
      } catch (error) {
        const err = error as ApiError;
        console.error('Error loading popular spheres:', err);
        toast({
          title: "Erreur",
          description: "Impossible de charger les sphères populaires",
          variant: "destructive"
        });
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [toast]);
  
  const [posts, setPosts] = useState<PostCardProps[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    (async () => {
      try {
  const data = await postService.getPosts();
        if (!isMounted) return;
        
        const mapped = (data || []).map((post: any) => ({
          id: String(post.id),
          author: {
            id: post.author?.id,
            name: post.author?.full_name || post.author?.name || "Utilisateur",
            avatar: post.author?.avatar_url || "/placeholder-avatar.jpg",
            username: post.author?.username,
            isVerified: Boolean(post.author?.is_verified),
            impactScore: Number(post.author?.impact_score || 0),
          },
          content: post.content,
          timestamp: post.created_at,
          likes: Number(post.stats?.likes_count || 0),
          comments: Number(post.stats?.comments_count || 0),
          category: post.category,
          sphere: post.sphere ? {
            id: post.sphere.id,
            name: post.sphere.name,
            color: post.sphere.color
          } : null,
          attachments: post.attachments || [],
          tags: post.tags || []
        }));
        
        setPosts(mapped);
      } catch (e: any) {
        console.error("Erreur lors du chargement des posts:", e);
        setLoadError(e?.message || "Une erreur est survenue lors du chargement des posts");
        toast({
          title: "Erreur",
          description: "Impossible de charger le fil d'actualité",
          variant: "destructive"
        });
      }
    })();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [toast]);

  const handleLoadMore = async () => {
    setIsLoading(true);
    
    try {
  // On pourrait ajouter un paramètre offset/page à l'API pour la pagination
  const data = await postService.getPosts();
      
      if (data && data.length > 0) {
        // Map API Post to PostCardProps
        const newPosts = data.map(post => ({
          id: String(post.id),
          author: {
            id: post.author.id,
            name: post.author.full_name,
            avatar: post.author.avatar_url || "/placeholder-avatar.jpg",
            username: post.author.username,
            isVerified: post.author.is_verified,
            impactScore: post.author.impact_score
          },
          content: post.content,
          timestamp: post.created_at,
          likes: post.stats.likes_count,
          comments: post.stats.comments_count,
          category: post.category,
          sphere: post.sphere ? {
            id: post.sphere.id,
            name: post.sphere.name,
            color: post.sphere.color
          } : undefined,
          attachments: post.attachments,
          tags: post.tags
        }));

        setPosts(prev => [...prev, ...newPosts]);
        toast({
          title: "Nouveaux posts chargés",
          description: `${newPosts.length} nouveaux posts ont été chargés`,
          duration: 2000,
        });
      } else {
        toast({
          title: "Plus de posts",
          description: "Tous les posts ont été chargés",
          duration: 2000,
        });
      }
    } catch (error) {
      const err = error as ApiError;
      console.error('Error loading more posts:', err);
      toast({
        title: "Erreur",
        description: "Impossible de charger plus de posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
  const data = await postService.getPosts();
      
      // Map API Post to PostCardProps
      const mapped = data.map(post => ({
        id: String(post.id),
        author: {
          id: post.author.id,
          name: post.author.full_name,
          avatar: post.author.avatar_url || "/placeholder-avatar.jpg",
          username: post.author.username,
          isVerified: post.author.is_verified,
          impactScore: post.author.impact_score
        },
        content: post.content,
        timestamp: post.created_at,
        likes: post.stats.likes_count,
        comments: post.stats.comments_count,
        category: post.category,
        sphere: post.sphere ? {
          id: post.sphere.id,
          name: post.sphere.name,
          color: post.sphere.color
        } : undefined,
        attachments: post.attachments,
        tags: post.tags
      }));
      
      setPosts(mapped);
      setLastRefresh(new Date());
      
      toast({
        title: "Feed actualisé",
        description: "Les posts ont été mis à jour",
        duration: 2000,
      });
    } catch (error) {
      const err = error as ApiError;
      console.error('Error refreshing posts:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser le feed",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className={isMobile ? "" : "container max-w-7xl mx-auto"}>
        <div className={isMobile ? "w-full" : "grid grid-cols-1 lg:grid-cols-12 gap-6 py-4 md:py-6 px-3 md:px-4"}>
          {/* Main Feed - Center */}
          <div className={isMobile ? "w-full" : "lg:col-span-8 xl:col-span-7 space-y-4 md:space-y-6"}>

        {/* Create Post */}
        <div className="campus-animate-slide-up">
          <CreatePost />
        </div>

        {/* Posts Feed */}
        <div className={isMobile ? "space-y-0" : "space-y-4"}>
          {posts.map((post, index) => (
            <div 
              key={post.id} 
              className="campus-animate-fade-in"
            >
              <PostCard post={post} />
            </div>
          ))}
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