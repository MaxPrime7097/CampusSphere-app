import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ArrowsLeftRight,
  BellRinging,
  Books,
  Check,
  Copy,
  LockKey,
  LockKeyOpen,
  SignOut,
  Sparkle,
  Trophy,
  UsersThree,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getCampusStatus, updateUserProfile, type CampusStatusData } from "@/services/api";
import { UniversityCombobox } from "@/components/forms/UniversityCombobox";
import { normalizeUniversity } from "@/lib/profileMetadata";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
} from "@/components/public/PublicMotion";

export function CampusUnlock(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const { t } = useTranslation("public");

  const initialSlug = () => {
    const fromQuery = searchParams.get("campus") || searchParams.get("ref");
    if (fromQuery) return normalizeUniversity(fromQuery);
    if (user?.university) return normalizeUniversity(user.university);
    return "iug";
  };

  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber || "");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(Boolean(user?.phoneNumber));
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSwitchingUniversity, setIsSwitchingUniversity] = useState(false);
  const [tempUniversity, setTempUniversity] = useState<string>(selectedSlug);
  const [customTempUniversity, setCustomTempUniversity] = useState<string>("");

  useEffect(() => {
    const fromQuery = searchParams.get("campus") || searchParams.get("ref");
    if (fromQuery) {
      const qNorm = normalizeUniversity(fromQuery);
      setSelectedSlug(qNorm);
      setTempUniversity(qNorm);
    } else if (user?.university) {
      const uNorm = normalizeUniversity(user.university);
      setSelectedSlug(uNorm);
      setTempUniversity(uNorm);
      setSearchParams({ campus: uNorm }, { replace: true });
    }
    if (user?.phoneNumber) {
      setPhoneNumber(user.phoneNumber);
      setPhoneSaved(true);
    }
  }, [user, searchParams, setSearchParams]);

  const { data: campusData, refetch } = useQuery<CampusStatusData>({
    queryKey: ["campus-status", selectedSlug],
    queryFn: () => getCampusStatus(selectedSlug),
    staleTime: 0,
    refetchInterval: 5000,
  });

  const currentCount = campusData?.currentCount ?? 0;
  const targetCount = campusData?.targetCount ?? 50;
  const remainingCount = campusData?.remainingCount ?? Math.max(0, targetCount - currentCount);
  const percentage =
    campusData?.percentage ?? Math.min(100, Math.round((currentCount / targetCount) * 100));
  const isOpen = campusData?.isOpen ?? false;

  const campusName = campusData?.name || t("campusUnlock.defaultCampusName");
  const referralUrl = `${window.location.origin}/register?campus=${selectedSlug}`;
  const shareMessage = t("campusUnlock.locked.shareMessage", {
    campus: campusName,
    target: targetCount,
    url: referralUrl,
  });

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopySuccess(true);
      toast({
        title: t("campusUnlock.toasts.copiedTitle"),
        description: t("campusUnlock.toasts.copiedDesc"),
      });
      setTimeout(() => setCopySuccess(false), 3000);
    } catch {
      toast({
        title: t("campusUnlock.toasts.errorTitle"),
        description: t("campusUnlock.toasts.copyError"),
        variant: "destructive",
      });
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      toast({
        title: t("campusUnlock.toasts.phoneRequiredTitle"),
        description: t("campusUnlock.toasts.phoneRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      try {
        localStorage.setItem("pending_phone", cleanPhone);
      } catch {}
      navigate(`/register?campus=${selectedSlug}&phone=${encodeURIComponent(cleanPhone)}`);
      return;
    }

    setIsSavingPhone(true);
    try {
      await updateUserProfile({ phone_number: cleanPhone });
      await refreshUser();
      setPhoneSaved(true);
      toast({
        title: t("campusUnlock.toasts.phoneSavedTitle"),
        description: t("campusUnlock.toasts.phoneSavedDesc", { target: targetCount }),
      });
    } catch (err: any) {
      toast({
        title: t("campusUnlock.toasts.errorTitle"),
        description: err?.message || t("campusUnlock.toasts.phoneError"),
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleApplyCampusChange = async () => {
    const finalVal = tempUniversity === "other" ? customTempUniversity.trim() : tempUniversity;
    if (!finalVal) {
      toast({
        title: t("campusUnlock.toasts.nameRequiredTitle"),
        description: t("campusUnlock.toasts.nameRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    if (finalVal === selectedSlug) {
      setIsSwitchingUniversity(false);
      return;
    }

    setSelectedSlug(finalVal);
    setTempUniversity(finalVal);
    setIsSwitchingUniversity(false);
    setSearchParams({ campus: finalVal }, { replace: true });

    try {
      localStorage.setItem("campus_ref", finalVal);
    } catch {}

    if (isAuthenticated) {
      try {
        await updateUserProfile({ university: finalVal });
        await refreshUser();
        await queryClient.invalidateQueries({ queryKey: ["campus-status"] });
        await refetch();
        toast({
          title: t("campusUnlock.toasts.updatedTitle"),
          description: t("campusUnlock.toasts.updatedDesc"),
        });
      } catch (err: any) {
        toast({
          title: t("campusUnlock.toasts.errorTitle"),
          description: err?.message || t("campusUnlock.toasts.updateError"),
          variant: "destructive",
        });
      }
    }
  };

  return (
    <PublicMotionProvider>
      <div className="cs-pub-font min-h-screen bg-[#f6f4ee] text-[#18181b] flex flex-col justify-between font-nunito">
        <Helmet>
          <title>{t("campusUnlock.meta.title", { campus: campusName })}</title>
          <meta
            name="description"
            content={t("campusUnlock.meta.description", {
              remaining: remainingCount,
              campus: campusName,
            })}
          />
        </Helmet>

        {/* Barre supérieure sombre cohérente avec le Header public */}
        <header className="sticky top-0 z-50 bg-[#09090b]/95 backdrop-blur-md border-b border-white/10">
          <div className="max-w-[1040px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <Link to="/cs" className="inline-flex items-center gap-2.5 min-w-0">
              <img src="/CS.svg" alt="CampusSphere" className="w-8 h-8 shrink-0" />
              <span className="font-automata text-lg font-bold campus-gradient bg-clip-text text-transparent truncate">
                CampusSphere
              </span>
            </Link>

            <div className="flex items-center gap-3 shrink-0">
              {isAuthenticated ? (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="font-poppins text-xs font-semibold text-white leading-none">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {isOpen
                        ? t("campusUnlock.header.statusOpen")
                        : t("campusUnlock.header.statusPending")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-zinc-200 font-poppins text-xs font-medium transition-colors"
                  >
                    <SignOut size={15} weight="duotone" aria-hidden="true" />
                    <span className="hidden sm:inline">{t("campusUnlock.header.logout")}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="px-4 py-1.5 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-poppins text-xs font-semibold transition-colors"
                >
                  {t("campusUnlock.header.login")}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Contenu principal */}
        <main className="w-full max-w-[760px] mx-auto px-3.5 sm:px-6 py-7 sm:py-10 space-y-6 flex-1">
          {/* Carte centrale de déblocage */}
          <motion.section
            className="rounded-3xl bg-white border border-black/10 p-5 sm:p-8 shadow-sm space-y-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: PUBLIC_EASE }}
          >
            {/* En-tête campus */}
            <div className="text-center space-y-2.5">
              <motion.div
                className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center ${
                  isOpen
                    ? "bg-emerald-500/12 text-emerald-600"
                    : "bg-[#fff7ed] text-[#ff9800]"
                }`}
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.08 }}
              >
                {isOpen ? (
                  <LockKeyOpen size={28} weight="duotone" aria-hidden="true" />
                ) : (
                  <LockKey size={28} weight="duotone" aria-hidden="true" />
                )}
              </motion.div>

              <h1 className="font-poppins text-2xl sm:text-3xl font-extrabold text-[#18181b] tracking-tight">
                {campusName}
              </h1>

              <div>
                <button
                  type="button"
                  onClick={() => setIsSwitchingUniversity(!isSwitchingUniversity)}
                  className="inline-flex items-center gap-1.5 font-poppins text-xs font-semibold text-[#e65100] hover:underline"
                >
                  <ArrowsLeftRight size={14} weight="duotone" aria-hidden="true" />
                  {isSwitchingUniversity
                    ? t("campusUnlock.switcher.cancel")
                    : t("campusUnlock.switcher.change")}
                </button>
              </div>

              <AnimatePresence>
                {isSwitchingUniversity && (
                  <motion.div
                    className="pt-2 max-w-sm mx-auto space-y-2.5 overflow-hidden"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.24, ease: PUBLIC_EASE }}
                  >
                    <UniversityCombobox value={tempUniversity} onValueChange={setTempUniversity} />
                    {tempUniversity === "other" && (
                      <Input
                        type="text"
                        placeholder={t("campusUnlock.switcher.otherPlaceholder")}
                        value={customTempUniversity}
                        onChange={(e) => setCustomTempUniversity(e.target.value)}
                        className="h-10 text-sm bg-white border-black/15"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleApplyCampusChange}
                      className="w-full h-10 rounded-full bg-[#09090b] hover:bg-zinc-800 text-white font-poppins text-xs font-semibold transition-colors"
                    >
                      {t("campusUnlock.switcher.confirm")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* État Ouvert vs Verrouillé */}
            {isOpen ? (
              <motion.div
                className="p-5 sm:p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: PUBLIC_EASE }}
              >
                <p className="font-poppins text-lg font-bold text-emerald-900">
                  {t("campusUnlock.open.title")}
                </p>
                <p className="text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  {t("campusUnlock.open.desc", { target: targetCount })}
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-poppins text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
                >
                  {t("campusUnlock.open.cta")}
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </button>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <p className="text-sm sm:text-[0.95rem] text-zinc-600 text-center max-w-lg mx-auto leading-relaxed">
                  {t("campusUnlock.locked.introPrefix")}{" "}
                  <strong className="text-[#18181b]">
                    {t("campusUnlock.locked.introBold", { target: targetCount })}
                  </strong>{" "}
                  {t("campusUnlock.locked.introSuffix")}
                </p>

                {/* Jauge de progression animée */}
                <div className="rounded-2xl bg-[#faf8f5] border border-black/8 p-4 sm:p-5 max-w-lg mx-auto space-y-2.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <span className="font-poppins text-2xl sm:text-3xl font-extrabold text-[#ff9800]">
                        {currentCount}
                      </span>
                      <span className="font-poppins text-sm font-semibold text-zinc-500">
                        {" "}
                        {t("campusUnlock.locked.registeredOf", { target: targetCount })}
                      </span>
                    </div>
                    <span className="font-poppins text-sm font-bold text-[#18181b]">
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-black/8 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#ff9800]"
                      initial={{ width: "4%" }}
                      animate={{ width: `${Math.max(4, percentage)}%` }}
                      transition={{ duration: 0.75, ease: PUBLIC_EASE }}
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 text-right">
                    {t("campusUnlock.locked.remainingPrefix")}{" "}
                    <strong className="text-[#18181b]">{remainingCount}</strong>{" "}
                    {remainingCount > 1
                      ? t("campusUnlock.locked.remainingOther")
                      : t("campusUnlock.locked.remainingOne")}
                  </p>
                </div>

                {/* Action virale principale : Partage WhatsApp + Copier */}
                <div className="max-w-lg mx-auto space-y-3">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full h-12 px-5 rounded-full bg-[#25D366] hover:bg-[#1fb857] hover:-translate-y-0.5 text-white font-poppins text-sm sm:text-base font-semibold shadow-md shadow-[#25D366]/20 inline-flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                  >
                    <WhatsappLogo size={22} weight="duotone" aria-hidden="true" />
                    {t("campusUnlock.locked.whatsappBtn")}
                  </button>
                  <p className="text-xs text-zinc-500 text-center">
                    {t("campusUnlock.locked.whatsappHint")}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      readOnly
                      value={referralUrl}
                      aria-label={t("campusUnlock.locked.inviteLinkAria")}
                      className="h-10 text-xs bg-[#faf8f5] border-black/10 font-mono text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="h-10 px-4 rounded-xl border border-black/12 bg-white hover:bg-[#faf8f5] text-[#18181b] font-poppins text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.97]"
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copySuccess ? (
                          <motion.span
                            key="copied"
                            className="inline-flex items-center gap-1.5 text-emerald-700"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.16 }}
                          >
                            <Check size={15} weight="bold" className="text-emerald-600" aria-hidden="true" />
                            {t("campusUnlock.locked.copied")}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            className="inline-flex items-center gap-1.5"
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.16 }}
                          >
                            <Copy size={15} weight="duotone" aria-hidden="true" />
                            {t("campusUnlock.locked.copy")}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>
                </div>

                {/* Alerte WhatsApp dès l'ouverture */}
                <div className="pt-5 border-t border-black/8 max-w-lg mx-auto space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#fff7ed] text-[#ff9800] flex items-center justify-center shrink-0 mt-0.5">
                      <BellRinging size={17} weight="duotone" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-poppins text-sm font-bold text-[#18181b]">
                        {t("campusUnlock.alert.title")}
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {t("campusUnlock.alert.desc", { target: targetCount })}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="tel"
                      placeholder={t("campusUnlock.alert.phonePlaceholder")}
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setPhoneSaved(false);
                      }}
                      className="h-10 text-sm bg-white border-black/15 flex-1 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                    />
                    <button
                      type="submit"
                      disabled={isSavingPhone}
                      className="h-10 px-5 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white font-poppins text-xs font-semibold whitespace-nowrap transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {isSavingPhone
                        ? t("campusUnlock.alert.saving")
                        : phoneSaved
                        ? t("campusUnlock.alert.saved")
                        : t("campusUnlock.alert.notifyMe")}
                    </button>
                  </form>

                  {phoneSaved && (
                    <motion.p
                      className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Check size={14} weight="bold" aria-hidden="true" />
                      {t("campusUnlock.alert.savedConfirm")}
                    </motion.p>
                  )}
                </div>
              </div>
            )}
          </motion.section>

          {/* Ce que ta promo débloque */}
          <section className="space-y-3.5">
            <Reveal>
              <h2 className="font-poppins text-xs font-bold uppercase tracking-[0.12em] text-zinc-500 text-center">
                {t("campusUnlock.perks.heading", { target: targetCount })}
              </h2>
            </Reveal>
            <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-3.5" stagger={0.08}>
              <StaggerItem className="rounded-2xl bg-white border border-black/8 p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff9800]/40 hover:shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center">
                  <Books size={19} weight="duotone" aria-hidden="true" />
                </div>
                <h3 className="font-poppins text-sm font-bold text-[#18181b]">
                  {t("campusUnlock.perks.p1Title")}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {t("campusUnlock.perks.p1Desc")}
                </p>
              </StaggerItem>

              <StaggerItem className="rounded-2xl bg-white border border-black/8 p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff9800]/40 hover:shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center">
                  <Sparkle size={19} weight="duotone" aria-hidden="true" />
                </div>
                <h3 className="font-poppins text-sm font-bold text-[#18181b]">
                  {t("campusUnlock.perks.p2Title")}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {t("campusUnlock.perks.p2Desc")}
                </p>
              </StaggerItem>

              <StaggerItem className="rounded-2xl bg-white border border-black/8 p-4 space-y-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff9800]/40 hover:shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-[#ff9800] flex items-center justify-center">
                  <UsersThree size={19} weight="duotone" aria-hidden="true" />
                </div>
                <h3 className="font-poppins text-sm font-bold text-[#18181b]">
                  {t("campusUnlock.perks.p3Title")}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {t("campusUnlock.perks.p3Desc")}
                </p>
              </StaggerItem>
            </StaggerGrid>
          </section>

          {/* Course au déblocage des campus */}
          <Reveal className="rounded-3xl bg-white border border-black/10 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#fff7ed] text-[#ff9800] flex items-center justify-center">
                  <Trophy size={17} weight="duotone" aria-hidden="true" />
                </div>
                <h2 className="font-poppins text-sm font-bold text-[#18181b]">
                  {t("campusUnlock.race.title")}
                </h2>
              </div>
              <span className="font-poppins text-xs font-medium text-zinc-500">
                {t("campusUnlock.race.goal", { target: targetCount })}
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {campusData?.campuses?.map((c) => {
                const isSelected = c.slug === selectedSlug;
                const barPct = c.isOpen ? 100 : Math.min(100, c.percentage);
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setSelectedSlug(c.slug);
                      setTempUniversity(c.slug);
                      setSearchParams({ campus: c.slug }, { replace: true });
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 hover:-translate-y-[1px] ${
                      isSelected
                        ? "bg-[#fff7ed] border-[#ff9800]/45"
                        : "bg-[#faf8f5] border-black/5 hover:border-black/15"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-poppins text-xs sm:text-sm font-semibold text-[#18181b] truncate">
                          {c.name}
                        </span>
                        {isSelected && (
                          <span className="font-poppins text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#ff9800]/15 text-[#e65100] shrink-0">
                            {t("campusUnlock.race.myCampus")}
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-poppins text-xs font-bold shrink-0 ${
                          c.isOpen ? "text-emerald-600" : "text-zinc-600"
                        }`}
                      >
                        {c.isOpen
                          ? t("campusUnlock.race.open")
                          : `${c.currentCount} / ${c.targetCount}`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/8 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          c.isOpen ? "bg-emerald-500" : "bg-[#ff9800]"
                        }`}
                        style={{ width: `${Math.max(4, barPct)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </main>

        {/* Footer sombre compact */}
        <footer className="bg-[#09090b] text-zinc-400 border-t border-white/10 py-5 px-4 text-center text-xs">
          <p>{t("campusUnlock.footer.rights", { year: new Date().getFullYear() })}</p>
          <p className="mt-1">
            {t("campusUnlock.footer.needHelp")}{" "}
            <a
              href="https://wa.me/237699404759"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff9800] hover:underline font-poppins font-semibold"
            >
              +237 699 40 47 59
            </a>
          </p>
        </footer>
      </div>
    </PublicMotionProvider>
  );
}

export default CampusUnlock;
