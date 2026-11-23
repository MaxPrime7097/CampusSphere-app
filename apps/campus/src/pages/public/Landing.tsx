import { lazy, Suspense, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChatCircle,
  CheckCircle,
  DownloadSimple,
  FilePdf,
  Lightning,
  RocketLaunch,
  Sparkle,
  UsersThree,
} from "@phosphor-icons/react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CookieBanner } from "@/components/layout/CookieBanner";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
  VIEWPORT_ONCE,
} from "@/components/public/PublicMotion";
import "@/styles/landing.css";

const ScrollTriggered = lazy(() => import("@/components/layout/ScrollTriggered"));

import {
  sectionOneCard,
  sectionTwoCard,
  sectionThreeCard,
  sectionFourCard,
} from "@/components/layout/cardData";

const PILLAR_IDS = ["rencontres", "ressources", "projets", "opportunites"] as const;
type StarterPillarId = (typeof PILLAR_IDS)[number];

const CONSTELLATION_SPECS = [
  { key: "c1", pos: "lp-pos-1", num: "01", icon: UsersThree, green: false },
  { key: "c2", pos: "lp-pos-2", num: "02", icon: BookOpen, green: false },
  { key: "c3", pos: "lp-pos-3", num: "03", icon: Lightning, green: false },
  { key: "c4", pos: "lp-pos-4", num: "04", icon: Calendar, green: false },
  { key: "c5", pos: "lp-pos-5", num: "05", icon: Sparkle, green: true },
  { key: "c6", pos: "lp-pos-6", num: "06", icon: ChatCircle, green: false },
] as const;

export function Landing() {
  const { t } = useTranslation("public");
  const navigate = useNavigate();
  const location = useLocation();
  const [activePillar, setActivePillar] = useState<StarterPillarId>("rencontres");
  const [hoveredConstellation, setHoveredConstellation] = useState<string | null>(null);

  const canonicalUrl =
    location.pathname === "/cs" || location.pathname.startsWith("/cs/")
      ? "https://campussphere.app/cs"
      : "https://campussphere.app/";

  const marqueeItems = t("landing.manifesto.marquee", { returnObjects: true }) as string[];
  const communityPoints = t("landing.features.stories.community.points", { returnObjects: true }) as string[];
  const resourcesPoints = t("landing.features.stories.resources.points", { returnObjects: true }) as string[];
  const spheresPoints = t("landing.features.stories.spheres.points", { returnObjects: true }) as string[];
  const eventsPoints = t("landing.features.stories.events.points", { returnObjects: true }) as string[];
  const spheraChecks = t("landing.sphera.checks", { returnObjects: true }) as string[];
  const traces = t("landing.community.traces", { returnObjects: true }) as { title: string; desc: string }[];
  const steps = t("landing.steps.items", { returnObjects: true }) as {
    num: string;
    kicker: string;
    title: string;
    desc: string;
  }[];

  const currentPillarTag = t(`landing.manifesto.pillars.${activePillar}.tag`);
  const currentPillarCaption = t(`landing.manifesto.pillars.${activePillar}.caption`);

  const getSpheraUrl = () => {
    const envUrl = (import.meta.env.VITE_SPHERA_STANDALONE_URL as string)?.trim();
    const isLocal = ["localhost", "127.0.0.1"].some((h) =>
      window.location.hostname.includes(h)
    );
    const baseUrl =
      envUrl || (isLocal ? "http://localhost:5174" : "https://sphera.campussphere.app");
    const accessToken =
      localStorage.getItem("access") || localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh");
    const params = new URLSearchParams();
    if (accessToken) params.set("access_token", accessToken);
    if (refreshToken) params.set("refresh_token", refreshToken);
    const query = params.toString();
    return `${baseUrl.replace(/\/$/, "")}/app${query ? `?${query}` : ""}`;
  };

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("landing.meta.title")}</title>
        <meta name="description" content={t("landing.meta.description")} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("landing.meta.title")} />
        <meta property="og:description" content={t("landing.meta.ogDescription")} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://campussphere.app/#website",
                name: "CampusSphere",
                url: "https://campussphere.app",
                description: t("landing.meta.schemaDescription"),
              },
              {
                "@type": "EducationalOrganization",
                "@id": "https://campussphere.app/#organization",
                name: "CampusSphere",
                url: "https://campussphere.app",
                logo: "https://campussphere.app/CS.svg",
                sameAs: [
                  "https://web.facebook.com/campussphereofficial",
                  "https://www.linkedin.com/company/campussphere",
                  "https://www.instagram.com/campussphere",
                ],
              },
            ],
          })}
        </script>
      </Helmet>

      <Header />

      <div className="cs-editorial">
        {/* ── Hero (centré) ─────────────────────────────────────────── */}
        <section className="lp-hero" id="accueil" aria-labelledby="hero-title">
          <img
            src="/landing/hero-campus.webp"
            alt=""
            className="lp-hero-bg"
            aria-hidden="true"
            loading="eager"
          />
          <div className="lp-hero-scrim" aria-hidden="true" />
          <div className="lp-hero-grid" aria-hidden="true" />
          <div className="lp-hero-glow" aria-hidden="true" />

          {/* Aperçus des 4 fonctionnalités clés autour du Hero (desktop large) */}
          <div className="lp-hero-artifacts" aria-hidden="true">
            <div className="lp-artifact lp-artifact-post">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.22, ease: PUBLIC_EASE }}
              >
                <div className="lp-artifact-post-head">
                  <span className="lp-artifact-avatar">M</span>
                  <div>
                    <b>Max N.</b>
                    <small>{t("landing.hero.artifacts.postMeta")}</small>
                  </div>
                </div>
                <p>{t("landing.hero.artifacts.postText")}</p>
                <div className="lp-artifact-post-foot">
                  <span>{t("landing.hero.artifacts.postImpact")}</span>
                  <span>{t("landing.hero.artifacts.postReplies")}</span>
                </div>
              </motion.div>
            </div>

            <div className="lp-artifact lp-artifact-file">
              <motion.div
                className="flex items-center gap-3 w-full"
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.34, ease: PUBLIC_EASE }}
              >
                <div className="lp-artifact-file-icon">
                  <FilePdf size={22} weight="duotone" aria-hidden="true" />
                  <span>PDF</span>
                </div>
                <div className="lp-artifact-file-info">
                  <b>{t("landing.hero.artifacts.fileTitle")}</b>
                  <small>{t("landing.hero.artifacts.fileMeta")}</small>
                </div>
                <div className="lp-artifact-file-dl">
                  <DownloadSimple size={18} weight="duotone" aria-hidden="true" />
                </div>
              </motion.div>
            </div>

            <div className="lp-artifact lp-artifact-sphere">
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.28, ease: PUBLIC_EASE }}
              >
                <div className="lp-artifact-sphere-top">
                  <span className="lp-artifact-badge">{t("landing.hero.artifacts.sphereBadge")}</span>
                  <div className="lp-artifact-avatars">
                    <span>A</span>
                    <span>J</span>
                    <span>+2</span>
                  </div>
                </div>
                <b>{t("landing.hero.artifacts.sphereTitle")}</b>
                <div className="lp-artifact-progress">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    style={{ transformOrigin: "left" }}
                    transition={{ duration: 0.85, delay: 0.6, ease: PUBLIC_EASE }}
                  />
                </div>
                <div className="lp-artifact-sphere-foot">
                  <small>{t("landing.hero.artifacts.sphereTasks")}</small>
                  <b>72%</b>
                </div>
              </motion.div>
            </div>

            <div className="lp-artifact lp-artifact-event">
              <motion.div
                className="flex items-center gap-[13px] w-full"
                initial={{ opacity: 0, y: 18, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.4, ease: PUBLIC_EASE }}
              >
                <div className="lp-artifact-event-date">
                  <span>{t("landing.hero.artifacts.eventDay")}</span>
                  <strong>18</strong>
                </div>
                <div className="lp-artifact-event-info">
                  <b>{t("landing.hero.artifacts.eventTitle")}</b>
                  <small>{t("landing.hero.artifacts.eventMeta")}</small>
                  <span className="lp-artifact-event-pill">{t("landing.hero.artifacts.eventPill")}</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="lp-container lp-hero-inner">
            <motion.h1
              id="hero-title"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: PUBLIC_EASE }}
            >
              {t("landing.hero.titleLine1")}<br />
              <em>{t("landing.hero.titleLine2")}</em><br />
              {t("landing.hero.titleLine3")}
            </motion.h1>
            <motion.p
              className="lp-hero-lede"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.52, delay: 0.08, ease: PUBLIC_EASE }}
            >
              {t("landing.hero.lede")}
            </motion.p>
            <motion.div
              className="lp-hero-actions"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.16, ease: PUBLIC_EASE }}
            >
              <button className="lp-btn lp-btn-orange" onClick={() => navigate("/register")}>
                {t("landing.hero.ctaPrimary")}{" "}
                <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
              </button>
              <button
                className="lp-btn lp-btn-ghost-light"
                onClick={() =>
                  document.getElementById("constat")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {t("landing.hero.ctaSecondary")}{" "}
                <ArrowDown size={16} weight="duotone" className="lp-icon-down" aria-hidden="true" />
              </button>
            </motion.div>
            <motion.p
              className="lp-hero-note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.26, ease: PUBLIC_EASE }}
            >
              {t("landing.hero.note")}
            </motion.p>
          </div>
        </section>

        {/* ── Point de départ (Manifeste vivant + ruban campus) ──────── */}
        <section
          className="lp-section lp-manifesto-section"
          id="point-de-depart"
          aria-label={t("landing.manifesto.ariaLabel")}
        >
          <div className="lp-container">
            <div className="lp-manifesto">
              <Reveal>
                <h2 className="lp-manifesto-lead">
                  {t("landing.manifesto.leadStart")}{" "}
                  <em>{t("landing.manifesto.leadHighlight")}</em>
                </h2>
              </Reveal>

              <Reveal delay={0.06}>
                <p className="lp-manifesto-statement">
                  {t("landing.manifesto.statementStart")}{" "}
                  <span className="lp-manifesto-token">
                    <button
                      type="button"
                      className={`lp-manifesto-pill ${activePillar === "rencontres" ? "is-active" : ""}`}
                      aria-pressed={activePillar === "rencontres"}
                      onMouseEnter={() => setActivePillar("rencontres")}
                      onFocus={() => setActivePillar("rencontres")}
                      onClick={() => setActivePillar("rencontres")}
                    >
                      <UsersThree size={20} weight="duotone" aria-hidden="true" />
                      <span>{t("landing.manifesto.pillars.rencontres.pill")}</span>
                    </button>,
                  </span>{" "}
                  <span className="lp-manifesto-token">
                    <button
                      type="button"
                      className={`lp-manifesto-pill ${activePillar === "ressources" ? "is-active" : ""}`}
                      aria-pressed={activePillar === "ressources"}
                      onMouseEnter={() => setActivePillar("ressources")}
                      onFocus={() => setActivePillar("ressources")}
                      onClick={() => setActivePillar("ressources")}
                    >
                      <BookOpen size={20} weight="duotone" aria-hidden="true" />
                      <span>{t("landing.manifesto.pillars.ressources.pill")}</span>
                    </button>,
                  </span>{" "}
                  <span className="lp-manifesto-token">
                    <button
                      type="button"
                      className={`lp-manifesto-pill ${activePillar === "projets" ? "is-active" : ""}`}
                      aria-pressed={activePillar === "projets"}
                      onMouseEnter={() => setActivePillar("projets")}
                      onFocus={() => setActivePillar("projets")}
                      onClick={() => setActivePillar("projets")}
                    >
                      <RocketLaunch size={20} weight="duotone" aria-hidden="true" />
                      <span>{t("landing.manifesto.pillars.projets.pill")}</span>
                    </button>
                  </span>{" "}
                  {t("landing.manifesto.statementAnd")}{" "}
                  <span className="lp-manifesto-token">
                    <button
                      type="button"
                      className={`lp-manifesto-pill ${activePillar === "opportunites" ? "is-active" : ""}`}
                      aria-pressed={activePillar === "opportunites"}
                      onMouseEnter={() => setActivePillar("opportunites")}
                      onFocus={() => setActivePillar("opportunites")}
                      onClick={() => setActivePillar("opportunites")}
                    >
                      <Sparkle size={20} weight="duotone" aria-hidden="true" />
                      <span>{t("landing.manifesto.pillars.opportunites.pill")}</span>
                    </button>
                  </span>{" "}
                  {t("landing.manifesto.statementEnd")}
                </p>
              </Reveal>

              <Reveal delay={0.12}>
                <div className="lp-manifesto-note" role="status" aria-live="polite">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activePillar}
                      className="lp-manifesto-note-left"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: PUBLIC_EASE }}
                    >
                      <span className="lp-manifesto-note-tag">{currentPillarTag}</span>
                      <p className="lp-manifesto-note-text">« {currentPillarCaption} »</p>
                    </motion.div>
                  </AnimatePresence>
                  <div className="lp-manifesto-dots" aria-label={t("landing.manifesto.choosePillar")}>
                    {PILLAR_IDS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        className={`lp-manifesto-dot ${activePillar === id ? "is-active" : ""}`}
                        aria-label={t(`landing.manifesto.pillars.${id}.tag`)}
                        aria-pressed={activePillar === id}
                        onClick={() => setActivePillar(id)}
                      />
                    ))}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <div className="lp-marquee" aria-hidden="true">
            <div className="lp-marquee-track">
              {[...marqueeItems, ...marqueeItems].map((item, idx) => (
                <span key={`${item}-${idx}`} className="lp-marquee-item">
                  {item}
                  <i />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Le Constat (Constellation CampusSphere) ────────────────── */}
        <section
          className="lp-section lp-constellation-section"
          id="constat"
          aria-label={t("landing.constat.ariaLabel")}
        >
          <div className="lp-container">
            <Reveal className="lp-constat-head">
              <h2>
                {t("landing.constat.titleLine1")}<br />
                <span className="lp-constat-orange">{t("landing.constat.titleLine2")}</span>
              </h2>
              <p>{t("landing.constat.body")}</p>
            </Reveal>

            <div className="lp-constellation-canvas">
              <div
                className={`lp-constellation-center${hoveredConstellation ? " is-active" : ""}`}
              >
                <motion.div
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0.88 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: 0.55, ease: PUBLIC_EASE }}
                >
                  <img src="/CS.svg" alt="CampusSphere" className="lp-constellation-logo" />
                  <b>CampusSphere</b>
                  <small>{t("landing.constat.centerSubtitle")}</small>
                </motion.div>
              </div>

              {CONSTELLATION_SPECS.map(({ key, pos, num, icon: Icon, green }, idx) => {
                const isDimmed = hoveredConstellation !== null && hoveredConstellation !== key;
                return (
                  <div key={key} className={`lp-constellation-slot ${pos}`}>
                    <motion.div
                      className={`lp-constellation-card${isDimmed ? " is-dimmed" : ""}`}
                      initial={{ opacity: 0, y: 18, scale: 0.96 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={VIEWPORT_ONCE}
                      transition={{ duration: 0.46, delay: idx * 0.06, ease: PUBLIC_EASE }}
                      onMouseEnter={() => setHoveredConstellation(key)}
                      onMouseLeave={() => setHoveredConstellation(null)}
                    >
                      <div className="lp-constellation-card-top">
                        <span
                          className="lp-constellation-icon"
                          style={
                            green
                              ? { background: "rgba(34, 197, 94, 0.12)", color: "#16a34a" }
                              : undefined
                          }
                        >
                          <Icon size={20} weight="duotone" aria-hidden="true" />
                        </span>
                        <span className="lp-constellation-num">{num}</span>
                      </div>
                      <h3>{t(`landing.constat.cards.${key}.title`)}</h3>
                      <p>{t(`landing.constat.cards.${key}.desc`)}</p>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            <Reveal delay={0.18}>
              <p className="lp-constat-bottom-tag">{t("landing.constat.bottomTag")}</p>
            </Reveal>
          </div>
        </section>

        {/* ── Feature Stories ─────────────────────────────────────────── */}
        <section
          className="lp-section lp-light"
          id="produit"
          aria-label={t("landing.features.ariaLabel")}
        >
          <div className="lp-container">
            <Reveal className="lp-centered">
              <h2 className="lp-h2">
                {t("landing.features.titleLine1")}<br />
                <em>{t("landing.features.titleLine2")}</em>
              </h2>
              <p className="lp-lede">{t("landing.features.lede")}</p>
            </Reveal>

            <div className="lp-stories">
              {/* 01 COMMUNAUTÉ */}
              <article
                className="lp-story lp-story-paper"
                id="communaute"
                aria-label={t("landing.features.stories.community.ariaLabel")}
              >
                <Reveal className="lp-story-copy" x={-20} y={0}>
                  <span className="lp-story-index">
                    {t("landing.features.stories.community.index")}
                  </span>
                  <h3>
                    {t("landing.features.stories.community.titleLine1")}<br />
                    <em>{t("landing.features.stories.community.titleLine2")}</em>
                  </h3>
                  <p>{t("landing.features.stories.community.desc")}</p>
                  <ul className="lp-story-points">
                    {communityPoints.map((pt) => (
                      <li key={pt}>
                        <CheckCircle size={18} weight="duotone" aria-hidden="true" /> {pt}
                      </li>
                    ))}
                  </ul>
                  <button className="lp-link" onClick={() => navigate("/register")}>
                    {t("landing.features.stories.community.cta")}{" "}
                    <ArrowRight size={16} weight="duotone" aria-hidden="true" />
                  </button>
                </Reveal>
                <div className="lp-story-visual">
                  <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                    <ScrollTriggered cardData={sectionOneCard} />
                  </Suspense>
                </div>
              </article>

              {/* 02 RESSOURCES */}
              <article
                className="lp-story lp-story-dark lp-story-reverse"
                id="ressources"
                aria-label={t("landing.features.stories.resources.ariaLabel")}
              >
                <Reveal className="lp-story-copy" x={20} y={0}>
                  <span className="lp-story-index">
                    {t("landing.features.stories.resources.index")}
                  </span>
                  <h3>
                    {t("landing.features.stories.resources.titleLine1")}<br />
                    <em>{t("landing.features.stories.resources.titleLine2")}</em>
                  </h3>
                  <p>{t("landing.features.stories.resources.desc")}</p>
                  <ul className="lp-story-points">
                    {resourcesPoints.map((pt) => (
                      <li key={pt}>
                        <CheckCircle size={18} weight="duotone" aria-hidden="true" /> {pt}
                      </li>
                    ))}
                  </ul>
                  <button className="lp-link" onClick={() => navigate("/register")}>
                    {t("landing.features.stories.resources.cta")}{" "}
                    <ArrowRight size={16} weight="duotone" aria-hidden="true" />
                  </button>
                </Reveal>
                <div className="lp-story-visual">
                  <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                    <ScrollTriggered cardData={sectionTwoCard} />
                  </Suspense>
                </div>
              </article>

              {/* 03 SPHÈRES */}
              <article
                className="lp-story lp-story-paper"
                id="spheres"
                aria-label={t("landing.features.stories.spheres.ariaLabel")}
              >
                <Reveal className="lp-story-copy" x={-20} y={0}>
                  <span className="lp-story-index">
                    {t("landing.features.stories.spheres.index")}
                  </span>
                  <h3>
                    {t("landing.features.stories.spheres.titleLine1")}<br />
                    <em>{t("landing.features.stories.spheres.titleLine2")}</em>
                  </h3>
                  <p>{t("landing.features.stories.spheres.desc")}</p>
                  <ul className="lp-story-points">
                    {spheresPoints.map((pt) => (
                      <li key={pt}>
                        <CheckCircle size={18} weight="duotone" aria-hidden="true" /> {pt}
                      </li>
                    ))}
                  </ul>
                  <button className="lp-link" onClick={() => navigate("/register")}>
                    {t("landing.features.stories.spheres.cta")}{" "}
                    <ArrowRight size={16} weight="duotone" aria-hidden="true" />
                  </button>
                </Reveal>
                <div className="lp-story-visual">
                  <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                    <ScrollTriggered cardData={sectionThreeCard} />
                  </Suspense>
                </div>
              </article>

              {/* 04 ÉVÉNEMENTS */}
              <article
                className="lp-story lp-story-dark lp-story-reverse"
                id="evenements"
                aria-label={t("landing.features.stories.events.ariaLabel")}
              >
                <Reveal className="lp-story-copy" x={20} y={0}>
                  <span className="lp-story-index">
                    {t("landing.features.stories.events.index")}
                  </span>
                  <h3>
                    {t("landing.features.stories.events.titleLine1")}<br />
                    <em>{t("landing.features.stories.events.titleLine2")}</em>
                  </h3>
                  <p>{t("landing.features.stories.events.desc")}</p>
                  <ul className="lp-story-points">
                    {eventsPoints.map((pt) => (
                      <li key={pt}>
                        <CheckCircle size={18} weight="duotone" aria-hidden="true" /> {pt}
                      </li>
                    ))}
                  </ul>
                  <button className="lp-link" onClick={() => navigate("/register")}>
                    {t("landing.features.stories.events.cta")}{" "}
                    <ArrowRight size={16} weight="duotone" aria-hidden="true" />
                  </button>
                </Reveal>
                <div className="lp-story-visual">
                  <Suspense fallback={<div style={{ minHeight: 400 }} />}>
                    <ScrollTriggered cardData={sectionFourCard} />
                  </Suspense>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── Sphera ──────────────────────────────────────────────────── */}
        <section className="lp-section lp-dark" id="sphera" aria-label="Sphera">
          <div className="lp-container">
            <div className="lp-sphera">
              <Reveal x={-20} y={0}>
                <div className="lp-sphera-lockup">
                  <img src="/sphera_logo.svg" alt="Sphera" width={42} height={42} />
                  <div>
                    <b>Sphera</b>
                    <small> {t("landing.sphera.by")}</small>
                  </div>
                </div>
                <h2>
                  {t("landing.sphera.titleLine1")}<br />
                  <em>{t("landing.sphera.titleLine2")}</em>
                </h2>
                <p>{t("landing.sphera.desc")}</p>
                <ul className="lp-sphera-checks">
                  {spheraChecks.map((check) => (
                    <li key={check}>
                      <CheckCircle size={18} weight="duotone" aria-hidden="true" /> {check}
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="lp-btn lp-btn-green" onClick={() => navigate("/sphera")}>
                    {t("landing.sphera.ctaDiscover")}{" "}
                    <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                  </button>
                  <a
                    className="lp-btn lp-btn-ghost-light"
                    href={getSpheraUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("landing.sphera.ctaOpen")}{" "}
                    <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                  </a>
                </div>
              </Reveal>
              <Reveal x={22} y={0} scale={0.97} delay={0.08}>
                <div className="lp-sphera-frame" data-image-slot="sphera-preview">
                  <div className="lp-sphera-bar" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <small>sphera.campussphere.app</small>
                  </div>
                  <img
                    src="/landing/sphera_preview.webp"
                    alt={t("landing.sphera.previewAlt")}
                    className="lp-sphera-img"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Dimension humaine ───────────────────────────────────────── */}
        <section className="lp-section lp-paper" aria-label={t("landing.community.ariaLabel")}>
          <div className="lp-container">
            <div className="lp-community">
              <Reveal x={-20} y={0} scale={0.98}>
                <div className="lp-media-slot has-media lp-community-photo" data-image-slot="community-photo">
                  <img
                    src="/landing/community-campus.webp"
                    alt={t("landing.community.photoAlt")}
                    loading="lazy"
                  />
                  <div className="lp-community-caption" aria-hidden="true">
                    <b>{t("landing.community.captionTitle")}</b>
                    <span>{t("landing.community.captionSub")}</span>
                  </div>
                </div>
              </Reveal>
              <div>
                <Reveal>
                  <h2 className="lp-h2">
                    {t("landing.community.titleLine1")}<br />
                    <em>{t("landing.community.titleLine2")}</em>
                  </h2>
                  <p className="lp-lede">{t("landing.community.lede")}</p>
                </Reveal>
                <StaggerGrid className="lp-traces" stagger={0.08} delayChildren={0.1}>
                  {traces.map((trace) => (
                    <StaggerItem key={trace.title} className="lp-trace" y={14}>
                      <div className="lp-trace-icon" aria-hidden="true">
                        <CheckCircle size={18} weight="duotone" />
                      </div>
                      <div>
                        <b>{trace.title}</b>
                        <small>{trace.desc}</small>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              </div>
            </div>
          </div>
        </section>

        {/* ── Premier pas ─────────────────────────────────────────────── */}
        <section className="lp-section lp-light" aria-label={t("landing.steps.ariaLabel")}>
          <div className="lp-container">
            <Reveal className="lp-steps-head">
              <h2 className="lp-h2">
                {t("landing.steps.titleLine1")}<br />
                <em>{t("landing.steps.titleLine2")}</em>
              </h2>
              <p className="lp-lede">{t("landing.steps.lede")}</p>
            </Reveal>
            <StaggerGrid className="lp-steps" stagger={0.1}>
              {steps.map((s, idx) => (
                <StaggerItem key={s.num} className="lp-step" y={20}>
                  <span className="lp-step-num" aria-hidden="true">
                    {s.num}
                  </span>
                  <div className="lp-step-body">
                    <div className="lp-step-kicker-row">
                      <span className="lp-step-kicker">{s.kicker}</span>
                      <motion.span
                        className="lp-step-line"
                        aria-hidden="true"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={VIEWPORT_ONCE}
                        style={{ transformOrigin: "left" }}
                        transition={{ duration: 0.55, delay: 0.16 + idx * 0.1, ease: PUBLIC_EASE }}
                      />
                    </div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── Ce que tu apportes / CTA ───────────────────────────────── */}
        <section className="lp-section lp-orange" aria-label={t("landing.cta.ariaLabel")}>
          <div className="lp-container">
            <div className="lp-impact">
              <Reveal className="lp-impact-copy">
                <h2>
                  {t("landing.cta.titleLine1")}<br />
                  <em>{t("landing.cta.titleLine2")}</em>
                </h2>
                <p>{t("landing.cta.body")}</p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                  <button className="lp-btn lp-btn-dark" onClick={() => navigate("/register")}>
                    {t("landing.cta.ctaPrimary")}{" "}
                    <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                  </button>
                  <button className="lp-btn lp-btn-ghost-light" onClick={() => navigate("/login")}>
                    {t("landing.cta.ctaSecondary")}
                  </button>
                </div>
              </Reveal>
              <div className="lp-impact-visual">
                <motion.div
                  className="lp-postit-wrapper"
                  initial={{ opacity: 0, y: 26, rotate: -3 }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: 0.58, ease: PUBLIC_EASE }}
                >
                  <div className="lp-postit-card">
                    <div className="lp-postit-tape" aria-hidden="true" />
                    <span className="lp-postit-kicker">{t("landing.cta.postitKicker")}</span>
                    <p className="lp-postit-text">{t("landing.cta.postitText")}</p>
                    <span className="lp-postit-author">{t("landing.cta.postitAuthor")}</span>
                  </div>

                  <motion.div
                    className="lp-postit-stamp"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 1.45, rotate: 14 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 5 }}
                    viewport={VIEWPORT_ONCE}
                    transition={{ type: "spring", stiffness: 360, damping: 20, delay: 0.3 }}
                  >
                    {t("landing.cta.postitStamp")}
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
      <CookieBanner />
    </PublicMotionProvider>
  );
}
