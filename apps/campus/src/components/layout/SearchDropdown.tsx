import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "@/services/api";
import { getEvents } from "@/services/eventService";
import { Loader2, BadgeCheck, FileText, BookOpen, FileCode, Zap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/date";
import { getSphereCategoryLabel } from "@/constants/sphereCategories";
import { useQuery } from "@tanstack/react-query";

interface SearchDropdownProps {
  query: string;
  isVisible: boolean;
  onClose: () => void;
}

const RESOURCE_TYPE_STYLES: Record<string, { icon: string; bg: string }> = {
  notes: { icon: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  resumes: { icon: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20" },
  exercises: { icon: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  exam_papers: { icon: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
  annales: { icon: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  projects: { icon: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20" },
  presentations: { icon: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20" },
  other: { icon: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
};

function getResourceStyle(type?: string) {
  if (!type) return RESOURCE_TYPE_STYLES.other;
  return RESOURCE_TYPE_STYLES[type.toLowerCase()] || RESOURCE_TYPE_STYLES.other;
}

function getResourceIcon(type?: string, className = "h-4 w-4") {
  const key = (type || "").toLowerCase();
  switch (key) {
    case "notes":
      return <BookOpen className={className} />;
    case "exercises":
      return <FileCode className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function SearchDropdown({ query, isVisible, onClose }: SearchDropdownProps) {
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const [results, setResults] = useState<{
    users: any[];
    posts: any[];
    events: any[];
    resources: any[];
    spheres: any[];
  }>({
    users: [],
    posts: [],
    events: [],
    resources: [],
    spheres: [],
  });

  const searchQuery = useQuery({
    queryKey: ["search-dropdown", normalizedQuery],
    queryFn: async () => {
      const [searchRes, eventsRes] = await Promise.all([
        globalSearch(query, "all", 4),
        getEvents({ search: query }).catch((): any[] => []),
      ]);
      return {
        search: searchRes,
        events: Array.isArray(eventsRes) ? eventsRes.slice(0, 3) : [],
      };
    },
    enabled: isVisible && normalizedQuery.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (!normalizedQuery || !isVisible) {
      setResults({ users: [], posts: [], events: [], resources: [], spheres: [] });
      return;
    }

    if (searchQuery.data) {
      const searchData = searchQuery.data.search?.data || {};
      setResults({
        users: (searchData.users || []).slice(0, 3),
        posts: (searchData.posts || []).slice(0, 2),
        events: searchQuery.data.events || [],
        resources: (searchData.resources || []).slice(0, 3),
        spheres: (searchData.spheres || []).slice(0, 3),
      });
    }
  }, [isVisible, normalizedQuery, searchQuery.data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!isVisible || (!query.trim() && !searchQuery.isLoading)) return null;

  const totalCount =
    results.users.length +
    results.posts.length +
    results.events.length +
    results.resources.length +
    results.spheres.length;
  const hasResults = totalCount > 0;

  const handleResultClick = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <div className="max-h-[460px] overflow-y-auto custom-scrollbar p-2.5 divide-y divide-border/30">
        {searchQuery.isLoading ? (
          <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span>Recherche en cours...</span>
          </div>
        ) : !hasResults ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm font-medium">Aucun résultat trouvé pour « {query} »</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Appuyez sur Entrée pour lancer une recherche complète.</p>
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {/* 1. Utilisateurs */}
            {results.users.length > 0 && (
              <div className="space-y-1">
                <div className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Personnes
                </div>
                <div className="space-y-0.5">
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleResultClick(`/profile/${user.username}`)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group cursor-pointer"
                    >
                      <Avatar className="h-8 w-8 rounded-full shrink-0 border border-border/40">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs font-semibold bg-muted text-muted-foreground">
                          {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-foreground truncate group-hover:underline">
                            {user.name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}
                          </span>
                          {(user.is_verified || user.isVerified) && (
                            <BadgeCheck className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Publications */}
            {results.posts.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Publications
                </div>
                <div className="space-y-1">
                  {results.posts.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => handleResultClick(`/posts/${post.id}`)}
                      className="w-full p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group cursor-pointer space-y-1"
                    >
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed group-hover:underline">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">Par {post.author_info?.name || post.author_info?.username || "Auteur"}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Zap className="h-3 w-3 text-amber-500" />
                          {post.impact_score || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Événements */}
            {results.events.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Événements
                </div>
                <div className="space-y-1">
                  {results.events.map((evt) => {
                    const startDate = evt.startDate ? new Date(evt.startDate) : new Date();
                    const day = !isNaN(startDate.getTime()) ? startDate.getDate() : 1;
                    const month = !isNaN(startDate.getTime())
                      ? startDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()
                      : "EVT";

                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => handleResultClick(`/events/${evt.id}`)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex flex-col items-center justify-center h-8 w-8 rounded-lg bg-muted border border-border/40 shrink-0">
                          <span className="text-[11px] font-bold text-foreground leading-none">{day}</span>
                          <span className="text-[8px] font-semibold text-muted-foreground uppercase leading-none mt-0.5">{month}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate group-hover:underline">
                            {evt.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {evt.isOnline ? "En ligne" : (evt.location || "Campus")}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Ressources */}
            {results.resources.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Ressources
                </div>
                <div className="space-y-1">
                  {results.resources.map((res) => {
                    const style = getResourceStyle(res.type);
                    return (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => handleResultClick(`/resources/${res.id}`)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group cursor-pointer"
                      >
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border", style.bg, style.icon)}>
                          {getResourceIcon(res.type, "h-4 w-4")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate group-hover:underline">
                            {res.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">{res.subject || "Document"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Sphères */}
            {results.spheres.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Sphères
                </div>
                <div className="space-y-1">
                  {results.spheres.map((sphere) => (
                    <button
                      key={sphere.id}
                      type="button"
                      onClick={() => handleResultClick(`/spheres/${sphere.id}`)}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left group cursor-pointer"
                    >
                      <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-border/40">
                        <AvatarImage src={sphere.avatar || undefined} />
                        <AvatarFallback className="rounded-lg bg-muted text-muted-foreground font-semibold text-xs">
                          {sphere.name?.[0]?.toUpperCase() || "S"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:underline">
                          {sphere.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {sphere.category
                            ? (getSphereCategoryLabel(String(sphere.category).trim().toLowerCase()) || "Sphère")
                            : "Sphère"} · {sphere.member_count ?? sphere.memberCount ?? 0} membres
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-2.5 border-t border-border/40 bg-muted/20 flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleResultClick(`/search?q=${encodeURIComponent(query)}`)}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>Voir tous les résultats pour « {query} »</span>
        </button>
        <span className="text-[10px] text-muted-foreground bg-muted border border-border/50 px-1.5 py-0.5 rounded-md font-mono">
          ↵ Entrée
        </span>
      </div>
    </div>
  );
}
