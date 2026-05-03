import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { getPost } from "@/services/api";
import { PostCard } from "@/components/feed/PostCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronLeft, Zap } from "lucide-react";
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
          <>
            <Helmet>
              <title>{post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + "..." : post.content) : "Post"} - CampusSphere</title>
              <meta name="description" content={post.content ? (post.content.length > 160 ? post.content.substring(0, 160) + "..." : post.content) : "Découvrez ce post sur CampusSphere."} />
              <link rel="canonical" href={`https://campussphere.app/posts/${id}`} />
              <meta property="og:title" content={`Discussion sur CampusSphere - ${post.author?.name || "Étudiant"}`} />
              <meta property="og:description" content={post.content ? post.content.substring(0, 160) : "Rejoignez la discussion sur CampusSphere."} />
              <meta property="og:url" content={`https://campussphere.app/posts/${id}`} />
              <meta property="og:image" content={post.images?.[0] || "https://campussphere-storage-bucket.s3.us-east-1.amazonaws.com/CampusSphere-banner.png"} />
            </Helmet>
            <PostCard post={post} />
            
            {/* Guest CTA Banner */}
            {!localStorage.getItem("access") && (
              <Card className="mt-8 border-primary/50 bg-primary/5 campus-animate-slide-up overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Zap className="h-24 w-24 text-primary fill-current -rotate-12 translate-x-8 -translate-y-8" />
                </div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-7 w-7 text-primary fill-current" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">Cette discussion vous intéresse ?</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                          Rejoignez CampusSphere pour liker, commenter et participer aux échanges avec les autres étudiants de votre campus.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <Button onClick={() => navigate("/register")} className="campus-gradient text-white px-8 h-11">
                        S'inscrire gratuitement
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/login")} className="h-11">
                        Connexion
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
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
