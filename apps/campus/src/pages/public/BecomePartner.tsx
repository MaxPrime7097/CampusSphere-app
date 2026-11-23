import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUpRight,
  Buildings,
  CalendarCheck,
  CheckCircle,
  Envelope,
  PaperPlaneTilt,
  ShieldCheck,
  Spinner,
  UsersThree,
} from "@phosphor-icons/react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitPartnerApplication } from "@/services/api";
import {
  PUBLIC_EASE,
  PublicMotionProvider,
  Reveal,
  StaggerGrid,
  StaggerItem,
} from "@/components/public/PublicMotion";
import "@/styles/public-pages.css";

const PARTNER_BENEFIT_SPECS = [
  { key: "b1", icon: UsersThree },
  { key: "b2", icon: CalendarCheck },
  { key: "b3", icon: ShieldCheck },
] as const;

export function BecomePartner(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation("public");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: "",
    organizationType: "entreprise",
    contactEmail: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationName.trim() || !formData.contactEmail.trim()) {
      toast({
        variant: "destructive",
        title: t("becomePartner.toasts.requiredTitle"),
        description: t("becomePartner.toasts.requiredDesc"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitPartnerApplication(formData);
      setIsSuccess(true);
      toast({
        title: t("becomePartner.toasts.sentTitle"),
        description: t("becomePartner.toasts.sentDesc"),
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("becomePartner.toasts.errorTitle"),
        description: error?.message || t("becomePartner.toasts.errorDesc"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicMotionProvider>
      <Helmet>
        <title>{t("becomePartner.meta.title")}</title>
        <meta name="description" content={t("becomePartner.meta.description")} />
        <link rel="canonical" href="https://campussphere.app/cs/become-partner" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("becomePartner.meta.ogTitle")} />
        <meta property="og:description" content={t("becomePartner.meta.ogDescription")} />
        <meta property="og:image" content="https://campussphere.app/CS.svg" />
        <meta property="og:site_name" content="CampusSphere" />
      </Helmet>

      <Header />

      <main className="cs-public">
        {/* ── 01. Hero éditorial centré ─────────────────────────────── */}
        <section className="pub-hero" aria-labelledby="partner-title">
          <div className="pub-hero-grid-bg" aria-hidden="true" />
          <div className="pub-hero-glow" aria-hidden="true" />
          <div className="pub-container">
            <div className="pub-hero-center">
              <motion.h1
                id="partner-title"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.54, ease: PUBLIC_EASE }}
              >
                {t("becomePartner.hero.titleLine1")}
                <br />
                <em>{t("becomePartner.hero.titleLine2")}</em>
              </motion.h1>
              <motion.p
                className="pub-hero-lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: PUBLIC_EASE }}
              >
                {t("becomePartner.hero.lede")}
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
                  onClick={() =>
                    document.getElementById("candidature")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {t("becomePartner.hero.ctaPrimary")}{" "}
                  <ArrowDown size={16} weight="duotone" className="pub-icon-down" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="pub-btn pub-btn-ghost-light"
                  onClick={() => navigate("/cs/about")}
                >
                  {t("becomePartner.hero.ctaSecondary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
              </motion.div>
            </div>

            <StaggerGrid className="pub-hero-pillars" mount delayChildren={0.2} stagger={0.07}>
              {(["p1", "p2", "p3"] as const).map((key) => (
                <StaggerItem key={key} className="pub-hero-pillar" y={14}>
                  <span className="pub-hero-pillar-num">
                    {t(`becomePartner.hero.pillars.${key}.num`)}
                  </span>
                  <b>{t(`becomePartner.hero.pillars.${key}.title`)}</b>
                  <p>{t(`becomePartner.hero.pillars.${key}.desc`)}</p>
                </StaggerItem>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── 02. Avantages & Formulaire de candidature ─────────────── */}
        <section
          className="pub-section pub-light"
          id="candidature"
          aria-label={t("becomePartner.form.sectionAria")}
        >
          <div className="pub-container">
            <div className="pub-contact-grid">
              {/* Colonne gauche : avantages détaillés */}
              <StaggerGrid className="pub-contact-aside" stagger={0.08}>
                {PARTNER_BENEFIT_SPECS.map(({ key, icon: Icon }) => (
                  <StaggerItem key={key} className="pub-contact-card">
                    <div className="pub-contact-card-head">
                      <div className="pub-contact-card-icon" aria-hidden="true">
                        <Icon size={20} weight="duotone" />
                      </div>
                      <h3>{t(`becomePartner.benefits.${key}.title`)}</h3>
                    </div>
                    <p>{t(`becomePartner.benefits.${key}.desc`)}</p>
                  </StaggerItem>
                ))}
              </StaggerGrid>

              {/* Colonne droite : formulaire de candidature */}
              <Reveal delay={0.08} className="pub-contact-form-card">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      className="pub-contact-sent"
                      role="status"
                      aria-live="polite"
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.35, ease: PUBLIC_EASE }}
                    >
                      <motion.div
                        className="pub-contact-sent-icon"
                        aria-hidden="true"
                        initial={{ scale: 0.5, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 360, damping: 18, delay: 0.08 }}
                      >
                        <CheckCircle size={32} weight="duotone" />
                      </motion.div>
                      <h3>{t("becomePartner.form.sentTitle")}</h3>
                      <p>
                        {t("becomePartner.form.sentDescPrefix")}{" "}
                        <strong className="text-[#18181b]">{formData.contactEmail}</strong>{" "}
                        {t("becomePartner.form.sentDescSuffix")}
                      </p>
                      <div className="flex flex-wrap justify-center gap-3">
                        <button
                          type="button"
                          className="pub-btn pub-btn-dark"
                          onClick={() => navigate("/cs")}
                        >
                          {t("becomePartner.form.backHome")}
                        </button>
                        <button
                          type="button"
                          className="pub-btn pub-btn-orange"
                          onClick={() => {
                            setIsSuccess(false);
                            setFormData({
                              organizationName: "",
                              organizationType: "entreprise",
                              contactEmail: "",
                              description: "",
                            });
                          }}
                        >
                          {t("becomePartner.form.newApplication")}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="pub-contact-card-icon" aria-hidden="true">
                          <Buildings size={20} weight="duotone" />
                        </div>
                        <h2 style={{ margin: 0 }}>
                          {t("becomePartner.form.titleStart")}{" "}
                          <em>{t("becomePartner.form.titleHighlight")}</em>
                        </h2>
                      </div>
                      <p className="pub-contact-form-sub">{t("becomePartner.form.subtitle")}</p>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                          <Label
                            htmlFor="orgName"
                            className="font-poppins text-sm font-semibold text-[#18181b]"
                          >
                            {t("becomePartner.form.orgNameLabel")}
                          </Label>
                          <Input
                            id="orgName"
                            placeholder={t("becomePartner.form.orgNamePlaceholder")}
                            value={formData.organizationName}
                            onChange={(e) =>
                              setFormData({ ...formData, organizationName: e.target.value })
                            }
                            required
                            className="h-11 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="orgType"
                              className="font-poppins text-sm font-semibold text-[#18181b]"
                            >
                              {t("becomePartner.form.orgTypeLabel")}
                            </Label>
                            <Select
                              value={formData.organizationType}
                              onValueChange={(val) =>
                                setFormData({ ...formData, organizationType: val })
                              }
                            >
                              <SelectTrigger
                                id="orgType"
                                className="h-11 bg-white border-black/15 text-[#18181b] focus:ring-[#ff9800] focus:border-[#ff9800]"
                              >
                                <SelectValue placeholder={t("becomePartner.form.orgTypePlaceholder")} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="entreprise">
                                  {t("becomePartner.form.orgTypes.entreprise")}
                                </SelectItem>
                                <SelectItem value="club">
                                  {t("becomePartner.form.orgTypes.club")}
                                </SelectItem>
                                <SelectItem value="association">
                                  {t("becomePartner.form.orgTypes.association")}
                                </SelectItem>
                                <SelectItem value="institution">
                                  {t("becomePartner.form.orgTypes.institution")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="contactEmail"
                              className="font-poppins text-sm font-semibold text-[#18181b]"
                            >
                              {t("becomePartner.form.emailLabel")}
                            </Label>
                            <Input
                              id="contactEmail"
                              type="email"
                              placeholder={t("becomePartner.form.emailPlaceholder")}
                              value={formData.contactEmail}
                              onChange={(e) =>
                                setFormData({ ...formData, contactEmail: e.target.value })
                              }
                              required
                              className="h-11 bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="desc"
                            className="font-poppins text-sm font-semibold text-[#18181b]"
                          >
                            {t("becomePartner.form.descLabel")}
                          </Label>
                          <Textarea
                            id="desc"
                            rows={5}
                            placeholder={t("becomePartner.form.descPlaceholder")}
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                            }
                            className="bg-white border-black/15 text-[#18181b] placeholder:text-zinc-400 resize-y focus-visible:ring-[#ff9800] focus-visible:border-[#ff9800]"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="pub-btn pub-btn-orange w-full disabled:opacity-60 disabled:pointer-events-none"
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner size={18} className="animate-spin pub-icon-static" aria-hidden="true" />
                              {t("becomePartner.form.submitting")}
                            </>
                          ) : (
                            <>
                              {t("becomePartner.form.submit")}
                              <PaperPlaneTilt size={17} weight="duotone" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 03. Bandeau final Orange ──────────────────────────────── */}
        <section className="pub-section pub-orange" aria-label={t("becomePartner.cta.ariaLabel")}>
          <div className="pub-container">
            <Reveal className="pub-cta-inner">
              <div className="pub-cta-copy">
                <h2>
                  {t("becomePartner.cta.titleLine1")}
                  <br />
                  <em>{t("becomePartner.cta.titleLine2")}</em>
                </h2>
                <p>{t("becomePartner.cta.body")}</p>
              </div>
              <div className="pub-cta-actions">
                <button
                  type="button"
                  className="pub-btn pub-btn-dark"
                  onClick={() => navigate("/cs/contact")}
                >
                  {t("becomePartner.cta.ctaPrimary")}{" "}
                  <ArrowUpRight size={16} weight="duotone" aria-hidden="true" />
                </button>
                <a href="mailto:contact@campussphere.app" className="pub-btn pub-btn-ghost-light">
                  <Envelope size={16} weight="duotone" className="pub-icon-static" aria-hidden="true" />
                  contact@campussphere.app
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

export default BecomePartner;
