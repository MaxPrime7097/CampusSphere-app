import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { PostCard } from "@/components/feed/PostCard";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Button } from "@/components/ui/button";
import { Bookmark, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getSavedPosts, getSavedResources, savePost, saveResource, downloadResource } from "@/services/api";
import { normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { PostSkeleton, ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { getResourceUrl } from "@/lib/utils";

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
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-6 md:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Éléments enregistrés
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Retrouvez rapidement vos publications et ressources académiques mises de côté
          </p>
        </div>

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
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => <ResourceSkeleton key={i} />)}
              </div>
            ) : savedResources.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="Aucune ressource enregistrée"
                description="Les ressources que vous sauvegardez apparaîtront ici."
                actionLabel="Parcourir les ressources"
                onAction={() => navigate("/resources")}
              />
            ) : (
              <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {savedResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    isDownloading={downloadingIds.has(resource.id)}
                    isSaved={true}
                    onDownload={(e) => handleDownload(e, resource.id)}
                    onSave={(e) => handleUnsaveResource(e, resource.id)}
                    onPreview={(e) => { e.stopPropagation(); navigate(getResourceUrl(resource)); }}
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
