import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost } from "@/services/api";
import { PostCard } from "@/components/feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mapPostToCard } from "@/lib/postCardMapper";
import { PostSkeleton } from "@/components/ui/skeletons";

export function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        const data = await getPost(id);
        if (mounted) setPost(mapPostToCard(data));
      } catch (error: any) {
        toast({
          title: "Erreur",
          description: error?.message || "Impossible de charger le post",
          variant: "destructive",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-3xl mx-auto py-6 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Retour
        </Button>

        {loading ? (
          <div className="campus-animate-fade-in">
            <PostSkeleton />
          </div>
        ) : post ? (
          <PostCard post={mapPostToCard(post)} />
        ) : (
          <Card className="campus-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              Post introuvable.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
