import { CreatePost } from "@/components/feed/CreatePost";
import { PostCard } from "@/components/feed/PostCard";
import { FriendSuggestions } from "@/components/feed/FriendSuggestions";
import { FeedSidebar } from "@/components/layout/FeedSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect, useMemo } from "react";
import { mockDB } from "@/services/mockDatabaseService";
import { mockDatabase } from "@/data/mockDatabase";
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

  // Charger l'utilisateur actuel
  useEffect(() => {
    mockDB.loadCurrentUser();
  }, []);

  const currentUser = mockDB.getCurrentUser();
  
  // Obtenir les posts globaux et les sphères populaires depuis le mock database
  const allSpheres = mockDB.getAllSpheres();
  
  // Trier les sphères par nombre de membres pour avoir les plus populaires
  const popularSpheres = allSpheres
    .sort((a, b) => b.memberCount - a.memberCount)
    .slice(0, 3);
  
  // Transformer les posts du mock database pour PostCard
  const transformedPosts = useMemo(() => {
    const globalPosts = mockDB.getGlobalPosts();
    return globalPosts.map(post => ({
      id: post.id,
      author: {
        name: mockDB.getUser(post.authorId)?.name || 'Utilisateur',
        avatar: mockDB.getUser(post.authorId)?.avatar || '/placeholder-avatar.jpg',
        username: mockDB.getUser(post.authorId)?.username || 'user',
        isVerified: mockDB.getUser(post.authorId)?.isVerified || false,
        impactScore: mockDB.getUser(post.authorId)?.impactScore || 0
      },
      content: post.content,
      timestamp: new Date(post.createdAt).toLocaleDateString('fr-FR'),
      likes: post.stats.likes,
      comments: post.stats.comments,
      category: 'Général'
    }));
  }, []); // Empty dependency array since we want this to run only once
  
  const [posts, setPosts] = useState(transformedPosts);

  const handleLoadMore = () => {
    setIsLoading(true);
    
    // Simuler le chargement de nouveaux posts
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
      
      // Simuler l'ajout de nouveaux posts depuis le mock database
      const globalPosts = mockDB.getGlobalPosts();
      const updatedPosts = globalPosts.map(post => ({
        id: post.id,
        author: {
          name: mockDB.getUser(post.authorId)?.name || 'Utilisateur',
          avatar: mockDB.getUser(post.authorId)?.avatar || '/placeholder-avatar.jpg',
          username: mockDB.getUser(post.authorId)?.username || 'user',
          isVerified: mockDB.getUser(post.authorId)?.isVerified || false,
          impactScore: mockDB.getUser(post.authorId)?.impactScore || 0
        },
        content: post.content,
        timestamp: new Date(post.createdAt).toLocaleDateString('fr-FR'),
        likes: post.stats.likes,
        comments: post.stats.comments,
        category: 'Général'
      }));
      setPosts(updatedPosts);
      setIsLoading(false);
      
      toast({
        title: "Nouveaux posts chargés",
        description: `Nouveaux posts chargés`,
        duration: 2000,
      });
    }, 1500);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simuler un refresh
    setTimeout(() => {
      const globalPosts = mockDB.getGlobalPosts();
      const refreshedPosts = globalPosts.map(post => ({
        id: post.id,
        author: {
          name: mockDB.getUser(post.authorId)?.name || 'Utilisateur',
          avatar: mockDB.getUser(post.authorId)?.avatar || '/placeholder-avatar.jpg',
          username: mockDB.getUser(post.authorId)?.username || 'user',
          isVerified: mockDB.getUser(post.authorId)?.isVerified || false,
          impactScore: mockDB.getUser(post.authorId)?.impactScore || 0
        },
        content: post.content,
        timestamp: new Date(post.createdAt).toLocaleDateString('fr-FR'),
        likes: post.stats.likes,
        comments: post.stats.comments,
        category: 'Général'
      }));
      setPosts(refreshedPosts);
      setLastRefresh(new Date());
      setIsLoading(false);
      
      toast({
        title: "Feed actualisé",
        description: "Les posts ont été mis à jour",
        duration: 2000,
      });
    }, 1000);
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