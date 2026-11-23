import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import jsQR from "jsqr";
import {
  QrCode,
  CheckCircle as CheckCircle2,
  Warning as AlertTriangle,
  XCircle,
  Camera,
  CameraSlash,
  MagnifyingGlass as Search,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { checkInAttendee } from "@/services/eventService";
import type { Event, EventAttendee } from "@/types/events.types";

interface EventScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  attendees: EventAttendee[];
  onCheckInSuccess: (updatedAttendee: EventAttendee) => void;
}

export function EventScannerModal({
  open,
  onOpenChange,
  event,
  attendees,
  onCheckInSuccess,
}: EventScannerModalProps) {
  const { t } = useTranslation("events");
  const [ticketInput, setTicketInput] = useState("");
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    status: "success" | "already_scanned" | "error";
    message: string;
    attendee?: EventAttendee;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const processingRef = useRef(false);

  const checkedInCount = attendees.filter(
    (a) => a.status === "attended" || a.isCheckedIn
  ).length;

  const filteredAttendees = useMemo(() => {
    const confirmed = attendees.filter(
      (a) => a.status === "going" || a.status === "attended" || Boolean(a.isCheckedIn)
    );
    if (!attendeeSearch.trim()) return confirmed;
    const q = attendeeSearch.toLowerCase();
    return confirmed.filter((a) => {
      const name = (
        a.user.name ||
        `${a.user.firstName || ""} ${a.user.lastName || ""}`.trim() ||
        a.user.username ||
        ""
      ).toLowerCase();
      return (
        name.includes(q) ||
        (a.user.username || "").toLowerCase().includes(q) ||
        (a.ticketCode || "").toLowerCase().includes(q)
      );
    });
  }, [attendees, attendeeSearch]);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const handleValidateTicket = useCallback(
    async (codeToUse?: string) => {
      const code = (codeToUse ?? ticketInput).trim();
      if (!code || processingRef.current) return;

      processingRef.current = true;
      setIsProcessing(true);
      setScanResult(null);

      try {
        const res = await checkInAttendee(event.id, code);
        if (res.alreadyCheckedIn) {
          setScanResult({
            status: "already_scanned",
            message: t("scannerModal.alreadyScanned"),
            attendee: res.attendee,
          });
        } else {
          const studentName =
            res.attendee?.user?.name ||
            `${res.attendee?.user?.firstName || ""} ${res.attendee?.user?.lastName || ""}`.trim() ||
            res.attendee?.user?.username ||
            "";
          setScanResult({
            status: "success",
            message: t("scannerModal.scanSuccess", { name: studentName }),
            attendee: res.attendee,
          });
          onCheckInSuccess(res.attendee);
        }
        setTicketInput("");
      } catch (err: any) {
        setScanResult({
          status: "error",
          message: err?.message || t("scannerModal.scanError"),
        });
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [event.id, onCheckInSuccess, t, ticketInput]
  );

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (decoded?.data) {
          const now = Date.now();
          const code = decoded.data.trim();
          const isSameRecent =
            lastScannedRef.current.code === code && now - lastScannedRef.current.at < 2500;
          if (!isSameRecent && !processingRef.current) {
            lastScannedRef.current = { code, at: now };
            void handleValidateTicket(code);
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [handleValidateTicket]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(t("scannerModal.cameraDenied"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      setCameraError(t("scannerModal.cameraDenied"));
      setCameraActive(false);
    }
  }, [t]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current
        .play()
        .then(() => {
          rafRef.current = requestAnimationFrame(scanFrame);
        })
        .catch(() => {
          setCameraError(t("scannerModal.cameraDenied"));
          stopCamera();
        });
    }
  }, [cameraActive, scanFrame, stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setScanResult(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [open, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <QrCode className="h-5 w-5 text-primary" />
              <span>{t("scannerModal.title")}</span>
            </DialogTitle>
            <Badge variant="secondary" className="text-xs font-semibold">
              {t("scannerModal.entriesCount", { checked: checkedInCount, total: attendees.length })}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">{event.title}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Real Camera QR Scanner */}
          <div className="relative h-52 rounded-2xl overflow-hidden bg-slate-950 border border-border flex flex-col items-center justify-center text-white">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {/* Targeting frame overlay */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-36 h-36 rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                </div>
                <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                    {t("scannerModal.viewfinderActive")}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={stopCamera}
                    className="h-7 px-2.5 text-[11px] rounded-lg bg-black/70 text-white hover:bg-black/90 border border-white/20"
                  >
                    <CameraSlash className="h-3.5 w-3.5 mr-1" />
                    {t("scannerModal.stopCamera")}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center px-4 space-y-2.5">
                <Camera className="h-9 w-9 text-white/60" />
                <span className="text-xs font-semibold text-white/90">
                  {t("scannerModal.cameraInactive")}
                </span>
                {cameraError && (
                  <p className="text-[11px] text-amber-300 max-w-xs leading-relaxed">
                    {cameraError}
                  </p>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={startCamera}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{t("scannerModal.startCamera")}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Manual Code Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              {t("scannerModal.instruction")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder={t("scannerModal.manualPlaceholder")}
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleValidateTicket();
                }}
                className="text-xs rounded-xl font-mono flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleValidateTicket()}
                disabled={isProcessing || !ticketInput.trim()}
                className="rounded-xl font-bold text-xs shrink-0"
              >
                {isProcessing ? t("scannerModal.validating") : t("scannerModal.validate")}
              </Button>
            </div>
          </div>

          {/* Result Notification Banner */}
          {scanResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-medium space-y-1 animate-in fade-in duration-200 ${
                scanResult.status === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : scanResult.status === "already_scanned"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {scanResult.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                {scanResult.status === "already_scanned" && (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                {scanResult.status === "error" && (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span>
                  {scanResult.status === "success"
                    ? t("attendeesModal.checkInSuccess")
                    : scanResult.status === "already_scanned"
                    ? t("scannerModal.alreadyScanned")
                    : t("attendeesModal.checkInError")}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">{scanResult.message}</p>
            </div>
          )}

          {/* Quick check-in from full searchable registered list */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-muted-foreground">
                {t("attendeesModal.tabs.going")} ({filteredAttendees.length})
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("scannerModal.searchAttendee")}
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl"
              />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {filteredAttendees.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-4">
                  {t("attendeesModal.emptyList")}
                </p>
              ) : (
                filteredAttendees.map((att) => {
                  const displayName =
                    att.user.name ||
                    `${att.user.firstName || ""} ${att.user.lastName || ""}`.trim() ||
                    att.user.username;
                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 text-xs"
                    >
                      <span className="font-semibold text-foreground truncate">
                        {displayName}
                      </span>

                      {att.status === "attended" || att.isCheckedIn ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0">
                          {t("attendeesModal.checkedIn")}
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isProcessing}
                          onClick={() => void handleValidateTicket(att.ticketCode || String(att.user.id))}
                          className="h-6 text-[10px] rounded-lg shrink-0"
                        >
                          {t("attendeesModal.manualCheckin")}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="w-full rounded-xl text-xs font-semibold shrink-0"
        >
          {t("scannerModal.close")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
