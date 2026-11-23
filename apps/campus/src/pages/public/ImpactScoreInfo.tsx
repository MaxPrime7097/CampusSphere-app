import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  Crown,
  Fire,
  Lightning,
  Plant,
  Prohibit,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trophy,
  UploadSimple,
} from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { IMPACT_LEVELS } from "@/constants/profileConstants";
import { useAuth } from "@/contexts/AuthContext";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
} from "@/components/public/PublicMotion";
import "@/styles/public-pages.css";

const ACTIVE_RULE_SPECS = [
  { key: "r1", icon: UploadSimple },
  { key: "r2", icon: Lightning },
  { key: "r3", icon: SlidersHorizontal },
] as const;

const ZERO_RULE_KEYS = ["z1", "z2", "z3", "z4"] as const;
const LEVEL_ICONS = [Plant, Star, Fire, Trophy, Crown] as const;
const FUTURE_SPECS = [
  { key: "f1", icon: Trophy },
  { key: "f2", icon: Lightning },
  { key: "f3", icon: ShieldCheck },
] as const;
const SCORE_FAQ_KEYS = ["q1", "q2", "q3", "q4", "q5"] as const;

export function ImpactScoreInfo(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation("public");

  const scoreFaqs = useMemo(
    () =>
      SCORE_FAQ_KEYS.map((key) => ({
        key,
        q: t(`impactScore.faq.items.${key}.q`),
        a: t(`impactScore.faq.items.${key}.a`),
      })),
    [t, i18n.language]
  );

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: scoreFaqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    }),
    [scoreFaqs]
  );

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("impactScore.meta.title")}</title>
        <meta name="description" content={t("impactScore.meta.description")} />
        <link rel="canonical" href="https://campussphere.app/cs/impact-score" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("impactScore.meta.ogTitle")} />
        <meta property="og:description" content={t("impactScore.meta.ogDescription")} />
        <meta property="og:url" content="https://campussphere.app/cs/impact-score" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t("impactScore.meta.twitterTitle")} />
        <meta name="twitter:description" content={t("impactScore.meta.twitterDescription")} />
        <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── 01. Hero éditorial centré ─────────────────────────────── */}
        <section className="pub-hero" aria-labelledby="impact-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-hero-center">
              <motion.h1
                id="impact-title"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, ease: PUBLIC_EASE }}
              >
                {t("impactScore.hero.titleLine1")}
                <br />
                <em>{t("impactScore.hero.titleLine2")}</em>
              </motion.h1>
              <motion.p
                className="pub-hero-lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: PUBLIC_EASE }}
              >
                {t("impactScore.hero.lede")}
              </motion.p>
              <motion.div
                className="pub-hero-actions"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, delay: 0.16, ease: PUBLIC_EASE }}
              >
                <button
                  type="button"
                  className="pub-btn pub-btn-orange"
                  onClick={() => navigate(isAuthenticated ? "/" : "/register")}
                >
                  {isAuthenticated
                    ? t("impactScore.hero.ctaAuth")
                    : t("impactScore.hero.ctaGuest")}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() =>
                    document.getElementById("bareme")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("impactScore.hero.ctaSecondary")}{" "}
                  <ArrowDown size={16} weight="duotone" className="pub-icon-down" aria-hidden="true" />
                </button>
              </motion.div>
            </div>

            <StaggerGrid className="pub-hero-pillars" mount delayChildren={0.2} stagger={0.07}>
              {(["p1", "p2", "p3"] as const).map((key) => (
                <StaggerItem key={key} className="pub-hero-pillar" y={14}>
                  <span className="pub-hero-pillar-num">
                    {t(`impactScore.hero.pillars.${key}.num`)}
                  </span>
                  <b>{t(`impactScore.hero.pillars.${key}.title`)}</b>
                  <p>{t(`impactScore.hero.pillars.${key}.desc`)}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 02. Barème officiel & règles anti-spam ────────────────── */}
        <section
          className="pub-section pub-light"
          id="bareme"
          aria-label={t("impactScore.rules.ariaLabel")}
        >
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("impactScore.rules.titleLine1")}
                <br />
                <em>{t("impactScore.rules.titleLine2")}</em>
              </h2>
              <p className="pub-lede">{t("impactScore.rules.lede")}</p>
            </Reveal>

            <StaggerGrid className="pub-score-rules" stagger={0.08}>
              {ACTIVE_RULE_SPECS.map(({ key, icon: Icon }) => (
                <StaggerItem key={key} as="article" className="pub-score-rule">
                  <div className="pub-score-rule-top">
                    <div className="pub-value-icon" style={{ marginBottom: 0 }} aria-hidden="true">
                      <Icon size={22} weight="duotone" />
                    </div>
                    <span className="pub-score-rule-tag">
                      {t(`impactScore.rules.items.${key}.tag`)}
                    </span>
                  </div>
                  <div className="pub-score-pts">{t(`impactScore.rules.items.${key}.points`)}</div>
                  <h3>{t(`impactScore.rules.items.${key}.title`)}</h3>
                  <p>{t(`impactScore.rules.items.${key}.desc`)}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>

            {/* Encadré 0 pt · Anti-spam */}
            <Reveal className="pub-zero-box" delay={0.06}>
              <div className="pub-zero-head">
                <div>
                  <h3>{t("impactScore.zeroRules.title")}</h3>
                  <p>{t("impactScore.zeroRules.desc")}</p>
                </div>
              </div>

              <StaggerGrid className="pub-zero-grid" stagger={0.06}>
                {ZERO_RULE_KEYS.map((key) => (
                  <StaggerItem key={key} className="pub-zero-item" y={12}>
                    <div className="pub-zero-icon" aria-hidden="true">
                      <Prohibit size={18} weight="duotone" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="pub-zero-item-top">
                        <h4>{t(`impactScore.zeroRules.items.${key}.title`)}</h4>
                        <span className="pub-zero-pill">{t("impactScore.zeroRules.badge")}</span>
                      </div>
                      <p>{t(`impactScore.zeroRules.items.${key}.reason`)}</p>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerGrid>
            </Reveal>
          </div>
        </section>

        {/* ── 03. Les 5 Paliers de Progression ──────────────────────── */}
        <section className="pub-section pub-paper" aria-label={t("impactScore.levels.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("impactScore.levels.titleLine1")}
                <br />
                <em>{t("impactScore.levels.titleLine2")}</em>
              </h2>
              <p className="pub-lede">{t("impactScore.levels.lede")}</p>
            </Reveal>

            <StaggerGrid className="pub-levels-grid" stagger={0.07}>
              {IMPACT_LEVELS.map((level, idx) => {
                const Icon = LEVEL_ICONS[idx] ?? Trophy;
                const isLegend = idx === IMPACT_LEVELS.length - 1;
                return (
                  <StaggerItem
                    key={level.min}
                    as="article"
                    className={`pub-level-card${isLegend ? " is-legend" : ""}`}
                  >
                    <span className="pub-level-step">
                      {t("impactScore.levels.step", { num: idx + 1 })}
                    </span>
                    <div className="pub-level-icon" aria-hidden="true">
                      <Icon size={26} weight="duotone" />
                    </div>
                    <span className="pub-level-min">
                      {t("impactScore.levels.fromPts", { min: level.min })}
                    </span>
                    <h3>{t(`impactScore.levels.names.l${idx}`)}</h3>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 04. Pourquoi accumuler des points dès maintenant ──────── */}
        <section className="pub-section pub-dark" aria-label={t("impactScore.future.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("impactScore.future.titleLine1")}
                <br />
                <em>{t("impactScore.future.titleLine2")}</em>
              </h2>
              <p className="pub-lede">{t("impactScore.future.lede")}</p>
            </Reveal>

            <StaggerGrid className="pub-future-grid" stagger={0.08}>
              {FUTURE_SPECS.map(({ key, icon: Icon }) => (
                <StaggerItem key={key} as="article" className="pub-future-card">
                  <div className="pub-future-icon" aria-hidden="true">
                    <Icon size={22} weight="duotone" />
                  </div>
                  <h3>{t(`impactScore.future.items.${key}.title`)}</h3>
                  <p>{t(`impactScore.future.items.${key}.desc`)}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 05. Questions fréquentes sur l’Impact Score ───────────── */}
        <section className="pub-section pub-light" aria-label={t("impactScore.faq.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("impactScore.faq.titleLine1")}
                <br />
                <em>{t("impactScore.faq.titleLine2")}</em>
              </h2>
              <p className="pub-lede">
                {t("impactScore.faq.ledePrefix")}{" "}
                <Link to="/cs/faq" className="text-[#e65100] font-semibold hover:underline">
                  {t("impactScore.faq.ledeLink")}
                </Link>
                .
              </p>
            </Reveal>

            <Reveal delay={0.06}>
              <Accordion type="single" collapsible className="space-y-3 max-w-4xl">
                {scoreFaqs.map((item) => (
                  <AccordionItem
                    key={item.key}
                    value={`impact-faq-${item.key}`}
                    className="rounded-2xl border border-black/10 bg-[#faf8f5] px-5 transition-colors data-[state=open]:bg-white data-[state=open]:border-[#ff9800]/50 data-[state=open]:shadow-sm"
                  >
                    <AccordionTrigger className="font-poppins text-left text-[0.98rem] sm:text-[1.04rem] font-semibold text-[#18181b] py-4 hover:no-underline hover:text-[#e65100] gap-4">
                      <span>{item.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="font-nunito font-normal text-[0.95rem] text-[#52525b] pb-5 pt-0.5 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        {/* ── 06. CTA Final Orange ──────────────────────────────────── */}
        <section className="pub-section pub-orange" aria-label={t("impactScore.cta.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("impactScore.cta.titleLine1")}
                  <br />
                  <em>{t("impactScore.cta.titleLine2")}</em>
                </h2>
                <p>{t("impactScore.cta.body")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate(isAuthenticated ? "/resources" : "/register")}
                >
                  {isAuthenticated
                    ? t("impactScore.cta.ctaAuth")
                    : t("impactScore.cta.ctaGuest")}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() => navigate("/cs/faq")}
                >
                  {t("impactScore.cta.ctaSecondary")}
                </button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </PublicMotionProvider>
  );
}

export default ImpactScoreInfo;
