import { useState, useEffect, useLayoutEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useParams, useNavigate } from "react-router-dom";
import { getPost } from "@/services/api";
import { PostCard } from "@/components/feed/PostCard";
import { CaretLeft as ChevronLeft, FileText } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mapPostToCard } from "@/lib/postCardMapper";
import { PostSkeleton } from "@/components/ui/skeletons";
import { parseSlugId, encodeHashId } from "@/lib/hashids";
import { getPostUrl } from "@/lib/utils";

export function PostDetail() {
  const { id: rawParam } = useParams();
  const realId = parseSlugId(rawParam) ?? rawParam;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Pre-emptive immediate address bar rewrite if rawParam is pure numeric
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !rawParam) return;
    if (/^\d+$/.test(rawParam)) {
      const parsed = Number(rawParam);
      if (Number.isInteger(parsed) && parsed > 0) {
        const hash = encodeHashId(parsed);
        if (hash && window.location.pathname !== `/posts/${hash}`) {
          window.history.replaceState(null, "", `/posts/${hash}`);
        }
      }
    }
  }, [rawParam]);

  const [post, setPost] = useState<any>(() => {
    if (!realId) return null;
    const direct = queryClient.getQueryData<any>(["post", realId]);
    if (direct) return mapPostToCard(direct);
    const homePosts = queryClient.getQueryData<any[]>(["home", "posts"]);
    const foundHome = (homePosts || []).find(
      (p: any) => String(p.id) === String(realId) || p.slug === realId || p.hash_id === realId
    );
    if (foundHome) return mapPostToCard(foundHome);
    const savedPosts = queryClient.getQueryData<any[]>(["saved-posts"]);
    const foundSaved = (savedPosts || []).find(
      (p: any) => String(p.id) === String(realId) || p.slug === realId || p.hash_id === realId
    );
    if (foundSaved) return mapPostToCard(foundSaved);
    return null;
  });

  const postQuery = useQuery({
    queryKey: ["post", realId],
    queryFn: () => getPost(String(realId)),
    enabled: Boolean(realId),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: () => {
      if (!realId) return undefined;
      const direct = queryClient.getQueryData<any>(["post", realId]);
      if (direct) return direct;
      const homePosts = queryClient.getQueryData<any[]>(["home", "posts"]);
      const foundHome = (homePosts || []).find(
        (p: any) => String(p.id) === String(realId) || p.slug === realId || p.hash_id === realId
      );
      if (foundHome) return foundHome;
      const savedPosts = queryClient.getQueryData<any[]>(["saved-posts"]);
      return (
        (savedPosts || []).find(
          (p: any) => String(p.id) === String(realId) || p.slug === realId || p.hash_id === realId
        ) ?? undefined
      );
    },
  });

  const loading = postQuery.isLoading && !post && !postQuery.data;

  useEffect(() => {
    if (postQuery.data) {
      const mapped = mapPostToCard(postQuery.data);
      setPost(mapped);

      // Replace URL with canonical slug + hashid
      if (typeof window !== "undefined" && window.history.replaceState) {
        const canonicalUrl = getPostUrl(mapped);
        if (canonicalUrl && window.location.pathname !== canonicalUrl) {
          window.history.replaceState(null, "", canonicalUrl);
        }
      }
    } else if (postQuery.error) {
      toast({
        title: "Erreur",
        description: (postQuery.error as any)?.message || "Impossible de charger le post",
        variant: "destructive",
      });
    }
  }, [postQuery.data, postQuery.error, toast]);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/home");
    }
  };

  const canonicalUrl = post ? getPostUrl(post) : `/posts/${rawParam}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-5 px-3.5 sm:px-4 space-y-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-9 px-3 rounded-xl transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Retour au fil d'actualité</span>
          </Button>
        </div>

        {loading ? (
          <div className="campus-animate-fade-in space-y-4">
            <PostSkeleton />
          </div>
        ) : post ? (
          <>
            <Helmet>
              <title>{post.content ? (post.content.length > 50 ? post.content.substring(0, 50) + "..." : post.content) : "Post"} - CampusSphere</title>
              <meta name="description" content={post.content ? (post.content.length > 160 ? post.content.substring(0, 160) + "..." : post.content) : "Découvrez ce post sur CampusSphere."} />
              <link rel="canonical" href={`https://campussphere.app${canonicalUrl}`} />
              <meta property="og:title" content={`Discussion sur CampusSphere - ${post.author?.name || "Étudiant"}`} />
              <meta property="og:description" content={post.content ? post.content.substring(0, 160) : "Rejoignez la discussion sur CampusSphere."} />
              <meta property="og:url" content={`https://campussphere.app${canonicalUrl}`} />
              <meta property="og:image" content={post.images?.[0] || "https://campussphere-storage-bucket.s3.us-east-1.amazonaws.com/CampusSphere-banner.png"} />
            </Helmet>

            <PostCard post={post} />

            {/* Guest CTA Banner for shared external visitors */}
            {!localStorage.getItem("access") && (
              <div className="mt-6 p-5 sm:p-6 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-foreground">Cette discussion vous intéresse ?</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm max-w-md leading-relaxed">
                    Rejoignez CampusSphere pour liker, commenter et participer aux échanges avec les étudiants de votre campus.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Button onClick={() => navigate("/register")} className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                    S'inscrire
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/login")} className="h-9 px-4 rounded-xl text-xs font-medium border-border/60 hover:bg-muted/50">
                    Connexion
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Post introuvable</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Ce post a peut-être été supprimé ou n'est plus accessible.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/home")} className="rounded-xl mt-2">
              Retour à l'accueil
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
