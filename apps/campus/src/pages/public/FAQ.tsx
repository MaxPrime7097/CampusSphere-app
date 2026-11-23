import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  BookOpenText,
  Envelope,
  Lifebuoy,
  MagnifyingGlass,
  Question,
  ShieldCheck,
  Sparkle,
  SquaresFour,
  UserCircle,
  UsersThree,
  Wallet,
  X,
} from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
} from "@/components/public/PublicMotion";
import "@/styles/public-pages.css";

interface FAQItem {
  id: string;
  q: string;
  a: React.ReactNode;
  aText: string;
}

interface FAQCategory {
  id: string;
  shortLabel: string;
  title: string;
  icon: React.ElementType;
  questions: FAQItem[];
}

const QUICK_TAG_KEYS = ["t1", "t2", "t3", "t4", "t5"] as const;

export function FAQ(): JSX.Element {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("public");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const quickSearchTags = useMemo(
    () => QUICK_TAG_KEYS.map((key) => t(`faq.hero.quickTags.${key}`)),
    [t, i18n.language]
  );

  const faqCategories: FAQCategory[] = useMemo(
    () => [
      {
        id: "compte",
        shortLabel: t("faq.categories.compte.shortLabel"),
        title: t("faq.categories.compte.title"),
        icon: UserCircle,
        questions: [
          {
            id: "compte-q1",
            q: t("faq.categories.compte.items.q1.q"),
            aText: t("faq.categories.compte.items.q1.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.compte.items.q1.a"
                  ns="public"
                  components={{
                    link: <Link to="/register" className="text-[#e65100] font-semibold hover:underline" />,
                  }}
                />
              </span>
            ),
          },
          {
            id: "compte-q2",
            q: t("faq.categories.compte.items.q2.q"),
            aText: t("faq.categories.compte.items.q2.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.compte.items.q2.a"
                  ns="public"
                  components={{
                    bold: <strong className="text-[#18181b]" />,
                    link: (
                      <Link
                        to="/cs/policies/terms"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
          {
            id: "compte-q3",
            q: t("faq.categories.compte.items.q3.q"),
            aText: t("faq.categories.compte.items.q3.aText"),
            a: t("faq.categories.compte.items.q3.a"),
          },
          {
            id: "compte-q4",
            q: t("faq.categories.compte.items.q4.q"),
            aText: t("faq.categories.compte.items.q4.aText"),
            a: t("faq.categories.compte.items.q4.a"),
          },
        ],
      },
      {
        id: "spheres",
        shortLabel: t("faq.categories.spheres.shortLabel"),
        title: t("faq.categories.spheres.title"),
        icon: UsersThree,
        questions: [
          {
            id: "spheres-q1",
            q: t("faq.categories.spheres.items.q1.q"),
            aText: t("faq.categories.spheres.items.q1.aText"),
            a: t("faq.categories.spheres.items.q1.a"),
          },
          {
            id: "spheres-q2",
            q: t("faq.categories.spheres.items.q2.q"),
            aText: t("faq.categories.spheres.items.q2.aText"),
            a: t("faq.categories.spheres.items.q2.a"),
          },
          {
            id: "spheres-q3",
            q: t("faq.categories.spheres.items.q3.q"),
            aText: t("faq.categories.spheres.items.q3.aText"),
            a: t("faq.categories.spheres.items.q3.a"),
          },
          {
            id: "spheres-q4",
            q: t("faq.categories.spheres.items.q4.q"),
            aText: t("faq.categories.spheres.items.q4.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.spheres.items.q4.a"
                  ns="public"
                  components={{
                    link: (
                      <Link
                        to="/cs/policies/community-guidelines"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
          {
            id: "spheres-q5",
            q: t("faq.categories.spheres.items.q5.q"),
            aText: t("faq.categories.spheres.items.q5.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.spheres.items.q5.a"
                  ns="public"
                  components={{
                    link: (
                      <Link
                        to="/cs/impact-score"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
        ],
      },
      {
        id: "sphera",
        shortLabel: t("faq.categories.sphera.shortLabel"),
        title: t("faq.categories.sphera.title"),
        icon: Sparkle,
        questions: [
          {
            id: "sphera-q1",
            q: t("faq.categories.sphera.items.q1.q"),
            aText: t("faq.categories.sphera.items.q1.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.sphera.items.q1.a"
                  ns="public"
                  components={{
                    b1: <strong className="text-[#18181b]" />,
                    b2: <strong className="text-[#18181b]" />,
                    b3: <strong className="text-[#18181b]" />,
                  }}
                />
              </span>
            ),
          },
          {
            id: "sphera-q2",
            q: t("faq.categories.sphera.items.q2.q"),
            aText: t("faq.categories.sphera.items.q2.aText"),
            a: t("faq.categories.sphera.items.q2.a"),
          },
          {
            id: "sphera-q3",
            q: t("faq.categories.sphera.items.q3.q"),
            aText: t("faq.categories.sphera.items.q3.aText"),
            a: t("faq.categories.sphera.items.q3.a"),
          },
          {
            id: "sphera-q4",
            q: t("faq.categories.sphera.items.q4.q"),
            aText: t("faq.categories.sphera.items.q4.aText"),
            a: t("faq.categories.sphera.items.q4.a"),
          },
        ],
      },
      {
        id: "ressources",
        shortLabel: t("faq.categories.ressources.shortLabel"),
        title: t("faq.categories.ressources.title"),
        icon: BookOpenText,
        questions: [
          {
            id: "ressources-q1",
            q: t("faq.categories.ressources.items.q1.q"),
            aText: t("faq.categories.ressources.items.q1.aText"),
            a: t("faq.categories.ressources.items.q1.a"),
          },
          {
            id: "ressources-q2",
            q: t("faq.categories.ressources.items.q2.q"),
            aText: t("faq.categories.ressources.items.q2.aText"),
            a: t("faq.categories.ressources.items.q2.a"),
          },
          {
            id: "ressources-q3",
            q: t("faq.categories.ressources.items.q3.q"),
            aText: t("faq.categories.ressources.items.q3.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.ressources.items.q3.a"
                  ns="public"
                  components={{
                    mail: (
                      <a
                        href="mailto:policies@campussphere.app"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                    link: (
                      <Link
                        to="/cs/policies/copyright"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
        ],
      },
      {
        id: "paiements",
        shortLabel: t("faq.categories.paiements.shortLabel"),
        title: t("faq.categories.paiements.title"),
        icon: Wallet,
        questions: [
          {
            id: "paiements-q1",
            q: t("faq.categories.paiements.items.q1.q"),
            aText: t("faq.categories.paiements.items.q1.aText"),
            a: t("faq.categories.paiements.items.q1.a"),
          },
          {
            id: "paiements-q2",
            q: t("faq.categories.paiements.items.q2.q"),
            aText: t("faq.categories.paiements.items.q2.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.paiements.items.q2.a"
                  ns="public"
                  components={{
                    b1: <strong className="text-[#18181b]" />,
                    b2: <strong className="text-[#18181b]" />,
                    link: (
                      <Link
                        to="/cs/policies/terms-of-sale"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
          {
            id: "paiements-q3",
            q: t("faq.categories.paiements.items.q3.q"),
            aText: t("faq.categories.paiements.items.q3.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.paiements.items.q3.a"
                  ns="public"
                  components={{
                    link: (
                      <Link
                        to="/cs/policies/terms-of-sale"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                    mail: (
                      <a
                        href="mailto:support@campussphere.app"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
        ],
      },
      {
        id: "securite",
        shortLabel: t("faq.categories.securite.shortLabel"),
        title: t("faq.categories.securite.title"),
        icon: ShieldCheck,
        questions: [
          {
            id: "securite-q1",
            q: t("faq.categories.securite.items.q1.q"),
            aText: t("faq.categories.securite.items.q1.aText"),
            a: t("faq.categories.securite.items.q1.a"),
          },
          {
            id: "securite-q2",
            q: t("faq.categories.securite.items.q2.q"),
            aText: t("faq.categories.securite.items.q2.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.securite.items.q2.a"
                  ns="public"
                  components={{
                    bold: <strong className="text-[#18181b]" />,
                    link: (
                      <Link
                        to="/cs/policies/privacy"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
          {
            id: "securite-q3",
            q: t("faq.categories.securite.items.q3.q"),
            aText: t("faq.categories.securite.items.q3.aText"),
            a: (
              <span>
                <Trans
                  i18nKey="faq.categories.securite.items.q3.a"
                  ns="public"
                  components={{
                    link: (
                      <Link
                        to="/cs/policies/datadeletion"
                        className="text-[#e65100] font-semibold hover:underline"
                      />
                    ),
                  }}
                />
              </span>
            ),
          },
        ],
      },
      {
        id: "assistance",
        shortLabel: t("faq.categories.assistance.shortLabel"),
        title: t("faq.categories.assistance.title"),
        icon: Lifebuoy,
        questions: [
          {
            id: "assistance-q1",
            q: t("faq.categories.assistance.items.q1.q"),
            aText: t("faq.categories.assistance.items.q1.aText"),
            a: t("faq.categories.assistance.items.q1.a"),
          },
          {
            id: "assistance-q2",
            q: t("faq.categories.assistance.items.q2.q"),
            aText: t("faq.categories.assistance.items.q2.aText"),
            a: (
              <div className="space-y-2">
                <p className="m-0">{t("faq.categories.assistance.items.q2.intro")}</p>
                <ul className="list-disc pl-5 space-y-1.5 m-0">
                  <li>
                    <strong className="text-[#18181b]">
                      {t("faq.categories.assistance.items.q2.supportLabel")}
                    </strong>{" "}
                    :{" "}
                    <a
                      href="mailto:support@campussphere.app"
                      className="text-[#e65100] font-semibold hover:underline"
                    >
                      support@campussphere.app
                    </a>
                  </li>
                  <li>
                    <strong className="text-[#18181b]">
                      {t("faq.categories.assistance.items.q2.policiesLabel")}
                    </strong>{" "}
                    :{" "}
                    <a
                      href="mailto:policies@campussphere.app"
                      className="text-[#e65100] font-semibold hover:underline"
                    >
                      policies@campussphere.app
                    </a>
                  </li>
                  <li>
                    <strong className="text-[#18181b]">
                      {t("faq.categories.assistance.items.q2.contactLabel")}
                    </strong>{" "}
                    :{" "}
                    <a
                      href="mailto:contact@campussphere.app"
                      className="text-[#e65100] font-semibold hover:underline"
                    >
                      contact@campussphere.app
                    </a>
                  </li>
                </ul>
              </div>
            ),
          },
        ],
      },
    ],
    [t, i18n.language]
  );

  const normalizedQuery = searchTerm.trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    const base = normalizedQuery
      ? faqCategories
      : activeCategory === "all"
      ? faqCategories
      : faqCategories.filter((cat) => cat.id === activeCategory);

    if (!normalizedQuery) return base;

    return base
      .map((category) => ({
        ...category,
        questions: category.questions.filter(
          (item) =>
            item.q.toLowerCase().includes(normalizedQuery) ||
            item.aText.toLowerCase().includes(normalizedQuery) ||
            category.title.toLowerCase().includes(normalizedQuery)
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [activeCategory, normalizedQuery, faqCategories]);

  const totalQuestions = useMemo(
    () => faqCategories.reduce((sum, cat) => sum + cat.questions.length, 0),
    [faqCategories]
  );

  const totalMatches = useMemo(
    () => visibleCategories.reduce((sum, cat) => sum + cat.questions.length, 0),
    [visibleCategories]
  );

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqCategories.flatMap((category) =>
        category.questions.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.aText,
          },
        }))
      ),
    }),
    [faqCategories]
  );

  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    if (searchTerm) setSearchTerm("");
  };

  const handlePickQuickTag = (tag: string) => {
    setSearchTerm((prev) => (prev.toLowerCase() === tag.toLowerCase() ? "" : tag));
    setActiveCategory("all");
  };

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("faq.meta.title")}</title>
        <meta name="description" content={t("faq.meta.description")} />
        <link rel="canonical" href="https://campussphere.app/cs/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("faq.meta.ogTitle")} />
        <meta property="og:description" content={t("faq.meta.ogDescription")} />
        <meta property="og:url" content="https://campussphere.app/cs/faq" />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t("faq.meta.ogTitle")} />
        <meta name="twitter:description" content={t("faq.meta.ogDescription")} />
        <meta name="twitter:image" content="https://campussphere.app/CS.svg" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── 01. Hero éditorial centré avec recherche intégrée ─────── */}
        <section className="pub-hero" aria-labelledby="faq-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-hero-center" style={{ marginBottom: 0 }}>
              <motion.h1
                id="faq-title"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, ease: PUBLIC_EASE }}
              >
                {t("faq.hero.titleLine1")}
                <br />
                <em>{t("faq.hero.titleLine2")}</em>
              </motion.h1>
              <motion.p
                className="pub-hero-lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: PUBLIC_EASE }}
              >
                {t("faq.hero.lede")}
              </motion.p>

              <motion.div
                className="pub-faq-search-wrap"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.48, delay: 0.16, ease: PUBLIC_EASE }}
              >
                <div className="pub-faq-search-box">
                  <span className="pub-faq-search-icon" aria-hidden="true">
                    <MagnifyingGlass size={20} weight="duotone" />
                  </span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t("faq.hero.searchPlaceholder")}
                    aria-label={t("faq.hero.searchAria")}
                    className="pub-faq-search-input"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="pub-faq-search-clear"
                      onClick={() => setSearchTerm("")}
                      aria-label={t("faq.hero.clearSearchAria")}
                    >
                      <X size={15} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="pub-faq-quick-tags" aria-label={t("faq.hero.quickTagsAria")}>
                  {quickSearchTags.map((tag) => {
                    const isActive = normalizedQuery === tag.toLowerCase();
                    return (
                      <motion.button
                        key={tag}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        className={`pub-faq-tag${isActive ? " is-active" : ""}`}
                        onClick={() => handlePickQuickTag(tag)}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 02. Navigation catégories + Accordéons FAQ ────────────── */}
        <section className="pub-section pub-light" aria-label={t("faq.nav.sectionAria")}>
          <div className="pub-container">
            {/* Filtres horizontaux sur mobile / tablette */}
            <div className="pub-faq-mobile-pills" role="tablist" aria-label={t("faq.nav.categoriesAria")}>
              <button
                type="button"
                role="tab"
                aria-selected={!normalizedQuery && activeCategory === "all"}
                className={`pub-faq-mobile-pill${!normalizedQuery && activeCategory === "all" ? " is-active" : ""}`}
                onClick={() => handleSelectCategory("all")}
              >
                {t("faq.nav.allShort", { count: totalQuestions })}
              </button>
              {faqCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={!normalizedQuery && activeCategory === cat.id}
                  className={`pub-faq-mobile-pill${!normalizedQuery && activeCategory === cat.id ? " is-active" : ""}`}
                  onClick={() => handleSelectCategory(cat.id)}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>

            <div className="pub-faq-layout">
              {/* Sidebar sticky desktop */}
              <Reveal>
                <aside className="pub-faq-sidebar" aria-label={t("faq.nav.categoriesAria")}>
                  <div className="pub-faq-sidebar-title">{t("faq.nav.categoriesTitle")}</div>
                  <button
                    type="button"
                    className={`pub-faq-cat-btn${!normalizedQuery && activeCategory === "all" ? " is-active" : ""}`}
                    onClick={() => handleSelectCategory("all")}
                  >
                    <span className="pub-faq-cat-btn-left">
                      <SquaresFour size={18} weight="duotone" aria-hidden="true" />
                      <span>{t("faq.nav.allQuestions")}</span>
                    </span>
                    <span className="pub-faq-cat-count">{totalQuestions}</span>
                  </button>

                  {faqCategories.map((cat) => {
                    const Icon = cat.icon;
                    const active = !normalizedQuery && activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`pub-faq-cat-btn${active ? " is-active" : ""}`}
                        onClick={() => handleSelectCategory(cat.id)}
                      >
                        <span className="pub-faq-cat-btn-left">
                          <Icon size={18} weight="duotone" aria-hidden="true" />
                          <span className="truncate">{cat.shortLabel}</span>
                        </span>
                        <span className="pub-faq-cat-count">{cat.questions.length}</span>
                      </button>
                    );
                  })}
                </aside>
              </Reveal>

              {/* Liste des questions */}
              <div>
                {normalizedQuery && (
                  <motion.div
                    className="pub-faq-results-bar"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span>
                      <strong>{totalMatches}</strong>{" "}
                      {totalMatches > 1 ? t("faq.nav.resultsOther") : t("faq.nav.resultsOne")}{" "}
                      {t("faq.nav.resultsFor")} « <strong>{searchTerm.trim()}</strong> »
                    </span>
                    <button
                      type="button"
                      className="pub-faq-results-reset"
                      onClick={() => setSearchTerm("")}
                    >
                      {t("faq.nav.reset")}
                    </button>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={normalizedQuery ? `q:${normalizedQuery}` : `c:${activeCategory}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: PUBLIC_EASE }}
                  >
                    {visibleCategories.length > 0 ? (
                      visibleCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <div key={category.id} className="pub-faq-group">
                            <div className="pub-faq-group-head">
                              <div className="pub-faq-group-icon" aria-hidden="true">
                                <Icon size={20} weight="duotone" />
                              </div>
                              <h2>{category.title}</h2>
                            </div>

                            <Accordion type="single" collapsible className="space-y-3">
                              {category.questions.map((item) => (
                                <AccordionItem
                                  key={item.id}
                                  value={item.id}
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
                          </div>
                        );
                      })
                    ) : (
                      <div className="pub-faq-empty">
                        <div className="pub-contact-sent-icon" aria-hidden="true">
                          <Question size={30} weight="duotone" />
                        </div>
                        <h3>{t("faq.nav.emptyTitle", { query: searchTerm.trim() })}</h3>
                        <p>{t("faq.nav.emptyDesc")}</p>
                        <div className="flex flex-wrap justify-center gap-3">
                          <button
                            type="button"
                            className="pub-btn pub-btn-dark"
                            onClick={() => setSearchTerm("")}
                          >
                            {t("faq.nav.seeAll")}
                          </button>
                          <button
                            type="button"
                            className="pub-btn pub-btn-orange"
                            onClick={() => navigate("/cs/contact")}
                          >
                            {t("faq.nav.writeUs")}{" "}
                            <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03. Bandeau final Orange (Relais Contact) ─────────────── */}
        <section className="pub-section pub-orange" aria-label={t("faq.cta.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("faq.cta.titleLine1")}
                  <br />
                  <em>{t("faq.cta.titleLine2")}</em>
                </h2>
                <p>{t("faq.cta.body")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("faq.cta.ctaPrimary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <a href="mailto:support@campussphere.app" className="pub-btn pub-btn-ghost-light">
                  <Envelope size={16} weight="duotone" className="pub-icon-static" aria-hidden="true" />
                  support@campussphere.app
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

export default FAQ;
