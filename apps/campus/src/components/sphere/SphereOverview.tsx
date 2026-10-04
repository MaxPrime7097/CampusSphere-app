import { useEffect, useState } from "react";
import { getSphereOverview } from "@/services/api";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Warning as AlertTriangle,
  CheckCircle as CheckCircle2,
  FileText,
  ChatCircle as MessageSquare,
  ArrowClockwise as RefreshCw,
  UsersThree as Users,
  Lightning as Zap,
  Clock,
  Spinner as Loader2,
  Megaphone,
  CalendarBlank,
  Sparkle,
} from "@phosphor-icons/react";
import { normalizeSphereType } from "@/config/sphereFeatures";
import { cn } from "@/lib/utils";

interface Props {
  sphereId: string;
  sphereType?: string;
  objective?: string;
  targetAudience?: string;
  duration?: string;
  onTabChange: (tab: string) => void;
}

const PRI: Record<string, string> = {
  high:   "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
const PRI_LABEL: Record<string, string> = { high: "Haute", medium: "Moyenne", low: "Basse" };
const KAN: Record<string, string> = { todo: "À faire", in_progress: "En cours", review: "Révision", done: "Terminé" };

export function SphereOverview({
  sphereId,
  sphereType,
  objective,
  targetAudience,
  duration,
  onTabChange,
}: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Normalize sphereType using canonical mapping
  const canonicalType = normalizeSphereType(sphereType);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getSphereOverview(sphereId));
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [sphereId]);

  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Réessayer
        </Button>
      </div>
    );
  }

  const prog = data?.progression ?? 0;

  // =========================================================================
  // 1. COURS OVERVIEW
  // =========================================================================
  if (canonicalType === "cours") {
    return (
      <div className="space-y-4">
        {/* Stats cards for Cours */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <Megaphone className="h-5 w-5 text-blue-500" />, label: "Annonces", value: data?.announcement_count ?? 0, sub: "officielles" },
            { icon: <FileText className="h-5 w-5 text-purple-500" />, label: "Ressources", value: data?.resource_count ?? 0, sub: "cours & TDs" },
            { icon: <Zap className="h-5 w-5 text-[#ff9800]" weight="fill" />, label: "Sessions IA", value: data?.study_sessions_count ?? 0, sub: "générées" },
            { icon: <Users className="h-5 w-5 text-primary" />, label: "Membres", value: data?.member_count ?? 0, sub: "étudiants" },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-xl p-3 space-y-1 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Objective & Target Audience */}
        {(objective || targetAudience) && (
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Objectif de l'Unité d'Enseignement
              </h3>
              {targetAudience && (
                <Badge variant="secondary" className="text-[11px]">
                  Public cible : {targetAudience}
                </Badge>
              )}
            </div>
            {objective && <p className="text-sm text-foreground/90 leading-relaxed italic">"{objective}"</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dernières Annonces Officielles */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-blue-500" />
                Dernières annonces
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("annonces")}>
                Voir tout
              </Button>
            </div>
            {!(data?.recent_announcements?.length) ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucune annonce récente pour ce cours.</p>
            ) : (
              (data.recent_announcements as any[]).map((a: any) => (
                <div key={a.id} className="py-2 border-b last:border-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <span className="text-[10px] text-muted-foreground">{fmt(a.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Sphera Quick-Study Widget */}
          <div className="bg-card border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#ff9800]/15 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-[#ff9800]" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    Entraînement avec Sphera
                    <Sparkle className="h-3.5 w-3.5 text-[#ff9800]" weight="fill" />
                  </h3>
                  <p className="text-xs text-muted-foreground">Intelligence Artificielle d'Étude</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transformez vos supports de cours en flashcards mémorisables, quiz QCM ciblés et résumés d'apprentissage instantanés.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#ff9800] hover:bg-[#e68900] text-white w-full gap-2 font-medium"
              onClick={() => onTabChange("sphera")}
            >
              <Zap className="h-4 w-4" weight="fill" />
              Réviser ce cours avec Sphera
            </Button>
          </div>

          {/* Fichiers & Supports récents */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Supports de cours récents
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("files")}>
                Tous les fichiers
              </Button>
            </div>
            {!(data?.recent_resources?.length) ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun document déposé pour le moment.</p>
            ) : (
              (data.recent_resources as any[]).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <p className="text-sm truncate font-medium">{r.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {r.type || "Doc"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discussion Q&A */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Discussion & Entraide
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("chat")}>
                Ouvrir
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
              {(data?.unread_messages ?? 0) > 0 ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold">
                    {data.unread_messages} message{data.unread_messages > 1 ? "s" : ""} non lu{data.unread_messages > 1 ? "s" : ""}
                  </p>
                  <Button
                    size="sm"
                    className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
                    onClick={() => onTabChange("chat")}
                  >
                    Accéder au salon du cours
                  </Button>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-muted-foreground">Une question sur le cours ? Discutez avec vos camarades.</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => onTabChange("chat")}>
                    Participer à la discussion
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PROJET OVERVIEW
  // =========================================================================
  if (canonicalType === "projet") {
    return (
      <div className="space-y-4">
        {/* Stats cards for Projet */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: <CheckCircle2 className="h-5 w-5 text-green-500" />, label: "Terminées", value: data?.done_tasks ?? 0, sub: `/ ${data?.total_tasks ?? 0} tâches` },
            { icon: <AlertTriangle className="h-5 w-5 text-red-500" />, label: "En retard", value: data?.overdue_tasks?.length ?? 0, sub: "tâches bloquantes" },
            { icon: <MessageSquare className="h-5 w-5 text-blue-500" />, label: "Non lus", value: data?.unread_messages ?? 0, sub: "messages d'équipe" },
            { icon: <Users className="h-5 w-5 text-primary" />, label: "Équipe", value: data?.member_count ?? 0, sub: "membres actifs" },
          ].map((s) => (
            <div key={s.label} className="bg-card border rounded-xl p-3 space-y-1 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Progression & Livrable Target */}
        <div className="bg-card border rounded-xl p-4 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold">Progression du projet</span>
                {duration && (
                  <p className="text-xs text-muted-foreground mt-0.5">Échéance cible : {duration}</p>
                )}
              </div>
              <span
                className={cn(
                  "text-2xl font-bold",
                  prog >= 75 ? "text-green-600" : prog >= 40 ? "text-amber-600" : "text-blue-600"
                )}
              >
                {prog}%
              </span>
            </div>

            {objective && (
              <div className="bg-primary/5 border-l-2 border-primary/30 px-3 py-2 rounded-r-md">
                <p className="text-sm text-foreground/80 leading-relaxed italic">"{objective}"</p>
              </div>
            )}

            <div className="space-y-2">
              <Progress value={prog} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {data?.done_tasks ?? 0} tâche{(data?.done_tasks ?? 0) !== 1 ? "s" : ""} terminée{(data?.done_tasks ?? 0) !== 1 ? "s" : ""} sur {data?.total_tasks ?? 0}
                </span>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onTabChange("tasks")}>
                  Ouvrir le Kanban →
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Overdue Tasks */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Tâches en retard
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("tasks")}>
                Voir tout
              </Button>
            </div>
            {!(data?.overdue_tasks?.length) ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucune tâche en retard 🎉 Bravo !</p>
            ) : (
              (data.overdue_tasks as any[]).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">{fmt(t.due_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", PRI[t.priority] || PRI.medium)}>
                      {PRI_LABEL[t.priority] || "Moyenne"}
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                      {KAN[t.kanban_status] || t.kanban_status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mes Tâches */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Mes tâches assignées
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("tasks")}>
                Kanban
              </Button>
            </div>
            {!(data?.my_tasks?.length) ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucune tâche assignée pour l'instant.</p>
            ) : (
              (data.my_tasks as any[]).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    {t.due_date && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{fmt(t.due_date)}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 flex-shrink-0">
                    {KAN[t.kanban_status] || t.kanban_status}
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Fichiers de travail */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Livrables & Fichiers de travail
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("files")}>
                Tous les fichiers
              </Button>
            </div>
            {!(data?.recent_resources?.length) ? (
              <p className="text-xs text-muted-foreground text-center py-6">Aucun livrable déposé</p>
            ) : (
              (data.recent_resources as any[]).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <p className="text-sm truncate font-medium">{r.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px]">
                      {r.type || "Fichier"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Discussion d'équipe */}
          <div className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Chat de projet
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("chat")}>
                Ouvrir
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
              {(data?.unread_messages ?? 0) > 0 ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold">
                    {data.unread_messages} message{data.unread_messages > 1 ? "s" : ""} d'équipe non lu{data.unread_messages > 1 ? "s" : ""}
                  </p>
                  <Button
                    size="sm"
                    className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
                    onClick={() => onTabChange("chat")}
                  >
                    Voir la discussion
                  </Button>
                </>
              ) : (
                <div className="py-2">
                  <p className="text-xs text-muted-foreground">Tous les messages de l'équipe ont été lus ✓</p>
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => onTabChange("chat")}>
                    Accéder au chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. COMMUNAUTÉ OVERVIEW
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Stats cards for Communaute */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Megaphone className="h-5 w-5 text-blue-500" />, label: "Annonces", value: data?.announcement_count ?? (data?.recent_announcements?.length ?? 0), sub: "officielles de promo" },
          { icon: <FileText className="h-5 w-5 text-purple-500" />, label: "Documents", value: data?.resource_count ?? (data?.recent_resources?.length ?? 0), sub: "guides & plannings" },
          { icon: <MessageSquare className="h-5 w-5 text-blue-500" />, label: "Discussions", value: data?.unread_messages ?? 0, sub: "non lus" },
          { icon: <Users className="h-5 w-5 text-primary" />, label: "Membres", value: data?.member_count ?? 0, sub: "de la promotion" },
        ].map((s) => (
          <div key={s.label} className="bg-card border rounded-xl p-3 space-y-1 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-2">
              {s.icon}
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Community Charter & Mission */}
      {(objective || targetAudience) && (
        <div className="bg-card border rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Mission & Vie de la Communauté
            </h3>
            {targetAudience && (
              <Badge variant="secondary" className="text-[11px]">
                Pour : {targetAudience}
              </Badge>
            )}
          </div>
          {objective && <p className="text-sm text-foreground/90 leading-relaxed italic">"{objective}"</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dernières actualités et annonces de promo */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-500" />
              Actualités & Annonces
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("annonces")}>
              Voir tout
            </Button>
          </div>
          {!(data?.recent_announcements?.length) ? (
            <p className="text-xs text-muted-foreground text-center py-6">Aucune annonce officielle publiée récemment.</p>
          ) : (
            (data.recent_announcements as any[]).map((a: any) => (
              <div key={a.id} className="py-2 border-b last:border-0 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold truncate">{a.title}</p>
                  <span className="text-[10px] text-muted-foreground">{fmt(a.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{a.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Fichiers indispensables & chartes */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Guides & Fichiers indispensables
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("files")}>
              Tous les documents
            </Button>
          </div>
          {!(data?.recent_resources?.length) ? (
            <p className="text-xs text-muted-foreground text-center py-6">Aucun document partagé pour le moment.</p>
          ) : (
            (data.recent_resources as any[]).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <p className="text-sm truncate font-medium">{r.title}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="secondary" className="text-[10px]">
                    {r.type || "Doc"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fmt(r.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discussion de promotion */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Discussion générale de promo
            </h3>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onTabChange("chat")}>
              Ouvrir
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
            {(data?.unread_messages ?? 0) > 0 ? (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold">
                  {data.unread_messages} message{data.unread_messages > 1 ? "s" : ""} non lu{data.unread_messages > 1 ? "s" : ""}
                </p>
                <Button
                  size="sm"
                  className="bg-secondary text-secondary-foreground hover:bg-muted border border-border/60"
                  onClick={() => onTabChange("chat")}
                >
                  Rejoindre le chat
                </Button>
              </>
            ) : (
              <div className="py-2">
                <p className="text-xs text-muted-foreground">Partagez des nouvelles, posez une question à la communauté.</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={() => onTabChange("chat")}>
                  Accéder à la discussion
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Membres & Bureau de promo */}
        <div className="bg-card border rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Membres & Animation
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Découvrez les délégués, responsables et l'ensemble des membres faisant vivre cet espace de promotion.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={() => onTabChange("members")}
          >
            <Users className="h-4 w-4" />
            Consulter l'annuaire des membres ({data?.member_count ?? 0})
          </Button>
        </div>
      </div>
    </div>
  );
}

