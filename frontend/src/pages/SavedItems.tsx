import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { PostCard } from "@/components/feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, ShoppingBag, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSavedPosts, getSavedResources, savePost, saveResource } from "@/services/api";
import { getSubjectLabel, getTypeLabel, normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { formatFileSize } from "@/lib/utils";

export function SavedItems() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedResources, setSavedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
            files: post.files || [],
            image: post.image || null,
            canEdit: Boolean(post.canEdit ?? post.can_edit),
            canDelete: Boolean(post.canDelete ?? post.can_delete),
          }));
          setSavedPosts(mappedPosts);

          // Map saved resources
          const mapped = (resources || []).map((r: any) => ({
            id: String(r.id),
            title: r.title,
            description: r.description || '',
            subject: normalizeSubject(r.subject),
            type: normalizeResourceType(r.type),
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

  const handleRemoveSavedPost = async (postId: string) => {
    try {
      await savePost(postId);
      setSavedPosts((prev) => prev.filter((post) => post.id !== postId));

      toast({
        title: "Post retiré des sauvegardes",
        description: "Le post a été retiré de vos éléments enregistrés",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de retirer ce post des sauvegardes",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSavedResource = async (resourceId: string) => {
    try {
      await saveResource(resourceId);
      setSavedResources((prev) => prev.filter((resource) => resource.id !== resourceId));
      toast({
        title: "Ressource retirée des sauvegardes",
        description: "La ressource a été retirée de vos éléments enregistrés",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de retirer cette ressource des sauvegardes",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-4xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold bg-clip-text text-muted-foreground mb-6">
          Éléments enregistrés
        </h1>

        <Tabs defaultValue="posts" className="w-full">
          <SharedTabsList containerClassName="mb-6">
            <SharedTabsTrigger value="posts">Posts</SharedTabsTrigger>
            <SharedTabsTrigger value="resources">Ressources</SharedTabsTrigger>
          </SharedTabsList>

          <TabsContent value="posts" className="space-y-4">
            {loading ? (
              <Card className="campus-card mobile-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucun post enregistré
                </CardContent>
              </Card>
            ) : (
              savedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleSave={(saved) => {
                    if (!saved) {
                      setSavedPosts((prev) => prev.filter((p) => p.id !== post.id));
                    }
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resources">
            {loading ? (
              <Card className="campus-card mobile-card">
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Chargement...</p>
                </CardContent>
              </Card>
            ) : savedResources.length === 0 ? (
              <Card className="campus-card mobile-card">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Aucune ressource enregistrée
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {savedResources.map((resource) => (
                  <Card key={resource.id} className="campus-card mobile-card">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{resource.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                          <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-2">
                            <span>Type: {getTypeLabel(resource.type)}</span>
                            <span>Matière: {getSubjectLabel(resource.subject)}</span>
                            <span>Taille: {formatFileSize(resource.fileSize)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleRemoveSavedResource(resource.id)}>
                            Retirer
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => window.location.assign(`/resources/${resource.id}`)}>
                            Voir
                          </Button>
                        </div>
                      </div>
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
