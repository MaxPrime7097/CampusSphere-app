import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Calendar, ShoppingBag, Loader2 } from "lucide-react";
import { getSavedPosts, getSavedResources } from "@/services/api";

export function SavedItems() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedResources, setSavedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [posts, resources] = await Promise.all([getSavedPosts(), getSavedResources()]);
        if (isMounted) {
          const mappedPosts = (posts || []).map((post: any) => ({
            id: String(post.id),
            author: {
              name: post.author?.name || "Utilisateur",
              avatar: post.author?.avatar || "/placeholder-avatar.jpg",
              username: post.author?.username || "user",
            },
            content: post.content || "",
            createdAt: post.createdAt || post.created_at || null,
            likes: Number(post.likesCount ?? post.likes_count ?? 0),
            comments: Number(post.commentsCount ?? post.comments_count ?? 0),
            category: post.category || "Général",
            impactScore: Number(post.impactScore ?? post.impact_score ?? 0),
            isLiked: Boolean(post.isLiked ?? post.is_liked),
            isSaved: true,
          }));
          setSavedPosts(mappedPosts);

          // Map saved resources
          const mapped = (resources || []).map((r: any) => ({
            id: String(r.id),
            title: r.title,
            description: r.description || '',
            subject: r.subject || 'other',
            type: r.type || 'notes',
            authorName: r.author?.name || r.author_info?.name || r.author_name || 'Unknown',
            fileUrl: r.fileUrl || r.file_url || r.file || '',
            fileSize: r.fileSize || r.file_size || '0 MB',
            tags: r.tags || [],
            impactScore: r.impactScore || r.impact_score || 0,
            createdAt: r.createdAt || r.created_at || null,
          }));
          setSavedResources(mapped);
        }
      } catch (e: any) {
        // Error loading saved items
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground mb-6">
          Éléments enregistrés
        </h1>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="resources">Ressources</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {loading ? (
              <Card className="campus-card">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Chargement...</p>
                </CardContent>
              </Card>
            ) : savedPosts.length === 0 ? (
              <Card className="campus-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucun post enregistré
                </CardContent>
              </Card>
            ) : (
              savedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </TabsContent>

          <TabsContent value="resources">
            {loading ? (
              <Card className="campus-card">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Chargement...</p>
                </CardContent>
              </Card>
            ) : savedResources.length === 0 ? (
              <Card className="campus-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucune ressource enregistrée
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedResources.map((resource) => (
                  <Card key={resource.id} className="campus-card">
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
