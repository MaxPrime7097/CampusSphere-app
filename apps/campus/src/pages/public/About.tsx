import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  CheckCircle,
  Compass,
  GraduationCap,
  Handshake,
  Heart,
  Lightbulb,
  Medal,
  ShieldCheck,
  Target,
  UsersThree,
} from "@phosphor-icons/react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Team01, type TeamMember } from "@/components/ui/team-01";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
} from "@/components/public/PublicMotion";
import "@/styles/public-pages.css";

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Nlend Max",
    role: "CEO & Full-Stack Dev",
    image: "/team/Max.webp",
    initials: "NM",
    shape: "arch",
    accentBg: "#ffe0b2",
    socials: {
      linkedin: "https://www.linkedin.com/in/max-prime-96b651239/",
      github: "https://github.com/MaxPrime7097",
      email: "mailto:contact@campussphere.app",
    },
  },
  {
    name: "Kana Tommi",
    role: "CMO & Graphic Designer",
    image: "/team/Tommi.webp",
    initials: "KT",
    shape: "peanut",
    accentBg: "#ffedd5",
    socials: {
      linkedin: "https://www.linkedin.com/",
      email: "mailto:contact@campussphere.app",
    },
  },
  {
    name: "Hussein Boris",
    role: "CTO & Full-Stack Dev",
    image: "/team/Boris.webp",
    initials: "HB",
    shape: "oval",
    accentBg: "#fef3c7",
    socials: {
      github: "https://github.com/",
      email: "mailto:contact@campussphere.app",
    },
  },
  {
    name: "Nounga Nathan",
    role: "CPO & Head of Design",
    image: "/team/Nathan.webp",
    initials: "NN",
    shape: "triple",
    accentBg: "#fed7aa",
    socials: {
      linkedin: "https://www.linkedin.com/",
      email: "mailto:contact@campussphere.app",
    },
  },
  {
    name: "Gwenaëlle Stelvana",
    role: "CFO & Community Manager",
    image: "/team/Gwen.webp",
    initials: "GS",
    shape: "leaf",
    accentBg: "#fde68a",
    socials: {
      linkedin: "https://www.linkedin.com/",
      email: "mailto:contact@campussphere.app",
    },
  },
  {
    name: "Otti Jacques",
    role: "Backend Developer",
    image: "/team/Jacques.webp",
    initials: "OJ",
    shape: "pill",
    accentBg: "#ffedd5",
    socials: {
      github: "https://github.com/",
      email: "mailto:contact@campussphere.app",
    },
  },
];

const VALUE_ICONS = [UsersThree, ShieldCheck, Handshake, Lightbulb, Heart, Medal] as const;

export function About(): JSX.Element {
  const { t } = useTranslation("public");
  const navigate = useNavigate();

  const heroPillars = t("about.hero.pillars", { returnObjects: true }) as {
    num: string;
    title: string;
    desc: string;
  }[];
  const storySteps = t("about.story.steps", { returnObjects: true }) as {
    num: string;
    tag: string;
    title: string;
    desc: string;
  }[];
  const card1Points = t("about.mission.card1Points", { returnObjects: true }) as string[];
  const card2Points = t("about.mission.card2Points", { returnObjects: true }) as string[];
  const values = t("about.values.items", { returnObjects: true }) as {
    title: string;
    desc: string;
  }[];

  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    mainEntity: {
      "@type": "Organization",
      name: "CampusSphere",
      url: "https://campussphere.app",
      logo: "https://campussphere.app/CS.svg",
      description: t("about.meta.schemaDescription"),
      founders: TEAM_MEMBERS.map((member) => ({
        "@type": "Person",
        name: member.name,
        jobTitle: member.role,
        image: `https://campussphere.app${member.image}`,
      })),
    },
  };

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("about.meta.title")}</title>
        <meta name="description" content={t("about.meta.description")} />
        <link rel="canonical" href="https://campussphere.app/cs/about" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("about.meta.ogTitle")} />
        <meta property="og:description" content={t("about.meta.ogDescription")} />
        <meta property="og:url" content="https://campussphere.app/cs/about" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(teamSchema)}</script>
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── 01. Hero éditorial centré ─────────────────────────────── */}
        <section className="pub-hero" aria-labelledby="about-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-hero-center">
              <motion.h1
                id="about-title"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, ease: PUBLIC_EASE }}
              >
                {t("about.hero.titleLine1")}<br />
                <em>{t("about.hero.titleLine2")}</em>
              </motion.h1>
              <motion.p
                className="pub-hero-lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: PUBLIC_EASE }}
              >
                {t("about.hero.lede")}
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
                  onClick={() => navigate("/register")}
                >
                  {t("about.hero.ctaPrimary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() =>
                    document.getElementById("histoire")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("about.hero.ctaSecondary")}{" "}
                  <ArrowDown size={16} weight="duotone" className="pub-icon-down" aria-hidden="true" />
                </button>
              </motion.div>
            </div>

            <StaggerGrid className="pub-hero-pillars" mount delayChildren={0.2} stagger={0.07}>
              {heroPillars.map((pillar) => (
                <StaggerItem key={pillar.num} className="pub-hero-pillar" y={14}>
                  <span className="pub-hero-pillar-num">{pillar.num}</span>
                  <b>{pillar.title}</b>
                  <p>{pillar.desc}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 02. Notre histoire en 3 temps ─────────────────────────── */}
        <section
          className="pub-section pub-light"
          id="histoire"
          aria-label={t("about.story.ariaLabel")}
        >
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("about.story.titleLine1")}<br />
                <em>{t("about.story.titleLine2")}</em>
              </h2>
              <p className="pub-lede">{t("about.story.lede")}</p>
            </Reveal>

            <StaggerGrid className="pub-story-steps" stagger={0.08}>
              {storySteps.map((step) => (
                <StaggerItem key={step.num} as="article" className="pub-story-step">
                  <div className="pub-story-step-top">
                    <span className="pub-story-num">{step.num}</span>
                    <span className="pub-story-tag">{step.tag}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 03. Mission & Cap (2 cartes contrastées) ──────────────── */}
        <section className="pub-section pub-paper" aria-label={t("about.mission.ariaLabel")}>
          <div className="pub-container">
            <StaggerGrid className="pub-mission-grid" stagger={0.1}>
              <StaggerItem as="article" className="pub-mission-card pub-mission-card-light">
                <div>
                  <div className="pub-mission-icon" aria-hidden="true">
                    <Compass size={24} weight="duotone" />
                  </div>
                  <h2>
                    {t("about.mission.card1TitleStart")}{" "}
                    <em>{t("about.mission.card1TitleHighlight")}</em>
                  </h2>
                  <p>{t("about.mission.card1Body")}</p>
                </div>
                <ul className="pub-mission-points">
                  {card1Points.map((point) => (
                    <li key={point}>
                      <CheckCircle size={18} weight="duotone" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </StaggerItem>

              <StaggerItem as="article" className="pub-mission-card pub-mission-card-dark">
                <div>
                  <div className="pub-mission-icon" aria-hidden="true">
                    <Target size={24} weight="duotone" />
                  </div>
                  <h2>
                    {t("about.mission.card2TitleStart")}{" "}
                    <em>{t("about.mission.card2TitleHighlight")}</em>
                  </h2>
                  <p>{t("about.mission.card2Body")}</p>
                </div>
                <ul className="pub-mission-points">
                  {card2Points.map((point) => (
                    <li key={point}>
                      <CheckCircle size={18} weight="duotone" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </StaggerItem>
            </StaggerGrid>
          </div>
        </section>

        {/* ── 04. Nos valeurs ───────────────────────────────────────── */}
        <section className="pub-section pub-light" aria-label={t("about.values.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("about.values.titleLine1")}<br />
                <em>{t("about.values.titleLine2")}</em>
              </h2>
              <p className="pub-lede">{t("about.values.lede")}</p>
            </Reveal>

            <StaggerGrid className="pub-values-grid" stagger={0.055}>
              {values.map((val, idx) => {
                const Icon = VALUE_ICONS[idx] ?? UsersThree;
                return (
                  <StaggerItem key={val.title} as="article" className="pub-value-card">
                    <div className="pub-value-icon" aria-hidden="true">
                      <Icon size={22} weight="duotone" />
                    </div>
                    <h3>{val.title}</h3>
                    <p>{val.desc}</p>
                  </StaggerItem>
                );
              })}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 05. L'Équipe (design Team01) + Programme Ambassadeurs ─── */}
        <section
          className="pub-section pub-paper"
          id="equipe"
          aria-label={t("about.team.ariaLabel")}
        >
          <div className="pub-container">
            <Team01
              title={t("about.team.title")}
              highlight={t("about.team.highlight")}
              subtitle={t("about.team.subtitle")}
              members={TEAM_MEMBERS}
            />

            <Reveal delay={0.08}>
              <div className="pub-ambassador">
                <div>
                  <span className="pub-ambassador-badge">
                    <GraduationCap size={15} weight="duotone" aria-hidden="true" />
                    {t("about.team.ambassadorBadge")}
                  </span>
                  <h3>{t("about.team.ambassadorTitle")}</h3>
                  <p>{t("about.team.ambassadorDesc")}</p>
                </div>
                <button
                  type="button"
                  className="pub-btn pub-btn-orange shrink-0"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("about.team.ambassadorCta")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 06. CTA Final Orange ──────────────────────────────────── */}
        <section className="pub-section pub-orange" aria-label={t("about.cta.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("about.cta.titleLine1")}<br />
                  <em>{t("about.cta.titleLine2")}</em>
                </h2>
                <p>{t("about.cta.body")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate("/register")}
                >
                  {t("about.cta.ctaPrimary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("about.cta.ctaSecondary")}
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

export default About;
