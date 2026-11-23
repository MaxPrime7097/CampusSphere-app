import { useEffect, useState } from "react";
import Sphere3D from "@/components/layout/Sphere3D";
import {
  BookOpen,
  Calendar,
  FilePdf,
  Globe,
  Lightning,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react";
import { useLanguage } from "@cs/i18n";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PUBLIC_EASE, PublicMotionProvider } from "@/components/public/PublicMotion";

interface AuthLanguageToggleProps {
  tone?: "dark" | "light";
  className?: string;
}

export function AuthLanguageToggle({
  tone = "dark",
  className = "",
}: AuthLanguageToggleProps) {
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation("auth");

  const isDark = tone === "dark";

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-1 rounded-full border backdrop-blur-sm ${
        isDark
          ? "border-white/12 bg-white/[0.04]"
          : "border-black/10 bg-[#faf8f5]"
      } ${className}`}
      role="group"
      aria-label={t("sidePanel.languageAria", { defaultValue: "Choisir la langue" })}
    >
      <span
        className={`pl-2 pr-1 flex items-center ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
        aria-hidden="true"
      >
        <Globe size={14} weight="duotone" />
      </span>
      {supportedLanguages.map((lang) => {
        const isActive = lang.code === currentLanguage;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => changeLanguage(lang.code)}
            aria-pressed={isActive}
            className={`px-2.5 py-1 rounded-full font-poppins text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isActive
                ? isDark
                  ? "bg-[#ff9800] text-white shadow-sm shadow-[#ff9800]/30"
                  : "bg-[#09090b] text-white"
                : isDark
                ? "text-zinc-400 hover:text-white"
                : "text-zinc-500 hover:text-[#18181b]"
            }`}
          >
            {lang.code}
          </button>
        );
      })}
    </div>
  );
}

const SCENE_SPECS = [
  {
    num: "01",
    titleKey: "p1Title",
    subKey: "p1Sub",
    topKey: "s1Top",
    bottomKey: "s1Bottom",
    topIcon: UsersThree,
    bottomIcon: Calendar,
    topAccent: "orange",
  },
  {
    num: "02",
    titleKey: "p2Title",
    subKey: "p2Sub",
    topKey: "s2Top",
    bottomKey: "s2Bottom",
    topIcon: FilePdf,
    bottomIcon: Lightning,
    topAccent: "orange",
  },
  {
    num: "03",
    titleKey: "p3Title",
    subKey: "p3Sub",
    topKey: "s3Top",
    bottomKey: "s3Bottom",
    topIcon: Sparkle,
    bottomIcon: BookOpen,
    topAccent: "green",
  },
] as const;

const SCENE_INTERVAL_MS = 4200;

export function AuthSidePanel() {
  const { t } = useTranslation("auth");
  const prefersReducedMotion = useReducedMotion();
  const [activeScene, setActiveScene] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveScene((prev) => (prev + 1) % SCENE_SPECS.length);
    }, SCENE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, isPaused]);

  const current = SCENE_SPECS[activeScene];
  const TopIcon = current.topIcon;
  const BottomIcon = current.bottomIcon;
  const isGreenTop = current.topAccent === "green";

  return (
    <PublicMotionProvider>
      <aside
        className="hidden lg:flex relative h-full min-h-screen w-full flex-col justify-between overflow-hidden bg-[#09090b] text-zinc-100 p-10 xl:p-12 border-l border-white/10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Grille éditoriale subtile + halo ambre */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "radial-gradient(ellipse at 50% 45%, #000 22%, transparent 75%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 w-[540px] h-[540px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,152,0,0.16) 0%, transparent 66%)",
          }}
        />

        {/* Barre supérieure : signature éditoriale + sélecteur de langue FR | EN */}
        <div className="relative z-20 flex items-center justify-between gap-4">
          <span className="font-poppins text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff9800]/90">
            Connect · Share · Grow
          </span>
          <AuthLanguageToggle tone="dark" />
        </div>

        {/* Scène centrale : Sphère 3D totalement dégagée + 2 micro-pilules rotatives */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-6">
          <div className="relative w-[340px] h-[340px] xl:w-[390px] xl:h-[390px] flex items-center justify-center">
            {/* Orbite discrète */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-4 rounded-full border border-dashed border-white/[0.08]"
            />

            {/* Sphère 3D interactive dégagée */}
            <motion.div
              className="relative z-10 w-[270px] h-[270px] xl:w-[310px] xl:h-[310px]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65, ease: PUBLIC_EASE }}
            >
              <Sphere3D />
            </motion.div>

            {/* Micro-pilule flottante haut gauche (rotation douce) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-5 -left-4 xl:-left-8 z-20"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`top-${current.num}`}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#141418]/90 border backdrop-blur-md shadow-xl ${
                    isGreenTop ? "border-emerald-500/35" : "border-white/12"
                  }`}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.36, ease: PUBLIC_EASE }}
                >
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isGreenTop
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-[#ff9800]/15 text-[#ff9800]"
                    }`}
                  >
                    <TopIcon size={15} weight="duotone" />
                  </span>
                  <span className="font-poppins text-xs font-semibold text-zinc-100 whitespace-nowrap">
                    {t(`sidePanel.scenes.${current.topKey}`)}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Micro-pilule flottante bas droite (rotation douce légèrement décalée) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 -right-3 xl:-right-6 z-20"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`bottom-${current.num}`}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#141418]/90 border border-[#ff9800]/30 backdrop-blur-md shadow-xl"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.36, delay: 0.08, ease: PUBLIC_EASE }}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#ff9800]/15 text-[#ff9800] flex items-center justify-center shrink-0">
                    <BottomIcon size={15} weight="duotone" />
                  </span>
                  <span className="font-poppins text-xs font-semibold text-zinc-100 whitespace-nowrap">
                    {t(`sidePanel.scenes.${current.bottomKey}`)}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bloc éditorial bas : titre Space Grotesk + 3 repères interactifs synchronisés */}
        <motion.div
          className="relative z-10 w-full max-w-lg mx-auto"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: PUBLIC_EASE }}
        >
          <h2 className="font-display text-3xl xl:text-[2.2rem] font-bold tracking-[-0.03em] leading-[1.08] text-white">
            {t("sidePanel.headlineLine1", { defaultValue: "Ton campus," })}
            <br />
            <span className="text-[#ff9800]">
              {t("sidePanel.headlineLine2", { defaultValue: "au même endroit." })}
            </span>
          </h2>
          <p className="font-nunito text-sm text-zinc-400 leading-relaxed mt-3 max-w-md">
            {t("sidePanel.editorialDesc", {
              defaultValue:
                "Retrouve ta promo, tes supports de cours, tes sphères de travail et Sphera IA dès ta connexion.",
            })}
          </p>

          <div className="grid grid-cols-3 gap-5 border-t border-white/10 mt-6 pt-5">
            {SCENE_SPECS.map(({ num, titleKey, subKey }, idx) => {
              const isActive = idx === activeScene;
              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActiveScene(idx)}
                  aria-pressed={isActive}
                  className={`relative text-left min-w-0 group cursor-pointer bg-transparent border-0 p-0 transition-opacity duration-200 ${
                    isActive ? "opacity-100" : "opacity-55 hover:opacity-85"
                  }`}
                >
                  {/* Barre active sur la bordure supérieure */}
                  <span
                    aria-hidden="true"
                    className={`block absolute -top-[21px] left-0 right-0 h-[2px] rounded-full transition-all duration-300 ${
                      isActive ? "bg-[#ff9800] opacity-100" : "bg-transparent opacity-0"
                    }`}
                  />
                  <span className="block font-poppins text-[11px] font-bold tracking-[0.12em] text-[#ff9800]">
                    {num}
                  </span>
                  <p className="font-poppins text-xs xl:text-[13px] font-bold text-white mt-1 truncate">
                    {t(`sidePanel.pillars.${titleKey}`)}
                  </p>
                  <p className="font-nunito text-[11px] text-zinc-400 mt-0.5 truncate">
                    {t(`sidePanel.pillars.${subKey}`)}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>
      </aside>
    </PublicMotionProvider>
  );
}
