import { useState } from "react";
import { Megaphone, Plus, Pin, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  created_at: string;
  is_pinned?: boolean;
}

interface AnnouncementsTabProps {
  sphereId: string;
  canModerate: boolean;
}

/** Composant prêt pour l'extension backend (V2). Pour l'instant les annonces
 *  sont stockées localement dans le state. Un endpoint dédié pourra être ajouté. */
export function AnnouncementsTab({ sphereId: _sphereId, canModerate }: AnnouncementsTabProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const announcement: Announcement = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      author: {
        name: "Vous",
        role: "Admin",
      },
      created_at: new Date().toISOString(),
      is_pinned: false,
    };
    setAnnouncements((prev) => [announcement, ...prev]);
    setNewTitle("");
    setNewContent("");
    setShowForm(false);
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Il y a ${diffH}h`;
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">Annonces officielles</h3>
          {announcements.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {announcements.length}
            </Badge>
          )}
        </div>
        {canModerate && (
          <Button
            size="sm"
            className="campus-gradient text-white gap-1.5 text-xs"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3.5 w-3.5" />
            Nouvelle annonce
          </Button>
        )}
      </div>

      {/* Formulaire de création */}
      {showForm && canModerate && (
        <div className="border rounded-xl bg-card p-4 space-y-3 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider">
            Nouvelle annonce
          </p>
          <div className="space-y-2">
            <Label htmlFor="ann-title" className="text-xs">
              Titre *
            </Label>
            <Input
              id="ann-title"
              placeholder="Ex: Rappel — Rendu du TP 2"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ann-content" className="text-xs">
              Message *
            </Label>
            <Textarea
              id="ann-content"
              placeholder="Contenu de l'annonce..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(false)}
              className="text-xs"
            >
              Annuler
            </Button>
            <Button
              size="sm"
              className="campus-gradient text-white text-xs"
              disabled={!newTitle.trim() || !newContent.trim()}
              onClick={handleCreate}
            >
              Publier
            </Button>
          </div>
        </div>
      )}

      {/* Liste des annonces */}
      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Aucune annonce</p>
            <p className="text-xs text-muted-foreground mt-1">
              {canModerate
                ? "Publiez votre première annonce officielle pour la sphère."
                : "Aucune annonce officielle pour le moment."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`border rounded-xl bg-card p-4 space-y-2 ${
                ann.is_pinned ? "border-primary/40 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {ann.is_pinned && <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                  <p className="font-semibold text-sm">{ann.title}</p>
                </div>
                <Badge variant="outline" className="text-[10px] flex-shrink-0">
                  Officiel
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {ann.content}
              </p>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={ann.author.avatar} />
                    <AvatarFallback className="text-[9px]">{ann.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-2.5 w-2.5" />
                    {ann.author.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDate(ann.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
