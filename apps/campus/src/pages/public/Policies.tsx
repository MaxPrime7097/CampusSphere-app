import React from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, Envelope } from "@phosphor-icons/react";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { POLICY_CATALOG } from "@/components/layout/PolicyLayout";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
} from "@/components/public/PublicMotion";
import "@/styles/public-pages.css";

export function Policies(): JSX.Element {
  const navigate = useNavigate();
  const { t } = useTranslation("policies");

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("hub.meta.title")}</title>
        <meta name="description" content={t("hub.meta.description")} />
        <link rel="canonical" href="https://campussphere.app/cs/policies" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("hub.meta.ogTitle")} />
        <meta property="og:description" content={t("hub.meta.ogDescription")} />
        <meta property="og:url" content="https://campussphere.app/cs/policies" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── 01. Hero éditorial centré ─────────────────────────────── */}
        <section className="pub-hero" aria-labelledby="policies-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-hero-center">
              <motion.h1
                id="policies-title"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, ease: PUBLIC_EASE }}
              >
                {t("hub.hero.titleLine1")}
                <br />
                <em>{t("hub.hero.titleLine2")}</em>
              </motion.h1>
              <motion.p
                className="pub-hero-lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: PUBLIC_EASE }}
              >
                {t("hub.hero.lede")}
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
                  onClick={() => navigate("/cs/policies/privacy")}
                >
                  {t("hub.hero.ctaPrimary")}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("hub.hero.ctaSecondary")}
                </button>
              </motion.div>
            </div>

            <StaggerGrid className="pub-hero-pillars" mount delayChildren={0.2} stagger={0.07}>
              {(["p1", "p2", "p3"] as const).map((key) => (
                <StaggerItem key={key} className="pub-hero-pillar" y={14}>
                  <span className="pub-hero-pillar-num">{t(`hub.hero.pillars.${key}.num`)}</span>
                  <b>{t(`hub.hero.pillars.${key}.title`)}</b>
                  <p>{t(`hub.hero.pillars.${key}.desc`)}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 02. Catalogue des 8 politiques ────────────────────────── */}
        <section className="pub-section pub-light" aria-label={t("hub.docs.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-split-head">
              <h2 className="pub-h2">
                {t("hub.docs.titleLine1")}
                <br />
                <em>{t("hub.docs.titleLine2")}</em>
              </h2>
              <p className="pub-lede">{t("hub.docs.lede")}</p>
            </Reveal>

            <StaggerGrid className="pub-policy-grid" stagger={0.055}>
              {POLICY_CATALOG.map(({ key, slug, icon: Icon }) => (
                <StaggerItem key={slug} className="flex">
                  <Link to={slug} className="pub-policy-card w-full">
                    <div>
                      <div className="pub-policy-card-top">
                        <div className="pub-value-icon" aria-hidden="true">
                          <Icon size={22} weight="duotone" />
                        </div>
                        <span className="pub-policy-card-arrow" aria-hidden="true">
                          <ArrowUpRight size={17} weight="bold" />
                        </span>
                      </div>
                      <h2>{t(`catalog.${key}.title`)}</h2>
                      <p>{t(`catalog.${key}.description`)}</p>
                    </div>
                    <span className="pub-policy-card-foot">
                      {t("hub.docs.readDoc")} <ArrowRight size={15} weight="bold" aria-hidden="true" />
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 03. Bandeau final Orange ──────────────────────────────── */}
        <section className="pub-section pub-orange" aria-label={t("hub.cta.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("hub.cta.titleLine1")}
                  <br />
                  <em>{t("hub.cta.titleLine2")}</em>
                </h2>
                <p>{t("hub.cta.body")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("hub.cta.ctaPrimary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <a href="mailto:policies@campussphere.app" className="pub-btn pub-btn-ghost-light">
                  <Envelope size={16} weight="duotone" className="pub-icon-static" aria-hidden="true" />
                  policies@campussphere.app
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </PublicMotionProvider>
  );
}

export default Policies;
