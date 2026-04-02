import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listNotificationsPaginated,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCheck,
  Bell,
  X,
  Users,
  MessageSquare,
  FileText,
  Calendar,
  Settings,
  Loader2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender: {
    name: string | null;
    avatar: string | null;
    id: string | null;
  };
  actionUrl: string | null;
}

const PAGE_SIZE = 10;

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeNotification, setActiveNotification] = useState<NotificationRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortByDate, setSortByDate] = useState<"desc" | "asc">("desc");

  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listNotificationsPaginated({
        page,
        pageSize: PAGE_SIZE,
        search: searchQuery || undefined,
        read: readFilter,
        type: typeFilter,
        ordering: sortByDate === "desc" ? "-created_at" : "created_at",
      });

      const mapped = (response.results || []).map((n: any) => {
        const senderName =
          n.sender?.name ||
          n.data?.sender_name ||
          n.data?.user_full_name ||
          n.data?.user_name ||
          n.data?.inviter_name ||
          n.data?.assigner_name ||
          n.data?.requester_name ||
          null;
        const senderAvatar = n.sender?.avatar || n.data?.sender_avatar || null;

        let actionUrl = null;
        if (n.data?.post_id) actionUrl = `/posts/${n.data.post_id}`;
        else if (n.data?.sphere_id) actionUrl = `/spheres/${n.data.sphere_id}`;
        else if (n.data?.task_id) actionUrl = `/tasks/${n.data.task_id}`;
        else if (n.data?.conversation_id) actionUrl = `/messages`;

        return {
          id: String(n.id),
          type: n.notification_type || n.type || "system",
          title: n.title || "Notification",
          message: n.message || n.content || "",
          read: n.is_read || n.read || false,
          createdAt: n.created_at || n.createdAt || new Date().toISOString(),
          sender: {
            name: senderName,
            avatar: senderAvatar,
            id: n.data?.sender_id || n.data?.user_id || n.data?.requester_id || n.data?.assigner_id || n.data?.inviter_id || null,
          },
          actionUrl,
        } satisfies NotificationRow;
      });

      setNotifications(mapped);
      setTotalCount(Number(response.count || mapped.length));
      setSelectedIds([]);
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || "Impossible de charger les notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, readFilter, searchQuery, sortByDate, toast, typeFilter]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "sphere_invite":
      case "sphere_join_request":
        return <Users className="h-4 w-4 text-blue-500" />;
      case "message":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "task":
      case "task_assigned":
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case "resource":
        return <FileText className="h-4 w-4 text-purple-500" />;
      case "system":
        return <Settings className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const markAsRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast({ title: "Toutes les notifications ont été marquées comme lues", duration: 2000 });
    } catch {
      toast({ title: "Erreur", description: "Impossible de marquer toutes les notifications comme lues", variant: "destructive" });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setStatusText("Suppression de la notification...");
      await deleteNotificationApi(id);
      setStatusText("Notification supprimée.");
      toast({ title: "Notification supprimée", duration: 1000 });
      if (activeNotification?.id === id) setActiveNotification(null);
      await fetchNotifications();
    } catch (error: any) {
      setStatusText(null);
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de supprimer la notification",
        variant: "destructive",
      });
    }
  };

  const handleBulkMarkRead = async () => {
    try {
      await Promise.all(selectedIds.map((id) => markNotificationRead(id)));
      toast({ title: `${selectedIds.length} notification(s) marquée(s) comme lue(s)` });
      await fetchNotifications();
    } catch {
      toast({ title: "Erreur", description: "Échec du marquage groupé", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => deleteNotificationApi(id)));
      toast({ title: `${selectedIds.length} notification(s) supprimée(s)` });
      setConfirmBulkOpen(false);
      await fetchNotifications();
    } catch {
      toast({ title: "Erreur", description: "Échec de la suppression groupée", variant: "destructive" });
    }
  };

  const openDetails = async (notification: NotificationRow) => {
    setActiveNotification(notification);
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch {
        // noop
      }
    }
  };

  const uniqueTypes = useMemo(() => {
    return Array.from(new Set(notifications.map((n) => n.type))).filter(Boolean);
  }, [notifications]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      <div className="container max-w-6xl mx-auto py-4 px-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-muted-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} nouvelles notifications sur cette page` : "Aucune nouvelle notification"}
            </p>
            {statusText && <p className="text-xs text-muted-foreground mt-1">{statusText}</p>}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
                <CheckCheck className="h-4 w-4" />
                <span className="hidden md:block">Tout marquer comme lu</span>
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input
              placeholder="Rechercher une notification..."
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
            />

            <Select value={readFilter} onValueChange={(value: "all" | "read" | "unread") => { setPage(1); setReadFilter(value); }}>
              <SelectTrigger>
                <SelectValue placeholder="État" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(value) => { setPage(1); setTypeFilter(value); }}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {uniqueTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="justify-between"
              onClick={() => setSortByDate((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              Date {sortByDate === "desc" ? "(récent → ancien)" : "(ancien → récent)"}
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted p-2">
              <Badge variant="secondary">{selectedIds.length} sélectionnée(s)</Badge>
              <Button size="sm" variant="outline" onClick={handleBulkMarkRead} className="gap-2">
                <Eye className="h-4 w-4" /> Marquer comme lues
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmBulkOpen(true)} className="gap-2">
                <Trash2 className="h-4 w-4" /> Supprimer la sélection
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => {
                      setSelectedIds(checked ? notifications.map((n) => n.id) : []);
                    }}
                    aria-label="Sélectionner toutes les notifications"
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Titre / Message</TableHead>
                <TableHead>Expéditeur</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Chargement des notifications...</p>
                  </TableCell>
                </TableRow>
              )}

              {!loading && notifications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    Aucune notification pour ces critères.
                  </TableCell>
                </TableRow>
              )}

              {!loading && notifications.map((notification) => (
                <TableRow key={notification.id} className={!notification.read ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(notification.id)}
                      onCheckedChange={(checked) => {
                        setSelectedIds((prev) => checked ? [...prev, notification.id] : prev.filter((id) => id !== notification.id));
                      }}
                      aria-label={`Sélectionner ${notification.title}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <span className="text-xs text-muted-foreground">{notification.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="font-medium truncate">{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={notification.sender?.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">{(notification.sender?.name || "?").slice(0, 1)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{notification.sender?.name || "Système"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(notification.createdAt).toLocaleString("fr-FR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openDetails(notification)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setPendingDeleteId(notification.id);
                          setConfirmOpen(true);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Page {page} / {totalPages} • {totalCount} élément(s)
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Sheet open={Boolean(activeNotification)} onOpenChange={(open) => !open && setActiveNotification(null)}>
          <SheetContent side="right" className="w-[450px] sm:w-[600px]">
            <SheetHeader>
              <SheetTitle>{activeNotification?.title || "Détails"}</SheetTitle>
              <SheetDescription>
                {activeNotification ? new Date(activeNotification.createdAt).toLocaleString("fr-FR") : ""}
              </SheetDescription>
            </SheetHeader>
            {activeNotification && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(activeNotification.type)}
                  <Badge variant={activeNotification.read ? "secondary" : "default"}>
                    {activeNotification.read ? "Lue" : "Non lue"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{activeNotification.message}</p>
                <div className="text-sm">
                  <span className="font-medium">Expéditeur: </span>
                  {activeNotification.sender?.name || "Système"}
                </div>
                {activeNotification.actionUrl && (
                  <Button
                    onClick={() => {
                      navigate(activeNotification.actionUrl as string);
                      setActiveNotification(null);
                    }}
                  >
                    Ouvrir la cible liée
                  </Button>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Voulez-vous vraiment supprimer cette notification ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDeleteId) {
                    void deleteNotification(pendingDeleteId);
                  }
                  setConfirmOpen(false);
                  setPendingDeleteId(null);
                }}
              >
                Oui, supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmBulkOpen} onOpenChange={setConfirmBulkOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la sélection</AlertDialogTitle>
              <AlertDialogDescription>
                Vous êtes sur le point de supprimer {selectedIds.length} notification(s). Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleBulkDelete()}>Confirmer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
