import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { FriendSuggestions } from "@/components/feed/FriendSuggestions";
import { FeedSidebar } from "@/components/layout/FeedSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { listPosts, listSpheres, getCurrentUser } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCw, Loader2, Users, MessageCircle, BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";



export function Home() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [popularSpheres, setPopularSpheres] = useState<any[]>([]);

  // Load current user
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await getCurrentUser();
        if (isMounted) setCurrentUser(data);
      } catch (e) {
        // User not logged in
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load popular spheres
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const spheres = await listSpheres();
        if (isMounted) {
          const sorted = (spheres || [])
            .sort((a: any, b: any) => (b.member_count || 0) - (a.member_count || 0))
            .slice(0, 3);
          setPopularSpheres(sorted);
        }
      } catch (e) {
        // Error loading spheres
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await listPosts();
        if (!isMounted) return;
        const mapped = (data || []).map((post: any) => ({
          id: String(post.id ?? post.uuid ?? Math.random()),
          author: {
            name: post.author?.name || post.author_name || "Utilisateur",
            avatar: post.author?.avatar || "/placeholder-avatar.jpg",
            username: post.author?.username || "user",
            isVerified: Boolean(post.author?.isVerified),
            impactScore: Number(post.author?.impactScore || 0),
          },
          content: post.content || post.text || "",
          timestamp: post.created_at || post.createdAt || new Date().toISOString(),
          likes: Number(post.stats?.likes || post.likes || 0),
          comments: Number(post.stats?.comments || post.comments || 0),
          category: post.category || "Général",
        }));
        setPosts(mapped);
      } catch (e: any) {
        setLoadError(e?.message || "Erreur de chargement du fil d'actualité");
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoadMore = () => {
    setIsLoading(true);
    
    // Simuler le chargement de nouveaux posts (placeholder)
    setTimeout(() => {
      const newPosts = [
        {
          id: `${posts.length + 1}`,
          author: {
            name: "Nouvel Utilisateur",
            avatar: "/placeholder-avatar.jpg",
            username: "nouveau_user",
            isVerified: false,
            impactScore: 100
          },
          impactScore: 25,
          content: "Nouveau post chargé dynamiquement ! 🚀",
          timestamp: "il y a 1h",
          likes: 5,
          comments: 1,
          category: "Général"
        }
      ];
      
      setPosts((prev) => prev);
      setIsLoading(false);
      
      toast({
        title: "Nouveaux posts chargés",
        description: `Nouveaux posts chargés`,
        duration: 2000,
      });
    }, 1500);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      const data = await listPosts();
      const mapped = (data || []).map((post: any) => ({
        id: String(post.id ?? post.uuid ?? Math.random()),
        author: {
          name: post.author?.name || post.author_name || "Utilisateur",
          avatar: post.author?.avatar || "/placeholder-avatar.jpg",
          username: post.author?.username || "user",
          isVerified: Boolean(post.author?.isVerified),
          impactScore: Number(post.author?.impactScore || 0),
        },
        content: post.content || post.text || "",
        timestamp: post.created_at || post.createdAt || new Date().toISOString(),
        likes: Number(post.stats?.likes || post.likes || 0),
        comments: Number(post.stats?.comments || post.comments || 0),
        category: post.category || "Général",
      }));
      setPosts(mapped);
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