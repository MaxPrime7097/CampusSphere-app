import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { SharedTabsList, SharedTabsTrigger } from "@/components/ui/shared-tabs";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Button } from "@/components/ui/button";
import { Bookmark, BookOpen, MessageCircle, Zap, BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getSavedPosts, getSavedResources, savePost, saveResource, downloadResource } from "@/services/api";
import { normalizeResourceType, normalizeSubject } from "@/lib/resourceMetadata";
import { ResourceSkeleton } from "@/components/ui/skeletons";
import { EmptyState } from "@/components/ui/empty-state";
import { getResourceUrl } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";

function SavedPostSkeleton() {
  return (
    <div className="flex items-start gap-3 sm:gap-4 p-4 rounded-xl border border-border/40 bg-card/20 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-muted/60 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-1/3 bg-muted/60 rounded" />
        <div className="h-3 w-4/5 bg-muted/60 rounded" />
        <div className="h-3 w-1/4 bg-muted/60 rounded" />
      </div>
      <div className="h-14 w-14 rounded-lg bg-muted/40 shrink-0" />
    </div>
  );
}

interface SavedPostItemProps {
  post: any;
  onUnsave: (e: React.MouseEvent) => void;
  onClick: () => void;
}

function SavedPostItem({ post, onUnsave, onClick }: SavedPostItemProps) {
  const thumbnail = post.files?.find((f: any) => {
    const type = (f.type || "").toLowerCase();
    const ext = (f.name?.split(".").pop() || "").toLowerCase();
    return type.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(ext);
  })?.url || post.image;

  return (
    <div
      onClick={onClick}
      className="group flex items-start justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-muted/30 hover:border-border transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
          <AvatarImage src={post.author.avatar} />
          <AvatarFallback className="bg-muted text-muted-foreground font-semibold text-xs">
            {post.author.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-xs sm:text-sm text-foreground truncate group-hover:underline">
              {post.author.name}
            </span>
            {post.author.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
            )}
            <span className="text-xs text-muted-foreground/50">·</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {post.createdAt ? formatRelativeTime(post.createdAt) : "Récemment"}
            </span>
            {post.category && post.category.toLowerCase() !== "général" && post.category.toLowerCase() !== "general" && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                {post.category}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-foreground/90 line-clamp-2 leading-relaxed">
            {post.content}
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium">
              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
              {post.impactScore}
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <MessageCircle className="h-3.5 w-3.5" />
              {post.comments}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {thumbnail && (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted border border-border/30 shrink-0">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onUnsave}
          title="Retirer des enregistrements"
        >
          <Bookmark className="h-4 w-4 fill-primary text-primary" />
        </Button>
      </div>
    </div>
  );
}

export function SavedItems() {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedResources, setSavedResources] = useState<any[]>([]);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const savedPostsQuery = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => getSavedPosts(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const savedResourcesQuery = useQuery({
    queryKey: ["saved-resources"],
    queryFn: () => getSavedResources(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const loading =
    (savedPostsQuery.isLoading || savedResourcesQuery.isLoading) &&
    savedPosts.length === 0 &&
    savedResources.length === 0 &&
    !savedPostsQuery.data &&
    !savedResourcesQuery.data;

  useEffect(() => {
    if (savedPostsQuery.data) {
      const mappedPosts = (savedPostsQuery.data || []).map((post: any) => ({
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
    }
  }, [savedPostsQuery.data]);

  useEffect(() => {
    if (savedResourcesQuery.data) {
      const mapped = (savedResourcesQuery.data || []).map((r: any) => ({
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
  }, [savedResourcesQuery.data]);

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

  const handleUnsavePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await savePost(postId);
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({
        title: "Post retiré des sauvegardes",
        description: "Le post a été retiré de vos enregistrements",
        duration: 2000,
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de retirer le post",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-6 md:py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-300">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Éléments enregistrés
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Retrouvez rapidement vos publications et ressources académiques mises de côté
          </p>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <SharedTabsList containerClassName="mb-6">
            <SharedTabsTrigger value="posts">Posts</SharedTabsTrigger>
            <SharedTabsTrigger value="resources">Ressources</SharedTabsTrigger>
          </SharedTabsList>

          <TabsContent value="posts" className="space-y-3">
            {loading ? (
              <>
                <SavedPostSkeleton />
                <SavedPostSkeleton />
                <SavedPostSkeleton />
              </>
            ) : savedPosts.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Aucun post enregistré"
                description="Les posts que vous enregistrez apparaîtront ici."
              />
            ) : (
              savedPosts.map((post) => (
                <SavedPostItem
                  key={post.id}
                  post={post}
                  onClick={() => navigate(`/posts/${post.id}`)}
                  onUnsave={(e) => handleUnsavePost(e, post.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resources">
            {loading ? (
              <div className="flex flex-col">
                {Array.from({ length: 6 }).map((_, i) => <ResourceSkeleton key={i} />)}
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
              <div className="flex flex-col">
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
