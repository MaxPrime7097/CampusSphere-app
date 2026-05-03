import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { globalSearch } from "@/services/api";
import { Search, User, BookOpen, Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchDropdownProps {
  query: string;
  isVisible: boolean;
  onClose: () => void;
}

export function SearchDropdown({ query, isVisible, onClose }: SearchDropdownProps) {
  const navigate = useNavigate();
  const [results, setResults] = useState<{ users: any[]; resources: any[]; spheres: any[] }>({
    users: [],
    resources: [],
    spheres: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || !isVisible) {
      setResults({ users: [], resources: [], spheres: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await globalSearch(query, "all", 5);
        if (response.success) {
          setResults({
            users: response.data.users || [],
            resources: response.data.resources || [],
            spheres: response.data.spheres || [],
          });
        }
      } catch (error) {
        console.error("Search suggestions error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!isVisible || (!query.trim() && !isLoading)) return null;

  const hasResults = results.users.length > 0 || results.resources.length > 0 || results.spheres.length > 0;

  const handleResultClick = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !hasResults ? (
          <div className="py-8 text-center text-muted-foreground">
            <p className="text-sm">Aucun résultat pour "{query}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Utilisateurs */}
            {results.users.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                  <User className="h-3 w-3" /> Personnes
                </div>
                <div className="mt-1 space-y-1">
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleResultClick(`/profile/${user.username}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.first_name?.[0] || user.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ressources */}
            {results.resources.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                  <BookOpen className="h-3 w-3" /> Ressources
                </div>
                <div className="mt-1 space-y-1">
                  {results.resources.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleResultClick(`/resources/${res.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {res.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{res.subject}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sphères */}
            {results.spheres.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                  <Users className="h-3 w-3" /> Sphères
                </div>
                <div className="mt-1 space-y-1">
                  {results.spheres.map((sphere) => (
                    <button
                      key={sphere.id}
                      onClick={() => handleResultClick(`/spheres/${sphere.id}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {sphere.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{sphere.member_count} membres</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-2 border-t bg-accent/30">
        <button
          onClick={() => handleResultClick(`/search?q=${encodeURIComponent(query)}`)}
          className="w-full py-2 text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-2"
        >
          Voir tous les résultats pour "{query}"
        </button>
      </div>
    </div>
  );
}
