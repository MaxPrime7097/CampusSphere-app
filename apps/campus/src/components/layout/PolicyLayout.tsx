import React, { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpRight,
  CaretRight,
  Cookie,
  Copyright as CopyrightIcon,
  Envelope,
  FileText,
  Receipt,
  Scales,
  ShieldCheck,
  Trash,
  UsersThree,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/styles/public-pages.css";

export type PolicyCatalogKey =
  | "privacy"
  | "terms"
  | "termsOfSale"
  | "legalNotice"
  | "dataDeletion"
  | "communityGuidelines"
  | "cookiePolicy"
  | "copyright";

export interface PolicyNavItem {
  key: PolicyCatalogKey;
  slug: string;
  icon: React.ElementType;
}

export const POLICY_CATALOG: PolicyNavItem[] = [
  { key: "privacy", slug: "/cs/policies/privacy", icon: ShieldCheck },
  { key: "terms", slug: "/cs/policies/terms", icon: FileText },
  { key: "termsOfSale", slug: "/cs/policies/terms-of-sale", icon: Receipt },
  { key: "legalNotice", slug: "/cs/policies/legal-notice", icon: Scales },
  { key: "dataDeletion", slug: "/cs/policies/datadeletion", icon: Trash },
  { key: "communityGuidelines", slug: "/cs/policies/community-guidelines", icon: UsersThree },
  { key: "cookiePolicy", slug: "/cs/policies/cookiepolicy", icon: Cookie },
  { key: "copyright", slug: "/cs/policies/copyright", icon: CopyrightIcon },
];

export interface PolicySectionLink {
  id: string;
  title: string;
}

interface PolicyLayoutProps {
  metaTitle: string;
  metaDescription: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  title: string;
  highlight?: string;
  subtitle: string;
  lastUpdated: string;
  currentSlug: string;
  sections: PolicySectionLink[];
  children: React.ReactNode;
}

export function PolicyLayout({
  metaTitle,
  metaDescription,
  canonical,
  ogTitle,
  ogDescription,
  title,
  highlight,
  subtitle,
  lastUpdated,
  currentSlug,
  sections,
  children,
}: PolicyLayoutProps): JSX.Element {
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { t } = useTranslation("policies");

  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── Hero éditorial sombre compact ─────────────────────────── */}
        <section className="pub-legal-hero" aria-labelledby="policy-page-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-legal-hero-inner">
              <nav className="pub-legal-breadcrumb" aria-label={t("layout.breadcrumbAria")}>
                <Link to="/cs/policies">{t("layout.policiesRoot")}</Link>
                <CaretRight size={13} weight="bold" aria-hidden="true" />
                <span>{highlight ? `${title} ${highlight}` : title}</span>
              </nav>

              <h1 id="policy-page-title">
                {title}
                {highlight ? (
                  <>
                    {" "}
                    <em>{highlight}</em>
                  </>
                ) : null}
              </h1>
              <p className="pub-legal-hero-sub">{subtitle}</p>
              <span className="pub-legal-updated">
                {t("layout.lastUpdated", { date: lastUpdated })}
              </span>
            </div>
          </div>
        </section>

        {/* ── Contenu juridique 2 colonnes ──────────────────────────── */}
        <section className="pub-section pub-light">
          <div className="pub-container">
            {/* Navigation rapide entre politiques sur mobile / tablette */}
            <nav className="pub-faq-mobile-pills" aria-label={t("layout.otherPoliciesAria")}>
              {POLICY_CATALOG.map((item) => {
                const isActive = item.slug === currentSlug;
                return (
                  <Link
                    key={item.slug}
                    to={item.slug}
                    className={`pub-faq-mobile-pill${isActive ? " is-active" : ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    {t(`catalog.${item.key}.shortLabel`)}
                  </Link>
                );
              })}
            </nav>

            <div className="pub-legal-layout">
              {/* Sidebar sticky desktop : sommaire + navigation politiques */}
              <aside className="pub-legal-sidebar">
                {sections.length > 0 && (
                  <nav className="pub-legal-box" aria-label={t("layout.tocAria")}>
                    <div className="pub-legal-box-title">{t("layout.tocTitle")}</div>
                    <ul className="pub-legal-toc-list">
                      {sections.map((section) => (
                        <li key={section.id}>
                          <a href={`#${section.id}`} className="pub-legal-toc-link">
                            {section.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}

                <nav className="pub-legal-box" aria-label={t("layout.allPoliciesAria")}>
                  <div className="pub-legal-box-title">{t("layout.otherPoliciesTitle")}</div>
                  <ul className="pub-legal-nav-list">
                    {POLICY_CATALOG.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.slug === currentSlug;
                      return (
                        <li key={item.slug}>
                          <Link
                            to={item.slug}
                            className={`pub-legal-nav-link${isActive ? " is-active" : ""}`}
                          >
                            <Icon size={16} weight="duotone" aria-hidden="true" />
                            <span className="truncate">{t(`catalog.${item.key}.shortLabel`)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </aside>

              {/* Corps du document */}
              <article className="pub-legal-article">{children}</article>
            </div>
          </div>
        </section>

        {/* ── Bandeau final Orange (Contact juridique) ──────────────── */}
        <section className="pub-section pub-orange" aria-label={t("layout.ctaAria")}>
          <div className="pub-container">
            <div className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("layout.ctaTitle1")}
                  <br />
                  <em>{t("layout.ctaTitle2")}</em>
                </h2>
                <p>{t("layout.ctaBody")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("layout.ctaContact")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <a href="mailto:policies@campussphere.app" className="pub-btn pub-btn-ghost-light">
                  <Envelope size={16} weight="duotone" aria-hidden="true" />
                  policies@campussphere.app
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default PolicyLayout;
