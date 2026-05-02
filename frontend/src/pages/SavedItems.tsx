import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { PostCard } from "@/components/feed/PostCard";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getSavedPosts, getSavedResources, savePost, saveResource, downloadResource } from "@/services/api";
import { normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { PostSkeleton, ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";

export function SavedItems() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedResources, setSavedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

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
            viewCount: r.viewCount || r.view_count || 0,
            downloadCount: r.downloadCount || r.download_count || 0,
          }));
          setSavedResources(mapped);
        }
      } catch (e: any) {
        // silent
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleDownload = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    if (downloadingIds.has(resourceId)) return;
    setDownloadingIds((prev) => new Set(prev).add(resourceId));
    try {
      await downloadResource(resourceId);
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Téléchargement échoué", variant: "destructive" });
    } finally {
      setDownloadingIds((prev) => { const next = new Set(prev); next.delete(resourceId); return next; });
    }
  };

  const handleUnsaveResource = async (e: React.MouseEvent, resourceId: string) => {
    e.stopPropagation();
    try {
      await saveResource(resourceId);
      setSavedResources((prev) => prev.filter((r) => r.id !== resourceId));
      toast({ title: "Ressource retirée des sauvegardes", duration: 2000 });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message, variant: "destructive" });
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
              <>
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : savedPosts.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Aucun post enregistré"
                description="Les posts que vous enregistrez apparaîtront ici."
              />
            ) : (
              savedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onToggleSave={(saved) => {
                    if (!saved) setSavedPosts((prev) => prev.filter((p) => p.id !== post.id));
                  }}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resources">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <ResourceSkeleton key={i} />)}
              </div>
            ) : savedResources.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucune ressource enregistrée"
                description="Les ressources que vous sauvegardez apparaîtront ici."
                actionLabel="Parcourir les ressources"
                onAction={() => navigate("/resources")}
              />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {savedResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isDownloading={downloadingIds.has(resource.id)}
                    isSaved={true}
                    onDownload={(e) => handleDownload(e, resource.id)}
                    onSave={(e) => handleUnsaveResource(e, resource.id)}
                    onPreview={(e) => { e.stopPropagation(); navigate(`/resources/${resource.id}?mode=preview`); }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
